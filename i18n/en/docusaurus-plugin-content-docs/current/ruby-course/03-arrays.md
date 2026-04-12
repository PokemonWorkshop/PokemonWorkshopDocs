---
title: "How to use arrays in Ruby?"
slug: arrays
sidebar_position: 3
description: "This chapter introduces **Arrays**, the most commonly used data structure in Ruby. An Array allows storing multiple values in a single variable."
---

This chapter introduces **Arrays**, the most commonly used data structure in Ruby. An Array allows storing multiple values in a single variable.

## Principle

So far, each variable held only a single value: a name, a level, a type. But how do you store a team of 6 Pokemon? Creating 6 separate variables (`pokemon_1`, `pokemon_2`...) would be tedious. That is the role of the **Array**: an ordered list of elements, accessible by their position.

You can think of an Array as a locker with several numbered compartments. Each compartment holds a value, and you access each value by its number.

## Creating an Array

The simplest way to create an Array is to use square brackets `[]`:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']
types = [:electric, :fire, :water]
levels = [25, 36, 40]
empty = []

p team     # => ["Pikachu", "Charizard", "Blastoise"]
p empty    # => []
```

- An Array can contain any type of value: Strings, Integers, Symbols, and even a mix of different types.
- `[]` creates an empty Array.

You can also create an Array of a given size with `Array.new`:

```ruby
# Create an Array of 6 slots, all filled with nil
slots = Array.new(6, nil)
p slots    # => [nil, nil, nil, nil, nil, nil]

# Create an Array of 6 slots with computed values
levels = Array.new(6) { |index| (index + 1) * 10 }
p levels   # => [10, 20, 30, 40, 50, 60]
```

- `Array.new(6, nil)` creates 6 slots filled with `nil`.
- The second form uses a **block** `{ |index| ... }` that computes the value of each slot. We have not yet seen blocks in detail, but the syntax is simple: between `{ }`, the `|index|` receives the slot number (starting from 0), and the expression after produces the value.

## Accessing elements

Each element has an **index** (its position in the Array). Note: indexes start at **0**, not 1:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise', 'Gengar', 'Dragonite', 'Snorlax']
#        index 0      index 1     index 2     index 3       index 4      index 5

puts team[0]      # => Pikachu      (first element)
puts team[2]      # => Blastoise      (third element)
puts team[5]      # => Snorlax      (last element)
puts team[-1]     # => Snorlax      (last, counting from the end)
puts team[-2]     # => Dragonite   (second to last)
```

- `team[0]` accesses the first element. This is a programming convention: counting starts from 0.
- Negative indexes count from the end. `-1` is the last, `-2` the second to last.

Ruby also offers shortcuts:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']

puts team.first    # => Pikachu
puts team.last     # => Blastoise
```

## Modifying an element

You can replace an element by assigning a new value to an index:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']
puts team[0]       # => Pikachu

team[0] = 'Raichu'
puts team[0]       # => Raichu
p team             # => ["Raichu", "Charizard", "Blastoise"]
```

## Getting the size

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']

puts team.size      # => 3
puts team.length    # => 3  (identical to .size)
puts team.empty?    # => false
puts [].empty?      # => true
```

- `.size` and `.length` do the same thing. `.empty?` returns `true` if the Array contains no elements.

## Adding elements

```ruby
team = ['Pikachu']

# Add to the end
team.push('Charizard')
team << 'Blastoise'          # shortcut, the most commonly used
p team    # => ["Pikachu", "Charizard", "Blastoise"]

# Add to the beginning
team.unshift('Mew')
p team    # => ["Mew", "Pikachu", "Charizard", "Blastoise"]

# Insert at a specific position
team.insert(2, 'Gengar')
p team    # => ["Mew", "Pikachu", "Gengar", "Charizard", "Blastoise"]
```

- `<<` is the most common way to add to the end. It is read as "append" or "push".
- `.unshift` adds to the beginning. `.insert(position, value)` inserts at a given index.

## Removing elements

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise', 'Gengar']

# Remove the last
last_removed = team.pop
puts last_removed   # => Gengar
p team              # => ["Pikachu", "Charizard", "Blastoise"]

# Remove the first
first_removed = team.shift
puts first_removed    # => Pikachu
p team                # => ["Charizard", "Blastoise"]

# Remove by value (all occurrences)
team = ['Pikachu', 'Charizard', 'Pikachu']
team.delete('Pikachu')
p team    # => ["Charizard"]

# Remove by index
team = ['Pikachu', 'Charizard', 'Blastoise']
team.delete_at(1)
p team    # => ["Pikachu", "Blastoise"]
```

- `.pop` and `.shift` return the removed element, allowing you to store it in a variable.
- `.delete(value)` removes **all** occurrences of that value.

## Searching in an Array

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise', 'Gengar']

