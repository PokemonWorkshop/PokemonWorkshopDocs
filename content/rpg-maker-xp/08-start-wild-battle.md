---
title: "Start a wild battle"
slug: start-a-wild-battle
sidebar_position: 8
description: "PSDK can throw the player into a wild battle straight from an event: a single encounter, a double battle, or a fully configured Pokémon with its shininess, form and held item set in advance. This guide covers the command that starts the battle, the forms it accepts, and the switches you read afterwards to react to the result."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can throw the player into a wild battle straight from an event: a single encounter, a double battle, or a fully configured Pokémon with its shininess, form and held item set in advance. This guide covers the command that starts the battle, the forms it accepts, and the switches you read afterwards to react to the result.

`call_battle_wild` is an [Interpreter method](/rpg-maker-xp/using-the-interpreter-in-an-event): you call it from an event's **Script** command, without any prefix. The Pokémon is named by its db_symbol (`:pikachu`, `:gyarados`) or its numeric ID, exactly as it appears in the creatures database.

## A simple wild battle

The basic form takes the Pokémon and its level:

```ruby
call_battle_wild(id, level)
```

- `id` — the wild Pokémon, as a db_symbol (`:pikachu`) or its numeric ID.
- `level` — the level it appears at.

So a single level 15 Pikachu is:

```ruby
call_battle_wild(:pikachu, 15)
```

The battle starts immediately. By default the player cannot lose a wild battle without consequence: a defeat triggers the usual black-out and warps them back home or to the last Pokémon Center.

## A double or triple wild battle

To start a 2-versus-2 battle, pass a second Pokémon as another `id`, `level` pair:

```ruby
call_battle_wild(id1, level1, id2, level2)
```

For example, a Zigzagoon and a Wurmple together:

```ruby
call_battle_wild(:zigzagoon, 7, :wurmple, 6)
```

The number of Pokémon you pass drives the battle format on its own: two enemies make a double battle, three make a triple (3-versus-3). Just append another `id`, `level` pair:

```ruby
call_battle_wild(:zubat, 12, :zubat, 11, :golbat, 14)
```

A triple battle needs the player to have three able Pokémon to fill their own side. Beyond three the format stays capped at a triple; a full five-Pokémon horde is a property of a wild group configured in Studio, not something this command produces.

## Configure the wild Pokémon

The two forms above always generate a plain Pokémon. When you need control over its form, gender, held item or other attributes, build the Pokémon first with `PFM::Pokemon.generate_from_hash`, then hand it to `call_battle_wild`:

```ruby
pokemon = PFM::Pokemon.generate_from_hash(id: :pikachu, level: 15, form: 1, gender: 2)
call_battle_wild(pokemon, nil)
```

The level is read from the hash, so the second argument of `call_battle_wild` is ignored here, pass `nil`.

`generate_from_hash` accepts a hash whose keys map to the Pokémon's attributes:

- `id` — db_symbol or numeric ID of the Pokémon.
- `level` — its level.
- `shiny` / `no_shiny` — force or forbid the shiny appearance.
- `form` — the form index (`-1` lets PSDK pick automatically).
- `gender` — `0` genderless, `1` male, `2` female.
- `item` — the db_symbol of a held item (`:leftovers`).
- `nature`, `stats` (IVs), `bonus` (EVs), `moves`, `ball` — and the other attributes a Pokémon can carry.

:::note

The way `call_battle_wild` tells its forms apart relies on the type of the third argument, and the engine itself flags this dispatch as fragile. For anything beyond a plain single or double encounter, prefer building `PFM::Pokemon` objects with `generate_from_hash`: it is unambiguous and far more readable.

:::

You can also set the battle scenery just before the call: assign `$game_temp.battleback_name` to force a background, and `$game_system.battle_bgm = RPG::AudioFile.new('name', 100, 100)` to force the music. Set the background on the line immediately before `call_battle_wild`, as PSDK resets it every frame.

### A shiny encounter

For a single Pokémon, the simple form takes two extra booleans, force-shiny then no-shiny:

```ruby
call_battle_wild(:gyarados, 30, true, false)
```

That guarantees a shiny Gyarados. The same result through a configured Pokémon, which is the only way to force a shiny in a multi-Pokémon battle:

```ruby
pokemon = PFM::Pokemon.generate_from_hash(id: :gyarados, level: 30, shiny: true)
call_battle_wild(pokemon, nil)
```

### A configured double battle

To run a double battle where each Pokémon is configured, generate both and pass the second after the ignored `nil`:

```ruby
first = PFM::Pokemon.generate_from_hash(id: :zigzagoon, level: 7, shiny: true)
second = PFM::Pokemon.generate_from_hash(id: :wurmple, level: 6, form: 1)
call_battle_wild(first, nil, second)
```

The first argument is the lead Pokémon, the `nil` stands in for the ignored level, and every further argument is another Pokémon on the wild side.

## React to the battle outcome

When the battle ends, PSDK writes the result into game switches. Read them in a **Conditional Branch** right after the `call_battle_wild` command to branch on what happened:

| Switch | ID | Meaning |
| --- | --- | --- |
| `BT_Victory` | 37 | the player won |
| `BT_Defeat` | 36 | the player was defeated |
| `BT_Player_Flee` | 35 | the player fled |
| `BT_Wild_Flee` | 34 | the wild Pokémon fled |
| `BT_Catch` | 38 | the player caught the Pokémon |

For example, give a reward only if the player actually won, by testing switch `37` in a Conditional Branch after the battle. On a real defeat (switch `36`), the player has already been warped back, so the event continues from there.

## Conclusion

- `call_battle_wild(id, level)` starts a single wild battle; the Pokémon is named by db_symbol or numeric ID.
- Append more `id`, `level` pairs for a double or triple battle; the enemy count sets the format (capped at a triple).
- For full control (shiny, form, gender, held item) build the Pokémon with `PFM::Pokemon.generate_from_hash` and pass it instead of an ID.
- After the battle, switches `34` to `38` tell you whether the player won, lost, fled, was fled from, or caught the Pokémon.
