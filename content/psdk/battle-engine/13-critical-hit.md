---
title: "How to modify critical hit chance in PSDK?"
slug: how-to-modify-critical-hit-chance
sidebar_position: 13
description: "This guide explains how to modify a move's critical hit rate and the critical damage multiplier."
---

## Principle

The critical hit system works in two steps:

- **Count calculation**: a counter starts from the move's base rate (`critical_rate`) and is adjusted by the active effects (abilities, items, statuses...). This counter is converted to a probability via the `CRITICAL_RATES` table.
- **Damage multiplier**: if the hit is critical, the `calc_ch` method applies a x1.5 multiplier on the damage.

A move can also decide its own critical outcome, and effects can raise or lower the count, force a guaranteed critical, or prevent any critical.

The probability table is as follows:

| Count | Probability |
| ----- | ----------- |
| 0     | 0%          |
| 1     | 6.25%       |
| 2     | 12.5%       |
| 3     | 50%         |
| 4+    | 100%        |

## From Studio

A move's base critical rate is configured directly in Studio via the `critical_rate` field. This value is used as the **initial count** of the critical counter:

- A `critical_rate` of 1 is the default for every move: a base count of 1 (6.25%).
- A `critical_rate` of 2 gives a base count of 2 (12.5%) -- the high critical-rate moves.
- A `critical_rate` of 0 means the move can never land a critical on its own (count 0 = 0%).

For example, the moves **Slash** and **Stone Edge** have a `critical_rate` of 2 in Studio, against the default of 1.

## From the move

To give a single move its own critical rule, override `calc_critical_hit` in the move's subclass. The method returns a `Boolean`: return your own result when your conditions are met, and `return super` otherwise to fall back to the standard calculation (effects, count, and probability table).

No built-in move ships with such an override -- the following are illustrative examples of what you can implement.

The order matters: `calc_critical_hit` is where the standard calculation resolves **prevention first**, then forcing, then the count. If you return `true` (or a probability) too early, you skip that prevention step and an effect like Lucky Chant or Shell Armor can no longer block the critical. So call `super` for the normal path, and re-check prevention before forcing your own critical.

### Example: guaranteed critical under a condition

A move that always crits if the target is poisoned, while still letting prevention effects block it:

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return super unless target.poisoned? || target.toxic?

  # A prevention effect (Lucky Chant, Shell Armor...) must still win
  return false if @logic.each_effects(user, target).any? { |effect| effect.prevent_critical_hit?(user, target) }

  return true
end
```

- `return super unless ...` delegates to the standard calculation when the condition is not met -- prevention, forcing and the count are resolved there.
- The guard re-checks `prevent_critical_hit?` so abilities like Shell Armor or the Lucky Chant effect can still cancel the critical.
- `return true` forces the critical only once prevention has been ruled out.

### Example: increased chance under a condition

A move that has 50% critical chance in rain, prevention still applying:

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return super unless @logic.weather_effect.global_rain?

  return false if @logic.each_effects(user, target).any? { |effect| effect.prevent_critical_hit?(user, target) }

  return bchance?(0.5)
end
```

- `@logic.weather_effect.global_rain?` checks the active weather.
- The same prevention guard ensures a blocked critical stays blocked.
- `bchance?(0.5)` performs a 50% random check using the battle RNG when the critical is allowed.

For a plain guaranteed critical, the `force_critical_hit?` effect hook (next section) is simpler: the system checks it **after** prevention, so blockers win without a manual guard.

## From an effect

Beyond a single move, criticals are driven by **effects**: abilities, held items, statuses, field effects, and the persistent effects a move can apply to a Pokémon. **Focus Energy**, for example, does not override `calc_critical_hit` -- it applies a lasting effect on the Pokémon that boosts the count. This is different from the move's own logic above.

Each effect can implement up to three hooks, all defined on the effect base class, returning a neutral value by default:

- `critical_count_modifier(user, target)` -- returns an `Integer` added to the count (Focus Energy +2, Super Luck +1, Razor Claw / Scope Lens +1, Lansat Berry +2).
- `force_critical_hit?(user, target)` -- returns `true` to guarantee a critical, bypassing the count (**Merciless** on a poisoned target).
- `prevent_critical_hit?(user, target)` -- returns `true` to block any critical (**Lucky Chant** on a side, **Battle Armor** / **Shell Armor** on a Pokémon).

For example, the Focus Energy effect implements only the count hook:

```ruby
# Return the critical count modifier (added to the critical count)
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Integer]
def critical_count_modifier(user, target)
  return 0 unless user == @pokemon

  return 2
end
```

The count maps to discrete tiers (0, 6.25%, 12.5%, 50%, 100%): for a guaranteed critical, prefer `force_critical_hit?` over a large modifier. Creating and registering your own battle effect is a topic of its own -- a dedicated guide on creating a battle effect will cover it.

## From the system

The system-level calculation is handled by `calc_critical_hit(user, target, initial_critical_count)` in the battle logic. The move's damage step calls it with its `critical_rate` as the initial count:

```ruby
@critical = logic.calc_critical_hit(user, target, critical_rate)
```

It resolves in this order:

1. **Prevention**: if any effect returns `true` from `prevent_critical_hit?`, the hit is not critical.
2. **Forcing**: otherwise, if any effect returns `true` from `force_critical_hit?`, the hit is critical.
3. **Count**: otherwise, `calc_critical_count` iterates over every effect via `each_effects`, sums each `critical_count_modifier`, and the total is converted to a probability through `CRITICAL_RATES`.

The damage multiplier itself is applied by `calc_ch`: x1.5 on a critical hit, with an extra x1.5 (x2.25 total) when the user has the **Sniper** ability.

## Conclusion

- Configure `critical_rate` in Studio for the base rate -- it becomes the initial count (1 = default, 2 = high rate, 0 = never crits on its own).
- Override `calc_critical_hit` in the move's subclass for that move's own rule: return a `Boolean`, `return super` to fall back, and re-check `prevent_critical_hit?` before forcing so blockers still win.
- Implement an effect hook (`critical_count_modifier`, `force_critical_hit?`, `prevent_critical_hit?`) for abilities, items, statuses, or the persistent effects a move applies.
- At the system level, the logic resolves prevention, then forcing, then the count-based probability from `CRITICAL_RATES`; the damage multiplier is x1.5 (x2.25 with the Sniper ability).
