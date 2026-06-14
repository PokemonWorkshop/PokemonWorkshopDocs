---
title: "How to change the damage formula?"
slug: how-to-change-the-damage-formula
sidebar_position: 11
description: "This guide explains how to replace the damage calculation formula of a move for special cases like fixed damage."
---

## Principle

The damage calculation formula is defined in the `damages` method. By default, it uses the standard Pokemon formula (power, attack, defense, STAB, effectiveness, etc.).

Some moves require replacing this formula entirely. For example, **Dragon Rage** always deals a fixed 40 HP of damage, regardless of stats.

## Replacing the complete formula

To handle this behavior, override the `damages` method in the move's class.

### Example: Fixed damage moves

```ruby
# Fixed damage values for specific moves
FIXED_DAMAGE_VALUES = {
  sonic_boom: 20,
  dragon_rage: 40
}.freeze

# Method calculating the damages done by the actual move
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Integer]
def damages(user, target)
  @critical = false
  @effectiveness = 1
  damage = FIXED_DAMAGE_VALUES.fetch(db_symbol, 1)
  log_data("Fixed Damage Move: #{damage} HP")

  return damage
end
```

- `@critical = false` disables critical hits for this move.
- `@effectiveness = 1` forces effectiveness to neutral (no "super effective" on fixed damage).
- `FIXED_DAMAGE_VALUES` allows easily adding other fixed damage moves via monkey patch.

## Modifying sub-steps of the formula

If you don't want to replace the complete formula but adjust a specific step, several internal methods within `damages` can be overridden:

- `calc_critical_hit`: critical hit calculation
- `calc_sp_atk`: attack stat (physical or special)
- `calc_sp_def`: defense stat (physical or special)
- `calc_mod1`: first modifier (pre-critical)
- `calc_ch`: critical hit multiplier
- `calc_mod2`: second modifier (post-critical)
- `calc_stab`: STAB bonus (Same Type Attack Bonus)
- `calc_mod3`: third modifier (post-STAB)

Some of these methods in turn call hooks accessible from effects.

## Conclusion

- Use `damages` to entirely replace the damage calculation formula.
- Use the sub-methods (`calc_critical_hit`, `calc_stab`, etc.) to modify a specific step of the standard formula.
- For fixed damage, remember to disable criticals (`@critical = false`) and effectiveness (`@effectiveness = 1`).
