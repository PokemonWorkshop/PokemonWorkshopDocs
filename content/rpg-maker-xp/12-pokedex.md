---
title: "Manage the Pokédex"
slug: manage-the-pokedex
sidebar_position: 12
description: "The Pokédex is part of the game state in PSDK, reached through game_state.pokedex. This guide covers giving the player the Pokédex, reading the seen and caught counters, the difference between the regional and national dex, switching between several dexes, and checking, showing or marking a specific species from an event."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

The Pokédex is part of the **game state** in PSDK, reached through `game_state.pokedex`. This guide covers giving the player the Pokédex, reading the seen and caught counters, the difference between the regional and national dex, switching between several dexes, and checking, showing or marking a specific species from an event.

The Pokédex object lives on the game state. You reach it through the global `game_state` accessor, so every command on this page is written `game_state.pokedex.something(...)`, typed in an event's **Script** command. If the Script command is new to you, start with [Use the Interpreter in an event](/rpg-maker-xp/using-the-interpreter-in-an-event).

Several of these operations also have a fully event-based equivalent, through the switches and variables PSDK reserves for the dex; each is given where it applies. The same Pokédex is also reachable through the older `$pokedex` global you will meet in existing scripts.

## Give the player the Pokédex

The Pokédex is disabled at the start of a new game. Enable it when the player receives it, usually from the NPC who hands it over:

```ruby
game_state.pokedex.enable
```

This turns on system **switch 100**, the flag PSDK uses to know the player owns the dex. From then on the player can open the Pokédex screen and their encounters are tracked normally.

To take it back, disable it:

```ruby
game_state.pokedex.disable
```

To read whether the player has it, `enabled?` returns `true` or `false`, so it belongs in the **Script** tab of a **Conditional Branch**:

```ruby
game_state.pokedex.enabled?
```

Every one of these has an event equivalent: turning **switch 100** on enables the dex, turning it off disables it, and checking switch 100 tells you the state, no Script needed.

## Check a specific species

:::note[Naming a species]

