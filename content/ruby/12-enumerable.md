---
title: "Enumerable"
slug: enumerable
sidebar_position: 12
description: "This chapter introduces Enumerable, a module that provides over 50 collection manipulation methods. We also discover Comparable, which allows comparing objects with each other."
---

This chapter introduces **Enumerable**, a module that provides over 50 collection manipulation methods. We also discover **Comparable**, which allows comparing objects with each other.

## Principle

We have already used `.map`, `.select`, `.reject` on Arrays. These are not strictly Array methods: they come from the **Enumerable** module that Array includes automatically.

The principle is simple: if a class defines the `each` method and includes `Enumerable`, it inherits all these methods for free. `each` is the only building block needed — Ruby builds everything else on top of it.

This is exactly what we learned in chapter 10 with mixins: `include Enumerable` injects dozens of methods into the class.

## Including Enumerable in a class

```ruby
class Registry
  include Enumerable

  def initialize
    @pokemon_list = []
  end

  def add(pokemon)
    @pokemon_list << pokemon
    return self
  end

  # The only required method for Enumerable
  def each(&block)
    @pokemon_list.each(&block)
  end
end
```

- `include Enumerable` gives access to `map`, `select`, `sort_by`, `reduce`, etc.
- `each` is the **contract**: Enumerable uses it as the foundation for all its methods.
- `&block` captures the block passed to `each` and forwards it to `@pokemon_list.each`.
- `return self` in `add` allows chaining: `registry.add(a).add(b)`.

## Transforming: map and flat_map

`map` transforms each element and returns a new Array:

```ruby
names = registry.map { |pokemon| pokemon.name }
# => ["Pikachu", "Charizard", "Blastoise"]
```

`flat_map` does the same thing, then flattens the result by one level. This is useful when each element produces an Array:

```ruby
# Each Pokemon can have multiple types
all_types = registry.flat_map { |pokemon| pokemon.types }
# => [:electric, :fire, :flying, :water]

# Without flat_map, we would get an Array of Arrays
registry.map { |pokemon| pokemon.types }
# => [[:electric], [:fire, :flying], [:water]]
```

- `flat_map` = `map` + `flatten(1)`. It is a very common shortcut.

## Filtering: select, reject, find

We already saw them in chapter 3, but they come from Enumerable:

```ruby
# Keep Fire-type Pokemon
fire_pokemon = registry.select { |pokemon| pokemon.types.include?(:fire) }

# Exclude KO'd Pokemon
alive = registry.reject { |pokemon| pokemon.ko? }

# Find the first Water-type Pokemon
first_water = registry.find { |pokemon| pokemon.types.include?(:water) }
```

- `select` and `reject` return an Array. `find` returns a single element or `nil`.

## Reducing: reduce

`reduce` (also called `inject`) accumulates a value while traversing the collection:

```ruby
# Sum all levels
total = registry.reduce(0) { |sum, pokemon| sum + pokemon.level }
```

How it works, step by step:

1. `sum` starts at `0` (the initial value passed to `reduce`)
2. First iteration: `sum = 0 + 25` -> `sum` is `25`
3. Second iteration: `sum = 25 + 36` -> `sum` is `61`
4. And so on... The final result is the last value of `sum`.

There are also shortcuts:

```ruby
# sum is a shortcut for reduce(0) { |s, p| s + p.level }
total = registry.sum { |pokemon| pokemon.level }

# reduce with a symbol (when working directly with numbers)
levels = [25, 36, 40]
total = levels.reduce(:+)    # => 101
```

- `sum` is more readable than `reduce` for simple additions.
- `reduce(:+)` calls the `+` method between each pair of elements.

## Sorting: sort_by, min_by, max_by

`sort_by` sorts according to a criterion extracted by the block:

```ruby
# Sort by level ascending
by_level = registry.sort_by { |pokemon| pokemon.level }

# Sort by level descending (negate the value)
strongest = registry.sort_by { |pokemon| -pokemon.level }
```

