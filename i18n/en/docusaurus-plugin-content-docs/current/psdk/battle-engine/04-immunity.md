---
title: "How to be immune to a move in PSDK?"
slug: how-to-be-immune-to-a-move
sidebar_position: 4
description: "This guide explains how to make a Pokemon immune to a move, whether from the move's own logic or from an external effect."
---

## Principle

A Pokemon can be immune to a move for two distinct reasons:

- **From the move itself**: the move checks the target's conditions and decides it has no effect.
- **From an external effect**: an active effect on the target prevents the move from affecting it.

In both cases, immunity is signaled by returning `true`.

> **Difference with blocking** (guide 002): blocking prevents the move from reaching the target and displays a message. Immunity means the move reaches the target but has **no effect** -- the system automatically displays the message "It doesn't affect [Pokemon]...".

## From the move

Some moves can have no effect on the target based on their own rules. For example, the move **Attract** has no effect if both Pokemon are not of opposite genders or if the target is already under the Attract effect.

To handle this behavior, override the `target_immune?` method in the move's class.

### Example: Attract

```ruby
# Test if the target is immune
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @return [Boolean]
def target_immune?(user, target)
  return true if super
  return true unless user.gender * target.gender == 2
  return true if target.effects.has?(:attract)

  return false
end
```

- The call to `super` is **mandatory** to preserve default checks.
- `user.gender * target.gender == 2` checks that both Pokemon are of opposite genders (male=1, female=2, so 1*2=2).
- The method returns `false` by default if no immunity condition is met.

## From an effect

Some effects can make a Pokemon immune to certain moves. For example, the ability **Bulletproof** grants immunity to ballistic moves.

To handle this behavior, use the `on_move_ability_immunity` method in the effect's class. Despite the method name containing `ability`, it applies to **all types of effects**.

### Example: Bulletproof

```ruby
# Function called when we try to check if the Pokemon is immune to a move due to its effect
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Boolean] if the target is immune to the move
def on_move_ability_immunity(user, target, move)
  return false if target != @target
  return false unless move.ballistics?
  return false unless user.can_be_lowered_or_canceled?

  move.scene.visual.show_ability(target)

  return true
end
```

- The first lines verify that the target is the effect holder and that the move is ballistic.
- `can_be_lowered_or_canceled?` checks that the user's ability can be neutralized (some abilities ignore immunities).
- The ability animation is displayed with `show_ability` to visually indicate the immunity.

## Conclusion

- Use `target_immune?` if the immunity depends on the move's own logic.
- Use `on_move_ability_immunity` if the immunity depends on an external effect active on the target.
- Return `true` to signal immunity -- the message is automatically displayed by the system.
- For ability-type effects, remember to display the ability animation with `show_ability`.
