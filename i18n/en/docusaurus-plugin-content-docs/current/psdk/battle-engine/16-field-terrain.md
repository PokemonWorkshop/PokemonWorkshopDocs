---
title: "How to create a field terrain in PSDK?"
slug: how-to-create-a-field-terrain
sidebar_position: 16
description: "This guide explains how to add a new field terrain to the battle system, create its effects, add the associated text messages, and trigger it via a move or an effect."
---

## Principle

Adding a field terrain involves four steps:

- **Add the text messages**: the messages displayed on activation and end of the terrain.
- **Create the effect class**: the mechanical behavior of the terrain (power boost, status prevention, etc.).
- **Register the terrain in the handler**: link the terrain symbol to the messages.
- **Trigger it**: allow its activation via a move or an effect.

## Adding text messages

Terrain messages are stored in file 100060 in Studio. Two messages need to be added:

- An **activation** message (when the terrain appears) -- e.g., *"An electric current runs across the battlefield!"*
- An **end** message (when the terrain fades) -- e.g., *"The electricity disappeared from the battlefield."*

Note the line numbers of these messages in Studio, they will be needed for registration in the handler.

Existing terrains use these line numbers in file 60:

| Terrain          | Activation | End |
| ---------------- | ---------- | --- |
| Electric Terrain | 226        | 227 |
| Grassy Terrain   | 222        | 223 |
| Misty Terrain    | 224        | 225 |
| Psychic Terrain  | 346        | 347 |

## Creating the effect class

Terrains inherit from `Battle::Effects::FieldTerrain` and are placed in the `5 Battle/06 Effects/07 Field Terrain Effects/` folder.

Here is the minimum required for a working terrain:

```ruby
module Battle
  module Effects
    class FieldTerrain
      class Void < FieldTerrain
        def on_end_turn_event(logic, scene, battlers)
          @internal_counter -= 1
          logic.fterrain_change_handler.fterrain_change(:none) if @internal_counter <= 0
        end
      end
      register(:void_terrain, Void)
    end
  end
end
```

The strict minimum is:

- `on_end_turn_event`: manages the terrain's duration. `@internal_counter` counts down remaining turns. When it reaches 0, the terrain is removed by setting it to `:none`. Without this method, the terrain lasts indefinitely.
- `register(:void_terrain, Void)`: ties the symbol to the terrain via the factory pattern. Without this call, the terrain cannot be instantiated.

Between these two elements, you add the desired behavior by overriding `EffectBase` hooks. For example, Electric Terrain overrides `on_status_prevention` to prevent sleep and `mod1_multiplier` to boost Electric-type moves. Existing terrains in `5 Battle/06 Effects/07 Field Terrain Effects/` show the different possibilities.

### `affected_by_terrain?`

When adding terrain-related behavior, you must check `affected_by_terrain?` on the target or user Pokemon. This method returns `true` if the Pokemon is grounded. A Pokemon is **not** affected if it is Flying type, has the Levitate ability, is under the effect of Magnet Rise or Telekinesis, or holds an Air Balloon.

### Available hooks

Terrains can override any hook from `EffectBase`. The full list can be found in `5 Battle/06 Effects/100 EffectBase.rb`.

## Registering the terrain in the handler

The `FTerrainChangeHandler` manages terrain application and messages. The `FTERRAIN_SYM_TO_MSG` hash contains the mapping between terrain symbols and message line numbers. It is not frozen, so you can simply add entries:

```ruby
module Battle
  module Logic
    class FTerrainChangeHandler
      FTERRAIN_SYM_TO_MSG[:void_terrain] = 400
      FTERRAIN_SYM_TO_MSG[:none][:void_terrain] = 401
    end
  end
end
```

## Triggering the terrain via a move

### Configure the move in Studio

Create the move in Pokemon Studio with these properties:

- **Procedure**: `s_terrain`
- **Category**: Status
- **PP**: 10 (typical)
- **Target**: All Pokemon

### Register the move in TerrainMove

```ruby
module Battle
  class Move
    class TerrainMove
      TERRAIN_MOVES[:void_terrain] = :void_terrain
    end
  end
end
```

The system uses `TERRAIN_MOVES[db_symbol]` to find which terrain to apply. It also automatically checks whether the user holds a `:terrain_extender` item to extend the duration from 5 to 8 turns.

## Triggering the terrain via an effect

```ruby
module Battle
  module Effects
    class Ability
      class VoidSurge < ElectricSurge
        private

        def terrain_type
          return :void_terrain
        end
      end
      register(:void_surge, VoidSurge)
    end
  end
end
```

The effect inherits from `ElectricSurge` (or any existing Surge) and only overrides `terrain_type`. The system automatically handles the `:terrain_extender` item check for duration.

Reference examples can be found in `050 FieldTerrain Setting Abilities.rb`.

## Adding a terrain query method

```ruby
module Battle
  module Effects
    class FieldTerrain
      def void?
        return @db_symbol == :void_terrain
      end
    end
  end
end
```

## File summary

| File                                              | Action                                                     |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Studio -> Battle System (file 100060)             | Add activation and end messages                            |
| `my-project/scripts/001 FTerrainChangeHandler.rb` | Register messages in the handler                           |
| `my-project/scripts/002 FieldTerrain.rb`          | Create the terrain effect class                            |
| `my-project/scripts/003 TerrainMove.rb`           | Link the move to the terrain (if move)                     |
| `my-project/scripts/004 Ability.rb`               | Create the effect (if effect)                              |
| Studio -> Moves                                   | Create the move with `s_terrain` procedure (if move)       |

## Conclusion

- First add the **messages** in Studio (file 100060), as they are needed for the handler.
- Create the **effect class** by inheriting from `FieldTerrain` with at minimum `on_end_turn_event` and `register`.
- Add entries to `FTERRAIN_SYM_TO_MSG` to link the messages to the terrain.
- Add the entry to `TERRAIN_MOVES` for moves, or inherit from `ElectricSurge` for effects.
- Always check `affected_by_terrain?` before applying an effect to a Pokemon.
- Existing terrains in `5 Battle/06 Effects/07 Field Terrain Effects/` serve as reference for possible behaviors.
