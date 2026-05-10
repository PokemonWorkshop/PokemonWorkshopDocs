---
title: "How to modify critical hit chance in PSDK?"
slug: how-to-modify-critical-hit-chance
sidebar_position: 13
description: "This guide explains how to modify a move's critical hit rate and the critical damage multiplier."
---

## Principle

The critical hit system works in two steps:

- **Count calculation**: a counter is incremented based on the move's base rate, active effects, abilities, and items. This counter is converted to a probability via the `CRITICAL_RATES` table.
- **Damage multiplier**: if the hit is critical, the `calc_ch` method applies a x1.5 multiplier on the damage.

The probability table is as follows:

| Count | Probability |
| ----- | ----------- |
| 0     | 0%          |
| 1     | 6.25%       |
| 2     | 12.5%       |
| 3     | 50%         |
| 4+    | 100%        |

## From Studio

A move's base critical rate is configured directly in Studio via the `critical_rate` field. This value represents the initial count of the critical counter:

- A `critical_rate` of 0 gives a base count of 0 (no bonus).
- A `critical_rate` of 1 gives a base count of 1 (6.25% base, stackable with other bonuses).

For example, the moves **Slash** and **Stone Edge** have a `critical_rate` of 1 in Studio.

## From the move

For more advanced critical logic, override the `calc_critical_hit` method in the move's subclass. If the conditions are not met, return `super` to keep the default behavior.

### Example: guaranteed critical under a condition

A move that always crits if the target is poisoned:

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return true if target.poisoned? || target.toxic?

  return super
end
```

- `return true` guarantees the critical hit when the condition is met.
- `return super` delegates to the standard calculation (count + probability table) otherwise.

### Example: increased chance under a condition

A move that has 50% critical chance in rain:

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return bchance?(0.5) if @logic.effective_weather_effect.global_rain?

  return super
end
```

- `bchance?(0.5)` performs a random check with 50% success chance, using the battle RNG.
- If the weather condition is not met, `return super` keeps the normal calculation.

## From the system

The critical count calculation is handled by `calc_critical_count` in the battle logic. This counter adds up:

- The move's `critical_rate` (base value).
- Bonuses from active effects (Focus Energy, Dragon Cheer, Triple Arrows).
- The Super Luck ability bonus (+1).
- Item bonuses (Razor Claw, Scope Lens, Leek for Farfetch'd).
- The Lansat Berry bonus.

Critical hit prevention is done via:

- The **Battle Armor** and **Shell Armor** abilities that block criticals on the target.
- The **Lucky Chant** effect that prevents criticals on the entire team.
- Some abilities like **Merciless** guarantee a critical if the target is poisoned.

## Conclusion

- Configure `critical_rate` in Studio for the base rate (0 = normal, 1 = high rate).
- Override `calc_critical_hit` in the move's subclass for custom logic. Use `return true` for a guaranteed critical, `bchance?` for increased chances, and `return super` otherwise.
- The counter is incremented by abilities, items, and effects before being converted to a probability.
- Prevention is done via the Battle Armor/Shell Armor abilities or the Lucky Chant effect.