puts team.include?('Pikachu')      # => true
puts team.include?('Mewtwo')       # => false
puts team.index('Blastoise')         # => 2 (its position)
puts team.index('Mewtwo')          # => nil (not found)
```

- `.include?` checks whether a value is in the Array. `.index` returns its position, or `nil` if not found.

## Iterating over an Array with each

To do something with each element of an Array, use `.each`:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']

team.each { |pokemon| puts "Go, #{pokemon} !" }
```

Displays:

```
Go, Pikachu !
Go, Charizard !
Go, Blastoise !
```

- `.each` passes each element, one by one, to the **block** `{ |pokemon| ... }`. The word `pokemon` between the pipes `| |` is the name given to the current element. You can choose any name, but it is more readable to use the singular of the collection.
- In Ruby, many Array methods accept a block to customize their behavior. In this chapter, some methods are shown without a block (like `.sort`, `.reverse`), but they often have a block variant that we will discover later. When you see an Array method, there is a good chance you can pass it a block.
- For a block that fits on one line, use `{ }`. For a longer block, use `do ... end`:

```ruby
team.each do |pokemon|
  puts "Pokemon: #{pokemon}"
  puts "  Name length: #{pokemon.length}"
end
```

## Iterating with the index

When you need the position of each element along with its value:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']

team.each_with_index do |pokemon, index|
  puts "#{index + 1}. #{pokemon}"
end
```

Displays:

```
1. Pikachu
2. Charizard
3. Blastoise
```

- `.each_with_index` passes two values to the block: the element and its index. We add 1 to the index for a more natural display (starting at 1 rather than 0).

## Transforming an Array with map

`.map` creates a **new** Array by transforming each element:

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise']

uppercased_team = team.map { |pokemon| pokemon.upcase }
p uppercased_team    # => ["PIKACHU", "CHARIZARD", "BLASTOISE"]
p team               # => ["Pikachu", "Charizard", "Blastoise"]  (unchanged)
```

- `.map` does not modify the original Array. It returns a new Array with the results.

## Filtering an Array with select and reject

```ruby
team = ['Pikachu', 'Charizard', 'Blastoise', 'Gengar', 'Dragonite']

# Keep only names longer than 8 characters
long_names = team.select { |pokemon| pokemon.length > 8 }
p long_names    # => ["Charizard", "Gengar", "Dragonite"]

# Exclude names longer than 8 characters
short_names = team.reject { |pokemon| pokemon.length > 8 }
p short_names   # => ["Pikachu", "Blastoise"]
```

- `.select` keeps elements for which the block returns `true`.
- `.reject` does the opposite: it excludes those for which the block returns `true`.

## Sorting and reordering

```ruby
team = ['Blastoise', 'Pikachu', 'Charizard']

p team.sort         # => ["Charizard", "Pikachu", "Blastoise"]  (alphabetical order)
p team.reverse      # => ["Charizard", "Pikachu", "Blastoise"]  (reversed order)

levels = [36, 25, 40, 10]
p levels.sort       # => [10, 25, 36, 40]  (ascending order)
```

- `.sort` sorts in alphabetical order (String) or numerical order (Integer). `.reverse` reverses the order.
- `.sort` can also take a block to sort by a custom criterion (for example, sorting by name length). We will see this form in later chapters.
- Like `.map` and `.select`, these methods return a new Array without modifying the original.

## Other useful methods

```ruby
# Remove nils
sparse = ['Pikachu', nil, 'Blastoise', nil]
p sparse.compact        # => ["Pikachu", "Blastoise"]

# Remove duplicates
duplicates = ['Pikachu', 'Charizard', 'Pikachu', 'Blastoise']
p duplicates.uniq       # => ["Pikachu", "Charizard", "Blastoise"]

# Convert an Array to a String
team = ['Pikachu', 'Charizard', 'Blastoise']
puts team.join(', ')    # => Pikachu, Charizard, Blastoise
puts team.join(' | ')   # => Pikachu | Charizard | Blastoise
```

- `.compact` removes all `nil` values. `.uniq` removes duplicates.
- `.join` is the inverse of `.split` (seen in chapter 2): it combines elements into a single String with a separator.

## Conclusion

- An **Array** is an ordered list of elements, accessible by index (which starts at 0).
- `<<` is the idiomatic way to add an element to the end.
- `.each` iterates over each element. `.each_with_index` also gives the position.
- `.map` transforms each element and returns a new Array.
- `.select` keeps elements matching a condition. `.reject` does the opposite.
- `.sort` sorts, `.reverse` reverses, `.compact` removes nils, `.uniq` removes duplicates.
- `.include?` checks for the presence of an element. `.index` returns its position.
- `.join` converts to a String. `.split` (seen in chapter 2) does the reverse.