Every command that takes a species accepts either its **db_symbol**, the text identifier of a species such as `:pikachu`, or a numeric ID. A numeric ID is the **National Pokédex number** (the species' database ID), never the position shown in a regional dex.

:::

`pokemon_seen?` and `pokemon_caught?` answer whether the player has ever encountered or captured a given species. They return `true` or `false`, for the **Script** tab of a **Conditional Branch**:

```ruby
# Has the player seen a Pikachu?
game_state.pokedex.pokemon_seen?(:pikachu)

# Has the player caught one?
game_state.pokedex.pokemon_caught?(:pikachu)
```

Both accept an optional second argument, a **form** number, to test one specific form instead of the species as a whole (`0` is the base form):

```ruby
# Has the player seen form 2 of Rotom?
game_state.pokedex.pokemon_seen?(:rotom, 2)
```

This is the workhorse for reactive events: an NPC who comments on what the player has caught, a route that opens once a species is registered, and so on. A full flow, an NPC gives the dex and a later gate checks a capture:

```ruby
# In the NPC event that hands over the Pokédex
game_state.pokedex.enable

# Later, in the Script tab of a Conditional Branch guarding a route
game_state.pokedex.pokemon_caught?(:pikachu)
```

The first event switches the dex on; the second lets the player through only once they have caught a Pikachu.

## Read the counters

The Pokédex tracks how many species the player has seen and caught. `pokemon_seen` and `pokemon_captured` return those totals:

```ruby
game_state.pokedex.pokemon_seen
game_state.pokedex.pokemon_captured
```

Both return an `Integer`, so you can store one in a variable or test it, for example a Professor who rewards the player once they have caught fifty species:

```ruby
# Script tab of a Conditional Branch
game_state.pokedex.pokemon_captured >= 50
```

PSDK also mirrors the two totals in system **variable 2** (seen) and **variable 3** (caught), kept up to date automatically, so a plain **Control Variables** command reads them with no Script.

These totals cover every species seen or caught across the whole game. With the standard national dex, which lists every species, they are exactly what the national dex shows: `pokemon_seen` matches `variant_creature_seen(:national)` and `pokemon_captured` matches `variant_creature_caught(:national)`.

The number on the **in-game Pokédex screen** is not always that total: it counts only the dex currently displayed (its *variant*, the db_symbol of the dex on screen). A regional dex lists one region, so it shows fewer. Read the on-screen count with `variant_creature_seen` and `variant_creature_caught`:

```ruby
game_state.pokedex.variant_creature_seen             # seen, for the dex currently shown
game_state.pokedex.variant_creature_caught           # caught, for the dex currently shown
game_state.pokedex.variant_creature_seen(:regional)  # seen, for a specific dex
```

Called with no argument they count the dex currently displayed; pass a dex db_symbol to count another one.

| What you read                                           | What it counts                                     |
| ------------------------------------------------------- | -------------------------------------------------- |
| `pokemon_seen` / `pokemon_captured` (variables 2 and 3) | the national total, unchanged by the displayed dex |
| `variant_creature_seen` / `variant_creature_caught`     | only the dex currently shown                       |

:::note

These carry the `pokemon_` prefix as an alias. PSDK's canonical names are now `creature_seen`, `creature_caught`, `creature_seen?` and `creature_caught?`; the `pokemon_` forms call the same code and are kept because they read better in a Pokémon game. Methods with no Pokémon-specific alias (`mark_seen`, `mark_captured`, `variant`) are written as-is.

:::

## The regional and national dex

So far the player has browsed the **regional dex**: it lists only the species of the current region, and only those can be recorded. **National mode** unlocks every species, so anything can be marked seen or caught, and the national dex lists them all.

```ruby
game_state.pokedex.set_national(true)   # switch to national mode
game_state.pokedex.set_national(false)  # back to regional
game_state.pokedex.national?            # true when national mode is on
```

National mode is stored in system **switch 99**, so an event can toggle it by turning switch 99 on or off, and read it the same way.

Because a regional dex lists only its region, the same save shows a smaller on-screen count there than on the national dex. Switching to national mode adds nothing to the player's records; it only widens what the screen counts and what can be recorded.

## Switch the displayed dex

A project can define several dexes in Pokémon Studio, each with its own db_symbol, for example `:regional`, `:national`, and any custom dex you create. The Pokédex remembers which one it currently shows:

```ruby
game_state.pokedex.variant              # the db_symbol of the dex currently shown
game_state.pokedex.variant = :national  # show the national dex from now on
game_state.pokedex.variant = :regional  # back to the regional dex
```

Assigning a dex the project does not define is ignored, so the value always points at a real dex. `set_national(true)` is a shortcut that switches to the `:national` dex **and** turns national mode on; use `variant =` on its own when you only want to change which list is shown, for instance to display the regional dex of another area.

:::warning[Leaving national mode]

To go from the national dex back to a regional one, call `set_national(false)` **before** changing the variant:

```ruby
game_state.pokedex.set_national(false)  # clears switch 99 and reverts to a regional dex
game_state.pokedex.variant = :regional  # then pick the exact dex to show
```

`variant = :regional` on its own does **not** turn national mode off: switch 99 stays `true`, and you end up displaying a regional dex while every species is still treated as unlocked, a mismatched state to avoid. Only `set_national(false)` clears national mode, so it always comes first.

:::

## Mark a species seen or caught

When a wild creature appears in battle and when the player catches it, PSDK records it for you through `mark_seen` and `mark_captured`. You rarely need them by hand, but they are there for scenario control, such as a scene that reveals a legendary before any battle:

```ruby
game_state.pokedex.mark_seen(:mew)      # record Mew as seen
game_state.pokedex.mark_captured(:mew)  # record Mew as caught
```

`mark_seen` takes an optional form and a forced flag:

```ruby
game_state.pokedex.mark_seen(db_symbol, form = 0, forced: false)
```

- `db_symbol` — the species, as a db_symbol or National Pokédex number.
- `form` — the form to record. Optional, `0` is the base form.
- `forced` — bypass the two checks below. Optional, `false` by default.

By default `mark_seen` records nothing in two cases: when the Pokédex is disabled, and when the species is not part of the dex variant on screen (a regional dex only accepts its own species). `forced: true` overrides both:

```ruby
game_state.pokedex.mark_seen(:mew, 0, forced: true)
```

Because the record is kept globally, a species forced in this way still counts on every dex that lists it and on the national total, even though the dex currently shown would not have accepted it on its own. National mode lifts the variant check too, but not the disabled-dex one, so `forced: true` is the way to cover both. When PSDK marks battles and catches itself, it passes the creature's own form (`pokemon.form`) rather than `0`, so a species is recorded in the exact form it was met.

`mark_captured` is stricter than `mark_seen` here: it has no `forced` option, and it still refuses a species outside the current dex variant (though it does not need the dex to be enabled). To record a capture for a species absent from the regional dex, a legendary for instance, turn national mode on first:

```ruby
game_state.pokedex.set_national(true)
game_state.pokedex.mark_captured(:mew)
```

To undo a record, `unmark_seen` and `unmark_captured` take the species back out:

```ruby
game_state.pokedex.unmark_seen(:mew)
game_state.pokedex.unmark_captured(:mew)
```

The common case is a creature caught before the player receives the Pokédex (see [Give a Pokémon to the player](/rpg-maker-xp/give-a-pokemon)). PSDK still marks it captured, as long as it belongs to the current dex; call `unmark_captured` (and `unmark_seen`) if the story needs that catch to stay off the record.

## Show a creature's dex page

`show_pokemon` opens the Pokédex straight to one creature's page. Unlike the commands above, it is an [Interpreter method](/rpg-maker-xp/using-the-interpreter-in-an-event): you call it with no prefix.

```ruby
show_pokemon(pokemon_id, form = 0)
```

- `pokemon_id` — the creature to show: a db_symbol, a National Pokédex number, or a live Pokémon object (which keeps that individual's shiny status).
- `form` — the form to display. Optional, `0` is the base form; ignored for a live Pokémon, which uses its own form.

The simplest call is just the species:

```ruby
show_pokemon(:pikachu)
```

What the page shows follows how far the player has gotten with that species:

- **Never seen** — the page comes up empty: the sprite and name are hidden and no data is shown.
- **Seen but not caught** — the sprite, the name and the cry appear, but the details (species, form name, weight, height, types) and the flavor description stay hidden.
- **Caught** — the full entry: sprite, name, details and description.

So to reveal a creature the player has not encountered yet, a legendary shown during a cutscene for example, mark it seen first, otherwise the page opens empty:

```ruby
game_state.pokedex.mark_seen(:mew, 0, forced: true)
show_pokemon(:mew)
```

Here `forced: true` gets past both a disabled dex and a species that is not in the current dex variant (see the previous section).

## Conclusion

- The Pokédex is reached through `game_state.pokedex`; enable it with `enable` (system switch 100) before anything is tracked.
- Test whether the player has seen or caught a species with `pokemon_seen?` / `pokemon_caught?` in a Conditional Branch, the go-to for reactive events.
- `pokemon_seen` / `pokemon_captured` (variables 2 and 3) hold the national total; `variant_creature_seen` / `variant_creature_caught` give the per-dex count shown on screen.
- National mode (`set_national(true)`, switch 99) unlocks every species; `variant =` switches which dex list is shown, and `set_national(false)` must come before it when leaving national mode.
- `mark_seen` records a species (`forced: true` bypasses a disabled dex or the variant limit); `mark_captured` has no `forced` and still needs the species in the current dex or national mode. `unmark_seen` / `unmark_captured` undo a record.
- Open a creature's page with the Interpreter command `show_pokemon`; mark it seen first if it might be unknown, or the page opens empty.
- A numeric ID always means the National Pokédex number, never the position shown in a regional dex.
