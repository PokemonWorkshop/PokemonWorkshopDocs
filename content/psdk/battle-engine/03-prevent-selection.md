---
title: "How to prevent move selection in PSDK?"
slug: how-to-prevent-move-selection
sidebar_position: 3
description: "This guide explains how to make a move non-selectable in the battle menu, whether from the move's own logic or from an external effect."
---

## Principle

A move can be non-selectable for two distinct reasons:

- **From the move itself**: the move checks its own conditions and decides it cannot be chosen.
- **From an external effect**: an active effect on the Pokémon prevents the move from being selected.

In both cases, the prevention is signaled by returning a `Proc`. This return **must be accompanied by a message** clearly indicating the reason to the player.

> **Difference with failure** (guide 001): selection prevention happens **before** the turn, in the battle menu. Failure happens **during** the turn, at move execution.

## From the move

Some moves can be non-selectable based on their own rules. For example, the move **Stuff Cheeks** cannot be selected if the user is not holding a Berry.

To handle this behavior, override the `disable_reason` method in the move's class.

### Example: Stuff Cheeks

```ruby
# Get the reason why the move is disabled
# @param user [PFM::PokemonBattler] user of the move
# @return [#call] Block that should be called when the move is disabled
def disable_reason(user)
  reason_message = @scene.display_message_and_wait(parse_text_with_pokemon(60, 508, user))
  return proc { reason_message } unless user.hold_berry?(user.battle_item_db_symbol)

  return super
end
```

- The call to `super` is **mandatory** to preserve default checks.
- If the condition is not met, a `Proc` containing the message is returned to signal that the move is disabled.
- If the condition is met (the user holds a Berry), `super` takes over.

## From an effect

Some moves can be non-selectable because of an active effect on the user. For example, the **Gravity** effect prevents selection of gravity-affected moves.

To handle this behavior, use the `on_move_disabled_check` method in the effect's class.

### Example: Gravity

```ruby
# Function called when we try to check if the user cannot use a move
# @param user [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Proc, nil]
def on_move_disabled_check(user, move)
  return unless move.gravity_affected?

  reason_message = move.scene.display_message_and_wait(parse_text_with_pokemon(19, 1092, user, PFM::Text::MOVE[1] => move.name))
  return proc { reason_message }
end
```

- The first line checks that the move is affected by gravity.
- If it is, a `Proc` containing the message is returned.
- If it is not, `nil` is implicitly returned (no block).

## Special case: coupling with prevention

When using `disable_reason` to disable a move, you must also implement `move_usable_by_user` (guide 001). Indeed, a disabled move can still be launched through effects like **Metronome** that bypass selection.

Similarly, for effects, `on_move_disabled_check` must be coupled with `on_move_prevention_user` to cover the case where the move is launched without going through the menu.

## Conclusion

- Use `disable_reason` and `move_usable_by_user` if the logic depends on the move itself.
- Use `on_move_disabled_check` and `on_move_prevention_user` if the logic depends on an external effect.
- Return a `Proc` to signal that the move is non-selectable.
- Always display a clear message to the player indicating the reason.
- Always cover the case where the move is launched without going through the selection menu.
