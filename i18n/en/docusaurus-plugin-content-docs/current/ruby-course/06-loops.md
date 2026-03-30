---
title: "How to use loops and iterators in Ruby?"
slug: loops-and-iterators
sidebar_position: 6
description: "This chapter introduces the tools that allow you to **repeat** instructions: classic loops and iterators. We also discover how to read what the user types on the keyboard."
---

This chapter introduces the tools that allow you to **repeat** instructions: classic loops and iterators. We also discover how to read what the user types on the keyboard.

## Principle

We already saw `.each` in chapter 3 for iterating over an Array. But sometimes, we need to repeat code without having a collection: waiting for a user action, simulating combat turns, or displaying a countdown.

Ruby provides two families of tools:

- **Loops** (`while`, `until`, `loop`): repeat a block as long as a condition is true (or until we decide to stop). Useful when we don't know in advance how many times we'll loop.
- **Iterators** (`times`, `upto`, `downto`, `each`): iterate a fixed number of times or over a collection. This is the idiomatic Ruby way.

## Reading user input

Before building menus, we need to know how to read what the user types. Ruby provides `gets`:

~~~ruby
print 'Quel est ton nom ? '
name = gets.chomp
puts "Bonjour, #{name} !"
~~~

- `print` displays text **without** a newline (unlike `puts`). The cursor stays on the same line, which is convenient for questions.
- `gets` waits for the user to type something and press Enter. It returns the text as a String.
- `.chomp` removes the trailing newline `\n`. Without `.chomp`, the String would contain an invisible line break.

To read a number, add `.to_i`:

~~~ruby
print 'Niveau du Pokémon : '
level = gets.chomp.to_i
puts "Niveau : #{level}"
~~~

- `.to_i` converts the String to an Integer. If the user types something other than a number, `.to_i` returns 0.

## The while loop

`while` repeats a block **as long as** the condition is true:

~~~ruby
level = 1

while level < 5
  puts "Pikachu est au niveau #{level}"
  level += 1
end
~~~

Outputs:

~~~
Pikachu est au niveau 1
Pikachu est au niveau 2
Pikachu est au niveau 3
Pikachu est au niveau 4
~~~

- The condition `level < 5` is evaluated **before** each iteration. When `level` reaches 5, the condition becomes false and the loop stops.
- `level += 1` is essential. Without it, `level` would stay at 1 and the loop would run forever (infinite loop). If that happens, press Ctrl+C to interrupt the program.

## The until loop

`until` is the opposite of `while`: it repeats **as long as** the condition is **false** (in other words, **until** the condition becomes true):

~~~ruby
hp = 50
max_hp = 120

until hp >= max_hp
  hp += 10
  puts "Soin en cours... PV : #{hp}/#{max_hp}"
end

puts 'Soin terminé !'
~~~

- `until hp >= max_hp` reads as: "repeat until the HP reach the maximum".
- `until` is sometimes more readable than `while` when thinking in terms of "until".

## The loop loop

`loop` creates an infinite loop. You exit it with `break`:

~~~ruby
loop do
  print 'Tape "quit" pour sortir : '
  input = gets.chomp

  break if input == 'quit'

  puts "Tu as tapé : #{input}"
end

puts 'Sorti de la boucle !'
~~~

- `loop do ... end` runs indefinitely until a `break` is reached.
- `break if input == 'quit'` exits the loop when the user types "quit".
- This is the ideal pattern for **interactive menus**: display the options, read the choice, process it, and start again.

## The times iterator

`times` executes a block a fixed number of times:

~~~ruby
3.times do
  puts 'Pikachu utilise Tonnerre !'
end
~~~

You can also retrieve the iteration number:

~~~ruby
5.times do |turn|
  puts "Tour #{turn + 1}"
end
~~~

Outputs:

~~~
Tour 1
Tour 2
Tour 3
Tour 4
Tour 5
~~~

- `|turn|` receives the iteration number, starting at **0**. We add 1 for human-readable display.
- `times` is perfect when you know the number of repetitions in advance.

## The upto and downto iterators

To iterate over a range of numbers:

~~~ruby
# Count from 1 to 5
1.upto(5) do |level|
  puts "Niveau #{level}"
end
~~~

~~~ruby
# Countdown
5.downto(1) do |count|
  puts "#{count}..."
end
puts 'Évolution !'
~~~

- `1.upto(5)` iterates from 1 to 5 inclusive, in ascending order.
- `5.downto(1)` iterates from 5 to 1 inclusive, in descending order.

## Reminder: each and each_with_index

We already saw `each` in chapter 3. It is **the** iteration method in Ruby:

~~~ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

team.each { |pokemon| puts "Go, #{pokemon} !" }

team.each_with_index do |pokemon, index|
  puts "#{index + 1}. #{pokemon}"
end
~~~

To iterate over a Hash (seen in chapter 4), the block receives the key and the value:

~~~ruby
stats = { hp: 35, attack: 55, defense: 40 }

stats.each do |stat, value|
  puts "#{stat} : #{value}"
end
~~~

## The for loop

`for` exists in Ruby but is almost never used. We mention it because you may encounter it in older code:

~~~ruby
types = [:fire, :water, :grass]

for type in types
  puts "Type : #{type}"
end
~~~

- `for` is syntactic sugar for `each`, but with a drawback: the variable `type` continues to exist after the loop. With `each`, the block variable is local. That is why Ruby developers prefer `each`.

## Flow control: break and next

### break -- exit the loop

`break` exits the loop immediately:

~~~ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Florizarre']

team.each do |pokemon|
  break if pokemon == 'Tortank'

  puts "Vérification de #{pokemon}..."
end

puts 'Tortank trouvé !'
~~~

Outputs:

~~~
Vérification de Pikachu...
Vérification de Dracaufeu...
Tortank trouvé !
~~~

- As soon as `pokemon` equals `'Tortank'`, `break` stops the `each`. The remaining elements are not iterated.

### next -- skip to the next iteration

`next` skips the rest of the block and moves to the next element:

~~~ruby
levels = [5, 0, 12, 0, 8]

levels.each do |level|
  next if level == 0

  puts "Pokémon de niveau #{level}"
end
~~~

Outputs:

~~~
Pokémon de niveau 5
Pokémon de niveau 12
Pokémon de niveau 8
~~~

- `next if level == 0` skips Pokemon with level 0 (fainted). The `puts` is not executed for them, but the loop continues with the remaining elements.

## Conclusion

- `while` repeats as long as a condition is true. `until` repeats until it becomes true.
- `loop` with `break` is the standard pattern for interactive menus.
- `times` repeats a fixed number of times. `upto`/`downto` iterate over a range.
- `each` is the idiomatic method for iterating over collections. Prefer `each` over `for`.
- `break` exits the loop. `next` skips to the next iteration.
- `gets.chomp` reads user input. `.to_i` converts it to a number.
- `print` displays text without a newline (useful for questions).
