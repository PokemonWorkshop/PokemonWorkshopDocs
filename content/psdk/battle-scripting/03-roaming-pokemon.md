---
title: "Add a roaming Pokémon"
slug: how-to-add-roaming-pokemon
sidebar_position: 3
description: "This guide explains how to add a roaming Pokémon: a wild Pokémon that wanders across several maps, appears at random, and tries to flee on the first turn of battle."
---

This guide explains how to add a **roaming Pokémon**: a wild Pokémon that wanders across several maps, appears at random, and tries to flee on the first turn of battle.

## Principle

A roaming Pokémon reproduces the behaviour of legendaries like **Raikou** and **Entei** in the official games: instead of living in a fixed encounter group, it moves on its own between a set of maps. The player never knows exactly where it is, can track it on the world map, and when they finally cross its path it almost always escapes on the first turn.

PSDK handles this through the wild battle manager, accessible from `$wild_battle`. A roaming Pokémon is registered once, then the engine takes care of the rest:

- It relocates the Pokémon between maps according to a movement pattern.
- It rolls an encounter check on every step while the player stands where the Pokémon currently is.
- It makes the Pokémon try to flee in battle with a very low priority (`-7`, the Gen 5 mechanic), so the player gets one action before it escapes on the first turn.
- It removes the Pokémon automatically once it has been defeated.

To capture a roaming Pokémon, the player has to make that single action count: throw a Poké Ball on the first turn, or use a trapping effect that prevents it from fleeing.

## Adding a roaming Pokémon

To register a roaming Pokémon, call `add_roaming_pokemon` on `$wild_battle`. A good place to do this is the event or the script that introduces the Pokémon in your scenario (for example after a cutscene).

```ruby
# Add a roaming Pokemon
# @param chance [Integer] the chance divider to see the Pokemon
# @param proc_id [Integer] ID of the Wild_RoamingInfo::RoamingProcs
# @param pokemon_hash [Hash, PFM::Pokemon] hash to generate the mon (cf. PFM::Pokemon#generate_from_hash), or the Pokemon
# @return [PFM::Pokemon] the generated roaming Pokemon
$wild_battle.add_roaming_pokemon(50, 1, { id: :raikou, level: 40 })
```

- `chance` is a **divider**: on each step where the player stands where the Pokémon currently is, the engine rolls `rand(chance) == 0`. A value of `50` means roughly one chance in fifty per step. The smaller the value, the more often the Pokémon appears.
- `proc_id` is the index of the movement pattern in `RoamingProcs` (see the next section). Pattern `1` is the built-in multi-map roaming.
- `pokemon_hash` is the same hash used by `PFM::Pokemon.generate_from_hash`. The common keys are `:id` (the Pokémon db_symbol), `:level`, and `:shiny`. You can also pass an existing `PFM::Pokemon` instance directly.

Once this call has run, the Pokémon is active: PSDK tests on every step whether it should appear, with nothing else to enable.

The method returns the generated `PFM::Pokemon`, so you can keep a reference to it if you need to inspect or remove it later.

```ruby
roaming_raikou = $wild_battle.add_roaming_pokemon(50, 1, { id: :raikou, level: 40, shiny: true })
```

## Defining where it roams

The `proc_id` you pass to `add_roaming_pokemon` selects a **movement pattern**. A pattern is a short block of code, re-run as the player walks around, that answers a single question: *where is the Pokémon right now?* It answers by filling in three values.

| Value       | What it means                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `map_id`    | The ID of the map the Pokémon is currently on, the same map number shown in RPG Maker XP and Pokémon Studio. |
| `zone_type` | The kind of terrain the encounter happens on. `1` is tall grass, the same as a normal wild encounter.        |
| `tag`       | The terrain tag the player must be standing on, as defined on the tileset. `0` is the default.               |

The `zone_type` values are: `0` regular ground, `1` tall grass, `2` very tall grass, `3` cave, `4` mountain, `5` sand, `6` pond, `7` sea, `8` underwater, `9` snow, `10` ice.

You often do not need to write a pattern yourself. PSDK already ships two:

