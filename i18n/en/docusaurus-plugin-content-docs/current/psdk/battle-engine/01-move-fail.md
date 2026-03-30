---
title: "How to make a move fail in PSDK?"
slug: how-to-make-a-move-fail
sidebar_position: 1
description: "This guide explains how to make a move fail before it is executed, whether from the move's own logic or from an external effect."
---

## Principle

A move can fail for two distinct reasons:

- **From the move itself**: the move checks its own conditions and decides it cannot be used.
- **From an external effect**: an active effect on the Pokemon prevents the move from being used.

In both cases, the failure **must be accompanied by a message** clearly indicating the reason to the player.

## From the move

Some moves can fail based on their own rules. For example, the move **Gravity** fails if gravity is already active on the field.

To handle this behavior, override the `move_usable_by_user` method in the move's class.

### Example: Gravity

```ruby
# Function that tests if the user is able to use the move
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @note Thing that prevents the move from being used should be defined by :move_prevention_user Hook
# @return [Boolean] if the procedure can continue
def move_usable_by_user(user, targets)
  return false unless super
  return show_usage_failure(user) && false if @logic.terrain_effects.has?(:gravity)

  return true
end
```

- The call to `super` is **mandatory** to preserve default checks.
- `show_usage_failure(user)` displays the failure message to the player.
- The `&& false` expression ensures the method returns `false` after displaying the message.

## From an effect

Some moves can fail because of an active effect on the user. For example, the **Throat Chop** effect prevents the use of sound-based moves.

To handle this behavior, use the `on_move_prevention_user` method in the effect's class.

### Example: Throat Chop

```ruby
# Function called when we try to use a move as the user (returns :prevent if user fails)
# @param user [PFM::PokemonBattler]
# @param targets [Array<PFM::PokemonBattler>]
# @param move [Battle::Move]
# @return [:prevent, nil] :prevent if the move cannot continue
def on_move_prevention_user(user, targets, move)
  return if user != @pokemon
  return unless move.sound_attack?

  move.scene.display_message_and_wait(parse_text_with_pokemon(59, 1860, user))
  return :prevent
end
```

- The first lines verify that the effect applies to this user and this type of move.
- The failure message is displayed **before** returning `:prevent`.
- Returning `:prevent` signals to the system that the move cannot continue.

## Conclusion

- Use `move_usable_by_user` if the failure depends on the move's own logic.
- Use `on_move_prevention_user` if the failure depends on an external effect active on the Pokemon.
- Return `false` (from a move) or `:prevent` (from an effect) depending on the context.
- Always display a clear message to the player before returning the failure.
