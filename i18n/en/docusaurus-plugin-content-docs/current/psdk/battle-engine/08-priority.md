---
title: "How to change move priority in PSDK?"
slug: how-to-change-move-priority
sidebar_position: 8
description: "This guide explains how to dynamically change the priority of a move at the time of use, whether from the move's own logic or from an external effect."
---

## Principle

A move's priority can be changed for two distinct reasons:

- **From the move itself**: the move recalculates its priority based on the battle context.
- **From an external effect**: an active effect modifies the move's priority before turn order is determined.

In both cases, the returned value is an `Integer` representing the final priority.

## From the move

Some moves can change their priority based on their own rules. For example, the move **Grassy Glide** gains +1 priority if the grassy terrain is active and the user is grounded.

To handle this behavior, override the `priority` method in the move's class.

### Example: Grassy Glide

```ruby
# Return the priority of the skill
# @param user [PFM::PokemonBattler] user for the priority check
# @return [Integer]
def priority(user = nil)
  base_priority = super
  return base_priority unless @logic.field_terrain_effect.grassy?
  return base_priority unless @logic.current_action.launcher.grounded?

  return base_priority + 1
end
```

- `super` retrieves the base priority defined in the move's data.
- Conditions are checked sequentially: if any fails, the base priority is returned unchanged.
- The method adds +1 to the base priority instead of returning a fixed value, which respects prior modifications.

## From an effect

Some effects can change a move's priority. For example, the ability **Prankster** gives +1 priority to status moves.

To handle this behavior, use the `on_move_priority_change` method in the effect's class.

### Example: Prankster

```ruby
# Function called when we try to check if the effect changes the definitive priority of the move
# @param user [PFM::PokemonBattler]
# @param priority [Integer]
# @param move [Battle::Move]
# @return [Integer, nil]
def on_move_priority_change(user, priority, move)
  return if user != @target
  return unless move&.status?

  return priority + 1
end
```

- The first line checks that the user is the ability holder.
- The second line checks that the move is a status move.
- The `priority` parameter contains the current priority, potentially already modified by other effects.
- Returning `nil` (implicit) leaves the priority unchanged.

## Conclusion

- Use `priority` if the change depends on the move's own logic. Return an `Integer`.
- Use `on_move_priority_change` if the change depends on an external effect. Return an `Integer` or `nil`.
- Always modify priority relatively (`base_priority + 1`) rather than absolutely to respect other modifications.
