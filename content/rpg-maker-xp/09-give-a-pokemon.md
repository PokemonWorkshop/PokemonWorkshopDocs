---
title: "Give a Pokémon to the player"
slug: give-a-pokemon
sidebar_position: 9
description: "PSDK can hand a Pokémon to the player straight from an event: a polished gift with its jingle and nickname prompt, a silent addition that slips into the PC when the team is full, an egg, or a fully configured Pokémon with its form, gender and held item set in advance. This guide covers the commands that give a Pokémon, where each one puts it, and the switch you read to know whether it reached the party or the PC."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can hand a Pokémon to the player straight from an event: a polished gift with its jingle and nickname prompt, a silent addition that slips into the PC when the team is full, an egg, or a fully configured Pokémon with its form, gender and held item set in advance. This guide covers the commands that give a Pokémon, where each one puts it, and the switch you read to know whether it reached the party or the PC.

These are all [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): you call them from an event's **Script** command, without any prefix. RPG Maker XP has no built-in "give a Pokémon" event command, so everything here goes through Script. The Pokémon is named by its db_symbol (`:pikachu`, `:eevee`) or its numeric ID, exactly as it appears in the creatures database.

## A complete gift

When the player should *notice* receiving a Pokémon, the professor handing over a starter, an NPC giving away an Eevee, reach for `receive_pokemon_sequence`. It is the full presentation: it adds the Pokémon, plays the reception jingle, shows the "received a Pokémon" message, then asks the player whether to give it a nickname.

```ruby
receive_pokemon_sequence(pokemon_or_id, level = 5, shiny = false)
```