- Pattern `0` keeps the Pokémon on a single fixed spot.
- Pattern `1` makes it roam between two maps in the tall grass, the classic legendary-beast behaviour.

For a standard roaming Pokémon, passing `1` as the `proc_id` is enough. Write your own pattern only when you want it to roam on specific maps of your game.

### Writing your own pattern

Add a new proc to `PFM::Wild_RoamingInfo::RoamingProcs`. The simplest one keeps the Pokémon on a single map, in the tall grass:

```ruby
# Always on map 12, in the tall grass
::PFM::Wild_RoamingInfo::RoamingProcs << proc do |infos|
  infos.map_id = 12
  infos.zone_type = 1 # tall grass
  infos.tag = 0
end
```

To make it actually roam, give it a list of maps and move it to a new one each time the player has met it:

```ruby
# Roam between maps 10, 11 and 12, in the tall grass
::PFM::Wild_RoamingInfo::RoamingProcs << proc do |infos|
  maps = [10, 11, 12]
  # Relocate when the Pokemon has not been placed yet, or once the player has met it on its current map
  if infos.map_id == -1 || (infos.map_id == $game_map.map_id && infos.spotted)
    infos.map_id = (maps - [infos.map_id]).sample
    infos.spotted = false
  end
  infos.zone_type = 1 # tall grass
  infos.tag = 0
end
```

Reading the relocation rule line by line:

- `infos.map_id == -1` is the value a fresh roaming Pokémon starts with, so the very first run drops it onto one of the maps at random.
- `infos.spotted` turns `true` once the player has met the Pokémon in battle or opened the world map. The Pokémon therefore stays put until the player finds it, then moves away.
- `(maps - [infos.map_id]).sample` picks one of the maps other than the current one, so the location always changes.

The new pattern is added at the end of the array, so its `proc_id` is the next free index: with the two built-in patterns (`0` and `1`), the first one you add is `2`. That is the number to pass to `add_roaming_pokemon`.

Adding a proc this way is a textbook case of monkey-patching, the standard way to extend PSDK. Register it in a dedicated script so it is loaded before the Pokémon is added.

## Managing roaming Pokémon

The manager exposes a few helpers to work with the roaming Pokémon currently registered.

Test whether a given Pokémon is roaming. This is mostly used internally in battle to enable the flee behaviour, but it is available to scripts too:

```ruby
$wild_battle.roaming?(roaming_raikou) # => true
```

Remove a roaming Pokémon, for instance when the player captures it or when your scenario ends its chase:

```ruby
$wild_battle.remove_roaming_pokemon(roaming_raikou)
```

Both defeated and captured roaming Pokémon are removed **automatically**: the manager drops every entry whose Pokémon is dead, and a successful capture removes it too. You only need `remove_roaming_pokemon` for the cases the engine cannot guess, like ending the chase from a story event.

Iterate over every roaming Pokémon, for example to check their state or display them:

```ruby
$wild_battle.each_roaming_pokemon do |pokemon|
  log_info("Roaming: #{pokemon.name}")
end
```

Finally, roaming Pokémon integrate with the **world map**. When the player opens it, the engine calls `on_map_viewed`, which marks every roaming Pokémon as spotted. This is what lets the world map show their last known position and, combined with the `infos.spotted` check above, triggers their next move.

Roaming Pokémon are part of the save file: one still roaming when the player saves is restored at its last position on load. Their position is also recomputed each time the player changes map, which is when a spotted Pokémon moves on.

## Conclusion

- Register a roaming Pokémon with `$wild_battle.add_roaming_pokemon(chance, proc_id, pokemon_hash)`.
- `chance` is an encounter divider, `proc_id` selects a movement pattern, and `pokemon_hash` follows `PFM::Pokemon.generate_from_hash`.
- Define where the Pokémon wanders by adding a proc to `PFM::Wild_RoamingInfo::RoamingProcs`; its index becomes the `proc_id`.
- In battle, the Pokémon automatically tries to flee with a very low priority (`-7`), so it escapes on the first turn right after the player has acted.
- Use `roaming?`, `each_roaming_pokemon` and `remove_roaming_pokemon` to manage them; defeated roaming Pokémon are removed automatically.
