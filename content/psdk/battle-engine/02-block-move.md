---
title: "Block a move"
slug: how-to-block-a-move
sidebar_position: 2
description: "This guide explains how to prevent a move from reaching its target, whether from the move's own logic or from an effect active on the target."
---

## Principle

A move can be blocked for two distinct reasons:

- **From the move itself**: the move checks the target's conditions and decides it cannot reach it.
- **From an external effect**: an active effect on the target prevents the move from reaching it.

In both cases, the block **must be accompanied by a message** clearly indicating the reason to the player.

> **Difference with failure** (guide 001): failure prevents the **user** from launching the move (`move_usable_by_user`), while blocking prevents the move from reaching the **target** (`move_blocked_by_target?`).

## From the move

Some moves can be blocked based on their own rules. For example, the move **Disable** is blocked if the target is already under the Disable effect or if it has not yet used a move.

To handle this behavior, override the `move_blocked_by_target?` method in the move's class.

### Example: Disable

```ruby
# Function that tests if the target blocks the move
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] expected target
# @note Thing that prevents the move from being used should be defined by :move_prevention_target Hook.
# @return [Boolean] if the target evades the move (and is not selected)
def move_blocked_by_target?(user, target)
  return true if super
  return @scene.display_message_and_wait(parse_text(18, 74)) && true if target.effects.has?(:disable)
  return @scene.display_message_and_wait(parse_text(18, 74)) && true if target.move_history.empty?

  return false
end
```

- The call to `super` is **mandatory** to preserve default checks.
- Each condition displays a message then returns `true` via the `&& true` expression.
- The method returns `false` by default if no blocking condition is met.

## From an effect

Some moves can be blocked by an effect active on the target. For example, the ability **Good as Gold** blocks all single-target status moves.

To handle this behavior, use the `on_move_prevention_target` method in the effect's class.

### Example: Good as Gold

```ruby
# Function called when we try to check if the target evades the move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler] expected target
# @param move [Battle::Move]
# @return [Boolean] if the target is evading the move
def on_move_prevention_target(user, target, move)
  return false if user == @target || target != @target
  return false unless move&.status?
  return false unless move&.one_target?

  @logic.scene.visual.show_ability(target)
  @logic.scene.visual.wait_for_animation
  @logic.scene.display_message_and_wait(parse_text_with_pokemon(19, 210, target))

  return true
end
```

- The first lines verify that the target is the effect holder and that the move is a single-target status move.
- The ability animation is displayed with `show_ability` before the message (standard pattern for abilities).
- Returning `true` signals to the system that the move is blocked by the target.

## Conclusion

- Use `move_blocked_by_target?` if the block depends on the move's own logic.
- Use `on_move_prevention_target` if the block depends on an external effect active on the target.
- Return `true` to signal that the move is blocked.
- Always display a clear message to the player before returning the block.
