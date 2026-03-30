---
title: "How to use variables and data types in Ruby?"
slug: variables-and-data-types
sidebar_position: 1
description: "This guide is the first in a series of Ruby courses. In this first chapter, we learn how to store information in variables."
---

This guide is the first in a series of Ruby courses. In this first chapter, we learn how to store information in variables.

No prior programming knowledge is required. We start from scratch.

## Prerequisites

Before starting, Ruby and a code editor must be installed on your machine. If this is not yet done, follow the guide "How to set up your development environment" in the Miscellaneous section of the tutorials.

## Testing code with IRB

Throughout this chapter, we will write small bits of code to understand each concept. The quickest way to test Ruby is to use **IRB** (Interactive Ruby). It is a console that executes Ruby line by line and immediately displays the result.

To launch IRB, open a terminal (in VSCode: menu Terminal > New Terminal) and type:

```bash
irb
```

You get a prompt `irb(main):001:0>` where you can type Ruby:

```
irb(main):001:0> 1 + 1
=> 2
irb(main):002:0> 'Pikachu'.length
=> 7
```

- Each line is executed immediately. The result is displayed after `=>`.
- To quit IRB, type `exit`.
- IRB is perfect for testing a quick operation, checking a behavior, or experimenting. We will use it a lot in the first chapters.

## Principle

A program manipulates data: a name, a number, a list. To use this data, it needs to be stored somewhere. That is the role of a **variable**: a name that points to a value.

You can think of a variable as a label stuck on a box. The label (the name) lets you find what the box contains (the value). At any time, you can change the contents of the box without changing the label.

## Creating a variable

In Ruby, creating a variable is as simple as writing a name, the `=` sign, then the value you want to store:

```ruby
name = 'Pikachu'
level = 25
```

- `name` is the variable name. We chose this name; it could be anything else.
- `=` is the assignment operator. It says "the variable on the left now contains the value on the right".
- `'Pikachu'` is the value we store: here, text (called a **character string** or **String**).
- `level` stores an integer (**Integer**).

We can then use these variables anywhere we would have used the value directly:

```ruby
name = 'Pikachu'
level = 25

puts name     # Displays: Pikachu
puts level    # Displays: 25
```

- `puts` is a command that displays a value on screen. It is one of the first tools we use to verify that our code does what we expect.

## Changing the value of a variable

You can replace the contents of a variable at any time. The old value is simply forgotten:

```ruby
name = 'Pikachu'
puts name          # Displays: Pikachu

name = 'Évoli'
puts name          # Displays: Évoli
```

- The variable `name` first points to `'Pikachu'`, then to `'Évoli'`. The name does not change, only the contents change.

## Data types

Not all values are alike. A name is text, a level is a number, a legendary status is true or false. Ruby distinguishes these different **data types**. Let's look at the main ones.

### Integers (Integer)

An Integer is a number without a decimal point. It is used for levels, Pokedex numbers, hit points:

```ruby
pokedex_number = 25
level = 50
max_team_size = 6
```

For large numbers, Ruby allows underscores `_` to make reading easier. The program ignores them completely:

```ruby
# These two lines are identical for Ruby
experience = 1000000
experience = 1_000_000
```

### Decimal numbers (Float)

A Float is a number with a decimal point:

```ruby
damage_multiplier = 1.5
capture_rate = 0.75
```

- Floats are used when decimal precision is needed, such as damage multipliers.

### Text (String)

A String is a sequence of characters surrounded by quotes. Ruby accepts single quotes `'...'` or double quotes `"..."`:

```ruby
pokemon_name = 'Pikachu'
description = "Un adorable Pokémon de type Électrik"
```

The difference between the two is important. Double quotes allow you to **insert variables into text** using the `#{}` syntax. This is called **interpolation**:

```ruby
name = 'Pikachu'
level = 25

# With double quotes: interpolation works
puts "#{name} est niveau #{level}"    # Displays: Pikachu est niveau 25

# With single quotes: interpolation does NOT work
puts '#{name} est niveau #{level}'    # Displays: #{name} est niveau #{level}
```

- Interpolation is very handy for building sentences from variables. We will use it constantly.
- Simple rule: if the text contains variables, use double quotes. Otherwise, single quotes are fine.

### Symbols (Symbol)

A Symbol looks like a String, but it starts with `:` and has no quotes:

```ruby
pokemon_type = :electric
status = :healthy
```

What is the difference from a String? A Symbol is a **fixed identifier**. You never modify it; you compare it. It is like a label carved in stone, while a String is text that can be rewritten.

In practice:

- Use a Symbol when the value is an **identifier**: a Pokemon type (`:fire`, `:water`), a status (`:poisoned`), a nature (`:adamant`).
- Use a String when the value is **text displayed to the user**: a name, a description, a message.

