---
title: "Create a custom System Tag"
slug: create-a-custom-system-tag
sidebar_position: 3
description: "PSDK lets you teach the map engine a brand-new System Tag, a tile of your own with its own wild encounters, battle background, terrain-based move behaviour and walking particles. This guide walks through the five engine hooks a new tag plugs into, writes every method override as a prepend, and shows where to paint the finished tag in Tiled."
---

PSDK lets you teach the map engine a brand-new System Tag, a tile of your own with its own wild encounters, battle background, terrain-based move behaviour and walking particles. This guide walks through the five engine hooks a new tag plugs into, writes every method override as a prepend, and shows where to paint the finished tag in Tiled.

## The problem: a terrain the engine doesn't know yet

The built-in System Tags cover the classic terrains: grass, cave, sea, ice, sand and so on. Each one already knows how to start its own wild battles, pick a battle background and spray the right walking particle. But the moment you want something the base set does not have, say a glowing puddle that triggers its own encounter table and shows a custom battleback, no existing tag fits.

A **custom System Tag** is how you add that terrain without forking the engine. You declare one new constant, then plug it into the handful of engine methods that already branch on a tag, each time adding your case and falling back to the original behaviour with `super`. The result behaves like a first-class tag: you paint it in Tiled and the engine reacts to it on every step.

This guide assumes you already know how a tag is read and stored. If not, start with [Understanding System Tags](/psdk/core-systems/system-tags). Every method override below follows the [monkey-patching](/getting-started/monkey-patching-in-psdk) convention, a `prepend` module calling `super`, never an `alias`.

## What a custom tag plugs into

A tag is not a single switch: each behaviour lives in a different part of the engine. Adding a tag means touching up to five of them, the last one optional.

| Step | Engine hook | What it controls |
| --- | --- | --- |
| 1 | `GameData::SystemTags.system_tag_db_symbol` | The readable symbol returned for the tile. |
| 2 | `PFM::Environment#get_zone_type` / `#convert_zone_type` | The zone type, which drives wild encounters. |
| 3 | `Battle::Logic::BattleInfo::BACKGROUND_NAMES` | The battle background shown when a fight starts on the tile. |
| 4 | `Game_Map::TERRAIN_TAGS_TABLE` | The location used by `LocationBased` moves. |
| 5 | `Game_Character::PARTICLES_METHODS` (optional) | The particle spawned when a character walks on the tile. |

The five snippets can live in separate script files or be merged into one, as long as the constant from step 1 is defined before the later steps reference it. Where these scripts go in a PSDK project is covered in [monkey-patching](/getting-started/monkey-patching-in-psdk).

Throughout this guide the example tag is called **CustomPuddle**, with the symbol `:custom_puddle`.

## 1. Declare the constant and its symbol

A tag constant is just an id produced by the `gen(x, y)` helper, where `(x, y)` is the tile's position on the System Tags tileset. Pick a cell that no existing tag uses (the built-in tags stop at row 7, so any cell below is free):

```ruby
module GameData
  module SystemTags
    # Column 0, row 12 of the System Tags tileset, a free cell
    CustomPuddle = gen 0, 12
  end
end
```

Next, give the tag a readable symbol so the rest of the engine, and Pokémon Studio, can refer to it by name. The engine resolves a tag to its symbol in `GameData::SystemTags.system_tag_db_symbol`. Override it to return your symbol for the new tag and defer to the original for everything else. By convention a custom symbol starts with `custom_`:

```ruby
module GameData
  module SystemTags
    # Adds the symbol of the custom tag without touching the engine method
    module CustomPuddleSymbol
      def system_tag_db_symbol(system_tag)
        return :custom_puddle if system_tag == CustomPuddle

        super
      end
    end
    # system_tag_db_symbol is a module-level method (module_function),
    # so the override is prepended onto the module's singleton class.
    singleton_class.prepend(CustomPuddleSymbol)
  end
end
```

The `super` call keeps every existing tag working: only `CustomPuddle` is handled here, anything else falls through to the engine's own `case`.

## 2. Give the tag a zone type

A **zone type** is the integer the engine uses to classify the ground the player stands on. It is what decides which wild encounter list applies and, in the next step, which battle background to load. Two methods produce it: `get_zone_type`, which reads the player's current tile, and `convert_zone_type`, which maps an arbitrary tag to the same value. Both live on `PFM::Environment`.

The built-in zone types run from `0` (building) to `10` (ice), so the next free value is `11`. Override both methods to return it for the custom tag:

