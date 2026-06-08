---
title: "Comment étendre du code existant avec prepend en Ruby ?"
slug: etendre-du-code-avec-prepend
sidebar_position: 11
description: "Ce chapitre présente les techniques pour étendre du code existant sans le modifier directement. C'est un concept fondamental en Ruby : on peut enrichir une classe après sa création, même si on n'a pas accès au fichier source."
---

Ce chapitre présente les techniques pour **étendre du code existant** sans le modifier directement. C'est un concept fondamental en Ruby : on peut enrichir une classe après sa création, même si on n'a pas accès au fichier source.

## Principe

Imaginons qu'on utilise une classe `Pokemon` écrite par quelqu'un d'autre. On veut ajouter un système de log qui affiche un message à chaque fois qu'un Pokémon subit des dégâts. Mais on ne veut pas (et parfois on ne peut pas) modifier le fichier original.

Ruby offre trois solutions :

- **Réouverture de classes** : on rouvre la classe pour ajouter ou modifier des méthodes. Simple mais risqué si on écrase une méthode existante.
- **alias** : l'ancienne technique pour sauvegarder une méthode avant de la redéfinir. Fragile.
- **prepend** : la technique moderne et sûre. On insère un module **avant** la classe dans la chaîne d'ancêtres.

## Réouverture de classes

En Ruby, les classes ne sont jamais "fermées". On peut les rouvrir pour ajouter des méthodes :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Niv.#{@level}"
  end
end

# Plus loin dans le code (ou dans un autre fichier)
class Pokemon
  def can_evolve?
    return @level >= 16
  end
end

pikachu = Pokemon.new('Pikachu', 25)
puts pikachu.can_evolve?      # => true
puts pikachu                  # => Pikachu Niv.25 (to_s fonctionne toujours)
```

- **Ajouter** une méthode en rouvrant la classe est sans risque. L'original n'est pas touché.
- **Redéfinir** une méthode existante est risqué : le comportement original est perdu.

## alias — l'ancienne technique (à éviter)

`alias` sauvegarde une méthode sous un autre nom avant de la redéfinir :

```ruby
class Pokemon
  alias original_to_s to_s

  def to_s
    return "[Modifié] #{original_to_s}"
  end
end

puts Pokemon.new('Pikachu', 25)    # => [Modifié] Pikachu Niv.25
```

- `alias original_to_s to_s` crée une copie de `to_s` sous le nom `original_to_s`.
- Le problème : si **deux plugins** font `alias` sur la même méthode, le second écrase le premier. C'est fragile et source de bugs difficiles à diagnostiquer.
- `alias` est une technique historique. On ne l'utilise plus en Ruby moderne.

## prepend — la technique moderne

`prepend` insère un module **avant** la classe dans la chaîne d'ancêtres. Le module peut appeler `super` pour exécuter la méthode originale :

```ruby live
class Pokemon
  attr_reader :name, :hp

  def initialize(name, hp)
    @name = name
    @hp = hp
  end

  def take_damage(amount)
    @hp = (@hp - amount).clamp(0, 999)
    return nil
  end
end

# Le module qui étend le comportement
module DamageLog
  def take_damage(amount)
    puts "#{name} subit #{amount} dégâts !"
    super
    puts "#{name} a #{hp} PV restants."
  end
end

# On insère le module AVANT la classe
Pokemon.prepend(DamageLog)

pikachu = Pokemon.new('Pikachu', 100)
pikachu.take_damage(30)
```

Affiche :

```
Pikachu subit 30 dégâts !
Pikachu a 70 PV restants.
```

- `super` dans le module appelle la méthode **de la classe originale**. Le comportement original est préservé et enrichi.
- Le module peut exécuter du code **avant** et **après** `super`.
- Contrairement à `alias`, plusieurs modules peuvent être prependés sans conflit. Chaque `super` appelle le suivant dans la chaîne.

## La chaîne d'ancêtres avec prepend

`prepend` modifie l'ordre dans `.ancestors` :

```ruby
puts Pokemon.ancestors.inspect
# Avant : [Pokemon, Object, Kernel, BasicObject]

