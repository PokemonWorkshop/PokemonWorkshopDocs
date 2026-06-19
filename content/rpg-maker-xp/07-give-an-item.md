---
title: "Give an item to the player"
slug: give-an-item
sidebar_position: 7
description: "PSDK can hand an item to the player in several ways: a Poké Ball lying on the ground, a gift from an NPC, or a silent background add. This guide covers the three event commands that give an item, how each treats the event it runs from, and the bag methods to check, count and remove what the player owns."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can hand an item to the player in several ways: a Poké Ball lying on the ground, a gift from an NPC, or a silent background add. This guide covers the three event commands that give an item, how each treats the event it runs from, and the bag methods to check, count and remove what the player owns.

The first three commands are [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): you call them from an event's **Script** command, without any prefix. The bag methods at the end go through the `$bag` global instead; the difference is explained where they come up.

## Three ways to hand over an item

PSDK gives you three commands to hand an item over, and the right one depends on **what the player sees**. A Poké Ball lying on the ground that vanishes once picked up is not the same event as an NPC who keeps standing there after giving a gift. The commands differ mainly in **whether they delete the event** afterwards and in the message they show. In every one, the item is named by its db_symbol (`:potion`, `:poke_ball`) or its numeric ID, exactly as it appears in the items database.

### Pick up a ground item

`pick_item` is the command for an item sitting on the map, the classic Poké Ball the player walks into:

```ruby
pick_item(item_id, count = 1, no_delete = false)
```

- `item_id` — the item to give, as a db_symbol (`:poke_ball`) or its numeric ID.
- `count` — how many to give. Optional, defaults to `1`.
- `no_delete` — whether to keep the event afterwards. Optional, defaults to `false`, meaning the event is **deleted for good**.

On the Poké Ball event, a single Script command is enough:

```ruby
pick_item(:potion)
```

This adds one Potion, shows the "found a Potion" message, plays the item jingle, then **deletes the event permanently**: the Poké Ball disappears and will not come back, even after the player leaves and re-enters the map. That is exactly what you want for a one-time ground item.

To hand over several at once, pass a count:

```ruby
pick_item(:poke_ball, 5)
```

If the item should stay available (a respawning pickup, a test event), keep the event by passing `true` as the third argument:

```ruby
pick_item(:potion, 1, true)
```

### Receive an item from an NPC

`give_item` is the command for an NPC handing the player something. Unlike `pick_item`, it **never deletes the event**, so the character stays on the map and can be talked to again:

```ruby
give_item(item_id, count = 1)
```

- `item_id` — the item, as a db_symbol or numeric ID.
- `count` — how many. Optional, defaults to `1`.

After the gift dialogue, in the same event:

```ruby
give_item(:potion)
```

This adds the item, shows the gift message and plays the jingle, but leaves the NPC in place. PSDK picks the right message automatically: a Key Item gets the special key-item line, anything else the generic gift line. There is no `no_delete` argument here, keeping the event is the whole point of `give_item`.

### The general command

Both commands above are built on `add_item`, which you can also call directly when you need finer control:

```ruby
add_item(item_id, no_delete = false, count: 1)
```

- `item_id` — the item, as a db_symbol or numeric ID.
- `no_delete` — keep the event (`true`) or delete it (`false`, the default).
- `count` — how many, as a keyword argument. Optional, defaults to `1`.

```ruby
add_item(:potion, false, count: 3)
```

This adds three Potions, shows the found message and deletes the event. `pick_item` is just `add_item` with the found message; `give_item` is `add_item` with the event kept. Reach for `add_item` directly only when neither shortcut fits. When the bag is full (a maximum bag size is configured), `add_item` shows a "no more room" message instead of adding the item, so you never have to check capacity yourself.

## Add an item silently

All three commands above show a message and play a sound. When you only need the item in the bag with no fanfare, for example as a side effect of another event, go through the bag object directly. These methods are not Interpreter commands: they live on the player's bag, reached through the `$bag` global, so they are written `$bag.something(...)`. You still type them in a **Script** command, the prefix is the only difference.

`$bag.add_item` adds an item with no message and no sound:

```ruby
$bag.add_item(db_symbol, nb = 1)
```

- `db_symbol` — the item, as a db_symbol or numeric ID.
- `nb` — how many. Optional, defaults to `1`.

```ruby
$bag.add_item(:potion, 2)
```

This quietly drops two Potions into the bag. Nothing is shown and the event is left untouched.

## Check, count and remove items

The same `$bag` global lets you read and edit what the player owns.

### Check whether the player has an item

`$bag.has_item?` returns whether the bag holds at least a given quantity of an item:

```ruby
$bag.has_item?(db_symbol, quantity = 1)
```

It returns `true` or `false`, so it belongs in the **Script** tab of a **Conditional Branch**. The quantity is optional and defaults to `1`:

```ruby
# Does the player have at least one Potion?
$bag.has_item?(:potion)
```

Pass a quantity to test a larger amount:

```ruby
# Does the player have at least five Poké Balls?
$bag.has_item?(:poke_ball, 5)
```

### Count how many

`$bag.item_quantity` returns the exact amount the player holds:

```ruby
$bag.item_quantity(db_symbol)
```

It returns an `Integer` (`0` when the player has none), useful to store in a variable or test a threshold. In a Conditional Branch Script tab:

```ruby
# Has the player got more than ten Poké Balls?
$bag.item_quantity(:poke_ball) > 10
```

### Remove an item

`$bag.remove_item` takes items back out of the bag:

```ruby
$bag.remove_item(db_symbol, nb = 999)
```

- `db_symbol` — the item to remove.
- `nb` — how many. Optional; the default of `999` effectively clears the item out entirely.

```ruby
$bag.remove_item(:potion, 2)
```

This removes two Potions. If the count reaches zero the item leaves the bag completely. Called without a quantity, it removes the whole stack:

```ruby
$bag.remove_item(:potion)
```

The method is also available as `$bag.drop_item`, which reads better when the player throws something away; both do the same thing.

## Conclusion

- Use `pick_item` for a ground item: it shows the "found" message and **deletes the event**, so the pickup happens once. Pass `true` as the third argument to keep it.
- Use `give_item` for an NPC gift: it shows the gift message and **keeps the event**, so the character stays talkable.
- Both are built on `add_item`; call it directly only for finer control, such as adding several at once.
- Add an item with no message or sound through `$bag.add_item`.
- Read and edit the bag with `$bag.has_item?`, `$bag.item_quantity` and `$bag.remove_item` (alias `drop_item`), all callable from a Conditional Branch Script tab.
