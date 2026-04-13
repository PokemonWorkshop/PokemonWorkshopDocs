---
title: "How to create a weather in PSDK?"
slug: how-to-create-a-weather
sidebar_position: 15
description: "This guide explains how to add a new weather to the battle system, create its effects, add the associated text messages, and trigger it via a move or an effect."
---

## Principle

Adding a weather involves four steps:

- **Add the text messages**: the messages displayed on activation, end, and each turn.
- **Create the effect class**: the mechanical behavior of the weather (type multipliers, per-turn damage, etc.).
- **Register the weather in the handler**: link the weather symbol to the messages.
- **Trigger it**: allow its activation via a move or an effect.

## Adding text messages

Weather messages are stored in file 100018 in Pokémon Studio. Up to three messages need to be added:

- An **activation** message (when the weather appears) -- e.g., _"It started to rain!"_
- An **end** message (when the weather fades) -- e.g., _"The rain stopped."_
- A **turn** message (displayed at the end of each turn, optional) -- e.g., _"The sandstorm rages."_

Note the line numbers of these messages in Pokémon Studio, they will be needed for registration in the handler.

Existing weathers use these line numbers in file 18:

| Weather   | Activation | End | Turn |
| --------- | ---------- | --- | ---- |
| Rain      | 88         | 93  | --   |
| Sunny     | 87         | 92  | --   |
| Sandstorm | 89         | 94  | 98   |
| Hail      | 90         | 95  | 99   |
| Fog       | 91         | 96  | --   |
| Snow      | 287        | 288 | 289  |

## Creating the effect class

Weathers inherit from `Battle::Effects::Weather` and are placed in the `5 Battle/06 Effects/06 Weather Effects/` folder.

Here is the minimum required for a working weather:

```ruby
module Battle
  module Effects
    class Weather
      class VoidWeather < Weather
        def on_end_turn_event(logic, scene, battlers)
          if $env.decrease_weather_duration
            scene.display_message_and_wait(parse_text(id_file, id_text))
            logic.weather_change_handler.weather_change(:none, 0)
          end
        end
      end
      register(:void_weather, VoidWeather)
    end
  end
end
```

The strict minimum is:

- `on_end_turn_event`: manages the weather's duration. `$env.decrease_weather_duration` counts down turns and the weather expires when it returns true. Without this method, the weather lasts indefinitely.
- `register(:void_weather, VoidWeather)`: ties the symbol to the weather via the factory pattern. Without this call, the weather cannot be instantiated.

Between these two elements, you add the desired behavior by overriding `EffectBase` hooks. For example, Rain overrides `mod1_multiplier` to boost Water moves (x1.5) and weaken Fire moves (x0.5). Existing weathers in `5 Battle/06 Effects/06 Weather Effects/` show the different possibilities.

### Available hooks

Weathers can override any hook from `EffectBase`. The full list can be found in `5 Battle/06 Effects/100 EffectBase.rb`.

## Registering the weather in the handler

The `WeatherChangeHandler` manages weather application and messages. Two constants need to be updated.

### Adding the symbol to WEATHER_NAMES

The `WEATHER_NAMES` array in `PFM::Environment` lists all known weather symbols:

```ruby
module PFM
  class Environment
    WEATHER_NAMES << :void_weather
  end
end
```

### Adding the activation message to WEATHER_SYM_TO_MSG

The `WEATHER_SYM_TO_MSG` hash contains the mapping between weather symbols and message line numbers. It is not frozen, so you can simply add entries:

```ruby
module Battle
  module Logic
    class WeatherChangeHandler
      WEATHER_SYM_TO_MSG[:void_terrain] = 400
      WEATHER_SYM_TO_MSG[:none][:void_terrain] = 401
    end
  end
end
```

The hash structure is as follows:

- `WEATHER_SYM_TO_MSG[:void_terrain] = 400`: the activation message (line 400 from text file 60).
- `WEATHER_SYM_TO_MSG[:none][:void_terrain] = 401`: the end message (line 401), displayed when the terrain changes to `:none`.

## Triggering the weather via a move

To create a move that invokes the weather:

### Configure the move in Pokémon Studio

Create the move in Pokémon Studio with these properties:

- **Procedure**: `s_weather`
- **Category**: Status
- **PP**: 5 (typical)
- **Target**: All Pokemon

### Register the move in WeatherMove

The `WEATHER_MOVES` hash maps a move's `db_symbol` to the weather symbol. Simply add an entry:

```ruby
module Battle
  class Move
    class WeatherMove
      WEATHER_MOVES[:void_weather] = :void_weather
    end
  end
end
```

### Register the duration extension item (optional)

If an item extends the weather duration (from 5 to 8 turns), add it to `WEATHER_ITEMS`:

```ruby
module Battle
  class Move
    class WeatherMove
      WEATHER_ITEMS[:void_weather] = :void_rock
    end
  end
end
```

## Triggering the weather via an effect

The example below shows an ability effect, but the same methods apply for an item or any other effect that triggers a weather:

```ruby
module Battle
  module Effects
    class Ability
      class VoidStream < Drizzle
        private

        def weather
          return :void_weather
        end

        def item_db_symbol
          return :void_rock
        end
      end
      register(:void_stream, VoidStream)
    end
  end
end
```

The effect inherits from `Drizzle` (or any existing weather effect) and only overrides `weather` (the weather symbol) and `item_db_symbol` (the duration extension item). The system automatically handles the duration (5 turns, or 8 with the item).

Reference examples can be found in `050 Weather Setting Abilitites.rb`.

## Adding a weather query method

To be able to check the active weather in code (e.g., `logic.weather_effect.void_weather?`), you need to add a query method to the base class:

```ruby
module Battle
  module Effects
    class Weather
      def void_weather?
        return @db_symbol == :void_weather
      end
    end
  end
end
```

## File summary

| File                                             | Action                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| Studio -> Battle System (file 100018)            | Add activation, end and turn messages                |
| `my-project/scripts/001 Weather.rb`              | Add symbol to `WEATHER_NAMES`                        |
| `my-project/scripts/002 WeatherChangeHandler.rb` | Add entry to `WEATHER_SYM_TO_MSG`                    |
| `my-project/scripts/003 WeatherEffect.rb`        | Create the weather effect class                      |
| `my-project/scripts/004 WeatherMove.rb`          | Add to `WEATHER_MOVES` and `WEATHER_ITEMS` (if move) |
| `my-project/scripts/005 Ability.rb`              | Create the effect (if effect)                        |
| Studio -> Moves                                  | Create the move with `s_weather` procedure (if move) |

## Conclusion

- First add the **messages** in Studio (file 100018), as they are needed for the handler.
- Create the **effect class** by inheriting from `Weather` with at minimum `on_end_turn_event` and `register`.
- Add the symbol to `WEATHER_NAMES` and the entry to `WEATHER_SYM_TO_MSG` to link the messages.
- Add the entry to `WEATHER_MOVES` for moves, or inherit from `Drizzle` for effects.
- Existing weathers in `5 Battle/06 Effects/06 Weather Effects/` serve as reference for possible behaviors.