```ruby
module PFM
  class Environment
    module CustomPuddleZone
      def get_zone_type(ice_prio = false)
        return 11 if custom_puddle?

        super
      end

      def convert_zone_type(system_tag)
        return 11 if system_tag == GameData::SystemTags::CustomPuddle

        super
      end

      private

      # Is the player standing on the custom puddle tag?
      # @return [Boolean]
      def custom_puddle?
        @game_state.game_player.system_tag == GameData::SystemTags::CustomPuddle
      end
    end
    prepend CustomPuddleZone
  end
end
```

Two details matter here. Calling `super` with no arguments forwards `ice_prio` untouched, so the original priority logic keeps working for the built-in tags. And `11` is simply the next free value in this version of PSDK: if a future update adds new terrains, this number, and the background index in the next step, must move up accordingly.

## 3. Choose the battle background

Without this step a battle started on the tile renders on a black background. The engine picks the image from `BACKGROUND_NAMES`, an array of file names indexed by zone type, in `Battle::Logic::BattleInfo`. Because the engine shifts the index by one for any non-building zone (`zone_type + 1`), zone type `11` reads index `12`. The array currently holds twelve entries (indices `0` to `11`), so a single `push` appends your background at exactly index `12`:

```ruby
module Battle
  class Logic
    class BattleInfo
      # zone type 11 reads index 12 after the engine's +1 shift,
      # so this must be the entry pushed after the last built-in one
      BACKGROUND_NAMES.push('back_custom_puddle')
    end
  end
end
```

The pushed string is the name of an image in your project's `graphics/battlebacks` folder, here `back_custom_puddle`. The ordering is load-bearing: the new name has to land at the index your zone type points to, so push it once, after the engine has built the default array, and do not insert it elsewhere.

## 4. Map the tag for LocationBased moves

Some moves change their behaviour with the ground they are used on: their `LocationBased` logic reads a **location** symbol rather than the raw tag. That mapping lives in `Game_Map::TERRAIN_TAGS_TABLE`. Add an entry so the engine treats your tile like a known location, here shallow water:

```ruby
class Game_Map
  # LocationBased moves treat the custom puddle like shallow water
  TERRAIN_TAGS_TABLE[GameData::SystemTags::CustomPuddle] = :shallow_water
end
```

Reuse whichever existing location symbol fits the terrain you are modelling; `:shallow_water` is one of several the engine already understands.

## 5. Add walking particles (optional)

This step is purely cosmetic: it spawns a particle when a character steps on the tile. Skip it entirely if you do not want one. The engine looks up `PARTICLES_METHODS`, a hash keyed by tag, to know which method to call, so add your tag and define the matching method. The method asks `Yuki::Particles` to spawn a particle identified by your symbol:

```ruby
class Game_Character
  PARTICLES_METHODS[GameData::SystemTags::CustomPuddle] = :particle_push_custom_puddle

  # Spawn the custom puddle particle when a character steps on the tag
  def particle_push_custom_puddle
    Yuki::Particles.add_particle(self, :custom_puddle)
  end
end
```

The particle itself, the `:custom_puddle` animation, is defined in `Data/Animations/Particles.rb`. Open that file, scroll to the bottom just above the `save,` line, and add your animation next to the many existing examples. After editing it, regenerate the compiled particle data from a terminal opened in `Data/Animations`:

```bash
ruby Particles.rb
```

## Paint the tag in Tiled

The constant only becomes useful once the tag is painted on a map. System Tags are painted in Tiled on the `systemtags` layer, from the System Tags tileset image at `Data/Tiled/Assets/prio_w.png`. Add your tile on the first free cell of that image, matching the `(x, y)` position you passed to `gen`, then paint it wherever the terrain should apply. How the `systemtags` layer works is detailed in [Understanding System Tags](/psdk/core-systems/system-tags).

## Conclusion

- A **custom System Tag** is a constant produced by `gen(x, y)` that you plug into the engine methods already branching on a tag.
- Every method override is a `prepend` module that handles your tag and calls `super` for the rest, never an `alias`.
- The five hooks are: the symbol (`system_tag_db_symbol`), the zone type (`get_zone_type` / `convert_zone_type`), the battle background (`BACKGROUND_NAMES`), the `LocationBased` location (`TERRAIN_TAGS_TABLE`) and, optionally, the particle (`PARTICLES_METHODS`).
- The zone type and the background index are version-specific numbers: `11` and index `12` are the next free slots today, and shift up if PSDK adds terrains.
- Reuse an existing location symbol such as `:shallow_water` for `LocationBased` moves rather than inventing one.
- Finish by painting the tile on the `systemtags` layer from `Data/Tiled/Assets/prio_w.png`.
