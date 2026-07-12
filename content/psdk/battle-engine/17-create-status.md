---
title: "Create a custom status"
slug: how-to-create-a-status
sidebar_position: 17
description: "This guide explains how to create a custom status in PSDK: declaring its ID, coding its query and apply methods, registering it in the battle handlers, creating its effect class, and adding its battle icon."
---

This guide explains how to create a custom status in PSDK: declaring its ID, coding its query and apply methods, registering it in the battle handlers, creating its effect class, and adding its battle icon.

:::info[Required versions]
Custom statuses rely on the status parser introduced in **PSDK .26.34** and **Pokémon Studio 2.4.0**. Make sure your project is up to date before starting.
:::

## Principle

A status is more than a label: the battle engine has to know how to apply it, prevent it, factor it into the catch rate, and run its per-turn behavior. Creating one therefore touches several layers:

- **Pick a name and apply it in Studio**: assign the status to the moves that should inflict it.
- **Declare an ID** so the engine has a stable reference for the status.
- **Add query and apply methods** to `PFM::Pokemon` so the rest of the code can read and set the status.
- **Register it in the handlers**: the `StatusChangeHandler` (application, messages, prevention) and, optionally, the `CatchHandler` (catch-rate bonus).
- **Create the effect class** that holds the status' battle behavior.
- **Keep it battle-safe** with a small compatibility patch, then optionally give it a **battle animation**.
- **Add the icon** so the status shows up on the battle interface.

Throughout this guide, the running example is a custom status displayed as **Groggy** in Studio, which the engine resolves to the symbol `:custom_groggy` (see below). Replace that name and symbol with your own everywhere they appear.

## Naming the status in Studio

Choose a clear name and keep it consistent: you will reuse it across every script below.

In Studio, open each move that should inflict your status and set it as the move's status effect. When Studio saves a custom status to its JSON, it prefixes the name with `Custom_`: a status named `Groggy` is stored as `Custom_Groggy`.

When PSDK compiles the data, any status name starting with `Custom_` is downcased and turned into a symbol. `Custom_Groggy` therefore becomes `:custom_groggy`, the symbol you will use everywhere in code.

:::tip
Book a name you are happy with from the start. Renaming the status in Studio later means updating every script that references the symbol.
:::

## Declaring the status ID

The engine refers to each status by an integer ID. Open `Data/configs/states.json` in your project with a text editor and add your status to the `ids` map:

```json
{
  "klass": "Configs::States",
  "ids": {
    "poison": 1,
    "paralysis": 2,
    "burn": 3,
    "sleep": 4,
    "freeze": 5,
    "confusion": 6,
    "toxic": 8,
    "death": 9,
    "ko": 9,
    "flinch": 7,
    "custom_groggy": 20
  }
}
```

Pick an ID **well above the existing ones** (20 here) so an official status added in a future PSDK version cannot collide with yours. The official statuses currently top out at 9, so the empty range between them and your ID is intentional and harmless. Save the file: PSDK reloads the corresponding `.rxdata` data automatically.

The ID is now reachable in code through `Configs.states.ids[:custom_groggy]`.

## Adding query and apply methods on the Pokémon

`PFM::Pokemon` exposes, for every official status, three methods the rest of the engine relies on. Paralysis is a good model:

```ruby
# Is the Pokemon paralyzed?
# @return [Boolean]
def paralyzed?
  return @status == Configs.states.ids[:paralysis]
end

# Paralyze the Pokemon
# @param forcing [Boolean] force the new status
# @return [Boolean] if the pokemon has been paralyzed
def status_paralyze(forcing = false)
  if (@status == 0 || forcing) && !dead?
    @status = Configs.states.ids[:paralysis]
    return true
  end
  return false
end

# Can the Pokemon be paralyzed?
# @return [Boolean]
def can_be_paralyzed?
  return false if @status != 0
  return false if type_electric?

  return true
end
```

- `paralyzed?` reports whether the Pokémon currently suffers from the status.
- `status_paralyze(forcing)` applies the status. By default it only takes hold on a Pokémon that has no status and is not fainted; `forcing = true` bypasses that guard.
- `can_be_paralyzed?` decides whether the status may be applied, factoring in any immunity (here, Electric types).

