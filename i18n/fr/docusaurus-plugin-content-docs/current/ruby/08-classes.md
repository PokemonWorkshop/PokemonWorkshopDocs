---
title: "Les classes et les objets"
slug: classes-et-objets
sidebar_position: 8
description: "Ce chapitre introduit les classes, le mécanisme central pour organiser le code en Ruby. Une classe regroupe des données et des comportements dans un seul endroit."
---

Ce chapitre introduit les **classes**, le mécanisme central pour organiser le code en Ruby. Une classe regroupe des données et des comportements dans un seul endroit.

## Principe

Jusqu'ici, on a utilisé des Hash pour représenter un Pokémon : `{ name: 'Pikachu', level: 25 }`. Ça fonctionne, mais ça a des limites :

- On ne peut pas contrôler les valeurs (rien n'empêche de mettre un niveau négatif)
- On ne peut pas attacher de comportement au Hash (pas de méthode `heal` ou `take_damage`)
- On peut faire des fautes de frappe dans les clés sans que Ruby ne prévienne

Une **classe** résout tout cela. C'est un plan de construction qui définit :

- Quelles **données** l'objet contient (variables d'instance `@`)
- Quels **comportements** il a (méthodes)

Un **objet** est une instance créée à partir de ce plan.

## Définir une classe

```ruby
class Pokemon
  def initialize(name, level)
    @name = name
    @level = level
  end
end

pikachu = Pokemon.new('Pikachu', 25)
p pikachu    # => #<Pokemon @name="Pikachu", @level=25>
```

- `class Pokemon ... end` définit la classe. Le nom commence par une majuscule (convention `CamelCase`).
- `initialize` est une méthode spéciale appelée automatiquement par `.new`. C'est le **constructeur** : il reçoit les arguments et initialise les variables d'instance.
- `@name` et `@level` sont des **variables d'instance**. Elles appartiennent à l'objet et persistent entre les appels de méthodes.
- `Pokemon.new('Pikachu', 25)` crée un nouvel objet et appelle `initialize` avec ces arguments.

## Variables d'instance et accesseurs

Les variables d'instance (`@name`, `@level`) sont **privées** par défaut. On ne peut pas y accéder depuis l'extérieur :

```ruby
pikachu = Pokemon.new('Pikachu', 25)
# pikachu.name    # => Erreur ! NoMethodError
```

Pour autoriser la lecture, on utilise `attr_reader` :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end
end

pikachu = Pokemon.new('Pikachu', 25)
puts pikachu.name     # => Pikachu
puts pikachu.level    # => 25
# pikachu.level = 50  # => Erreur ! Pas de setter
```

- `attr_reader :name, :level` crée des méthodes de lecture (getters) pour `@name` et `@level`.

Il existe aussi :

- `attr_writer :level` : crée un setter uniquement (`pikachu.level = 50`)
- `attr_accessor :level` : crée getter **et** setter

Mais `attr_accessor` ne fait aucune vérification. Si on veut contrôler les valeurs, on écrit un setter personnalisé.

## Setters personnalisés

Un setter personnalisé est une méthode dont le nom se termine par `=`. Ruby traduit `pikachu.level = 50` en appel de cette méthode :

```ruby live
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    self.level = level
  end

  # Setter personnalisé : le niveau est toujours entre 1 et 100
  def level=(new_level)
    @level = new_level.clamp(1, 100)
    return @level
  end
end

pokemon = Pokemon.new('Dracaufeu', 150)
puts pokemon.level    # => 100 (limité par le setter)

pokemon.level = -5
puts pokemon.level    # => 1 (limité par le setter)
```text

- `def level=(new_level)` : le `=` fait partie du nom de la méthode. C'est ce qui permet d'écrire `pokemon.level = 50`.
- `.clamp(1, 100)` borne la valeur entre 1 et 100.
- `self.level = level` dans `initialize` appelle le setter (et donc la validation). Si on écrivait `@level = level`, on contournerait la validation.

## Méthodes d'instance

Les méthodes définies dans une classe sont des **méthodes d'instance**. Elles opèrent sur les données de l'objet :

```ruby live
class Pokemon
  attr_reader :name, :hp, :max_hp

  def initialize(name, max_hp)
    @name = name
    @max_hp = max_hp
    @hp = max_hp
  end

  def take_damage(amount)
    @hp = (@hp - amount).clamp(0, @max_hp)
    return nil
  end

  def heal
    @hp = @max_hp
    return nil
  end

  def fainted?
    return @hp <= 0
  end
end

pikachu = Pokemon.new('Pikachu', 55)
pikachu.take_damage(30)
puts pikachu.hp             # => 25
puts pikachu.fainted?       # => false

