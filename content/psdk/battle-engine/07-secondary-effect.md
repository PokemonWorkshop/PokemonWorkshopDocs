---
title: "Create a move's secondary effect"
slug: how-to-create-a-secondary-effect
sidebar_position: 7
description: "This guide explains how to implement a move's custom effect and how to validate the conditions for applying that effect."
---

## Principle

Implementing a move's effect is done in two steps:

- **Apply the effect**: the `deal_effect` method executes the effect on valid targets.
- **Validate conditions**: a verification method determines whether the effect can be applied. This method depends on the move type (offensive or status).

## Applying the effect

To define what the move does, override the `deal_effect` method in the move's class. This method receives the targets that will actually be affected.

### Example: Core Enforcer

```ruby
# Function that deals the effect to the pokemon
# @param user [PFM::PokemonBattler] user of the move
# @param actual_targets [Array<PFM::PokemonBattler>] targets that will be affected by the move
def deal_effect(user, actual_targets)
  actual_targets.each do |target|
    next if target.effects.has?(:ability_suppressed)

    launchers = logic.turn_actions.map(&:launcher)
    next if launchers.first != user

    @logic.ability_change_handler.disable_ability(target, :__undef__, db_symbol, user, self)
    @scene.display_message_and_wait(parse_text_with_pokemon(19, 565, target))
  end
end
```

- The `each` loop on `actual_targets` is **mandatory** to apply the effect to each target individually.
- `next` skips to the next target if the conditions are not met for a given target.
- Handlers (`ability_change_handler`) are used for standard operations (ability change, status, stats, etc.).

## Validating conditions

The conditions for applying the effect are checked **before** its execution. If the conditions are not met, the effect is skipped. The method to use depends on the move type.

### For offensive moves

Override the `effect_working?` method which determines whether the move's secondary effect can be applied. Core Enforcer illustrates it:

```ruby
# Test if the effect is working
# @param user [PFM::PokemonBattler] user of the move
# @param actual_targets [Array<PFM::PokemonBattler>] targets that will be affected by the move
# @return [Boolean]
def effect_working?(user, actual_targets)
  return actual_targets.none? { |target| target.effects.has?(:ability_suppressed) }
end
```

- If the method returns `false`, `deal_effect` is not called.
- The check is performed on `actual_targets` (the targets that were actually hit by the move).

### For status moves

Override the `move_usable_by_user` method which determines whether the move can be launched (see guide 001 for full details). Gravity illustrates it:

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

- If the method returns `false`, the move fails entirely (not just the effect).
- The call to `super` is **mandatory** to preserve default checks.

## Conclusion

- Use `deal_effect` to implement the move's effect, iterating over `actual_targets`.
- Use `effect_working?` to validate conditions for a secondary effect on an offensive move.
- Use `move_usable_by_user` to validate conditions for a status move (guide 001).
- Use the handlers provided by the system for standard operations (stats, status, ability, etc.).
