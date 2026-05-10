---
title: "How to use methods and blocks in Ruby?"
slug: methods-and-blocks
sidebar_position: 7
description: "This chapter introduces **methods** (named, reusable pieces of code) and **blocks** (pieces of code that you pass to a method). This is a fundamental chapter: from now on, we can structure our code instead of writing everything in a single script."
---

This chapter introduces **methods** (named, reusable pieces of code) and **blocks** (pieces of code that you pass to a method). This is a fundamental chapter: from now on, we can structure our code instead of writing everything in a single script.

## Principle

Up until now, all our code ran from top to bottom. If we wanted to reuse a calculation or a display, we had to copy-paste the lines. This is fragile: if we fix a bug, we have to fix it everywhere.

A **method** solves this problem. It is a set of instructions that you name once, and can call as many times as you want. You can also pass it **parameters** to make it flexible.

A **block** is a piece of code that you pass to a method. We have already used them without knowing it with `.each`, `.map`, `.select`: the code between `{ }` or `do...end` is a block.

## Defining a method

You create a method with `def`, a name, and `end`:

```ruby
def greet
  puts 'Hello, trainer!'
end

greet    # Prints: Hello, trainer!
greet    # Prints: Hello, trainer!
```

- `def greet` declares the method. The code inside is **not** executed at that point.
- `greet` calls the method. The code runs on each call.
- Method names follow the `snake_case` convention, just like variables.

## Parameters

A method can receive **parameters** that make it flexible:

```ruby
def greet_pokemon(name)
  puts "Go, #{name} !"
end

greet_pokemon('Pikachu')     # Prints: Go, Pikachu !
greet_pokemon('Charizard')   # Prints: Go, Charizard!
```

- `name` is a parameter. When you call the method, you pass a value that replaces this parameter.
- If you call `greet_pokemon` without an argument, Ruby raises an error.

### Default values

You can give a parameter a default value:

```ruby
def greet_pokemon(name, greeting = 'Go')
  puts "#{greeting}, #{name} !"
end

greet_pokemon('Pikachu')              # Prints: Go, Pikachu !
greet_pokemon('Pikachu', 'Onward')  # Prints: En avant, Pikachu !
```

- `greeting = 'Go'`: if the argument is not provided, `greeting` defaults to `'Go'`.

### Named parameters (keyword)

For methods with multiple optional parameters, named parameters are more readable:

```ruby
def create_pokemon(name, level:, type: :normal)
  return { name: name, level: level, type: type }
end

pikachu = create_pokemon('Pikachu', level: 25, type: :electric)
rattata = create_pokemon('Rattata', level: 3)
p pikachu    # => {:name=>"Pikachu", :level=>25, :type=>:electric}
p rattata    # => {:name=>"Rattata", :level=>3, :type=>:normal}
```

- `level:` is a **required** named parameter (no default value).
- `type: :normal` is a named parameter with a default value.
- At the call site, you write `level: 25` instead of just `25`. It is longer but much clearer when there are multiple parameters.

### The splat \*args

The splat collects a variable number of arguments into an Array:

```ruby
def display_team(trainer, *pokemon_names)
  puts "Team of #{trainer}:"
  pokemon_names.each do |pokemon_name|
    puts "  - #{pokemon_name}"
  end
end

display_team('Ash', 'Pikachu', 'Charizard', 'Blastoise')
```

- `*pokemon_names` gathers all arguments after `trainer` into an Array.
- You can pass 0, 1, or 100 names -- the splat adapts.

### The double-splat \*\*options

The double-splat collects undeclared named parameters into a Hash:

```ruby
def create_pokemon(name, level:, **stats)
  pokemon = { name: name, level: level }
  return pokemon.merge(stats)
end

pikachu = create_pokemon('Pikachu', level: 25, attack: 55, speed: 90)
p pikachu    # => {:name=>"Pikachu", :level=>25, :attack=>55, :speed=>90}
```

- `**stats` catches `attack: 55, speed: 90` into a Hash `{ attack: 55, speed: 90 }`.
- `.merge(stats)` merges this Hash with the base Hash.

## Return values

Every Ruby method returns a value. You can return it explicitly with `return`:

```ruby
def calculate_damage(attack, defense)
  return attack - defense
end

damage = calculate_damage(55, 30)
puts "Damage: #{damage}"    # Prints: Dégâts : 25
```

Without `return`, Ruby automatically returns the **last evaluated expression**:

