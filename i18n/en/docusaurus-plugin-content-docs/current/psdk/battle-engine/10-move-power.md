---
title: "How to change move power in PSDK?"
slug: how-to-change-move-power
sidebar_position: 10
description: "This guide explains how to dynamically change the base power of a move, whether from the move's own logic or from an external effect."
---

## Principle

A move's power can be changed for two distinct reasons:

- **From the move itself**: the move recalculates its base power based on the context.
- **From an external effect**: an active effect applies a multiplier on the base power.

The two mechanisms operate at different levels: `real_base_power` returns the **base power** (absolute value), while `base_power_multiplier` returns a **multiplier** applied afterwards.

## From the move

Some moves can change their power based on their own rules. For example, the move **Acrobatics** doubles its power if the user has no held item.

To handle this behavior, override the `real_base_power` method in the move's class.

### Example: Acrobatics

```ruby
# Get the real base power of the move (taking in account all parameter)
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Numeric]
def real_base_power(user, target)
  return power * 2 if user.item_effect.is_a?(Battle::Effects::Item::Gems) && user.item_consumed
  return power * 2 unless user.hold_item?(user.battle_item_db_symbol)

  return super
end
```

- `power` is the base power defined in the move's data.
- The `item_consumed` check covers the case where a gem was consumed at the beginning of the turn.
- `hold_item?` checks if the user still holds an item -- if not, the power is doubled.
- `super` returns the unmodified base power if no condition is met.

## From an effect

Some effects can modify a move's power via a multiplier. For example, the ability **Technician** multiplies by 1.5 the power of moves with 60 or less base power.

To handle this behavior, use the `base_power_multiplier` method in the effect's class.

### Example: Technician

```ruby
# Get the base power multiplier of this move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Float]
def base_power_multiplier(user, target, move)
  return super if user != @target
  return super if move.power > 60

  return 1.5
end
```

- `super` returns the default multiplier (1.0) if the conditions are not met.
- The check uses `move.power` (base power) and not `real_base_power` (power after modifications).
- Returning `1.5` is a multiplier: the final power will be `real_base_power * 1.5`.

## Conclusion

- Use `real_base_power` if the change depends on the move's own logic. Return the modified base power (`Numeric`).
- Use `base_power_multiplier` if the change depends on an external effect. Return a multiplier (`Float`).
- `real_base_power` defines the absolute power, `base_power_multiplier` applies a multiplicative factor on top.