Pokemon.prepend(DamageLog)

puts Pokemon.ancestors.inspect
# Après : [DamageLog, Pokemon, Object, Kernel, BasicObject]
```

- Le module `DamageLog` est maintenant **en tête** de la chaîne, avant `Pokemon`.
- Quand on appelle `pikachu.take_damage(30)`, Ruby cherche la méthode dans l'ordre : d'abord dans `DamageLog`, puis dans `Pokemon`.
- `super` dans `DamageLog` passe au prochain élément de la chaîne : `Pokemon`.

## Plusieurs prepend

On peut prependre plusieurs modules. Chaque `super` remonte la chaîne :

```ruby
module DamageLog
  def take_damage(amount)
    puts "[LOG] #{name} subit #{amount} dégâts"
    super
  end
end

module MagicShield
  def take_damage(amount)
    reduced_damage = (amount * 0.8).to_i
    puts "[BOUCLIER] Dégâts réduits de #{amount} à #{reduced_damage}"
    super(reduced_damage)
  end
end

Pokemon.prepend(DamageLog)
Pokemon.prepend(MagicShield)

puts Pokemon.ancestors.inspect
# => [MagicShield, DamageLog, Pokemon, Object, ...]
```

- Le dernier module prependé est en tête. L'ordre d'appel est : `MagicShield` → `DamageLog` → `Pokemon`.
- `super(reduced_damage)` dans `MagicShield` passe les dégâts réduits à `DamageLog`, qui appelle `super` vers `Pokemon`.
- C'est ce qui rend `prepend` si puissant : chaque plugin s'empile sans casser les autres.

## include vs prepend vs extend

Récapitulatif des trois façons d'injecter un module :

```ruby
class Pokemon
  include Displayable    # Après la classe (utilitaires)
  prepend DamageLog      # Avant la classe (interception)
  extend Search          # Méthodes de classe
end

puts Pokemon.ancestors.inspect
# => [DamageLog, Pokemon, Displayable, Object, ...]
```

| Méthode   | Position dans ancestors | Appel via                        | Usage                   |
| --------- | ----------------------- | -------------------------------- | ----------------------- |
| `include` | Après la classe         | Instance (`pikachu.fiche`)       | Ajouter des utilitaires |
| `prepend` | Avant la classe         | Instance (`pikachu.take_damage`) | Intercepter et enrichir |
| `extend`  | Hors de la chaîne       | Classe (`Pokemon.search(...)`)   | Méthodes de classe      |

- `include` : le module s'insère **après** la classe. La classe a la priorité. C'est pour le partage de comportement (Enumerable, Comparable).
- `prepend` : le module s'insère **avant** la classe. Le module a la priorité. C'est pour l'interception et l'extension.
- `extend` : les méthodes deviennent des méthodes de classe. Pas dans `.ancestors` des instances.

## Règle importante

Ne jamais remplacer une classe existante par une autre hiérarchie. Toujours utiliser `prepend` pour ajouter du comportement :

```ruby
# Ne PAS faire
class Pokemon
  def take_damage(amount)
    # réécriture complète, le comportement original est perdu
  end
end

# Faire à la place
module MyExtension
  def take_damage(amount)
    # code ajouté
    super    # le comportement original est préservé
  end
end
Pokemon.prepend(MyExtension)
```

## Conclusion

- Les classes Ruby sont ouvertes. Ajouter des méthodes en rouvrant est sûr. Écraser des méthodes existantes perd le comportement original.
- `alias` est l'ancienne technique, fragile et obsolète. Ne plus l'utiliser.
- `prepend` insère un module **avant** la classe dans `.ancestors`. `super` appelle la méthode originale.
- Plusieurs modules prependés s'empilent sans conflit. Chaque `super` passe au suivant.
- `include` ajoute après la classe (utilitaires). `prepend` ajoute avant (interception). `extend` ajoute des méthodes de classe.
- Toujours utiliser `prepend` avec `super` pour étendre du code existant.
