---
title: "Modules"
slug: modules
sidebar_position: 10
description: "This chapter introduces modules, a tool for organizing code and sharing behavior between classes. Modules are the natural complement to classes and inheritance."
---

This chapter introduces **modules**, a tool for organizing code and sharing behavior between classes. Modules are the natural complement to classes and inheritance.

## Principle

In chapter 9, we saw that inheritance allows specializing a class. But it has a limitation: in Ruby, a class can only inherit from **one** parent. What if we want to give display capabilities to `Pokemon` **and** `Team`, two classes with no parent-child relationship?

That is the role of **modules**. A module is a container for methods and constants. It looks like a class, but with two major differences:

- You **cannot** create an instance of a module (no `.new`)
- You can **include** it in as many classes as you want

A module has two main uses:

- **Namespace**: grouping classes and constants under the same roof to avoid name conflicts
- **Mixin**: sharing methods between multiple classes without inheritance

## Namespaces

Imagine we have a `Pokemon` class for the Pokedex and another `Pokemon` for combat. Without a module, this is a name conflict. Modules solve this problem:

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

# Two Pokemon classes, no conflict
entry = Pokedex::Pokemon.new('Pikachu', [:electric])
fighter = Combat::Pokemon.new('Pikachu', 55)
```

- `module Pokedex ... end` creates a namespace. `Pokedex::Pokemon` and `Combat::Pokemon` coexist without issue.
- `::` (double colon) is the **scope resolution** operator. It navigates through modules: `Pokedex::Pokemon` means "the class `Pokemon` inside the module `Pokedex`".

## Constants in a module

A module can contain constants:

```ruby
module Pokedex
  VERSION = '1.0.0'
  MAX_TEAM_SIZE = 6
end

puts Pokedex::VERSION          # => 1.0.0
puts Pokedex::MAX_TEAM_SIZE    # => 6
```

- Constants are accessible from the outside with `::`.
- Inside the module, they are accessed directly by their name.

## Nested modules

Modules can be nested inside each other:

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

- `Pokedex::Data::Pokemon`: we chain `::` to navigate through nesting levels.

You can also **reopen** a module to add content later:

```ruby
module Pokedex
  VERSION = '1.0.0'
end

# Later in the code (or in another file)
module Pokedex
  MAX_TEAM_SIZE = 6
end

puts Pokedex::VERSION          # => 1.0.0
puts Pokedex::MAX_TEAM_SIZE    # => 6
```

- Ruby merges the declarations. This is very common when code is spread across multiple files.

## include — sharing behavior (mixin)

`include` injects a module's methods into a class. The module's methods become **instance methods** of the class:

```ruby
module Displayable
  def summary
    return "#{@name} Lvl.#{@level}"
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
sacha = Trainer.new('Ash', 10)

puts pikachu.summary    # => Pikachu Lvl.25
puts sacha.summary      # => Ash Lvl.10
```

- `include Displayable` gives the `summary` method to `Pokemon` **and** `Trainer`. We shared behavior without inheritance.
- The module accesses the instance variables (`@name`, `@level`) of the object that includes it. So the class must define those variables.
- This is what we call a **mixin**: we "mix" the module's methods into the class.

## include and the ancestor chain

When you include a module, it appears in `.ancestors`:

```ruby
puts Pokemon.ancestors.inspect
# => [Pokemon, Displayable, Object, Kernel, BasicObject]
```

- Ruby looks for methods in the order of `.ancestors`: first in the class, then in the included modules, then in the parent class.
- If multiple modules define the same method, the **last included** one takes priority.

## extend — class methods

`extend` works like `include`, but the methods become **class methods** instead of instance methods:

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
  Pokemon.new('Charizard', [:fire, :flying]),
  Pokemon.new('Blastoise', [:water])
]

# Called on the class (not on an object)
fire_pokemon = Pokemon.find_by_type(team, :fire)
puts fire_pokemon.first.name    # => Charizard
```

- `include` -> instance methods (called on an object: `pikachu.summary`)
- `extend` -> class methods (called on the class: `Pokemon.find_by_type(...)`)

## module_function — utility functions

`module_function` makes methods callable directly on the module, like utility functions:

```ruby
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

- `module_function :calculate_damage` makes the method callable directly on the module.
- This is the same mechanism as `Math.sqrt(4)` in Ruby: `Math` is a module, and `sqrt` is a `module_function`.

You can also write `module_function` without an argument so that **all** methods that follow become module functions:

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

## Absolute resolution with

If an inner module has the same name as an outer module, you can force resolution from the root with a `::` prefix:

```ruby
module Pokedex
  REGION = 'Kanto'

  module Data
    REGION = 'Johto'

    def self.display_regions
      puts REGION              # => Johto (relative resolution)
      puts Pokedex::REGION     # => Kanto (explicit resolution)
      puts ::Pokedex::REGION   # => Kanto (absolute resolution from the root)
    end
  end
end

Pokedex::Data.display_regions
```

- `::Pokedex::REGION`: the leading `::` forces Ruby to search from the top level. This is rarely needed, but useful in case of ambiguity.

## Conclusion

- A **module** is a container for methods and constants. You cannot create instances of it.
- Modules serve as **namespaces** to avoid conflicts (`Pokedex::Pokemon` vs `Combat::Pokemon`).
- `include` injects a module's methods as **instance methods**. This is the mixin.
- `extend` injects the methods as **class methods**.
- `module_function` makes methods callable directly on the module (like `Math.sqrt`).
- `::` navigates through modules. `::Module` as a prefix forces resolution from the root.
- Modules can be nested and reopened freely. Ruby merges the declarations.
- Included modules appear in `.ancestors`, which influences the method lookup order.
