---
title: "Give a badge to the player"
slug: give-a-badge
sidebar_position: 6
description: "Gym badges are part of the trainer's state in PSDK, not a game switch. This guide shows how to award, remove and test a badge from an event, how the optional region and value parameters work, and how to count the badges the player has earned."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

Gym badges are part of the **trainer's state** in PSDK, not a game switch. This guide shows how to award, remove and test a badge from an event, how the optional region and value parameters work, and how to count the badges the player has earned.

Unlike the [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event), which you call with no prefix, badges live on the trainer object. You reach it through the `$trainer` global, so every command on this page is written `$trainer.something(...)`. You still type it in an event's **Script** command, the prefix is the only difference.

## What a badge is in PSDK

When the player beats a Gym Leader, the leader's event hands them a badge. PSDK stores that as a flag on the trainer: each badge is either obtained or not. There is no system switch to toggle, and nothing to declare in advance.

The trainer holds room for **6 regions of 8 badges each**, so a badge is identified by two numbers: its **number** (1 to 8) and its **region** (starting at 1). Most games only use one region, which is why the region is optional and defaults to `1`. The eight badges of region 1 are the ones drawn on the **Trainer Card**.

## Award a badge

`set_badge` flips a badge to obtained:

```ruby
$trainer.set_badge(badge_num, region = 1, value = true)
```

- `badge_num` — the badge to set, from `1` to `8`.
- `region` — the region the badge belongs to, starting at `1`. Optional, defaults to `1`.
- `value` — the obtained state. Optional, defaults to `true`.

In the Gym Leader's event, right after the victory dialogue, award the fifth badge with:

```ruby
$trainer.set_badge(5)
```

Because `region` and `value` use their defaults, this gives badge 5 of region 1. A `badge_num` outside the `1`–`8` range is rejected and logged as an error instead of being set.

## Remove a badge

Pass `false` as the third argument to clear a badge:

```ruby
$trainer.set_badge(5, 1, false)
```

Here you have to write the region explicitly, because `value` is the third parameter: there is no way to skip the one in the middle. This takes badge 5 of region 1 back to the not-obtained state.

## Badges from another region

A multi-region game stores each region's badges separately. Target one by passing its number as the second argument:

```ruby
$trainer.set_badge(5, 3)
```

This awards badge 5 of **region 3**. The region must be at least `1`; the trainer has room for six of them, and asking for a badge in a region the game does not provide is rejected and logged as an error.

## Check whether the player has a badge

`badge_obtained?` returns whether a badge is set:

```ruby
$trainer.badge_obtained?(badge_num, region = 1)
```

It returns `true` or `false`, so it belongs in the **Script** tab of a **Conditional Branch**. To gate a route behind the fifth badge:

```ruby
# Does the player have the fifth badge?
$trainer.badge_obtained?(5)
```

As with `set_badge`, the region is optional and defaults to `1`, so `$trainer.badge_obtained?(5, 3)` checks badge 5 of region 3. The method is also available under the alias `has_badge?`, which reads better in some conditions; both do the same thing.

## Count the badges

`badge_counter` returns how many badges the player has obtained, across every region:

```ruby
$trainer.badge_counter
```

It returns an `Integer`, useful to unlock something once the player has collected enough badges. In a **Conditional Branch** Script tab:

```ruby
# Has the player collected all eight badges?
$trainer.badge_counter >= 8
```

## Conclusion

- Badges are trainer state, reached through the `$trainer` global, not game switches.
- Award one with `$trainer.set_badge(badge_num)`; remove it with `$trainer.set_badge(badge_num, region, false)`.
- A badge is a **number** (1–8) plus a **region** (defaults to 1, up to 6); the region 1 badges show on the Trainer Card.
- Test a badge with `$trainer.badge_obtained?(badge_num)` (alias `has_badge?`) in a Conditional Branch Script tab.
- Count earned badges with `$trainer.badge_counter`.
