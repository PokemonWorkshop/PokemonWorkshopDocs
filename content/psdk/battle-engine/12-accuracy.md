---
title: "Change move accuracy"
slug: how-to-modify-move-accuracy
sidebar_position: 12
description: "This guide explains how to dynamically modify a move's accuracy, whether by bypassing it entirely or by applying a multiplier from an external effect."
---

## Principle

A move's accuracy is calculated by the `chance_of_hit` method using the formula:

```text
chance_of_hit = factor x accuracy
```

Where `factor` is the product of three elements:

- Multipliers from all active effects (`chance_of_hit_multiplier`).
- The user's accuracy modifier (`accuracy_mod`).
- The target's evasion modifier (`evasion_mod`).

If `bypass_chance_of_hit?` returns `true`, the accuracy check is skipped and the move always hits.

:::note
**Pokémon Studio tip**: setting a move's accuracy to `0` in Pokémon Studio is enough to make it never miss. The system treats an accuracy of 0 or less as an automatic bypass of the accuracy check.
:::

## From the move

Some moves change their accuracy based on context. For example, the move **Thunder** has 50 accuracy in sun, always hits in rain, and keeps its normal accuracy otherwise.

To handle this behavior, override the `accuracy` method in the move's subclass. If the conditions are not met, return `super` to keep the value defined in Pokémon Studio.

### Example: Thunder

```ruby
# Return the current accuracy of the move
# @return [Integer]
def accuracy
  return 50 if @logic.effective_weather_effect.global_sunny?
  return 0 if @logic.effective_weather_effect.global_rain?

  return super
end
```

- `return 50` reduces accuracy to 50% in sun.
- `return 0` makes the move never miss in rain (accuracy of 0 = automatic bypass).
- `return super` keeps the accuracy defined in Pokémon Studio for all other cases.

You can also override `bypass_chance_of_hit?` to completely skip the accuracy check based on specific conditions. For example, a move that always hits if the target used Minimize:

```ruby
# Check if the move bypass chance of hit and cannot fail
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def bypass_chance_of_hit?(user, target)
  return true if target.effects.has?(:minimize)

  return super
end
```

- `bypass_chance_of_hit?` is useful when the bypass depends on an external condition (target's state, ability, etc.) rather than a change in accuracy value.

## From an effect

Some effects can modify a move's accuracy via a multiplier. For example, the ability **Compound Eyes** multiplies accuracy by 1.3 for all of the user's moves.

To handle this behavior, use the `chance_of_hit_multiplier` method in the effect's class.

### Example: Compound Eyes

```ruby
# Return the chance of hit multiplier
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @param move [Battle::Move]
# @return [Float]
def chance_of_hit_multiplier(user, target, move)
  return 1 if user != @target

  return 1.3
end
```

- `super` returns the default multiplier (`1`), to use when conditions are not met.
- Returning a value greater than `1` increases accuracy, less than `1` decreases it.
- All multipliers from active effects are multiplied together before being applied to the formula.

### Example: Hustle

```ruby
# Return the chance of hit multiplier
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @param move [Battle::Move]
# @return [Float]
def chance_of_hit_multiplier(user, target, move)
  return 1 if user != @target

  return move.physical? ? 0.8 : 1
end
```

- Here the multiplier is conditional: `0.8` for physical moves, `1` for others.
- The Hustle ability reduces accuracy of physical moves in exchange for an attack bonus.

## Conclusion

- Override `accuracy` in the move's subclass to change accuracy based on context. Return `super` if the conditions are not met.
- Override `bypass_chance_of_hit?` to skip the accuracy check based on a condition. Return `super` otherwise.
- Use `chance_of_hit_multiplier` to apply a multiplier on accuracy from an effect. Return a `Float`.
- The final formula is: `factor x accuracy`, where `factor` is the product of all multipliers, user accuracy, and target evasion.
