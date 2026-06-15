---
title: "L'héritage"
slug: heritage
sidebar_position: 9
description: "Ce chapitre présente l'héritage, le mécanisme qui permet à une classe de reprendre tout ce qu'une autre classe définit et d'y ajouter ses propres spécificités."
---

Ce chapitre présente l'**héritage**, le mécanisme qui permet à une classe de reprendre tout ce qu'une autre classe définit et d'y ajouter ses propres spécificités.

## Principe

On a créé une classe `Pokemon` au chapitre 8. Mais tous les Pokémon ne sont pas identiques : un Pokémon sauvage a une zone d'apparition et un taux de capture, un Pokémon de dresseur a un propriétaire et peut-être un surnom.

On pourrait copier-coller la classe `Pokemon` et la modifier pour chaque cas, mais ce serait du gaspillage. Si on corrige un bug dans `Pokemon`, il faudrait le corriger dans toutes les copies.

L'**héritage** résout ce problème. On crée une classe **enfant** qui **hérite** de la classe **parent**. L'enfant reçoit automatiquement toutes les méthodes et attributs du parent, et peut en ajouter ou en modifier.

On dit que `WildPokemon` **est un** `Pokemon` avec des propriétés supplémentaires. C'est la relation "est un" qui guide l'héritage.

## Hériter d'une classe

La syntaxe est `class Enfant < Parent` :

```ruby live
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Niv.#{@level}"
  end

  def cry
    return "#{@name} !"
  end
end

class WildPokemon < Pokemon
  attr_reader :area

  def initialize(name, level, area)
    super(name, level)
    @area = area
  end
end

wild = WildPokemon.new('Rattata', 3, 'Route 1')
puts wild           # => Rattata Niv.3
puts wild.name      # => Rattata
puts wild.area      # => Route 1
puts wild.cry       # => Rattata !
```

- `class WildPokemon < Pokemon` : `WildPokemon` hérite de `Pokemon`. Il reçoit `name`, `level`, `to_s`, `cry` — tout ce que `Pokemon` définit.
- `super(name, level)` dans `initialize` appelle le constructeur du parent. Sans cet appel, `@name` et `@level` ne seraient pas initialisés.
- `@area` est un attribut propre à `WildPokemon`. Le parent `Pokemon` ne le connaît pas.

## super — appeler la méthode du parent

`super` est le mot-clé qui appelle la méthode du parent portant le **même nom**. Il existe trois formes :

```ruby
class Pokemon
  def initialize(name, level)
    @name = name
    @level = level
  end
end

class WildPokemon < Pokemon
  def initialize(name, level, area)
    # super avec des arguments : transmet exactement ces arguments au parent
    super(name, level)
    @area = area
  end
end
```

Les trois formes de `super` :

- `super(name, level)` : transmet exactement les arguments spécifiés. C'est la forme la plus courante et la plus explicite.
- `super` (sans parenthèses) : transmet **tous** les arguments reçus par la méthode courante, tels quels. Pratique quand l'enfant reçoit les mêmes arguments que le parent.
- `super()` (parenthèses vides) : ne transmet **aucun** argument. Utile quand le parent n'attend rien.

Attention : confondre `super` et `super()` est une source fréquente de bugs. Si le parent attend des arguments et qu'on écrit `super()`, Ruby lèvera une erreur.

## Surcharger une méthode

L'enfant peut **redéfinir** une méthode du parent pour changer son comportement :

```ruby live
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Niv.#{@level}"
  end

  def cry
    return "#{@name} !"
  end
end

class WildPokemon < Pokemon
  attr_reader :area

  def initialize(name, level, area)
    super(name, level)
    @area = area
  end

  # Surcharge : enrichit l'affichage du parent
  def to_s
    return "#{super} [Sauvage - #{@area}]"
  end

  # Surcharge : remplace complètement le comportement du parent
  def cry
    return "Un #{@name} sauvage apparaît !"
  end
end

wild = WildPokemon.new('Rattata', 3, 'Route 1')
puts wild       # => Rattata Niv.3 [Sauvage - Route 1]
puts wild.cry   # => Un Rattata sauvage apparaît !
```

- `to_s` appelle `super` pour récupérer l'affichage du parent (`"Rattata Niv.3"`) et y ajoute des informations. C'est la surcharge par **enrichissement**.
- `cry` ne fait pas appel à `super`. Le comportement du parent est entièrement remplacé. C'est la surcharge par **remplacement**.

On choisit l'un ou l'autre selon le besoin. L'enrichissement est plus courant car il évite de dupliquer la logique du parent.

## Un second enfant

