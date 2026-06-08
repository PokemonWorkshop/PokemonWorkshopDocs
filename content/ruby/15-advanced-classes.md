---
title: "How to use advanced class features in Ruby?"
slug: advanced-class-features
sidebar_position: 16
description: "This chapter introduces advanced class features: operator overloading, duck typing, Struct, and object identity management. These tools make classes more expressive and natural to use."
---

This chapter introduces advanced class features: operator overloading, duck typing, `Struct`, and object identity management. These tools make classes more expressive and natural to use.

## Principle

In Ruby, operators like `==`, `+`, `[]` are actually **methods**. Writing `a == b` is the same as calling `a.==(b)`. You can therefore redefine them in your own classes to give them meaningful behavior.

Ruby also relies on **duck typing**: what matters is not the type of an object, but the methods it responds to. "If it walks like a duck and quacks like a duck, then it is a duck."

## Overloading == (equality)

By default, `==` checks whether two variables point to the **same object** in memory. This is generally not what you want:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end
end

a = Pokemon.new('Pikachu', 25)
b = Pokemon.new('Pikachu', 25)
puts a == b    # => false (two different objects in memory!)
```

To compare by **value**, redefine `==`:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def ==(other)
    return false unless other.is_a?(Pokemon)

    return @name == other.name && @level == other.level
  end
end

a = Pokemon.new('Pikachu', 25)
b = Pokemon.new('Pikachu', 25)
puts a == b    # => true (same values)
```

- `other.is_a?(Pokemon)` checks the type to avoid errors if you compare a Pokemon with something else.
- You compare the attributes that define the logical identity of the object.

## Overloading [] and []= (key access)

We saw that `pikachu[:attack]` works when `pikachu` is a Hash. But if `pikachu` is a `Pokemon` object, it does not work by default. You can change that by defining the `[]` and `[]=` methods.

The idea: a Pokemon has several stats (HP, attack, defense...) stored in an internal Hash. Instead of writing `pikachu.stats[:attack]`, we would like to write `pikachu[:attack]` directly, as if the Pokemon itself were a Hash.

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level, stats)
    @name = name
    @level = level
    @stats = stats
  end

  # When we write pikachu[:attack], Ruby calls this method
  def [](stat_name)
    return @stats[stat_name]
  end

  # When we write pikachu[:attack] = 60, Ruby calls this method
  def []=(stat_name, value)
    @stats[stat_name] = value
    return value
  end
end

pikachu = Pokemon.new('Pikachu', 25, { hp: 35, attack: 55, defense: 40 })
puts pikachu[:attack]    # => 55

pikachu[:attack] = 60
puts pikachu[:attack]    # => 60
```

- `def [](stat_name)` is a method whose name is `[]`. The syntax is unusual, but it is a method name like any other. When Ruby sees `pikachu[:attack]`, it translates it to `pikachu.[](:attack)`.
- `def []=(stat_name, value)` works the same way: `pikachu[:attack] = 60` becomes `pikachu.[]=(:attack, 60)`.
- This is the same principle as the `level=` setter seen in chapter 8: Ruby translates natural syntax into a method call.

## Duck typing and respond_to?

Duck typing means you do not check the **type** of an object, but the **methods** it has:

```ruby
def display_creature(creature)
  puts "#{creature.name} Lvl.#{creature.level}" if creature.respond_to?(:name)
end
```

- `respond_to?(:name)` returns `true` if the object has a `name` method, regardless of its class.
- This allows a method to accept any object that has the right methods, not only instances of a specific class.

## Struct — quick data classes

`Struct` automatically creates a class with a constructor, getters, setters, `==`, and `to_s`:

```ruby
Move = Struct.new(:name, :type, :power, :accuracy)

thunderbolt = Move.new('Thunder', :electric, 90, 100)
puts thunderbolt.name      # => Thunder
puts thunderbolt.power     # => 90

