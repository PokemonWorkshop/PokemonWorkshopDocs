---
title: "Comment utiliser les modules en Ruby ?"
slug: modules
sidebar_position: 10
description: "Ce chapitre présente les modules, un outil pour organiser le code et partager du comportement entre classes. Les modules sont le complément naturel des classes et de l'héritage."
---

Ce chapitre présente les **modules**, un outil pour organiser le code et partager du comportement entre classes. Les modules sont le complément naturel des classes et de l'héritage.

## Principe

Au chapitre 9, on a vu que l'héritage permet de spécialiser une classe. Mais il a une limite : en Ruby, une classe ne peut hériter que d'**un seul** parent. Que faire si on veut donner des capacités d'affichage à `Pokemon` **et** à `Team`, deux classes sans lien de parenté ?

C'est le rôle des **modules**. Un module est un conteneur de méthodes et de constantes. Il ressemble à une classe, mais avec deux différences majeures :

- On **ne peut pas** créer d'instance d'un module (pas de `.new`)
- On peut l'**inclure** dans autant de classes qu'on veut

Un module a deux usages principaux :

- **Espace de noms** : regrouper des classes et constantes sous un même toit pour éviter les conflits de noms
- **Mixin** : partager des méthodes entre plusieurs classes sans héritage

## Les espaces de noms

Imaginons qu'on ait une classe `Pokemon` pour le Pokédex et une autre `Pokemon` pour le combat. Sans module, c'est un conflit de noms. Les modules résolvent ce problème :

```ruby
module Pokedex
  class Pokemon
    attr_reader :name, :types

    def initialize(name, types)
      @name = name
      @types = types
    end
  end
end

module Combat
  class Pokemon
    attr_reader :name, :hp

    def initialize(name, hp)
      @name = name
      @hp = hp
    end
  end
end

# Deux classes Pokemon, sans conflit
entry = Pokedex::Pokemon.new('Pikachu', [:electric])
fighter = Combat::Pokemon.new('Pikachu', 55)
```

- `module Pokedex ... end` crée un espace de noms. `Pokedex::Pokemon` et `Combat::Pokemon` coexistent sans problème.
- `::` (double deux-points) est l'opérateur de **résolution de portée**. Il permet de naviguer dans les modules : `Pokedex::Pokemon` signifie "la classe `Pokemon` à l'intérieur du module `Pokedex`".

## Constantes dans un module

Un module peut contenir des constantes :

```ruby
module Pokedex
  VERSION = '1.0.0'
  MAX_TEAM_SIZE = 6
end

puts Pokedex::VERSION          # => 1.0.0
puts Pokedex::MAX_TEAM_SIZE    # => 6
```

- Les constantes sont accessibles depuis l'extérieur avec `::`.
- À l'intérieur du module, on y accède directement par leur nom.

## Modules imbriqués

Les modules peuvent s'imbriquer les uns dans les autres :

```ruby
module Pokedex
  module Data
    class Pokemon
      attr_reader :name

      def initialize(name)
        @name = name
      end
    end
  end
end

pikachu = Pokedex::Data::Pokemon.new('Pikachu')
```

- `Pokedex::Data::Pokemon` : on enchaîne les `::` pour naviguer dans les niveaux d'imbrication.

On peut aussi **rouvrir** un module pour y ajouter du contenu plus tard :

```ruby
module Pokedex
  VERSION = '1.0.0'
end

# Plus loin dans le code (ou dans un autre fichier)
module Pokedex
  MAX_TEAM_SIZE = 6
end

puts Pokedex::VERSION          # => 1.0.0
puts Pokedex::MAX_TEAM_SIZE    # => 6
```

- Ruby fusionne les déclarations. C'est très courant quand le code est réparti sur plusieurs fichiers.

## include — partager du comportement (mixin)

`include` injecte les méthodes d'un module dans une classe. Les méthodes du module deviennent des **méthodes d'instance** de la classe :

```ruby live
module Displayable
  def summary
    return "#{@name} Niv.#{@level}"
  end
end

class Pokemon
  include Displayable

  def initialize(name, level)
    @name = name
    @level = level
  end
end

class Trainer
  include Displayable

  def initialize(name, level)
    @name = name
    @level = level
  end
end

pikachu = Pokemon.new('Pikachu', 25)
sacha = Trainer.new('Sacha', 10)

puts pikachu.summary    # => Pikachu Niv.25
puts sacha.summary      # => Sacha Niv.10
```