```ruby
def calculate_damage(attack, defense)
  attack - defense
end
```

Both forms work. In this tutorial series, we use `return` explicitly so the intent is clear, especially for beginners.

`return` can also be used to **exit a method early**:

```ruby
def heal(pokemon)
  if pokemon[:hp] >= pokemon[:max_hp]
    puts "#{pokemon[:name]} already has full HP!"
    return
  end

  pokemon[:hp] = pokemon[:max_hp]
  puts "#{pokemon[:name]} is healed!"
end
```

- The first `return` exits the method immediately if the Pokemon is already at maximum HP. The rest of the code is not executed.

## Blocks in depth

We have been using blocks since chapter 3 with `.each`, `.map`, `.select`. Let's see how to create our own methods that accept blocks.

### yield -- execute the block

`yield` allows a method to execute the block that was passed to it:

```ruby
def with_announcement(pokemon_name)
  puts "--- Start ---"
  yield(pokemon_name)
  puts "--- End ---"
end

with_announcement('Pikachu') do |name|
  puts "#{name} uses Thunderbolt!"
end
```

Outputs:

```
--- Start ---
Pikachu uses Thunderbolt!
--- End ---
```

- `yield(pokemon_name)` executes the block, passing `pokemon_name` as an argument.
- The block receives this argument in `|name|`.
- The method controls what happens **before** and **after** the block.

### block_given? -- check if a block was passed

```ruby
def display_pokemon(pokemon)
  puts "#{pokemon[:name]} Lvl.#{pokemon[:level]}"

  if block_given?
    yield(pokemon)
  else
    puts "  Type : #{pokemon[:type]}"
  end
end

pikachu = { name: 'Pikachu', level: 25, type: :electric, hp: 35, max_hp: 55 }

# Without a block: default display
display_pokemon(pikachu)

# With a block: custom display
display_pokemon(pikachu) do |pokemon|
  puts "  PV : #{pokemon[:hp]}/#{pokemon[:max_hp]}"
end
```

- `block_given?` returns `true` if a block was passed, `false` otherwise.
- This allows having a default behavior that the caller can customize.

### &block -- capture the block as an object

The `&` prefix converts a block into a **Proc** object, which can be stored and called with `.call`:

```ruby
def find_pokemon(team, &condition)
  team.each do |pokemon|
    return pokemon if condition.call(pokemon)
  end
  return nil
end

team = [
  { name: 'Pikachu', level: 25 },
  { name: 'Charizard', level: 36 },
  { name: 'Blastoise', level: 40 }
]

result = find_pokemon(team) { |pokemon| pokemon[:level] >= 35 }
puts "Found: #{result[:name]}"    # Prints: Found: Charizard
```

- `&condition` captures the block and transforms it into a Proc object stored in `condition`.
- `condition.call(pokemon)` executes this Proc with `pokemon` as an argument.
- The difference from `yield`: the Proc can be stored in a variable or passed to another method.

## Proc and lambda

Ruby also allows creating "standalone" blocks that you store in variables:

```ruby
# Lambda (recommended)
calculate = lambda do |attack, defense|
  return attack - defense
end

puts calculate.call(55, 30)    # => 25

# Shorthand syntax (stabby lambda)
calculate = ->(attack, defense) { attack - defense }

puts calculate.call(55, 30)    # => 25
```

- A **lambda** is a standalone block stored in a variable. You call it with `.call`.
- `->() { }` is a shorthand for `lambda do ... end`.

There is also `Proc.new`, which works similarly but with an important difference: `return` inside a Proc exits the **enclosing method**, while `return` inside a lambda only exits the lambda. For this reason, prefer `lambda` which is more predictable.

You can pass a lambda to a method that expects a block using `&`:

```ruby
high_level = ->(pokemon) { pokemon[:level] >= 35 }

result = team.select(&high_level)
```

- `&high_level` converts the lambda into a block to pass it to `.select`.

## Conclusion

- `def method_name(params) ... end` defines a method. Never on a single line.
- Parameters can be required, with defaults, named (`key:`), splat (`*args`), or double-splat (`**options`).
- Use `return` explicitly to clarify what the method returns.
- `yield` executes the block passed to the method. `block_given?` checks its presence.
- `&block` captures the block as a Proc for storing or forwarding.
- A **lambda** is a standalone block stored in a variable. Prefer `lambda` over `Proc.new`.
- `&variable` converts a lambda/Proc into a block to pass it to a method.