# == automatically compares all values
other = Move.new('Thunder', :electric, 90, 100)
puts thunderbolt == other  # => true
```

- `Struct.new` creates a complete class in a single line. It is perfect for simple data objects like moves.
- You can add methods to a Struct with a block:

```ruby
Move = Struct.new(:name, :type, :power, :accuracy) do
  def to_s
    return "#{name} (#{type}) — Power: #{power}"
  end
end

puts Move.new('Thunder', :electric, 90, 100)
# => Thunder (electric) — Power: 90
```

## method_missing — dynamic interception

`method_missing` is called when you invoke a method that does not exist. You can use it to create dynamic accessors:

```ruby
class Pokemon
  KNOWN_STATS = [:hp, :attack, :defense, :speed]

  def initialize(name, stats)
    @name = name
    @stats = stats
  end

  def method_missing(method_name, *arguments)
    return @stats[method_name] if KNOWN_STATS.include?(method_name)

    super
  end

  def respond_to_missing?(method_name, include_private = false)
    return KNOWN_STATS.include?(method_name) || super
  end
end

pikachu = Pokemon.new('Pikachu', { hp: 35, attack: 55, defense: 40, speed: 90 })
puts pikachu.attack    # => 55
puts pikachu.speed     # => 90

puts pikachu.respond_to?(:attack)    # => true
puts pikachu.respond_to?(:unknown)   # => false
```

- `method_missing` intercepts the call. If the name matches a known stat, it returns its value. Otherwise, `super` propagates the error normally.
- **Always** implement `respond_to_missing?` alongside it. Without it, `respond_to?` would return `false` even if `method_missing` handles the call.
- This mechanism is powerful but should be used **sparingly**: it makes code harder to understand. Prefer explicit methods when possible.

## Object identity

Ruby has several levels of comparison:

```ruby
a = 'Pikachu'
b = 'Pikachu'

puts a == b         # => true  (same value)
puts a.equal?(b)    # => false (different objects in memory)
puts a.eql?(b)      # => true  (same value and same type)
```

- `==`: value equality (the most common, the one you redefine)
- `.equal?`: memory identity (same object). **Never redefine it.**
- `.eql?`: used by Hashes for keys. If you redefine `==`, also redefine `eql?` and `hash`:

```ruby
class Pokemon
  def ==(other)
    return false unless other.is_a?(Pokemon)

    return @name == other.name && @level == other.level
  end

  def eql?(other)
    return self == other
  end

  def hash
    return [@name, @level].hash
  end
end
```

- `eql?` and `hash` must be consistent with `==`: two equal objects must have the same `hash`.
- Without this, using a Pokemon as a Hash key would give inconsistent results.

## freeze, dup and clone

`freeze` makes an object immutable:

```ruby
name = 'Pikachu'
name.freeze
puts name.frozen?    # => true
# name.upcase!       # => Error! FrozenError
```

`dup` creates a shallow copy:

```ruby
original = { name: 'Pikachu', stats: { hp: 35 } }
copy = original.dup

copy[:name] = 'Raichu'          # Does NOT modify the original
copy[:stats][:hp] = 999         # DOES modify the original too!
```

- `dup` copies the Hash itself, but nested values (like the `stats` Hash) are **shared**. This is a "shallow" copy.
- `clone` is similar to `dup` but also preserves the `frozen` state.
- For a deep copy, you can use `Marshal.dump` + `Marshal.load` (seen in chapter 14).

Note: in some Ruby projects, `.freeze` is not used on constants because it can prevent certain code extension techniques. This is a design choice.

## Conclusion

- Ruby operators (`==`, `[]`, `[]=`, `<=>`, `to_s`) are methods that you can redefine.
- Redefine `==` to compare by value. Always check the type with `is_a?`.
- `respond_to?` checks an object's capabilities rather than its type (duck typing).
- `Struct` creates complete data classes in a single line.
- `method_missing` intercepts calls to nonexistent methods. Always implement `respond_to_missing?`. Use sparingly.
- If you redefine `==`, also redefine `eql?` and `hash` for consistency with Hashes.
- `freeze` makes an object immutable. `dup` creates a shallow copy.
