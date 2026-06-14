---
title: "How to use hashes?"
slug: hashes
sidebar_position: 4
description: "This chapter introduces Hashes, a structure that associates keys with values. Where an Array stores elements by position (index 0, 1, 2...), a Hash stores them by name."
---

This chapter introduces **Hashes**, a structure that associates **keys** with **values**. Where an Array stores elements by position (index 0, 1, 2...), a Hash stores them by name.

## Principle

With an Array, you access an element by its number: `team[0]`. This is handy for ordered lists, but not for describing an object. To group a Pokemon's information (name, level, type), you would need to remember that index 0 is the name, index 1 the level, etc. This is fragile and unreadable.

A Hash solves this problem: each value is associated with a **key** that you choose. You access the value by its key, not by its position. It is like a dictionary: you look up a word (the key) to find its definition (the value).

## Creating a Hash

The most common way to create a Hash uses curly braces `{}` with Symbol keys:

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }
p pikachu    # => {:name=>"Pikachu", :type=>:electric, :level=>25}
```

- `name:` is the key (a Symbol `:name`), `'Pikachu'` is the value.
- Key-value pairs are separated by commas.
- The syntax `name: 'Pikachu'` is a shortcut for `:name => 'Pikachu'`. Both forms are equivalent.

You can also write keys with the **rocket syntax** `=>`:

```ruby
# Rocket syntax (older, but still used for non-Symbol keys)
pikachu = { :name => 'Pikachu', :type => :electric }

# With String keys (rare, but possible)
translations = { 'fire' => 'feu', 'water' => 'eau' }
```

- The shorthand syntax `name: value` only works with Symbol keys. For String or Integer keys, you must use `=>`.
- In practice, Symbol keys with the shorthand syntax are used almost all the time.

An empty Hash is created with `{}`:

```ruby
empty = {}
p empty    # => {}
```

## Accessing values

You access a value by passing its key in square brackets:

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

puts pikachu[:name]     # => Pikachu
puts pikachu[:level]    # => 25
puts pikachu[:ability]  # => nil (the key does not exist)
```

- If the key does not exist, `[]` returns `nil` without error. This is silent, which can be a trap if you make a typo.

To avoid this trap, you can use `.fetch`, which raises an error if the key does not exist:

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

puts pikachu.fetch(:name)              # => Pikachu
# pikachu.fetch(:ability)              # => Error! KeyError

# With a default value, no error
puts pikachu.fetch(:ability, 'aucun')  # => aucun
```

- `.fetch` without a default value raises an error if the key is missing. This is useful when a missing key is a bug you want to detect.
- `.fetch(:key, default_value)` returns the default value if the key does not exist, without error.

## Adding and modifying entries

```ruby
pikachu = { name: 'Pikachu', type: :electric }

# Add a new key
pikachu[:level] = 25
pikachu[:ability] = :static
p pikachu               # => {:name=>"Pikachu", :type=>:electric, :level=>25, :ability=>:static}

# Modify an existing key
pikachu[:level] = 30
puts pikachu[:level]    # => 30
```

- The syntax is the same for adding and modifying: `hash[:key] = value`. If the key exists, the value is replaced. Otherwise, it is created.

## Checking and deleting

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

# Check for the presence of a key
puts pikachu.key?(:name)      # => true
puts pikachu.key?(:ability)   # => false

# Size and emptiness
puts pikachu.size             # => 3
puts pikachu.empty?           # => false
puts {}.empty?                # => true

# Delete a key
deleted = pikachu.delete(:level)
puts deleted                  # => 25 (the deleted value is returned)
p pikachu                     # => {:name=>"Pikachu", :type=>:electric}
```

- `.key?` checks whether a key exists. This is more reliable than `hash[:key]` because a key can exist with the value `nil`.
- `.delete` removes the key-value pair and returns the deleted value.

## Extracting keys and values

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

p pikachu.keys     # => [:name, :type, :level]
p pikachu.values   # => ["Pikachu", :electric, 25]
```

- `.keys` returns an Array of all keys. `.values` returns an Array of all values.

## Iterating over a Hash

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

pikachu.each do |key, value|
  puts "#{key} : #{value}"
end
```

Displays:

```
name : Pikachu
type : electric
level : 25
```

- `.each` passes two values to the block: the key and the value. This is the difference from Arrays, where `.each` passes only a single element.

You can also iterate over only the keys or only the values:

```ruby
pikachu.each_key { |key| puts key }
pikachu.each_value { |value| puts value }
```

## Filtering a Hash

Like Arrays, Hashes have `.select` and `.reject`:

```ruby
pokemon = { name: 'Charizard', type: :fire, level: 36, hp: 150 }

# Keep only pairs whose value is an Integer
numbers = pokemon.select { |key, value| value.is_a?(Integer) }
p numbers    # => {:level=>36, :hp=>150}
```

- `.select` on a Hash returns a **new Hash** (unlike `.map`, which returns an Array).

## Merging two Hashes

```ruby
base = { hp: 78, attack: 84 }
bonus = { attack: 100, speed: 120 }

result = base.merge(bonus)
p result      # => {:hp=>78, :attack=>100, :speed=>120}
p base        # => {:hp=>78, :attack=>84}  (unchanged)
```

- `.merge` returns a **new** Hash. In case of a shared key, the value from the second Hash wins.
- The original is not modified.

## Nested Hashes

A Hash can contain other Hashes as values. This is very common for modeling complex data:

```ruby
charizard = {
  name: 'Charizard',
  types: [:fire, :flying],
  stats: { hp: 78, attack: 84, speed: 100 }
}

puts charizard[:stats][:hp]       # => 78
puts charizard[:stats][:speed]    # => 100
```

- You chain `[]` to access nested levels: `hash[:key1][:key2]`.

The problem arises when an intermediate level does not exist:

```ruby
# If :stats did not exist, we would get an error
# charizard[:moves][:first]    # => Error! NoMethodError (nil has no [])
```

To avoid this problem, Ruby offers `.dig`, which navigates deeply without error:

```ruby
puts charizard.dig(:stats, :hp)       # => 78
puts charizard.dig(:moves, :first)    # => nil (no error)
```

- `.dig` returns `nil` if an intermediate level does not exist, instead of raising an error.

## Hash with default value

Normally, accessing a nonexistent key returns `nil`. You can change this behavior with `Hash.new`:

```ruby
# Counter: each nonexistent key defaults to 0
counter = Hash.new(0)

counter[:fire] += 1
counter[:fire] += 1
counter[:water] += 1

puts counter[:fire]     # => 2
puts counter[:water]    # => 1
puts counter[:grass]    # => 0 (default value, the key has not been created)
p counter               # => {:fire=>2, :water=>1}
```

- `Hash.new(0)` creates a Hash whose default value is `0`. When you access a nonexistent key, you get `0` instead of `nil`.
- This is very handy for counters: you can do `+= 1` without checking whether the key already exists.

## Conclusion

- A **Hash** associates keys with values. Create with `{ key: value }` for Symbol keys.
- `[]` returns `nil` if the key is missing. `.fetch` raises an error or returns an explicit default.
- `[]=` adds or modifies an entry. `.delete` removes a pair.
- `.key?` checks for the presence of a key. `.keys` and `.values` return Arrays.
- `.each` iterates over key-value pairs. `.select` filters and returns a new Hash.
- `.merge` merges two Hashes (the second wins in case of conflict).
- Nested Hashes model complex data. `.dig` navigates them without risk of error.
- `Hash.new(default_value)` sets the value returned for nonexistent keys.
