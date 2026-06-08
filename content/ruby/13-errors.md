---
title: "How to handle errors in Ruby?"
slug: error-handling
sidebar_position: 14
description: "This chapter introduces exception handling, the mechanism that allows you to react when something goes wrong in a program. Instead of silent crashes or unexplained nil values, you will learn how to raise, catch, and handle errors properly."
---

This chapter introduces **exception handling**, the mechanism that allows you to react when something goes wrong in a program. Instead of silent crashes or unexplained `nil` values, you will learn how to raise, catch, and handle errors properly.

## Principle

Imagine trying to load a save file that does not exist, or a user entering a negative level for a Pokemon. Without error handling, the program crashes with a cryptic message.

In Ruby, errors are **objects**. When something goes wrong, you **raise** an exception. The program walks back up the call stack until it finds a `rescue` block able to catch it. If no `rescue` catches it, the program stops.

This mechanism separates normal code from error-handling code: you write the happy path, and you handle problematic cases in dedicated blocks.

## Raising an exception with raise

`raise` interrupts execution and creates an exception object:

```ruby
# Simple form: creates a RuntimeError
raise 'Pokémon not found'

# With a specific class
raise ArgumentError, 'Level must be between 1 and 100'
```

- `raise 'message'` creates a `RuntimeError` by default.
- `raise ArgumentError, 'message'` creates an error of a specific type. This is the recommended form because it allows catching errors by type.
- Once raised, the exception interrupts everything: the following lines are not executed.

## Catching with begin...rescue...end

The `begin...rescue...end` block catches exceptions:

```ruby
begin
  level = -5
  raise ArgumentError, 'Level must be positive' if level < 1

  puts "Level: #{level}"
rescue ArgumentError => error
  puts "Error: #{error.message}"
end

puts 'Le programme continue normalement.'
```

Outputs:

```
Error: Level must be positive
Le programme continue normalement.
```

- `rescue ArgumentError => error` catches `ArgumentError` exceptions and stores the object in `error`.
- `error.message` returns the message passed to `raise`.
- The code after `end` runs normally: the program does not crash.

## rescue inside a method

When the `rescue` covers the entire method, you can omit `begin`:

```ruby
def create_pokemon(name, level)
  raise ArgumentError, 'Name cannot be empty' if name.empty?
  raise ArgumentError, 'Level must be between 1 and 100' unless (1..100).include?(level)

  return { name: name, level: level }
rescue ArgumentError => error
  puts "Creation error: #{error.message}"
  return nil
end

result = create_pokemon('', 25)
puts result.inspect    # => nil

result = create_pokemon('Pikachu', 25)
puts result.inspect    # => {:name=>"Pikachu", :level=>25}
```

- The `rescue` applies to the entire body of the method.
- We return `nil` in the `rescue` so the caller can check whether the creation succeeded.

## Catching multiple exception types

You can chain multiple `rescue` clauses to handle different types of errors:

```ruby
def load_pokemon(name)
  raise ArgumentError, 'Empty name' if name.empty?
  raise RuntimeError, "Pokémon #{name} not found" unless name == 'Pikachu'

  return { name: name, level: 25 }
rescue ArgumentError => error
  puts "Invalid argument: #{error.message}"
  return nil
rescue RuntimeError => error
  puts "Error: #{error.message}"
  return nil
end
```

- Ruby tries each `rescue` in order. The first one that matches is executed.
- Always place the **most specific exceptions first**. Otherwise, a general clause would catch them all.

## The exception hierarchy

Ruby exceptions form a class hierarchy (like the inheritance seen in chapter 9):

```
Exception
  SignalException          (Ctrl+C)
  NoMemoryError
  ScriptError
    SyntaxError
    LoadError
  StandardError            ← rescue catches this by default
    ArgumentError
    RuntimeError
    TypeError
    NameError
      NoMethodError
    IOError
    ZeroDivisionError
    KeyError
    IndexError
```

- `rescue` without a type catches `StandardError` and all its descendants. This is the correct behavior in 99% of cases.
- **Never write `rescue Exception`**: this also catches `SignalException` (Ctrl+C), making the program impossible to interrupt.

## retry — try again

`retry` restarts execution at the beginning of the `begin` block. You must **always** use a counter to avoid infinite loops:

```ruby
attempts = 0

begin
  attempts += 1
  puts "Attempt #{attempts}..."

  # Simulate a random error
  raise 'Loading failed' if rand(3) != 0

  puts 'Loading succeeded!'
rescue RuntimeError => error
  puts "Error: #{error.message}"
  retry if attempts < 3
  puts 'Giving up after 3 attempts.'
end
```

- `retry` goes back to `begin` and re-executes the entire block.
- Without the `attempts < 3` counter, the loop would be infinite if the error is permanent.
- `raise` without an argument (alone) inside a `rescue` re-raises the current exception, useful for giving up after all attempts.

## ensure — execute no matter what

The `ensure` block **always** executes, whether an exception was raised or not:

```ruby
def save(data, filename)
  puts 'Saving in progress...'
  raise 'Save error' if data.nil?

  puts "Saved to #{filename}"
rescue RuntimeError => error
  puts "Failure: #{error.message}"
ensure
  puts 'Cleanup complete.'
end

save({ name: 'Pikachu' }, 'save.dat')
save(nil, 'save.dat')
```

Outputs:

```
Saving in progress...
Saved to save.dat
Cleanup complete.
Saving in progress...
Failure: Save error
Cleanup complete.
```

- `ensure` runs in **all** cases: after normal code, after a `rescue`, even after a `return`.
- It is the ideal place to close files, release resources, or display a final message.

## Creating your own exceptions

For errors specific to your program, create classes that inherit from `StandardError`:

```ruby
module Pokedex
  class InvalidPokemonError < StandardError; end
  class DuplicateError < StandardError; end
  class TeamFullError < StandardError; end
end
```

Then use them like any other exception:

```ruby
def add_pokemon(team, pokemon)
  raise Pokedex::TeamFullError, "The team is full (6 max)" if team.size >= 6
  raise Pokedex::DuplicateError, "#{pokemon} is already in the team" if team.include?(pokemon)

  team << pokemon
  return team
end

begin
  team = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Dragonite', 'Gengar']
  add_pokemon(team, 'Mewtwo')
rescue Pokedex::TeamFullError => error
  puts error.message
end
```

Outputs: `The team is full (6 max)`

- Inheriting from `StandardError` ensures that `rescue` without a type catches them.
- The class name describes the problem: `TeamFullError` is more meaningful than `RuntimeError`.
- Grouping exceptions inside a module avoids name conflicts.

## Re-raising an exception

`raise` without an argument inside a `rescue` re-raises the current exception. This is useful for logging a message while letting the error propagate:

```ruby
def process_pokemon(data)
  puts "Processing #{data[:name]}..."
  raise 'Corrupted data' if data[:level].nil?

  return data
rescue RuntimeError => error
  puts "Failure: #{error.message}"
  raise
end
```

- `raise` alone re-raises the exact same exception. The caller will have to catch it in turn.

## Conclusion

- `raise` raises an exception. Prefer `raise ClassName, 'message'` for typed errors.
- `begin...rescue...end` catches exceptions. `rescue` inside a `def` works without `begin`.
- Place the most specific `rescue` clauses first.
- **Never** write `rescue Exception`. Catch `StandardError` or something more specific.
- `retry` restarts at `begin`. Always protect it with a counter.
- `ensure` always runs, even after an error or a `return`.
- Create error classes that inherit from `StandardError` for domain-specific errors.
- `raise` without an argument inside a `rescue` re-raises the current exception.
