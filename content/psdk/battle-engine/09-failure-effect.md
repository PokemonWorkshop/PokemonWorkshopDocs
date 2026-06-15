---
title: "Create a move failure effect"
slug: how-to-create-a-failure-effect
sidebar_position: 9
description: "This guide explains how to execute a specific effect when a move fails (misses its target, is immunized, etc.), whether from the move itself or from an external effect."
---

## Principle

Some moves or effects trigger a behavior when a move fails. For example, **Jump Kick** deals recoil damage to the user if the move misses.

This behavior can be handled in two ways:

- **From the move itself**: the move defines its own reaction to failure.
- **From an external effect**: an ability, item, or other effect reacts to a move's failure.

## Failure reasons

The `on_move_failure` method receives a `reason` parameter that indicates why the move failed:

- `:usable_by_user`: the move failed in `move_usable_by_user` (guide 001)
- `:no_target`: all targets are KO (no valid target available)
- `:accuracy`: the move missed its target (accuracy check)
- `:immunity`: the target is immune to the move (guide 004)
- `:pp`: the move has no PP left (this reason is no longer sent by the system, but remains defined for backward compatibility)

## From the move

To define a failure behavior from the move, override the `on_move_failure` method in the move's class.

### Example: Jump Kick

```ruby
# Event called if the move failed
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @param reason [Symbol] why the move failed: :usable_by_user, :no_target, :accuracy, :immunity
def on_move_failure(user, targets, reason)
  return if reason == :usable_by_user

  hp = (user.max_hp / 2).clamp(1, Float::INFINITY)
  @logic.damage_handler.damage_change(hp, user)
  @scene.display_message_and_wait(parse_text_with_pokemon(19, 908, user))
end
```

- The `:usable_by_user` reason is excluded because recoil only applies if the move was actually attempted.
- `damage_handler.damage_change` is used to deal recoil damage via the standard handler.
- The recoil message is displayed after the damage is applied.

## From an effect

Some effects can react to a move's failure. For example, an ability or item could trigger a behavior when its holder's move fails.

To handle this behavior, use the `on_move_failure` method in the effect's class.

### Example: Accuracy boost when a move misses

This effect raises the user's accuracy by one stage each time one of their moves misses its target.

```ruby
# Function called when a move fails during its execution
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @param move [Battle::Move] the move that failed
# @param reason [Symbol] why the move failed: :usable_by_user, :no_target, :accuracy, :immunity
def on_move_failure(user, targets, move, reason)
  return if user != @pokemon
  return if reason != :accuracy

  @logic.stat_change_handler.stat_change_with_process(:acc, 1, user)
end
```

- We check that the user is the effect holder (`@pokemon`).
- We filter on `:accuracy` to only react when the move missed its target (not immunities or lack of targets).
- `stat_change_with_process` automatically handles messages and limit checks.

:::note
**Difference with the move version**: the effect signature receives an additional `move` parameter because the effect does not automatically know which move failed.
:::

## Conclusion

- Use `on_move_failure` in the move to define an effect specific to that move when it fails.
- Use `on_move_failure` in an effect to react to any move's failure.
- Filter failure reasons with the `reason` parameter to only react to relevant cases.
- Use the handlers provided by the system (`damage_handler`, `stat_change_handler`, etc.) for standard operations.
