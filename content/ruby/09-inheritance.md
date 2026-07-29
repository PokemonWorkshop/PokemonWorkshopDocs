---
title: "Inheritance"
slug: inheritance
sidebar_position: 9
description: "This chapter introduces inheritance, the mechanism that allows a class to take everything another class defines and add its own specifics on top."
---

This chapter introduces **inheritance**, the mechanism that allows a class to take everything another class defines and add its own specifics on top.

## Principle

We created a `Pokemon` class in chapter 8. But not all Pokemon are the same: a wild Pokemon has a spawn area and a catch rate, a trainer's Pokemon has an owner and possibly a nickname.

We could copy-paste the `Pokemon` class and modify it for each case, but that would be wasteful. If we fix a bug in `Pokemon`, we would have to fix it in all the copies.

**Inheritance** solves this problem. We create a **child** class that **inherits** from the **parent** class. The child automatically receives all methods and attributes from the parent, and can add or modify them.

We say that `WildPokemon` **is a** `Pokemon` with additional properties. It is the "is a" relationship that guides inheritance.

## Inheriting from a class

The syntax is `class Child < Parent`:

```ruby live
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Lvl.#{@level}"
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
puts wild           # => Rattata Lvl.3
puts wild.name      # => Rattata
puts wild.area      # => Route 1
puts wild.cry       # => Rattata !
```

- `class WildPokemon < Pokemon`: `WildPokemon` inherits from `Pokemon`. It receives `name`, `level`, `to_s`, `cry` — everything that `Pokemon` defines.
- `super(name, level)` in `initialize` calls the parent's constructor. Without this call, `@name` and `@level` would not be initialized.
- `@area` is an attribute specific to `WildPokemon`. The parent `Pokemon` does not know about it.

## super — calling the parent's method

`super` is the keyword that calls the parent's method with the **same name**. There are three forms:

```ruby
class Pokemon
  def initialize(name, level)
    @name = name
    @level = level
  end
end

class WildPokemon < Pokemon
  def initialize(name, level, area)
    # super with arguments: passes exactly these arguments to the parent
    super(name, level)
    @area = area
  end
end
```

The three forms of `super`:

- `super(name, level)`: passes exactly the specified arguments. This is the most common and most explicit form.
- `super` (without parentheses): passes **all** the arguments received by the current method, as-is. Handy when the child receives the same arguments as the parent.
- `super()` (empty parentheses): passes **no** arguments. Useful when the parent expects nothing.

Beware: confusing `super` and `super()` is a common source of bugs. If the parent expects arguments and you write `super()`, Ruby will raise an error.

## Overriding a method

The child can **redefine** a parent method to change its behavior:

```ruby live
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Lvl.#{@level}"
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

  # Override: enriches the parent's display
  def to_s
    return "#{super} [Wild - #{@area}]"
  end

  # Override: completely replaces the parent's behavior
  def cry
    return "A wild #{@name} appears!"
  end
end

wild = WildPokemon.new('Rattata', 3, 'Route 1')
puts wild       # => Rattata Lvl.3 [Wild - Route 1]
puts wild.cry   # => A wild Rattata appears!
```

- `to_s` calls `super` to retrieve the parent's display (`"Rattata Lvl.3"`) and adds information to it. This is override by **enrichment**.
- `cry` does not call `super`. The parent's behavior is entirely replaced. This is override by **replacement**.

You choose one or the other depending on the need. Enrichment is more common because it avoids duplicating the parent's logic.

## A second child

```ruby
class TrainerPokemon < Pokemon
  attr_reader :trainer_name

  def initialize(name, level, trainer_name)
    super(name, level)
    @trainer_name = trainer_name
  end

  def to_s
    return "#{super} [Trainer: #{@trainer_name}]"
  end

  def cry
    return "#{@trainer_name} sends out #{@name}!"
  end
end

trainer_pokemon = TrainerPokemon.new('Charizard', 36, 'Red')
puts trainer_pokemon       # => Charizard Lvl.36 [Trainer: Red]
puts trainer_pokemon.cry   # => Red sends out Charizard!
```

- `TrainerPokemon` and `WildPokemon` both inherit from `Pokemon` but add different behaviors. This is **polymorphism**: the same call (`cry`) produces a different result depending on the object's class.

## Chain inheritance

A child class can itself be the parent of another class:

```ruby
class LegendaryPokemon < WildPokemon
  attr_reader :signature_move

  def initialize(name, level, area, signature_move)
    super(name, level, area)
    @signature_move = signature_move
  end

  def to_s
    return "#{super} | Signature move: #{@signature_move}"
  end
end

mewtwo = LegendaryPokemon.new('Mewtwo', 70, 'Azure Cave', 'Psychic Strike')
puts mewtwo
# => Mewtwo Lvl.70 [Wild - Azure Cave] | Signature move: Psychic Strike
```

- `LegendaryPokemon` inherits from `WildPokemon`, which inherits from `Pokemon`. The `super` chain goes up automatically.
- `to_s` calls `super` which calls `WildPokemon`'s `to_s`, which itself calls `Pokemon`'s `to_s`. Each level adds its own information.

## Inspecting the hierarchy

Ruby offers several tools to examine relationships between classes:

```ruby
mewtwo = LegendaryPokemon.new('Mewtwo', 70, 'Azure Cave', 'Psychic Strike')

# is_a? checks the class AND all its ancestors
puts mewtwo.is_a?(LegendaryPokemon)           # => true
puts mewtwo.is_a?(WildPokemon)                # => true
puts mewtwo.is_a?(Pokemon)                    # => true
puts mewtwo.is_a?(TrainerPokemon)             # => false

# instance_of? checks ONLY the exact class
puts mewtwo.instance_of?(LegendaryPokemon)    # => true
puts mewtwo.instance_of?(Pokemon)             # => false

# Hierarchy inspection
puts mewtwo.class                             # => LegendaryPokemon
puts LegendaryPokemon.superclass              # => WildPokemon
puts WildPokemon.superclass                   # => Pokemon
p LegendaryPokemon.ancestors
# => [LegendaryPokemon, WildPokemon, Pokemon, Object, ...]
```

- `.is_a?` is the most used: it checks if the object is an instance of the class **or any of its ancestors**.
- `.instance_of?` is strict: only the exact class.
- `.superclass` returns the direct parent of a class. It is called on the **class**, not on an object.
- `.ancestors` returns the full hierarchy chain. It is a useful tool to understand in what order Ruby looks for methods.

## Inheritance vs composition

Inheritance is not always the right tool. The rule is simple:

- **Inheritance** when the relationship is "**is a**": a `WildPokemon` **is a** `Pokemon`.
- **Composition** when the relationship is "**has a**" or "**uses a**": a `Pokemon` **has** attacks, a team **uses** an Array of Pokemon. In these cases, you store the object in an instance variable instead of inheriting from it.

When in doubt, composition is often the more flexible choice. We will see composition in detail with modules in chapter 10.

## Conclusion

- `class Child < Parent` creates a class that inherits everything the parent defines.
- `super(arguments)` calls the parent's method. Always call `super` in `initialize`.
- Overriding a method = redefining it in the child. You can call `super` to enrich the parent's behavior, or not call it to replace it entirely.
- `.is_a?` checks the class and its ancestors. `.instance_of?` checks only the exact class.
- `.superclass` returns the direct parent of a class. `.ancestors` shows the full method lookup chain.
- Use inheritance for "is a" relationships. Prefer composition for "has a" or "uses a" relationships.
