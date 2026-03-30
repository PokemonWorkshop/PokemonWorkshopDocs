---
title: "How to change a move type in PSDK?"
slug: how-to-change-a-move-type
sidebar_position: 5
description: "This guide explains how to dynamically change the type of a move at the time of use, whether from the move's own logic or from an external effect."
---

## Principle

A move's type can be changed for two distinct reasons:

- **From the move itself**: the move determines its type based on the user or the context.
- **From an external effect**: an active effect modifies the move's type before execution.

The two mechanisms have different return formats: `definitive_types` returns an `Array<Integer>` (list of types), while `on_move_type_change` returns a single `Integer` or `nil`.

## From the move

Some moves can change type based on their own rules. For example, the move **Raging Bull** adapts its type based on the form of Tauros using it.

To handle this behavior, override the `definitive_types` method in the move's class.

### Example: Raging Bull

```ruby
# @return [Array<Symbol>]
RAGING_BULL_USERS = %i[tauros]

# Get the types of the move with 1st type being affected by effects
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Array<Integer>] list of types of the move
def definitive_types(user, target)
  return [type] unless RAGING_BULL_USERS.include?(user.db_symbol)

  case user.form
  when 1
    return [data_type(:fighting).id]
  when 2
    return [data_type(:fire).id]
  when 3
    return [data_type(:water).id]
  else
    return [type]
  end
end
```

- The `RAGING_BULL_USERS` constant limits the effect to the relevant Pokemon, allowing easy monkey patching.
- `data_type(:symbol).id` converts a type symbol to its numeric identifier.
- The method always returns an `Array<Integer>`, even for a single type (`[type]`).

## From an effect

Some effects can modify a move's type before execution. For example, the **Ion Deluge** effect transforms Normal-type moves into Electric-type.

To handle this behavior, use the `on_move_type_change` method in the effect's class.

### Example: Ion Deluge

```ruby
# Function called when we try to get the definitive type of a move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler] expected target
# @param move [Battle::Move]
# @param type [Integer] current type of the move (potentially after effects)
# @return [Integer, nil] new type of the move
def on_move_type_change(user, target, move, type)
  return if type != data_type(:normal).id

  return data_type(:electric).id
end
```

- The `type` parameter contains the current type of the move, potentially already modified by other effects.
- The method returns the new type (`Integer`) if the condition is met, or implicitly `nil` to leave the type unchanged.

## Conclusion

- Use `definitive_types` if the type change depends on the move's own logic. Return an `Array<Integer>`.
- Use `on_move_type_change` if the change depends on an external effect. Return an `Integer` or `nil`.
- Use `data_type(:symbol).id` to convert a type symbol to a numeric identifier.
