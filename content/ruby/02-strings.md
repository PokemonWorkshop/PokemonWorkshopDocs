---
title: "How to manipulate strings and symbols in Ruby?"
slug: strings-and-symbols
sidebar_position: 2
description: "This guide goes deeper into String and Symbol, introduced in chapter 1. We discover the tools Ruby offers to transform, format, and compare text."
---

This guide goes deeper into String and Symbol, introduced in chapter 1. We discover the tools Ruby offers to transform, format, and compare text.

## Principle

We saw that a String is text and that a Symbol is an identifier. In this chapter, we will learn how to manipulate Strings: modify them, split them, align them. We will also see why Symbols are so important and how to convert between the two.

## Reminder: single and double quotes

Single quotes create raw text. Double quotes allow interpolation (`#{}`) and escape sequences:

```ruby
name = 'Pikachu'

# Single quotes: raw text, no interpolation
puts 'Hello, #{name}'     # Displays: Hello, #{name}

# Double quotes: interpolation and escape sequences
puts "Hello, #{name}!"   # Displays: Hello, Pikachu!
puts "Line 1\nLine 2"     # Displays on two lines
```

- `\n` creates a line break. `\t` creates a tab. These sequences only work with double quotes.
- Simple rule: single quotes by default, double quotes if you need interpolation or `\n`.

## Multi-line text (heredoc)

To write text over multiple lines without chaining `\n`, Ruby offers **heredoc**:

```ruby
description = <<~TEXT
  Pikachu is an Electric-type Pokémon.
  It evolves from Pichu through happiness.
TEXT

puts description
```

- `<<~TEXT` opens the heredoc. The text ends when Ruby encounters `TEXT` alone on a line.
- The `~` removes common indentation, which allows indenting the text in the code without the spaces appearing in the output.
- The word `TEXT` is an arbitrary choice. You could write `<<~DESCRIPTION` or any other word.

## Interpolation vs concatenation

There are two ways to combine text and variables. The first, interpolation, we already know:

```ruby
name = 'Charizard'
level = 36

# Interpolation (preferred)
puts "#{name} is level #{level}"

# Concatenation (avoid)
puts name + ' is level ' + level.to_s
```

- Interpolation automatically converts values to text. Concatenation requires a call to `.to_s`, otherwise Ruby raises an error.
- Interpolation is more readable, shorter, and more performant. It is always the right choice.

## Getting the size of a String

```ruby
puts 'Pikachu'.length    # => 7
puts 'Pikachu'.size      # => 7
puts ''.length           # => 0
```

- `.length` and `.size` do exactly the same thing. Using one or the other is a matter of preference.

## Changing case

Ruby offers several methods to change uppercase and lowercase:

```ruby
puts 'pikachu'.upcase        # => PIKACHU
puts 'PIKACHU'.downcase      # => pikachu
puts 'pikachu'.capitalize    # => Pikachu
puts 'Pikachu'.swapcase      # => pIKACHU
```

- `.upcase` converts everything to uppercase. `.downcase` converts everything to lowercase.
- `.capitalize` capitalizes the first letter and lowercases the rest.
- `.swapcase` inverts each letter (uppercase becomes lowercase and vice versa). It is rarely useful, but good to know.

## Removing whitespace

```ruby
name = '  Pikachu  '

puts name.strip     # => "Pikachu"   (removes spaces on both sides)
puts name.lstrip    # => "Pikachu  " (removes on the left only)
puts name.rstrip    # => "  Pikachu" (removes on the right only)
```

- `.strip` is very useful when dealing with text entered by a user, which often contains extra spaces.

## Searching in a String

```ruby
puts 'Bulbasaur'.include?('saur')       # => true
puts 'Bulbasaur'.include?('Fire')         # => false
puts 'Bulbasaur'.start_with?('Bulb')     # => true
puts 'Bulbasaur'.end_with?('saur')      # => true
```

- These methods return `true` or `false`. The `?` at the end is the Ruby convention for methods that ask a question.
- The search is case-sensitive: `'Pikachu'.include?('pika')` returns `false`.