Recreate the same three methods for your status in a custom script. If you have never added a custom script, see [Set up the development environment](/getting-started/customize-psdk/setup-development-environment#how-psdk-loads-your-scripts), which explains where the file must live and how PSDK decides to load it.

```ruby
module PFM
  class Pokemon
    # Is the Pokemon groggy?
    # @return [Boolean]
    def groggy?
      return @status == Configs.states.ids[:custom_groggy]
    end

    # Make the Pokemon groggy
    # @param forcing [Boolean] force the new status
    # @return [Boolean] if the pokemon has been made groggy
    def status_groggy(forcing = false)
      if (@status == 0 || forcing) && !dead?
        @status = Configs.states.ids[:custom_groggy]
        return true
      end
      return false
    end

    # Can the Pokemon be made groggy?
    # @return [Boolean]
    def can_be_groggy?
      return false if @status != 0
      # Add your own immunity conditions here, one per line.

      return true
    end
  end
end
```

## Registering the status in the StatusChangeHandler

`Battle::Logic::StatusChangeHandler` decides whether a status can be applied in battle and, if so, displays the right message and animation. Several constants drive it; all of them are mutable, so you extend them from a custom script.

### Linking the symbol to its apply method

`STATUS_APPLY_METHODS` maps a status symbol to the `PFM::Pokemon` method that applies it. Point it at the method you wrote above:

```ruby
module Battle
  class Logic
    class StatusChangeHandler < ChangeHandlerBase
      STATUS_APPLY_METHODS[:custom_groggy] = :status_groggy
    end
  end
end
```

### Declaring the application message (optional)

`STATUS_APPLY_MESSAGE` holds the text line shown when the status takes hold:

```ruby
      # Text line for the application message
      STATUS_APPLY_MESSAGE[:custom_groggy] = 320
```

The message line refers to text **file 100019** in Pokémon Studio. Add your application text there with Studio (never edit the CSV by hand) and use its line number.

:::note[Text line numbers come from Studio]
Every line number pointing at text file 100019 in this guide, `320` above and the `285`, `282`, and `330` used in the prevention, effect, and cure sections below, is an example. When you add a message in Studio it assigns the next free line number; read that number and use it in your script rather than copying the ones shown here.
:::

### Preventing the status under custom conditions

When a status cannot be applied (an immunity, an ability, etc.), the handler must refuse it and explain why. It does so through `check_status_prevention`, which custom modules extend with `prepend`:

```ruby
module GroggyPrevention
  # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch
  # @param target [PFM::PokemonBattler]
  # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
  # @param skill [Battle::Move, nil] potential move used
  # @return [:prevent, nil]
  def check_status_prevention(status, target, launcher, skill)
    result = super
    result ||= check_groggy_prevention(status, target, launcher, skill)

    return result
  end

  # Function checking for groggy prevention
  # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch
  # @param target [PFM::PokemonBattler]
  # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
  # @param skill [Battle::Move, nil] potential move used
  # @return [:prevent, nil]
  def check_groggy_prevention(status, target, launcher, skill)
    return if status != :custom_groggy || target.can_be_groggy?

    return prevent_change do
      scene.display_message_and_wait(parse_text_with_pokemon(19, 285, target)) if skill.nil? || skill.status?
    end
  end
end
Battle::Logic::StatusChangeHandler.prepend(GroggyPrevention)
```

`super` runs every official prevention check first; `result ||=` then adds yours only if none of them already blocked the status, keeping the exact structure the engine uses for its own statuses. The dedicated `check_groggy_prevention` reads: if the request is for your status **and** the target cannot receive it, block the change and display the prevention text. `parse_text_with_pokemon(19, 285, target)` reads line `285` of text file 100019, which you add through Studio.

### Fixing the cure message (optional)

When a status is cured in battle (by a move, an item, or an ability), the handler clears it generically, but the message it displays is chosen by its private `cure_message_id` method. That method only knows the official statuses and falls back to the "woke up" line for anything else, so a cured custom status would show the wrong text. If your status can be cured in battle, prepend an override that returns your own message line:

```ruby
module GroggyCureMessage
  private

  # @param target [PFM::PokemonBattler]
  # @return [Integer] line of text file 100019
  def cure_message_id(target)
    return 330 if target.groggy?

    return super
  end
end
Battle::Logic::StatusChangeHandler.prepend(GroggyCureMessage)
```

`cure_message_id` runs before the status is cleared, so `target.groggy?` is still true at that point. Return the line of your cure text (added through Studio in file 100019) for your status, and defer to `super` for every other one. The cure itself works without this override; only the displayed message needs it.

## Adding a catch-rate bonus (optional)

In the core games, a statused Pokémon is easier to catch. If your status should grant the same bonus, extend `STATUS_MODIFIER` on `Battle::Logic::CatchHandler`:

```ruby
module Battle
  class Logic
    class CatchHandler < ChangeHandlerBase
      STATUS_MODIFIER[:custom_groggy] = 1.5
    end
  end
end
```

The value is a multiplier applied to the catch rate. For reference, the official statuses use `1.5` (poison, burn, paralysis) up to `2.5` (sleep, freeze). Any positive value works: a multiplier below `1` would make your status *reduce* the catch rate.

## Creating the status effect class

The behavior of a status in battle lives in a `Battle::Effects::Status` subclass. First, add a query method to the base class so the engine can recognize your status from an effect:

```ruby
module Battle
  module Effects
    class Status < EffectBase
      # Tell if the status effect is groggy
      # @return [Boolean]
      def groggy?
        @status == :custom_groggy
      end
    end
  end
end
```

Then create the effect class itself and register it:

```ruby
module Battle
  module Effects
    class Status
      class Groggy < Status
        # Prevent groggy from being applied twice
        # @param handler [Battle::Logic::StatusChangeHandler]
        # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch, :cure
        # @param target [PFM::PokemonBattler]
        # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
        # @param skill [Battle::Move, nil] potential move used
        # @return [:prevent, nil] :prevent if the status cannot be applied
        def on_status_prevention(handler, status, target, launcher, skill)
          return if target != self.target
          return if status != :custom_groggy

          return handler.prevent_change do
            handler.scene.display_message_and_wait(parse_text_with_pokemon(19, 282, target))
          end
        end

        # Name of the effect
        # @return [Symbol]
        def name
          :custom_groggy
        end
      end

      register(:custom_groggy, Groggy)
    end
  end
end
```

- Name the class in **PascalCase** (`Groggy`, `MyCustomStatus`).
- `on_status_prevention` runs while the Pokémon already carries the status: here it blocks re-applying it and shows the "already statused" text at line `282` of file 100019.
- `register(:custom_groggy, Groggy)` ties the symbol to the class through the factory.

From here, the status is fully recognized by the engine. To give it actual effects (per-turn damage, stat changes, etc.), override the `EffectBase` hooks. The existing status effects in `5 Battle/06 Effects/03 Status Effects/` (search `< Status`, or `< EffectBase` for the full set of hookable effects) are the reference for what is possible.

## Making custom statuses battle-safe

Even a status with no animation must not crash the battle. When any status is inflicted, the engine unconditionally tries to play a battle animation and a screen tint for it. Each official status registers both; a custom status has neither, and the engine currently offers no fallback, so applying it raises an error the moment it lands (`undefined method '>' for nil` for the missing animation, then `undefined method '[]' for nil` for the missing tint).

Until a future PSDK version makes these optional natively, add this compatibility patch once. It makes the animation and the tint truly optional: a status that registers them keeps them, a status that does not simply skips them.

```ruby
# Compatibility patch: a custom status with no registered animation or screen
# tint should simply skip them in battle, instead of crashing.
module UI
  class StatusAnimation
    class << self
      # Tell whether a status has a registered battle animation
      # @param db_symbol [Symbol]
      # @return [Boolean]
      def registered?(db_symbol)
        return @registered_status.key?(db_symbol)
      end
    end
  end
end

module BattleUI
  class PokemonSprite
    # Make the battle animation and the screen tint optional for custom statuses
    module OptionalCustomStatusVisuals
      # Play the status animation only when one is registered for the status
      # @param status [Symbol, Integer]
      def status_animation(status)
        symbol = status.is_a?(Integer) ? Configs.states.symbol(status) : status
        return super if UI::StatusAnimation.registered?(symbol)

        set_tone_status(symbol)
      end

      # Apply the screen tint only when the status defines one
      # @param status [Symbol, Integer]
      # @param switch [Boolean]
      def set_tone_status(status, switch = false)
        symbol = status.is_a?(Integer) ? Configs.states.symbol(status) : status
        return if symbol.is_a?(Symbol) && !STATUS_TONE.key?(symbol)

        super
      end
    end
    prepend OptionalCustomStatusVisuals
  end
end
```

`registered?` reports whether a status has an animation; `status_animation` then plays the animation only when one exists, and `set_tone_status` applies the tint only when the status defines one. Both guards fall back to `super` for the official statuses, so their behavior is unchanged. With this patch in place, your status works in battle with or without the visuals below. If you do not want a battle animation or a tint, you can stop here and move on to the icon.

## Adding a battle animation (optional)

The animation played when the status lands is a sprite sheet handled by `UI::StatusAnimation`. To give your status one, subclass it, describe the sheet, and register the subclass:

```ruby
module UI
  class StatusAnimation
    # Battle animation for the groggy status
    class Groggy < StatusAnimation
      # Number of [columns, rows] in the sprite sheet
      # @return [Array<Integer, Integer>]
      def status_dimension
        return [12, 10]
      end

      # Sheet path, resolved under Graphics/animations/
      # @return [String]
      def status_filename
        return 'status/custom_groggy'
      end

      # Duration of the animation in seconds (optional, default 1)
      # @return [Float]
      def status_duration
        return 1.2
      end
    end
    register(:custom_groggy, Groggy)
  end
end
```

- `status_dimension` returns the `[columns, rows]` grid of the sheet, and `status_filename` its path. Both are required once you register a subclass: the compatibility patch above skips the animation only while the status is *not* registered.
- `status_filename` is resolved against `Graphics/animations/`, so `'status/custom_groggy'` points to `graphics/animations/status/custom_groggy.png`. The official sheets (`status/poison`, `status/burn`, etc.) are the reference for the size and frame layout.
- `status_duration`, and the `x_offset` / `y_offset` overrides, are optional.

Two optional touches complete the effect, both keyed by your status symbol:

```ruby
# Screen tint pulsed while the animation plays: [red, green, blue, max_alpha, min_alpha]
BattleUI::PokemonSprite::STATUS_TONE[:custom_groggy] = [0.4, 0, 0.49, 0.6, 0]
# Sound effect played on application
BattleUI::PokemonSprite::STATUS_SE[:custom_groggy] = 'moves/poison'
```

Thanks to the compatibility patch these are genuine extras: a missing tint would otherwise crash the battle, and a missing sound plays nothing.

## Adding the status icon

### Editing the graphics file

Official statuses have an icon on the battle interface, and yours can too. The icons live in `graphics/interface`, one sheet per language:

- `statutsen.png` (English, the default fallback)
- `statutsfr.png` (French)
- `statutses.png` (Spanish)

If your game's language has no sheet, create `statuts[code].png` (for example `statutsde.png` for German, using the language code set in Studio). Edit the sheet for your language, or the English one by default.

Each icon occupies a 10-pixel-high band, ordered by status ID. To add yours (all coordinates are measured from the top-left corner):

- Extend the image height to `10 * (ID + 1)` pixels. With ID 20, the sheet becomes `10 * 21 = 210` pixels tall.
- Draw your icon at `X = 0`, `Y = 10 * ID`. With ID 20, that is `Y = 200`.
- Repeat for every language sheet you maintain.

An empty gap between your icon and the previous one is expected when your ID is not contiguous; it is harmless.

### Declaring the icon count in code

Finally, tell the sprite class how many status bands the sheet now holds. `UI::StatusSprite` exposes a `STATE_COUNT` constant; override it from a custom script with your highest ID plus one:

```ruby
module UI
  class StatusSprite < SpriteSheet
    remove_const :STATE_COUNT
    # Number of status icons in the sheet
    STATE_COUNT = 21
  end
end
```

With a highest ID of 20, `STATE_COUNT` becomes 21. Update this value whenever you add another custom status with a higher ID.

## File summary

| File                                         | Action                                                            |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Studio -> Moves                              | Set the custom status on every move that should inflict it        |
| `Data/configs/states.json`                   | Declare the status ID                                             |
| Studio -> Battle text (file 100019)          | Add the application, prevention and (optional) cure messages       |
| `my-project/scripts/001 PokemonStatus.rb`    | Add `groggy?`, `status_groggy`, `can_be_groggy?` to `PFM::Pokemon`|
| `my-project/scripts/002 StatusChange.rb`     | Register in `STATUS_APPLY_METHODS`, messages, and prevention      |
| `my-project/scripts/003 CatchHandler.rb`     | Add to `STATUS_MODIFIER` (optional catch bonus)                   |
| `my-project/scripts/004 StatusEffect.rb`     | Add the base query method and create the effect class             |
| `my-project/scripts/005 CustomStatusPatch.rb`| Paste the compatibility patch (makes animation and tint optional) |
| `graphics/animations/status/<name>.png`      | Add the battle animation sheet (optional)                         |
| `my-project/scripts/006 StatusAnimation.rb`  | Register a `UI::StatusAnimation` subclass (optional animation)    |
| `graphics/interface/statuts[lang].png`       | Add the status icon                                               |
| `my-project/scripts/007 StatusSprite.rb`     | Update `STATE_COUNT`                                              |

## Conclusion

- Name the status in Studio and assign it to the relevant moves; the `Custom_` prefix becomes your `:custom_groggy` symbol.
- Declare its **ID** in `states.json`, well above the official ones.
- Mirror the official **query and apply methods** on `PFM::Pokemon`.
- Register it in the **StatusChangeHandler** (apply method, messages, prevention) and, optionally, the **CatchHandler** for a catch bonus.
- Create the **effect class** with `register`, then code its behavior by overriding `EffectBase` hooks.
- Add the **compatibility patch** so the status never crashes in battle, then optionally register a **battle animation** (a `UI::StatusAnimation` subclass) with a tint and sound.
- Add the **icon** to the status sheets and bump `STATE_COUNT`.
- Existing statuses in `5 Battle/06 Effects/03 Status Effects/` are the reference for coding richer effects.