```ruby
class TrainerPokemon < Pokemon
  attr_reader :trainer_name

  def initialize(name, level, trainer_name)
    super(name, level)
    @trainer_name = trainer_name
  end

  def to_s
    return "#{super} [Dresseur : #{@trainer_name}]"
  end

  def cry
    return "#{@trainer_name} envoie #{@name} !"
  end
end

trainer_pokemon = TrainerPokemon.new('Dracaufeu', 36, 'Red')
puts trainer_pokemon       # => Dracaufeu Niv.36 [Dresseur : Red]
puts trainer_pokemon.cry   # => Red envoie Dracaufeu !
```

- `TrainerPokemon` et `WildPokemon` héritent tous les deux de `Pokemon` mais ajoutent des comportements différents. C'est le **polymorphisme** : le même appel (`cry`) produit un résultat différent selon la classe de l'objet.

## Héritage en chaîne

Une classe enfant peut elle-même être parent d'une autre classe :

```ruby
class LegendaryPokemon < WildPokemon
  attr_reader :signature_move

  def initialize(name, level, area, signature_move)
    super(name, level, area)
    @signature_move = signature_move
  end

  def to_s
    return "#{super} | Attaque signature : #{@signature_move}"
  end
end

mewtwo = LegendaryPokemon.new('Mewtwo', 70, 'Grotte Azurée', 'Frappe Psy')
puts mewtwo
# => Mewtwo Niv.70 [Sauvage - Grotte Azurée] | Attaque signature : Frappe Psy
```

- `LegendaryPokemon` hérite de `WildPokemon`, qui hérite de `Pokemon`. La chaîne `super` remonte automatiquement.
- `to_s` appelle `super` qui appelle le `to_s` de `WildPokemon`, qui appelle lui-même le `to_s` de `Pokemon`. Chaque niveau ajoute ses informations.

## Inspecter la hiérarchie

Ruby offre plusieurs outils pour examiner les relations entre classes :

```ruby
mewtwo = LegendaryPokemon.new('Mewtwo', 70, 'Grotte Azurée', 'Frappe Psy')

# is_a? vérifie la classe ET tous ses ancêtres
puts mewtwo.is_a?(LegendaryPokemon)           # => true
puts mewtwo.is_a?(WildPokemon)                # => true
puts mewtwo.is_a?(Pokemon)                    # => true
puts mewtwo.is_a?(TrainerPokemon)             # => false

# instance_of? vérifie UNIQUEMENT la classe exacte
puts mewtwo.instance_of?(LegendaryPokemon)    # => true
puts mewtwo.instance_of?(Pokemon)             # => false

# Inspection de la hiérarchie
puts mewtwo.class                             # => LegendaryPokemon
puts LegendaryPokemon.superclass              # => WildPokemon
puts WildPokemon.superclass                   # => Pokemon
p LegendaryPokemon.ancestors
# => [LegendaryPokemon, WildPokemon, Pokemon, Object, ...]
```

- `.is_a?` est le plus utilisé : il vérifie si l'objet est une instance de la classe **ou de l'un de ses ancêtres**.
- `.instance_of?` est strict : uniquement la classe exacte.
- `.superclass` retourne le parent direct d'une classe. On l'appelle sur la **classe**, pas sur un objet.
- `.ancestors` retourne la chaîne complète de la hiérarchie. C'est un outil utile pour comprendre dans quel ordre Ruby cherche les méthodes.

## Héritage vs composition

L'héritage n'est pas toujours le bon outil. La règle est simple :

- **Héritage** quand la relation est "**est un**" : un `WildPokemon` **est un** `Pokemon`.
- **Composition** quand la relation est "**a un**" ou "**utilise un**" : un `Pokemon` **a des** attaques, une équipe **utilise un** Array de Pokémon. Dans ces cas, on stocke l'objet dans une variable d'instance au lieu d'en hériter.

Si on hésite, la composition est souvent le choix le plus flexible. On verra la composition en détail avec les modules au chapitre 10.

## Conclusion

- `class Enfant < Parent` crée une classe qui hérite de tout ce que le parent définit.
- `super(arguments)` appelle la méthode du parent. Toujours appeler `super` dans `initialize`.
- Surcharger une méthode = la redéfinir dans l'enfant. On peut appeler `super` pour enrichir le comportement du parent, ou ne pas l'appeler pour le remplacer entièrement.
- `.is_a?` vérifie la classe et ses ancêtres. `.instance_of?` vérifie uniquement la classe exacte.
- `.superclass` retourne le parent direct d'une classe. `.ancestors` montre la chaîne complète de recherche des méthodes.
- Utiliser l'héritage pour les relations "est un". Préférer la composition pour les relations "a un" ou "utilise un".