- `pokemon_or_id` — the Pokémon, as a db_symbol (`:eevee`) or numeric ID.
- `level` — its level. Optional, defaults to `5`.
- `shiny` — its shiny status. Optional, defaults to `false` (see [Shiny](#shiny) below).

A single Script command gives a level 5 Eevee with the whole ceremony:

```ruby
receive_pokemon_sequence(:eevee, 5)
```

If the team is already full, the Pokémon lands in the PC and the player is told so. The command never deletes the event, so an NPC handing over the gift stays on the map. It returns the [`PFM::Pokemon`](/rpg-maker-xp/start-a-wild-battle) it created, or `nil` if it could not be placed. This sequence is built on `add_pokemon`, described next, with all the messaging added on top.

## Add a Pokémon silently

`add_pokemon` is the primitive underneath: it puts the Pokémon in the team with **no message and no sound**, useful as a side effect of another event when the player does not need a cutscene.

```ruby
add_pokemon(pokemon_or_id, level = 5, shiny = false)
```

- `pokemon_or_id` — the Pokémon, as a db_symbol, a numeric ID, or a `PFM::Pokemon` object you built yourself.
- `level` — its level. Optional, defaults to `5`. Ignored when you pass a ready-made `PFM::Pokemon`.
- `shiny` — its shiny status. Optional, defaults to `false`.

```ruby
add_pokemon(:pikachu, 12)
```

This quietly adds a level 12 Pikachu to the party. **If the party already holds six Pokémon, it goes to the current PC box instead** — the addition never fails for lack of room. The method returns the Pokémon (or `nil` if it could be placed neither in the party nor in the PC).

### Know where it landed

Because `add_pokemon` may divert to the PC, PSDK records the destination in a game switch you can test right after the call:

| Switch | ID | Meaning |
| --- | --- | --- |
| `SYS_Stored` | 9 | `true` = the Pokémon went to the PC box; `false` = it joined the party |

Read switch `9` in a **Conditional Branch** to react, for example to tell the player their new Pokémon is waiting in the PC. `receive_pokemon_sequence` already reads it for you to show the "sent to Box" message, so you only need this when you call `add_pokemon` directly.

### Shiny

The `shiny` argument, shared by `add_pokemon`, `store_pokemon`, `receive_pokemon_sequence` and `add_rename_pokemon`, takes more than a boolean:

- `false` — normal odds, the game's configured shiny rate. This is the default.
- `true` — always shiny.
- `0` — never shiny.
- any integer `n` greater than `0` — a `1 / n` chance (so `8` means one in eight).

```ruby
add_pokemon(:gyarados, 30, true)
```

That guarantees a shiny Gyarados.

## Store directly in the PC

When the Pokémon should go straight to a box, never to the party even when there is room, use `store_pokemon`:

```ruby
store_pokemon(pokemon_or_id, level = 5, shiny = false)
```

The arguments are identical to `add_pokemon`, but the destination is always the current PC box. It sets switch `9` (`SYS_Stored`) to `true` and returns the Pokémon.

```ruby
store_pokemon(:magikarp, 5)
```

This is the command for a reward you want waiting in the box rather than forced into the active team.

## Configure the Pokémon

The forms above always generate a plain Pokémon. When you need control over its form, gender, held item, nature or moves, describe it with a hash and pass it to `add_specific_pokemon`:

```ruby
add_specific_pokemon(hash)
```

The hash is handed to `PFM::Pokemon.generate_from_hash`, the same builder used in the [wild battle guide](/rpg-maker-xp/start-a-wild-battle). For example, an Alolan Meowth (its form index is `1`):

```ruby
add_specific_pokemon(id: :meowth, level: 5, form: 1)
```

The most common keys are:

- `id` — db_symbol or numeric ID of the Pokémon. Required.
- `level` — its level.
- `shiny` / `no_shiny` — force or forbid the shiny appearance.
- `form` — the form index (`-1` lets PSDK pick automatically).
- `gender` — `0` genderless, `1` male, `2` female.
- `item` — the db_symbol of a held item (`:leftovers`).
- `nature`, `stats` (IVs), `bonus` (EVs), `moves`, `ball` — and the other attributes a Pokémon can carry. The wild battle guide lists them in full.

Like `add_pokemon`, it adds to the party or diverts to the PC when the team is full, and returns the Pokémon.

## Let the player name it

Two commands cover nicknaming.

`add_rename_pokemon` gives a Pokémon and immediately opens the naming screen:

```ruby
add_rename_pokemon(pokemon_or_id, level = 5, shiny = false, num_char = 12)
```

The first three arguments match `add_pokemon`; `num_char` caps the nickname length, defaulting to `12` characters.

```ruby
add_rename_pokemon(:pikachu, 10)
```

It adds the Pokémon, then, only if it was placed successfully, opens the rename dialog. Unlike `receive_pokemon_sequence` it shows no message and plays no jingle, just the naming screen.

`rename_pokemon` renames a Pokémon the player **already owns**:

```ruby
rename_pokemon(index_or_pokemon, num_char = 12)
```

- `index_or_pokemon` — the party slot (`0` for the first Pokémon, up to `5`), or a `PFM::Pokemon` object.
- `num_char` — the character limit. Optional, defaults to `12`.

To rename the lead Pokémon:

```ruby
rename_pokemon(0)
```

Pass an object when you kept the return value of an earlier command, which lets you rename a Pokémon that may have gone to the PC:

```ruby
meowth = add_specific_pokemon(id: :meowth, level: 5, form: 1)
rename_pokemon(meowth) if meowth
```

The `if meowth` guard skips the rename when the Pokémon could not be placed.

## Give an egg

`add_egg` hands the player an egg rather than a hatched Pokémon:

```ruby
add_egg(id, egg_how_obtained = :received)
```

- `id` — the species, as a db_symbol or numeric ID; or a hash (same keys as `add_specific_pokemon`) for a configured egg.
- `egg_how_obtained` — where the egg came from. This only affects the Pokémon's memo text: `:received` (the default, an egg handed over, for instance at a Day Care) or `:found` (an egg picked up, for instance on the map).

A Pichu egg received from an NPC:

```ruby
add_egg(:pichu)
```

An egg found on the ground:

```ruby
add_egg(:growlithe, :found)
```

A configured egg, via a hash:

```ruby
add_egg({ id: :charmander, nature: :bold, form: 0 })
```

Eggs are created at level 1 and, like `add_pokemon`, go to the party or to the PC when the team is full.

## Take a Pokémon back

The mirror operation removes a Pokémon from the party. Neither command shows a message, and both act on the party only.

`withdraw_pokemon` removes by species:

```ruby
withdraw_pokemon(id, counter = 1)
```

- `id` — the species to remove, as a db_symbol or numeric ID.
- `counter` — how many to remove. Optional, defaults to `1`.

```ruby
withdraw_pokemon(:pikachu)
```

This removes the first Pikachu in the party. `withdraw_pokemon_at` removes by position instead:

```ruby
withdraw_pokemon_at(index)
```

```ruby
withdraw_pokemon_at(0)
```

This removes the lead Pokémon, whatever its species.

## French aliases

PSDK was built by a French-speaking team, so every command above also answers to a French alias. Both names are the exact same method, use whichever reads better to you:

| English name | French alias |
| --- | --- |
| `add_pokemon` | `ajouter_pokemon`, `ajouter_stocker_pokemon` |
| `store_pokemon` | `stocker_pokemon` |
| `add_specific_pokemon` | `ajouter_pokemon_param` |
| `add_rename_pokemon` | `ajouter_renommer_pokemon` |
| `rename_pokemon` | `renommer_pokemon` |
| `add_egg` | `ajouter_oeuf` |
| `withdraw_pokemon` | `retirer_pokemon` |
| `withdraw_pokemon_at` | `retirer_pokemon_index` |

`receive_pokemon_sequence` has no French alias; use its English name in either locale.

## Conclusion

- Use `receive_pokemon_sequence` for a gift the player should notice: it shows the message and jingle and offers a nickname, exactly like receiving a starter.
- `add_pokemon` is the silent primitive underneath: it adds to the party, or to the PC when the team is full, and sets switch `9` (`SYS_Stored`) so you know where it landed.
- `store_pokemon` always sends the Pokémon to the PC; `add_specific_pokemon` builds it from a hash (form, gender, held item, and so on).
- `add_rename_pokemon` and `rename_pokemon` open the naming screen; `add_egg` gives an egg, `:received` or `:found`.
- `withdraw_pokemon` and `withdraw_pokemon_at` take a Pokémon back out of the party, and every command has a French alias.