pikachu.take_damage(50)
puts pikachu.hp             # => 0 (ne descend pas en dessous de 0)
puts pikachu.fainted?       # => true

pikachu.heal
puts pikachu.hp             # => 55
```

- Chaque méthode accède aux variables d'instance de l'objet sur lequel elle est appelée.
- `fainted?` se termine par `?` : convention Ruby pour les méthodes qui retournent un booléen.

## self — l'objet courant

`self` fait référence à l'objet courant. Dans une méthode d'instance, `self` est l'objet sur lequel la méthode a été appelée :

```ruby
class Pokemon
  attr_reader :name

  def initialize(name)
    @name = name
  end

  def introduce
    puts "Je suis #{self.name} !"
    # Équivalent à :
    puts "Je suis #{name} !"
    # Équivalent à :
    puts "Je suis #{@name} !"
  end
end
```

- `self.name`, `name` et `@name` accèdent tous à la même donnée ici. `self.` est optionnel pour les getters.
- `self` est **obligatoire** pour appeler un setter : `self.level = 50`. Sans `self.`, Ruby penserait qu'on crée une variable locale.

## Méthodes de classe

Une méthode de classe est appelée sur la classe elle-même, pas sur un objet. On la définit avec `def self.` :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  # Méthode de classe : crée un starter au niveau 5
  def self.starter(name)
    return Pokemon.new(name, 5)
  end
end

pikachu = Pokemon.starter('Pikachu')
puts pikachu.level    # => 5
```

- `def self.starter` est appelée via `Pokemon.starter(...)`, pas via un objet.
- C'est un pattern de **fabrique** : une méthode qui crée des objets avec une configuration prédéfinie.

Pour regrouper plusieurs méthodes de classe, on peut utiliser `class << self` :

```ruby
class Pokemon
  class << self
    def starter(name)
      return Pokemon.new(name, 5)
    end

    def from_hash(data)
      return Pokemon.new(data[:name], data[:level])
    end
  end
end
```

## Visibilité : public, private, protected

Par défaut, toutes les méthodes sont **publiques**. On peut restreindre l'accès :

```ruby
class Pokemon
  attr_reader :name

  def initialize(name, level)
    @name = name
    @level = level
  end

  # Publique : accessible de l'extérieur
  def summary
    puts "#{@name} Niv.#{@level}"
    puts "  PV max : #{calculate_max_hp}"
  end

  private

  # Privée : accessible uniquement depuis l'intérieur de la classe
  def calculate_max_hp
    return @level * 3 + 10
  end
end

pikachu = Pokemon.new('Pikachu', 25)
pikachu.summary              # Fonctionne
# pikachu.calculate_max_hp  # => Erreur ! NoMethodError
```

- `private` : tout ce qui est en dessous de ce mot-clé devient privé. Ces méthodes ne sont accessibles que depuis l'intérieur de la classe.
- `protected` : comme `private`, mais les méthodes sont accessibles entre instances de la même classe. Utile pour les comparaisons entre objets.

## to_s — affichage lisible

`to_s` est une méthode spéciale : Ruby l'appelle automatiquement quand on utilise `puts` ou l'interpolation `#{}` :

```ruby
class Pokemon
  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Niv.#{@level}"
  end
end

pikachu = Pokemon.new('Pikachu', 25)
puts pikachu              # => Pikachu Niv.25
puts "Go, #{pikachu} !"   # => Go, Pikachu Niv.25 !
```

- Sans `to_s`, `puts pikachu` afficherait quelque chose comme `#<Pokemon:0x00007f...>`, ce qui n'est pas très utile.

## Constantes dans une classe

```ruby
class Pokemon
  MAX_LEVEL = 100

  def initialize(name, level)
    @name = name
    @level = level.clamp(1, MAX_LEVEL)
  end
end

puts Pokemon::MAX_LEVEL    # => 100
```

- Les constantes définies dans une classe sont accessibles avec `::` depuis l'extérieur.
- À l'intérieur de la classe, on y accède directement par leur nom.

## Conclusion

- `class ClassName ... end` définit une classe. `.new` crée un objet et appelle `initialize`.
- Les variables d'instance (`@var`) stockent les données de l'objet. Elles sont privées par défaut.
- `attr_reader` crée des getters. `attr_accessor` crée getters + setters (sans validation).
- Les setters personnalisés (`def level=(value)`) permettent de valider les données.
- `self` est l'objet courant. Obligatoire pour appeler un setter (`self.level = 50`).
- `def self.method_name` définit une méthode de classe (appelée sur la classe, pas sur un objet).
- `private` rend les méthodes accessibles uniquement à l'intérieur de la classe.
- `to_s` définit l'affichage lisible d'un objet pour `puts` et l'interpolation.
