---
title: "How to create classes and objects?"
slug: classes-and-objects
sidebar_position: 8
description: "This chapter introduces **classes**, the central mechanism for organizing code in Ruby. A class groups data and behaviors in a single place."
---

This chapter introduces **classes**, the central mechanism for organizing code in Ruby. A class groups data and behaviors in a single place.

## Principle

Up until now, we used Hashes to represent a Pokemon: `{ name: 'Pikachu', level: 25 }`. It works, but it has limitations:

- You cannot control the values (nothing prevents setting a negative level)
- You cannot attach behavior to the Hash (no `heal` or `take_damage` method)
- You can make typos in the keys without Ruby warning you

A **class** solves all of this. It is a blueprint that defines:

- What **data** the object contains (instance variables `@`)
- What **behaviors** it has (methods)

An **object** is an instance created from this blueprint.

## Defining a class

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

- `class Pokemon ... end` defines the class. The name starts with a capital letter (`CamelCase` convention).
- `initialize` is a special method called automatically by `.new`. It is the **constructor**: it receives the arguments and initializes the instance variables.
- `@name` and `@level` are **instance variables**. They belong to the object and persist between method calls.
- `Pokemon.new('Pikachu', 25)` creates a new object and calls `initialize` with these arguments.

## Instance variables and accessors

Instance variables (`@name`, `@level`) are **private** by default. You cannot access them from outside:

```ruby
pikachu = Pokemon.new('Pikachu', 25)
# pikachu.name    # => Error! NoMethodError
```

To allow reading, use `attr_reader`:

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
# pikachu.level = 50  # => Error! No setter
```

- `attr_reader :name, :level` creates reader methods (getters) for `@name` and `@level`.

There are also:

- `attr_writer :level`: creates a setter only (`pikachu.level = 50`)
- `attr_accessor :level`: creates getter **and** setter

But `attr_accessor` does not perform any validation. If you want to control the values, you write a custom setter.

## Custom setters

A custom setter is a method whose name ends with `=`. Ruby translates `pikachu.level = 50` into a call to this method:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    self.level = level
  end

  # Custom setter: level is always between 1 and 100
  def level=(new_level)
    @level = new_level.clamp(1, 100)
    return @level
  end
end

pokemon = Pokemon.new('Charizard', 150)
puts pokemon.level    # => 100 (clamped by the setter)

pokemon.level = -5
puts pokemon.level    # => 1 (clamped by the setter)
```

- `def level=(new_level)`: the `=` is part of the method name. This is what allows writing `pokemon.level = 50`.
- `.clamp(1, 100)` bounds the value between 1 and 100.
- `self.level = level` in `initialize` calls the setter (and therefore the validation). If we wrote `@level = level`, we would bypass the validation.

## Instance methods

Methods defined inside a class are **instance methods**. They operate on the object's data:

```ruby
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
puts pikachu.hp             # => 0 (does not go below 0)
puts pikachu.fainted?       # => true

pikachu.heal
puts pikachu.hp             # => 55
```

- Each method accesses the instance variables of the object it is called on.
- `fainted?` ends with `?`: a Ruby convention for methods that return a boolean.

## self -- the current object

`self` refers to the current object. Inside an instance method, `self` is the object on which the method was called:

```ruby
class Pokemon
  attr_reader :name

  def initialize(name)
    @name = name
  end

  def introduce
    puts "I am #{self.name}!"
    # Equivalent to:
    puts "I am #{name}!"
    # Equivalent to:
    puts "I am #{@name}!"
  end
end
```

- `self.name`, `name`, and `@name` all access the same data here. `self.` is optional for getters.
- `self` is **required** to call a setter: `self.level = 50`. Without `self.`, Ruby would think you are creating a local variable.

## Class methods

A class method is called on the class itself, not on an object. You define it with `def self.`:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  # Class method: creates a starter at level 5
  def self.starter(name)
    return Pokemon.new(name, 5)
  end
end

pikachu = Pokemon.starter('Pikachu')
puts pikachu.level    # => 5
```

- `def self.starter` is called via `Pokemon.starter(...)`, not via an object.
- This is a **factory** pattern: a method that creates objects with a predefined configuration.

To group multiple class methods, you can use `class << self`:

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

## Visibility: public, private, protected

By default, all methods are **public**. You can restrict access:

```ruby
class Pokemon
  attr_reader :name

  def initialize(name, level)
    @name = name
    @level = level
  end

  # Public: accessible from outside
  def summary
    puts "#{@name} Lvl.#{@level}"
    puts "  PV max : #{calculate_max_hp}"
  end

  private

  # Private: accessible only from inside the class
  def calculate_max_hp
    return @level * 3 + 10
  end
end

pikachu = Pokemon.new('Pikachu', 25)
pikachu.summary              # Works
# pikachu.calculate_max_hp  # => Error! NoMethodError
```

- `private`: everything below this keyword becomes private. These methods are only accessible from inside the class.
- `protected`: like `private`, but methods are accessible between instances of the same class. Useful for comparisons between objects.

## to_s -- readable display

`to_s` is a special method: Ruby calls it automatically when you use `puts` or string interpolation `#{}`:

```ruby
class Pokemon
  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Lvl.#{@level}"
  end
end

pikachu = Pokemon.new('Pikachu', 25)
puts pikachu              # => Pikachu Lvl.25
puts "Go, #{pikachu} !"   # => Go, Pikachu Lvl.25 !
```

- Without `to_s`, `puts pikachu` would display something like `#<Pokemon:0x00007f...>`, which is not very useful.

## Constants inside a class

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

- Constants defined inside a class are accessible with `::` from outside.
- Inside the class, you access them directly by name.

## Conclusion

- `class ClassName ... end` defines a class. `.new` creates an object and calls `initialize`.
- Instance variables (`@var`) store the object's data. They are private by default.
- `attr_reader` creates getters. `attr_accessor` creates getters + setters (without validation).
- Custom setters (`def level=(value)`) allow validating the data.
- `self` is the current object. Required to call a setter (`self.level = 50`).
- `def self.method_name` defines a class method (called on the class, not on an object).
- `private` makes methods accessible only from inside the class.
- `to_s` defines the readable display of an object for `puts` and interpolation.