- `include Displayable` donne la méthode `summary` à `Pokemon` **et** à `Trainer`. On a partagé du comportement sans héritage.
- Le module accède aux variables d'instance (`@name`, `@level`) de l'objet qui l'inclut. Il faut donc que la classe définisse ces variables.
- C'est ce qu'on appelle un **mixin** : on "mixe" les méthodes du module dans la classe.

## include et la chaîne des ancêtres

Quand on inclut un module, il apparaît dans `.ancestors` :

```ruby
puts Pokemon.ancestors.inspect
# => [Pokemon, Displayable, Object, Kernel, BasicObject]
```

- Ruby cherche les méthodes dans l'ordre de `.ancestors` : d'abord dans la classe, puis dans les modules inclus, puis dans la classe parent.
- Si plusieurs modules définissent la même méthode, le **dernier inclus** a la priorité.

## extend — méthodes de classe

`extend` fonctionne comme `include`, mais les méthodes deviennent des **méthodes de classe** au lieu de méthodes d'instance :

```ruby
module Searchable
  def find_by_type(team, type)
    return team.select { |pokemon| pokemon.types.include?(type) }
  end
end

class Pokemon
  extend Searchable

  attr_reader :name, :types

  def initialize(name, types)
    @name = name
    @types = types
  end
end

team = [
  Pokemon.new('Pikachu', [:electric]),
  Pokemon.new('Dracaufeu', [:fire, :flying]),
  Pokemon.new('Tortank', [:water])
]

# Appel sur la classe (pas sur un objet)
fire_pokemon = Pokemon.find_by_type(team, :fire)
puts fire_pokemon.first.name    # => Dracaufeu
```

- `include` → méthodes d'instance (appelées sur un objet : `pikachu.summary`)
- `extend` → méthodes de classe (appelées sur la classe : `Pokemon.find_by_type(...)`)

## module_function — fonctions utilitaires

`module_function` rend des méthodes appelables directement sur le module, comme des fonctions utilitaires :

```ruby live
module Pokedex
  module Combat
    def calculate_damage(attack, defense, power)
      return ((power * attack) / (defense + 1.0)).round
    end
    module_function :calculate_damage
  end
end

puts Pokedex::Combat.calculate_damage(55, 40, 60)    # => 80
```

- `module_function :calculate_damage` rend la méthode appelable directement sur le module.
- C'est le même mécanisme que `Math.sqrt(4)` en Ruby : `Math` est un module, et `sqrt` est une `module_function`.

On peut aussi écrire `module_function` sans argument pour que **toutes** les méthodes qui suivent soient des fonctions de module :

```ruby
module Pokedex
  module Combat
    module_function

    def calculate_damage(attack, defense, power)
      return ((power * attack) / (defense + 1.0)).round
    end

    def effectiveness(attack_type, defense_type)
      # ...
    end
  end
end
```

## Résolution absolue avec

Si un module interne porte le même nom qu'un module externe, on peut forcer la résolution depuis la racine avec `::` en préfixe :

```ruby
module Pokedex
  REGION = 'Kanto'

  module Data
    REGION = 'Johto'

    def self.display_regions
      puts REGION              # => Johto (résolution relative)
      puts Pokedex::REGION     # => Kanto (résolution explicite)
      puts ::Pokedex::REGION   # => Kanto (résolution absolue depuis la racine)
    end
  end
end

Pokedex::Data.display_regions
```

- `::Pokedex::REGION` : le `::` initial force Ruby à chercher depuis le niveau le plus haut. C'est rarement nécessaire, mais utile en cas d'ambiguïté.

## Conclusion

- Un **module** est un conteneur de méthodes et de constantes. On ne peut pas en créer d'instance.
- Les modules servent d'**espaces de noms** pour éviter les conflits (`Pokedex::Pokemon` vs `Combat::Pokemon`).
- `include` injecte les méthodes d'un module comme **méthodes d'instance**. C'est le mixin.
- `extend` injecte les méthodes comme **méthodes de classe**.
- `module_function` rend des méthodes appelables directement sur le module (comme `Math.sqrt`).
- `::` navigue dans les modules. `::Module` en préfixe force la résolution depuis la racine.
- Les modules s'imbriquent et se rouvrent librement. Ruby fusionne les déclarations.
- Les modules inclus apparaissent dans `.ancestors`, ce qui influence l'ordre de recherche des méthodes.
