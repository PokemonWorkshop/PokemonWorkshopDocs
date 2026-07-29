---
title: "Loops and iterators"
slug: loops-and-iterators
sidebar_position: 6
description: "This chapter introduces the tools that allow you to repeat instructions: classic loops and iterators. We also discover how to read what the user types on the keyboard."
---

This chapter introduces the tools that allow you to **repeat** instructions: classic loops and iterators. We also discover how to read what the user types on the keyboard.

## Principle

We already saw `.each` in chapter 3 for iterating over an Array. But sometimes, we need to repeat code without having a collection: waiting for a user action, simulating combat turns, or displaying a countdown.

Ruby provides two families of tools:

- **Loops** (`while`, `until`, `loop`): repeat a block as long as a condition is true (or until we decide to stop). Useful when we don't know in advance how many times we'll loop.
- **Iterators** (`times`, `upto`, `downto`, `each`): iterate a fixed number of times or over a collection. This is the idiomatic Ruby way.

## Reading user input

Before building menus, we need to know how to read what the user types. Ruby provides `gets`:

```ruby
print 'What is your name? '
name = gets.chomp
puts "Hello, #{name}!"
```

- `print` displays text **without** a newline (unlike `puts`). The cursor stays on the same line, which is convenient for questions.
- `gets` waits for the user to type something and press Enter. It returns the text as a String.
- `.chomp` removes the trailing newline `\n`. Without `.chomp`, the String would contain an invisible line break.

To read a number, add `.to_i`:

```ruby
print 'Pokémon level: '
level = gets.chomp.to_i
puts "Level: #{level}"
```

- `.to_i` converts the String to an Integer. If the user types something other than a number, `.to_i` returns 0.

## The while loop

`while` repeats a block **as long as** the condition is true:

```ruby live
level = 1

while level < 5
  puts "Pikachu is at level #{level}"
  level += 1
end
```

Outputs:

```text
Pikachu is at level 1
Pikachu is at level 2
Pikachu is at level 3
Pikachu is at level 4
```

- The condition `level < 5` is evaluated **before** each iteration. When `level` reaches 5, the condition becomes false and the loop stops.
- `level += 1` is essential. Without it, `level` would stay at 1 and the loop would run forever (infinite loop). If that happens, press Ctrl+C to interrupt the program.

## The until loop

`until` is the opposite of `while`: it repeats **as long as** the condition is **false** (in other words, **until** the condition becomes true):

```ruby
hp = 50
max_hp = 120

until hp >= max_hp
  hp += 10
  puts "Healing... HP: #{hp}/#{max_hp}"
end

puts 'Healing complete!'
```

- `until hp >= max_hp` reads as: "repeat until the HP reach the maximum".
- `until` is sometimes more readable than `while` when thinking in terms of "until".

## The loop loop

`loop` creates an infinite loop. You exit it with `break`:

```ruby
loop do
  print 'Type "quit" to exit: '
  input = gets.chomp

  break if input == 'quit'

  puts "You typed: #{input}"
end

puts 'Exited the loop!'
```

- `loop do ... end` runs indefinitely until a `break` is reached.
- `break if input == 'quit'` exits the loop when the user types "quit".
- This is the ideal pattern for **interactive menus**: display the options, read the choice, process it, and start again.

## The times iterator

`times` executes a block a fixed number of times:

```ruby
3.times do
  puts 'Pikachu uses Thunderbolt!'
end
```

You can also retrieve the iteration number:

```ruby
5.times do |turn|
  puts "Turn #{turn + 1}"
end
```

Outputs:

```text
Turn 1
Turn 2
Turn 3
Turn 4
Turn 5
```

- `|turn|` receives the iteration number, starting at **0**. We add 1 for human-readable display.
- `times` is perfect when you know the number of repetitions in advance.

## The upto and downto iterators

To iterate over a range of numbers:

```ruby
# Count from 1 to 5
1.upto(5) do |level|
  puts "Level #{level}"
end
```

```ruby
# Countdown
5.downto(1) do |count|
  puts "#{count}..."
end
puts 'Evolution!'
```

- `1.upto(5)` iterates from 1 to 5 inclusive, in ascending order.
- `5.downto(1)` iterates from 5 to 1 inclusive, in descending order.

## Reminder: each and each_with_index

We already saw `each` in chapter 3. It is **the** iteration method in Ruby:

```ruby live
team = ['Pikachu', 'Charizard', 'Blastoise']

team.each { |pokemon| puts "Go, #{pokemon} !" }

team.each_with_index do |pokemon, index|
  puts "#{index + 1}. #{pokemon}"
end
```

To iterate over a Hash (seen in chapter 4), the block receives the key and the value:

```ruby
stats = { hp: 35, attack: 55, defense: 40 }

stats.each do |stat, value|
  puts "#{stat} : #{value}"
end
```

## The for loop

`for` exists in Ruby but is almost never used. We mention it because you may encounter it in older code:

```ruby
types = [:fire, :water, :grass]

for type in types
  puts "Type : #{type}"
end
```

- `for` is syntactic sugar for `each`, but with a drawback: the variable `type` continues to exist after the loop. With `each`, the block variable is local. That is why Ruby developers prefer `each`.

## Flow control: break and next

### break -- exit the loop

`break` exits the loop immediately:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur']

team.each do |pokemon|
  break if pokemon == 'Blastoise'

  puts "Checking #{pokemon}..."
end

puts 'Blastoise found!'
```

Outputs:

```text
Checking Pikachu...
Checking Charizard...
Blastoise found!
```

- As soon as `pokemon` equals `'Blastoise'`, `break` stops the `each`. The remaining elements are not iterated.

### next -- skip to the next iteration

`next` skips the rest of the block and moves to the next element:

```ruby
levels = [5, 0, 12, 0, 8]

levels.each do |level|
  next if level == 0

  puts "Level #{level} Pokémon"
end
```

Outputs:

```text
Level 5 Pokémon
Level 12 Pokémon
Level 8 Pokémon
```

- `next if level == 0` skips Pokemon with level 0 (fainted). The `puts` is not executed for them, but the loop continues with the remaining elements.

## Conclusion

- `while` repeats as long as a condition is true. `until` repeats until it becomes true.
- `loop` with `break` is the standard pattern for interactive menus.
- `times` repeats a fixed number of times. `upto`/`downto` iterate over a range.
- `each` is the idiomatic method for iterating over collections. Prefer `each` over `for`.
- `break` exits the loop. `next` skips to the next iteration.
- `gets.chomp` reads user input. `.to_i` converts it to a number.
- `print` displays text without a newline (useful for questions).
