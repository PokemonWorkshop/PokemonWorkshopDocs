---
title: "Access game data"
slug: access-game-data
sidebar_position: 1
description: "This guide explains how to read game data (items, creatures, moves, types and more) from your PSDK scripts: the data accessors, the iterators, and the gotchas to know about unknown entries and creature forms."
---

This guide explains how to read game data (items, creatures, moves, types and more) from your PSDK scripts: the **data accessors**, the **iterators**, and the gotchas to know about unknown entries and creature forms.

## Where the game data lives

Everything you edit in **Pokémon Studio** (items, creatures, moves, zones...) is saved as data files under `Data/Studio/` in your project. When the game starts in debug mode and the compiled file `Data/Studio/psdk.dat` is missing, PSDK regenerates it from those files automatically. Your scripts never parse the files themselves: PSDK loads everything in memory and gives you accessor functions.

The accessors are defined in `scripts/3 Studio/001 Accessors.rb` (in the PSDK sources) as private methods of `Object`. In practice, this means you can call them from anywhere in your scripts, without any receiver or module prefix.

## How to read one entity

Each kind of entity has a `data_<kind>` function taking the **db_symbol** of the entry and returning a `Studio` data object:

| Function                              | Returns                |
| ------------------------------------- | ---------------------- |
| `data_ability(db_symbol)`              | `Studio::Ability`      |
| `data_creature(db_symbol)`             | `Studio::Creature`     |
| `data_creature_form(db_symbol, form)`  | `Studio::CreatureForm` |
| `data_dex(db_symbol)`                  | `Studio::Dex`          |
| `data_group(db_symbol)`                | `Studio::Group`        |
| `data_item(db_symbol)`                 | `Studio::Item`         |
| `data_map_link(db_symbol)`             | `Studio::MapLink`      |
| `data_move(db_symbol)`                 | `Studio::Move`         |
| `data_nature(db_symbol)`               | `Studio::Nature`       |
| `data_quest(db_symbol)`                | `Studio::Quest`        |
| `data_trainer(db_symbol)`              | `Studio::Trainer`      |
| `data_type(db_symbol)`                 | `Studio::Type`         |
| `data_world_map(db_symbol)`            | `Studio::WorldMap`     |
| `data_zone(db_symbol)`                 | `Studio::Zone`         |

`data_pokemon` also exists as an alias of `data_creature`.

The **db_symbol** is the stable identifier you see in Pokémon Studio (e.g. `:potion`, `:pikachu`). For example:

```ruby
item = data_item(:potion)
puts item.price

move = data_move(:thunderbolt)
puts move.power
```

You can pass an Integer **id** instead of a db_symbol; PSDK then searches the entry by its `id` property. Prefer db_symbols: they survive data reorganization, they are readable, and the id lookup scans the whole collection.

:::warning

An unknown entry does **not** return `nil`. The accessors fall back to a placeholder entity whose db_symbol is `:__undef__`. If you need to detect a missing entry, compare the db_symbol:

```ruby
item = data_item(:does_not_exist)
item.db_symbol # => :__undef__
```

:::

### Creatures and their forms

`Studio::Creature` only holds the basics shared by all forms (id, db_symbol, name, species, description) plus a `forms` array of `Studio::CreatureForm`, where the actual stats, types, abilities and move set live.

The `forms` array is **not indexed by form number**: each entry carries its own `form` property. To get a specific form, use `data_creature_form`, which finds the right entry and falls back to the first form when the requested one does not exist:

```ruby
creature = data_creature(:pikachu)
puts creature.name

form = data_creature_form(:pikachu, 0)
puts form.base_hp
```

## How to iterate through data

Every kind of entity also has an `each_data_<kind>` function: `each_data_ability`, `each_data_creature`, `each_data_dex`, `each_data_group`, `each_data_item`, `each_data_map_link`, `each_data_move`, `each_data_nature`, `each_data_quest`, `each_data_trainer`, `each_data_type`, `each_data_world_map` and `each_data_zone`.

They accept a block, or return an `Enumerator` when called without one. The Enumerator form is the most useful: it gives you the whole Ruby `Enumerable` toolbox (`select`, `map`, `count`, `find`...).

```ruby
# How many types does the game have?
type_count = each_data_type.size

# All the items that cost 200 or less
cheap_items = each_data_item.select { |item| item.price <= 200 }

# Print every creature name
each_data_creature { |creature| puts creature.name }
```

## Going further

The accessors return instances of the `Studio` data classes. To know which fields each class exposes, read their source in the PSDK scripts under `scripts/3 Studio/2 Data/` (one file per entity: `021 Item.rb`, `041 Creature.rb`, `042 CreatureForm.rb`, and so on). The classes are plain data holders with documented attributes, so the source reads like a field list.

:::note

If you are maintaining a project started before PSDK .25.14, you may still see `GameData::Item[...]`-style access in old scripts. The `GameData` module was replaced by the `Studio` classes and the accessors above; the data itself is the same, but most flags gained an `is_` prefix and most Integer references became Symbols.

:::

## Conclusion

- Game data is edited in Pokémon Studio and read from scripts through `data_<kind>(db_symbol)` accessors, callable from anywhere.
- Prefer **db_symbols** over Integer ids: stable, readable and faster to look up.
- An unknown entry returns the `:__undef__` placeholder entity, never `nil`.
- Creature data is split: `Studio::Creature` for the basics, `Studio::CreatureForm` (via `data_creature_form`) for stats, types and moves. Forms are identified by their `form` property, not by their position in the array.
- `each_data_<kind>` iterates over a whole collection and returns an `Enumerator` without a block, ready for `select`, `map` or `count`.
- The field list of every `Studio` class is in the PSDK sources under `scripts/3 Studio/2 Data/`.
