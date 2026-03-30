---
title: "How to use conditionals in Ruby?"
slug: conditionals
sidebar_position: 5
description: "This chapter introduces **conditionals**, the mechanism that allows a program to make decisions. Depending on the situation, the code executes one branch or another."
---

This chapter introduces **conditionals**, the mechanism that allows a program to make decisions. Depending on the situation, the code executes one branch or another.

## Principle

Up until now, our programs ran from top to bottom, line by line. But a useful program needs to be able to react: if the Pokemon is fainted, display a message. If the attack is super effective, double the damage. That is the role of conditionals: test a situation and act accordingly.

## True or false in Ruby (truthiness)

Before looking at conditionals, we need to understand how Ruby decides if something is "true" or "false".

The rule is very simple: **only `false` and `nil` are considered false**. Everything else is true, even values that seem "empty" in other languages:

~~~ruby
# These values are all considered true
puts 'oui' if 0          # 0 is true!
puts 'oui' if ''         # an empty String is true!
puts 'oui' if []         # an empty Array is true!

# Only false and nil are false
puts 'oui' if false      # not printed
puts 'oui' if nil         # not printed
~~~

- This is a Ruby-specific behavior. In other languages, `0` or `""` are often false. Not in Ruby.
- To test if a number equals zero, write `number == 0`. To test if a String is empty, use `.empty?`.

## if / elsif / else

The most common structure for executing code based on a condition:

~~~ruby
level = 50

if level >= 100
  puts 'Niveau maximum atteint !'
elsif level >= 50
  puts 'Pokémon de haut niveau'
elsif level >= 20
  puts 'Pokémon de niveau moyen'
else
  puts 'Pokémon de bas niveau'
end
~~~

- Ruby evaluates each condition from top to bottom and executes the **first** one that is true.
- `elsif` (not `elseif` or `else if`) adds additional conditions.
- `else` executes when none of the previous conditions are true. It is optional.
- The block ends with `end`.

A simple `if` without `elsif` or `else`:

~~~ruby
health_points = 0

if health_points <= 0
  puts 'Le Pokémon est KO !'
end
~~~

## unless

`unless` is the opposite of `if`. It executes the code when the condition is **false**:

~~~ruby
held_item = nil

unless held_item
  puts 'Le Pokémon ne tient aucun objet.'
end
~~~

- `unless held_item` means "if `held_item` is false (i.e., `nil` or `false`)".
- `unless` makes the code more readable when testing a simple negation. The golden rule is to avoid **double negations**: `unless !condition` is confusing, a simple `if condition` is much clearer. `unless` with `&&` is acceptable as long as the sentence remains easy to understand. However, avoid `unless` with `else`: if you need an `else`, then an `if` would be more readable.

## Postfix form (one-liner)

When the code to execute fits on a single line, you can put the condition at the end:

~~~ruby
level = 100
health_points = 0

puts 'Niveau maximum !' if level >= 100
puts 'Le Pokémon est KO !' if health_points <= 0
puts 'Le Pokémon est en forme.' unless health_points <= 0
~~~

- This is exactly the same as an `if ... end`, but more compact.
- It reads naturally: "print this message **if** the level is greater than or equal to 100".
- Use it only when the code fits on one line. For longer blocks, use the classic form.

## case / when

When comparing the same value against multiple possibilities, `case/when` is more readable than a chain of `if/elsif`:

~~~ruby
pokemon_type = :fire

case pokemon_type
when :fire
  puts 'Fort contre Plante, faible contre Eau'
when :water
  puts 'Fort contre Feu, faible contre Plante'
when :grass
  puts 'Fort contre Eau, faible contre Feu'
when :electric
  puts 'Fort contre Eau'
else
  puts "Type inconnu : #{pokemon_type}"
end
~~~

- `case` takes the value to compare. Each `when` tests a possibility.
- Only one `when` executes (no "fall-through" like in C or JavaScript).
- `else` is optional, it covers all cases not listed.

`case/when` also works with **ranges** (intervals):

~~~ruby
level = 45

case level
when 1..30
  puts 'Bas niveau'
when 31..60
  puts 'Niveau moyen'
when 61..100
  puts 'Haut niveau'
end
~~~

- `1..30` is a Range (interval) that includes 1 and 30. Ruby checks if `level` falls within this interval.

And with **classes** (types):

~~~ruby
value = 42

case value
when Integer
  puts 'Un nombre entier'
when String
  puts 'Du texte'
when Symbol
  puts 'Un symbole'
end
~~~

## Comparison operators

~~~ruby
puts 50 == 50     # => true   (equal)
puts 50 != 75     # => true   (not equal)
puts 50 < 75      # => true   (less than)
puts 50 > 75      # => false  (greater than)
puts 50 <= 50     # => true   (less than or equal)
puts 50 >= 75     # => false  (greater than or equal)
~~~

- `==` compares **values**. Be careful not to confuse it with `=` which is assignment.

There is also the "spaceship" operator `<=>` which returns -1, 0, or 1:

~~~ruby
puts 10 <=> 20    # => -1  (10 is smaller)
puts 20 <=> 20    # => 0   (equal)
puts 30 <=> 20    # => 1   (30 is larger)
~~~

- `<=>` is used by `.sort` to compare elements against each other. We will revisit it in later chapters.

## Logical operators

To combine multiple conditions, use `&&` (and), `||` (or), and `!` (not):

~~~ruby
level = 80
is_legendary = false

# && : BOTH conditions must be true
if level >= 50 && !is_legendary
  puts 'Pokémon puissant et non légendaire'
end

# || : at least ONE condition must be true
if is_legendary || level >= 80
  puts 'Pokémon rare !'
end

# ! : inverts the value
if !is_legendary
  puts 'Pokémon non légendaire'
end
~~~

- `&&` returns `true` if both sides are true.
- `||` returns `true` if at least one side is true.
- `!` inverts: `!true` gives `false`, `!false` gives `true`, `!nil` gives `true`.

Ruby also provides `and`, `or`, and `not` which do the same thing but with lower precedence. In practice, **always use `&&`, `||`, and `!`** to avoid surprises.

## The ||= operator (or-equals)

`||=` is a very common shortcut. It assigns a value only if the variable is `nil` or `false`:

~~~ruby
ability = nil
ability ||= :static
puts ability    # => static (ability was nil, so :static was assigned)

ability ||= :lightning_rod
puts ability    # => static (ability already had a value, nothing changes)
~~~

- `ability ||= :static` is equivalent to `ability = ability || :static`.
- If `ability` is `nil`, `||` takes the right-hand value (`:static`). If `ability` already has a value, `||` keeps the left-hand one.
- This is very useful for defining default values.

## The ternary operator

To choose between two values in a single line:

~~~ruby
level = 50
category = level >= 50 ? 'fort' : 'faible'
puts category    # => fort
~~~

- `condition ? value_if_true : value_if_false` is a shortcut for an `if/else` that returns a value.
- Use it when the choice is simple and fits on one line. For more complex cases, prefer `if/else`.

## Conclusion

- In Ruby, only `false` and `nil` are false. Everything else (`0`, `""`, `[]`) is true.
- `if/elsif/else/end` for conditionals. The keyword is `elsif` (not `elseif`).
- `unless` for simple negations. Do not use it with `else` or compound conditions.
- The postfix form (`puts 'message' if condition`) is ideal for simple one-liners.
- `case/when` compares a value against multiple possibilities (values, ranges, classes).
- `==` compares values. `&&` (and), `||` (or), `!` (not) combine conditions.
- `||=` assigns a value only if the variable is `nil` or `false`.
- The ternary operator `condition ? true : false` chooses between two values in one line.