```ruby
# Symbol -- an identifier, always the same
pokemon_type = :electric

# String -- text intended for display
pokemon_name = 'Pikachu'
```

### Booleans (true / false)

A boolean represents a value that is either true (`true`) or false (`false`). It is used for questions whose answer is yes or no:

```ruby
is_legendary = false
is_alive = true
has_mega_evolution = true
```

- There is no `Boolean` class in Ruby. `true` is of type `TrueClass` and `false` is of type `FalseClass`. This is a quirk of the language; no need to remember it for now.

### The absence of value (nil)

Sometimes a variable simply has no value. In Ruby, `nil` is used to say "nothing", "empty", "not defined":

```ruby
held_item = nil
secondary_type = nil
```

- `nil` is not zero, nor an empty string. It is the total absence of value.
- A single-type Pokemon has no secondary type. `nil` expresses exactly this idea.

## Knowing the type of a value

Ruby allows you to ask any value what its type is. Two tools are useful for this:

```ruby
puts 'Pikachu'.class     # => String
puts 25.class            # => Integer
puts 1.5.class           # => Float
puts :electric.class     # => Symbol
puts true.class          # => TrueClass
puts nil.class           # => NilClass
```

- `.class` asks a value "what type are you?".

You can also ask the question differently: "are you of this type?":

```ruby
puts 25.is_a?(Integer)        # => true
puts 25.is_a?(Float)          # => false
puts 'Pikachu'.is_a?(String)  # => true
```

- `.is_a?` answers with `true` or `false`. The `?` at the end of the name is a Ruby convention: methods that ask a question end with `?`.

## Displaying and debugging

We saw `puts` for displaying. There is a second very useful tool: `p`.

```ruby
name = 'Pikachu'
types = [:electric]

puts name    # => Pikachu       (clean display, for the user)
p name       # => "Pikachu"     (technical display, for the developer)

puts types   # => electric       (displays each element on a line)
p types      # => [:electric]    (shows the complete structure)

puts nil     # =>                (displays an empty line)
p nil        # => nil            (displays the word nil)
```

- `puts` displays the value in a readable way. It is what we use for messages intended for the user.
- `p` displays the value in a technical way, with quotes, brackets, etc. It is what we use when we want to understand exactly what a variable contains. It is a **debug** tool.

## Compound assignment operators

We often need to modify a variable based on its current value. For example, increasing experience by 100 points. We could write:

```ruby
experience = 0
experience = experience + 100
puts experience    # => 100
```

Ruby offers a shortcut with `+=`:

```ruby
experience = 0
experience += 100    # Equivalent to: experience = experience + 100
puts experience      # => 100
```

Here are the main shortcuts:

```ruby
experience = 100
experience += 50     # addition         => 150
experience -= 20     # subtraction      => 130
experience *= 2      # multiplication   => 260
experience /= 4      # division         => 65
experience %= 10     # modulo (remainder of division) => 5
```

- `+=` is by far the most common. The others are useful but less frequent.
- The modulo (`%`) returns the remainder of a division. `10 % 3` gives `1` because 10 divided by 3 is 3 remainder 1.

## Naming your variables

In Ruby, variable names follow a convention called `snake_case`: all lowercase, words separated by underscores:

```ruby
# Good names
pokemon_name = 'Pikachu'
max_health_points = 142
is_legendary = false

# Bad names -- avoid these
pokemonName = 'Pikachu'    # this is camelCase, not used in Ruby
n = 'Pikachu'              # too short, impossible to understand
x = 142                    # same problem
```

- A good variable name describes what it contains. Anyone reading the code should understand without effort what each variable represents.
- Never abbreviate: `pokemon_name` and never `pkmn_name` or `pn`.

## Constants

Some values never change during program execution. The maximum number of Pokemon in a team is always 6. They are defined as **constants**, in uppercase:

```ruby
MAX_TEAM_SIZE = 6
POKEDEX_VERSION = '0.1.0'
TYPE_FIRE = :fire
```

- Constants use `SCREAMING_SNAKE_CASE`: all uppercase, separated by underscores.
- Ruby displays a warning if you modify a constant, but does not prevent it. It is a convention, not a technical restriction.

## Conclusion

- A **variable** is a name that points to a value. It is created with `=`.
- Ruby has 6 fundamental types: **Integer** (whole number), **Float** (decimal number), **String** (text), **Symbol** (identifier), **Boolean** (`true`/`false`), and **nil** (absence of value).
- **Symbols** serve as identifiers (`:fire`, `:water`). **Strings** serve for displayed text.
- **Interpolation** (`"#{variable}"`) inserts a variable into text. It only works with double quotes.
- `puts` displays for the user, `p` displays for debugging.
- Variable names use `snake_case`. Constants use `SCREAMING_SNAKE_CASE`.
- `.class` gives the type of a value. `.is_a?` checks whether a value is of a certain type.