`min_by` and `max_by` find the extreme element without sorting the entire collection:

```ruby
strongest = registry.max_by { |pokemon| pokemon.level }
weakest = registry.min_by { |pokemon| pokemon.level }

# Both at once
weakest, strongest = registry.minmax_by { |pokemon| pokemon.level }
```

- `sort_by` returns a new sorted Array.
- `min_by`/`max_by` are more efficient than `sort_by.first`/`sort_by.last` because they traverse the collection only once.

## Grouping: group_by and tally

`group_by` organizes elements into subgroups based on a criterion:

```ruby
by_type = registry.group_by { |pokemon| pokemon.types.first }
# => { :electric => [...], :fire => [...], :water => [...] }
```

`tally` counts occurrences of each value in an Array:

```ruby
# Count how many Pokemon of each type
census = registry.flat_map { |pokemon| pokemon.types }.tally
# => { :electric => 2, :fire => 3, :water => 1, :flying => 1 }
```

- `group_by` returns a Hash whose keys are the values returned by the block.
- `tally` is a very handy shortcut for counting.

## Counting: count and sum

```ruby
# How many Pokemon in total?
total = registry.count

# How many Fire-type Pokemon?
fire_count = registry.count { |pokemon| pokemon.types.include?(:fire) }

# Sum of all levels
total_levels = registry.sum { |pokemon| pokemon.level }
```

- `count` without a block returns the total number. With a block, it counts those that satisfy the condition.

## Predicates: any?, all?, none?

These methods return `true` or `false`:

```ruby
# Is there at least one Water-type Pokemon?
registry.any? { |pokemon| pokemon.types.include?(:water) }    # => true

# Are all Pokemon above level 10?
registry.all? { |pokemon| pokemon.level > 10 }                # => true

# No Pokemon is KO'd?
registry.none? { |pokemon| pokemon.ko? }                      # => true
```

## Slicing: take and drop

```ruby
# The first 3 Pokemon
first_three = registry.take(3)

# All except the first 2
without_first_two = registry.drop(2)
```

## Chaining calls

You can chain multiple Enumerable methods to build complex queries:

```ruby
# The names of the 3 highest-level Pokemon
top_three = registry
  .sort_by { |pokemon| -pokemon.level }
  .take(3)
  .map { |pokemon| pokemon.name }
```

- Each method returns an Array, which allows calling the next one on it.
- The order of operations matters: filtering **before** sorting is more efficient.

## The Comparable module

Comparable works on the same principle as Enumerable: you include the module and define **a single method**, the `<=>` (spaceship) operator. In return, you get `<`, `>`, `<=`, `>=`, `between?` and `clamp`.

```ruby
class Pokemon
  include Comparable

  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def <=>(other)
    return @level <=> other.level
  end
end

pikachu = Pokemon.new('Pikachu', 25)
charizard = Pokemon.new('Charizard', 50)

puts pikachu < charizard                                    # => true
puts charizard > pikachu                                    # => true
puts pikachu.between?(Pokemon.new('Min', 10), charizard)    # => true
```

- `<=>` returns `-1` if `self` is less, `0` if equal, `1` if greater.
- Once `<=>` is defined, `.sort` works automatically without a block.

## Conclusion

- Including `Enumerable` and defining `each` gives access to over 50 methods.
- `map` transforms, `flat_map` transforms and flattens.
- `select`/`reject` filter, `find` finds the first match.
- `reduce` accumulates a value. `sum` is a shortcut for additions.
- `sort_by` sorts by criterion. `min_by`/`max_by` find the extremes.
- `group_by` groups, `tally` counts occurrences.
- `count` counts, `any?`/`all?`/`none?` check conditions.
- Including `Comparable` and defining `<=>` gives `<`, `>`, `<=`, `>=`, `between?`, `clamp`.
- You can chain Enumerable calls for complex queries.