## Replacing text

```ruby
phrase = 'Pikachu uses Thunderbolt. Pikachu wins!'

# Replace the first occurrence
puts phrase.sub('Pikachu', 'Raichu')
# => Raichu uses Thunderbolt. Pikachu wins!

# Replace all occurrences
puts phrase.gsub('Pikachu', 'Raichu')
# => Raichu uses Thunderbolt. Raichu wins!
```

- `.sub` replaces only the **first** occurrence. `.gsub` replaces **all** occurrences (the `g` stands for "global").
- These methods return a new String. The original is not modified.

## Repeating a String

The `*` operator allows repeating a String:

```ruby
puts '=' * 30       # => ==============================
puts 'Pika' * 3     # => PikaPikaPika
```

- This is very handy for creating separator lines or visual bars.

## Aligning text

Ruby allows aligning text in a fixed-width space:

```ruby
puts 'Pikachu'.ljust(15)          # => "Pikachu        "
puts 'Pikachu'.rjust(15)          # => "        Pikachu"
puts 'Pikachu'.center(15)         # => "    Pikachu    "
puts 'Pikachu'.center(15, '-')    # => "----Pikachu----"
```

- `.ljust(n)` aligns to the left over `n` characters by padding with spaces on the right.
- `.rjust(n)` aligns to the right. `.center(n)` centers the text.
- You can replace the space with another character by passing it as a second argument.

## Formatting numbers in text

To display a number with a precise format (leading zeros, fixed decimals), Ruby offers the `format` method:

```ruby
pokedex_number = 6
health = 88.5

puts format('No.%03d', pokedex_number)    # => No.006
puts format('PV: %.1f%%', health)         # => PV: 88.5%
```

- `%03d` means: an integer (`d`) on at least 3 characters (`3`), padded with zeros (`0`).
- `%.1f` means: a decimal number (`f`) with 1 digit after the decimal point.
- `%%` displays a literal `%` (otherwise Ruby thinks it is a format specifier).

## Symbols in depth

We saw in chapter 1 that Symbols are identifiers. Let's see why they differ from Strings:

```ruby
# Two identical Symbols are the same object in memory
puts :fire.object_id            # => always the same number
puts :fire.object_id            # => exactly the same number

# Two identical Strings are different objects
puts 'fire'.object_id           # => a number
puts 'fire'.object_id           # => a different number!
```

- Every time you write `'fire'`, Ruby creates a **new object** in memory. Every time you write `:fire`, Ruby reuses the **same object**.
- This is why comparison between Symbols is instantaneous: Ruby just compares a number, not each character one by one.

## Converting between String and Symbol

```ruby
type_symbol = :fire
type_string = type_symbol.to_s    # => "fire"

type_string = 'water'
type_symbol = type_string.to_sym  # => :water
```

- `.to_s` converts a Symbol to a String. `.to_sym` converts a String to a Symbol.
- These conversions are sometimes needed to display a Symbol (which cannot be interpolated as-is without `.to_s`, but interpolation calls `.to_s` automatically).

## When to use String vs Symbol

- **Symbol**: for anything that is an internal identifier. A Pokemon type (`:fire`), a status (`:poisoned`), a key in a data structure.
- **String**: for anything that is displayed or manipulated text. A Pokemon name (`'Pikachu'`), a description, a message.

When in doubt: will you display this value to the user? If yes, it is a String. Will you use it as a label to identify something? If yes, it is a Symbol.

## Conclusion

- Single quotes create raw text. Double quotes allow interpolation and escape sequences (`\n`, `\t`).
- Always prefer interpolation over concatenation.
- `.upcase`, `.downcase`, `.capitalize` change case. `.strip` removes whitespace.
- `.include?`, `.start_with?`, `.end_with?` search within a String.
- `.sub` replaces the first occurrence, `.gsub` all occurrences.
- `*` repeats a String. `.ljust`, `.rjust`, `.center` align text.
- `format` allows formatting numbers with leading zeros or fixed decimals.
- Symbols are immutable and unique in memory. Use `.to_s` and `.to_sym` to convert.
