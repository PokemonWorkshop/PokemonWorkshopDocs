---
title: "How to extend existing code with prepend in Ruby?"
slug: extending-code-with-prepend
sidebar_position: 11
description: "This chapter presents techniques for **extending existing code** without modifying it directly. This is a fundamental concept in Ruby: you can enrich a class after its creation, even if you do not have access to the source file."
---

This chapter presents techniques for **extending existing code** without modifying it directly. This is a fundamental concept in Ruby: you can enrich a class after its creation, even if you do not have access to the source file.

## Principle

Imagine we are using a `Pokemon` class written by someone else. We want to add a logging system that displays a message every time a Pokemon takes damage. But we do not want to (and sometimes cannot) modify the original file.

Ruby offers three solutions:

- **Reopening classes**: we reopen the class to add or modify methods. Simple but risky if we overwrite an existing method.
- **alias**: the old technique for saving a method before redefining it. Fragile.
- **prepend**: the modern and safe technique. We insert a module **before** the class in the ancestor chain.

## Reopening classes

In Ruby, classes are never "closed". You can reopen them to add methods:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def to_s
    return "#{@name} Lvl.#{@level}"
  end
end

# Later in the code (or in another file)
class Pokemon
  def can_evolve?
    return @level >= 16
  end
end

pikachu = Pokemon.new('Pikachu', 25)
puts pikachu.can_evolve?      # => true
puts pikachu                  # => Pikachu Lvl.25 (to_s still works)
```

- **Adding** a method by reopening the class is safe. The original is not touched.
- **Redefining** an existing method is risky: the original behavior is lost.

## alias — the old technique (to avoid)

`alias` saves a method under another name before redefining it:

```ruby
class Pokemon
  alias original_to_s to_s

  def to_s
    return "[Modified] #{original_to_s}"
  end
end

puts Pokemon.new('Pikachu', 25)    # => [Modified] Pikachu Lvl.25
```

- `alias original_to_s to_s` creates a copy of `to_s` under the name `original_to_s`.
- The problem: if **two plugins** use `alias` on the same method, the second overwrites the first. This is fragile and a source of bugs that are hard to diagnose.
- `alias` is a historical technique. It is no longer used in modern Ruby.

## prepend — the modern technique

`prepend` inserts a module **before** the class in the ancestor chain. The module can call `super` to execute the original method:

```ruby
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

# The module that extends the behavior
module DamageLog
  def take_damage(amount)
    puts "#{name} takes #{amount} damage!"
    super
    puts "#{name} has #{hp} HP remaining."
  end
end

# We insert the module BEFORE the class
Pokemon.prepend(DamageLog)

pikachu = Pokemon.new('Pikachu', 100)
pikachu.take_damage(30)
```

Output:

```
Pikachu takes 30 damage!
Pikachu has 70 HP remaining.
```

- `super` in the module calls the method **from the original class**. The original behavior is preserved and enriched.
- The module can execute code **before** and **after** `super`.
- Unlike `alias`, multiple modules can be prepended without conflict. Each `super` calls the next one in the chain.

## The ancestor chain with prepend

`prepend` modifies the order in `.ancestors`:

```ruby
puts Pokemon.ancestors.inspect
# Before: [Pokemon, Object, Kernel, BasicObject]

Pokemon.prepend(DamageLog)

puts Pokemon.ancestors.inspect
# After: [DamageLog, Pokemon, Object, Kernel, BasicObject]
```

- The module `DamageLog` is now **at the head** of the chain, before `Pokemon`.
- When we call `pikachu.take_damage(30)`, Ruby looks for the method in order: first in `DamageLog`, then in `Pokemon`.
- `super` in `DamageLog` passes to the next element in the chain: `Pokemon`.

## Multiple prepends

You can prepend multiple modules. Each `super` goes up the chain:

```ruby
module DamageLog
  def take_damage(amount)
    puts "[LOG] #{name} takes #{amount} damage"
    super
  end
end

module MagicShield
  def take_damage(amount)
    reduced_damage = (amount * 0.8).to_i
    puts "[SHIELD] Damage reduced from #{amount} to #{reduced_damage}"
    super(reduced_damage)
  end
end

Pokemon.prepend(DamageLog)
Pokemon.prepend(MagicShield)

puts Pokemon.ancestors.inspect
# => [MagicShield, DamageLog, Pokemon, Object, ...]
```

- The last prepended module is at the head. The call order is: `MagicShield` -> `DamageLog` -> `Pokemon`.
- `super(reduced_damage)` in `MagicShield` passes the reduced damage to `DamageLog`, which calls `super` toward `Pokemon`.
- This is what makes `prepend` so powerful: each plugin stacks without breaking the others.

## include vs prepend vs extend

Summary of the three ways to inject a module:

```ruby
class Pokemon
  include Displayable    # After the class (utilities)
  prepend DamageLog      # Before the class (interception)
  extend Search          # Class methods
end

puts Pokemon.ancestors.inspect
# => [DamageLog, Pokemon, Displayable, Object, ...]
```

| Method    | Position in ancestors | Called via                        | Usage                    |
| --------- | --------------------- | -------------------------------- | ------------------------ |
| `include` | After the class       | Instance (`pikachu.fiche`)       | Adding utilities         |
| `prepend` | Before the class      | Instance (`pikachu.take_damage`) | Intercepting & enriching |
| `extend`  | Outside the chain     | Class (`Pokemon.search(...)`)    | Class methods            |

- `include`: the module is inserted **after** the class. The class takes priority. Used for behavior sharing (Enumerable, Comparable).
- `prepend`: the module is inserted **before** the class. The module takes priority. Used for interception and extension.
- `extend`: the methods become class methods. Not in the instances' `.ancestors`.

## Important rule

Never replace an existing class with another hierarchy. Always use `prepend` to add behavior:

```ruby
# Do NOT do this
class Pokemon
  def take_damage(amount)
    # complete rewrite, the original behavior is lost
  end
end

# Do this instead
module MyExtension
  def take_damage(amount)
    # added code
    super    # the original behavior is preserved
  end
end
Pokemon.prepend(MyExtension)
```

## Conclusion

- Ruby classes are open. Adding methods by reopening is safe. Overwriting existing methods loses the original behavior.
- `alias` is the old technique, fragile and obsolete. Do not use it anymore.
- `prepend` inserts a module **before** the class in `.ancestors`. `super` calls the original method.
- Multiple prepended modules stack without conflict. Each `super` passes to the next one.
- `include` adds after the class (utilities). `prepend` adds before (interception). `extend` adds class methods.
- Always use `prepend` with `super` to extend existing code.
