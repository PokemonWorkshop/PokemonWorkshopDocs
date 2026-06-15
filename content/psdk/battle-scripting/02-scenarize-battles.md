---
title: "Scenarize a battle"
slug: how-to-scenarize-a-battle
sidebar_position: 2
description: "This guide explains how to use battle events: Ruby hooks into the battle scene that show mid-battle dialogue, set up initial effects, react to moves and force the AI, selected per battle by its battle id."
---

This guide explains how to use battle events: Ruby hooks into the battle scene that show mid-battle dialogue, set up initial effects, react to moves and force the AI, selected per battle by its battle id.

## What battle events do

A battle event is a Ruby file that hooks into the battle scene at specific moments, to make a fight feel scripted rather than mechanical. Three things stand out:

- **Show messages**: mid-battle dialogue, typically the enemy trainer talking.
- **Set up the logic** once it is loaded, for example starting the battle with an effect already active.
- **Force the AI** to take a specific action, a lighter alternative to writing a full custom AI for a gym leader or an elite.

## Creating a battle event file

Battle events live in `Data/Events/Battle/` as Ruby files. The filename must start with **five digits**, followed by anything, then `.rb`:

```
Data/Events/Battle/00234 Brock battle.rb
```

The five digits are what matters: they are the `battle_id` the scene looks for.

## Selecting which events load

`Battle::Logic::BattleInfo#battle_id` decides which file loads. A `battle_id` of `5` loads `Data/Events/Battle/00005*.rb`. There are two ways to set it:

- From a script, on the `BattleInfo`: `bi.battle_id = 5` (see the [battle scripting guide](/psdk/battle-scripting)).
- In Pokémon Studio, by setting the trainer's **Battle Group ID** to a non-zero value.

A few things to keep in mind:

- `battle_id` defaults to `-1`, which loads nothing. Events only run once you set it.
- A wild battle uses `battle_id = 1` by default (so `00001*.rb`), unless you call `$wild_battle.setup(battle_id)` yourself.

:::warning
Avoid two files sharing the same five digits (`00005 Brock.rb` and `00005 Misty.rb`): only one of them loads, and which one is undefined.
:::

## Registering an event

An event file reopens `Battle::Scene` and registers a block for each moment you want to hook into. Reopening the class groups every event of the file together and avoids repeating the `Battle::Scene.` prefix on each call:

```ruby
module Battle
  class Scene
    register_event(:battle_begin) do |scene|
      # ...
    end
  end
end
```

The block always receives the battle `scene` as its first argument; some events pass more. Only one block can be registered per event name: registering the same event twice keeps the last block.

The snippets below show the `register_event` calls on their own; each one goes inside that `module Battle` / `class Scene` block. The fully qualified form `Battle::Scene.register_event(...)` works too at the top level of the file, it is just more verbose.

## Showing mid-battle dialogue

The most common use is making the enemy trainer talk. PSDK does not ship a ready-made method for it, so add this helper once. It slides the trainer sprite in, shows the messages, then slides it back out:

```ruby
module Battle
  class Scene
    # Show messages from the enemy trainer during battle.
    # @param messages [Array<String>]
    # @note wraps everything in visual.lock
    def show_event_message(*messages)
      visual.lock do
        sprite = visual.battler_sprite(1, -1) # negative position = trainer sprite, -1 = first trainer
        slide_in = Yuki::Animation.move(0.4, sprite, 320 + sprite.width, sprite.y, 290, sprite.y)
        slide_in.start
        visual.animations << slide_in
        visual.hide_team_info
        visual.wait_for_animation

        messages.each do |message|
          message_window.blocking = true
          message_window.wait_input = true
          display_message_and_wait(message)
        end

        slide_out = Yuki::Animation.move(0.4, sprite, 290, sprite.y, 320 + sprite.width, sprite.y)
        slide_out.start
        visual.animations << slide_out
        visual.show_team_info
        visual.wait_for_animation
      end
    end
  end
end
```

Place it in a custom script, not in the battle event file, so every battle can use it. The examples below assume it exists.

:::note
`show_event_message` calls `visual.lock` itself, so never wrap a call to it inside another `visual.lock`: locking the visuals twice raises a race-condition error.
:::

## The available events

PSDK fires eight events over the course of a battle. They are all registered the same way; they differ in when they fire and in the extra arguments the block receives.

| Event | Block arguments | When it fires |
| ---------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `:logic_init` | `\|scene\|` | Right after the scene is built, before any animation. Set up the logic here. |
| `:pre_battle_begin` | `\|scene\|` | During the intro, after "Trainer wants to fight!", before any Pokémon is sent out. |
| `:battle_begin` | `\|scene\|` | After both sides sent their first Pokémon, before the first player choice. |
| `:trainer_dialog` | `\|scene\|` | Each turn, after the player has chosen, before the AI chooses. |
| `:AI_force_action` | `\|scene, ai, index\|` | Each turn, once per AI. Return actions to force them, or `nil` for default AI. |
| `:after_attack` | `\|scene, launcher, move\|` | After each move resolves. |
| `:after_action_dialog` | `\|scene\|` | After the turn's actions, before fainted Pokémon are replaced. |
| `:battle_turn_end` | `\|scene\|` | At the end of the turn, after fainted Pokémon are replaced. |

### Setting up the logic

`:logic_init` runs before any animation, while the logic exists but nothing is on screen yet. It is the place to add starting effects:

```ruby
register_event(:logic_init) do |scene|
  scene.logic.bank_effects[1].add(Battle::Effects::LightScreen.new(scene.logic, 1, 0, Float::INFINITY))
  scene.logic.bank_effects[1].add(Battle::Effects::Reflect.new(scene.logic, 1, 0, Float::INFINITY))
end
```

The battle now starts with Light Screen and Reflect already up on the enemy side for an unlimited number of turns. `bank_effects[bank]` holds a bank's effects, and the effect constructor takes `(logic, bank, position, turn_count)`.

### Making the trainer talk

Five events pass only `scene`, so any of them can call `show_event_message`; they differ only in timing (see the table). A line before the player's first move uses `:battle_begin`:

```ruby
register_event(:battle_begin) do |scene|
  scene.show_event_message("You actually made it this far? Let me show you a real battle!")
end
```

A first-turn-only line uses `:trainer_dialog` with a turn guard:

```ruby
register_event(:trainer_dialog) do |scene|
  next if $game_temp.battle_turn != 1 # only on the first turn

  scene.show_event_message("Oh, I forgot to mention, I never intended to play fair.")
end
```

A "down to the last Pokémon" boast uses `:battle_turn_end` (which fires after fainted Pokémon are replaced), with a flag so it runs only once:

```ruby
register_event(:battle_turn_end) do |scene|
  next if scene.logic.alive_battlers_without_check(1).size > 1
  next if scene.instance_variable_get(:@ace_dialog_done)

  scene.instance_variable_set(:@ace_dialog_done, true)
  scene.show_event_message("You are pushing me to my limits! Here is my best Pokémon!")
end
```

The `@ace_dialog_done` flag, stored on the long-lived scene, stops the event from firing every later turn. `:after_action_dialog` is the same idea one step earlier, before the replacement.

### Reacting to a move

`:after_attack` fires after every move, with the attacker (`launcher`) and the `move`. Use the move's public predicates to react, no need to reach into its internals:

```ruby
register_event(:after_attack) do |scene, launcher, move|
  next if launcher.bank != 0 # only react to the player's moves
  next if scene.instance_variable_get(:@praised_player)

  if move.super_effective?
    scene.instance_variable_set(:@praised_player, true)
    next scene.show_event_message("Nicely done! You really know how to hit a weakness.")
  end

  if move.critical_hit?
    scene.instance_variable_set(:@praised_player, true)
    scene.show_event_message("Ouch, that critical hit must have hurt!")
  end
end
```

`move.super_effective?`, `move.critical_hit?` and `move.effectiveness` are all public.

### Forcing the AI

`:AI_force_action` fires once per AI (`index` is its position, `ai` is the AI). Return an array of actions to override its turn, or `nil` to let the default AI decide:

```ruby
register_event(:AI_force_action) do |scene, ai, index|
  next if index != 0 # only the first AI

  controlled = ai.controlled_pokemon
  next if controlled.empty?
  next unless scene.logic.can_battler_be_replaced?(active = controlled.first)

  bench = ai.party.select { |pokemon| pokemon.alive? && !controlled.include?(pokemon) }
  next if bench.empty?

  next [Battle::Actions::Switch.new(scene, active, bench.sample)]
end
```

This forces the first AI to switch its active Pokémon for a random benched ally. `Battle::Actions::Switch.new(scene, out, in)` builds a switch action (the first Pokémon leaves, the second comes in), and returning the array makes the AI perform it.

## Defining your own events

The eight events above are the ones the battle scene fires, but `register_event` accepts any symbol, so a plugin can expose its own hooks. Triggering an event goes through `call_event`, which is private on the scene, so mirror the engine's own `on_after_attack` / `on_pre_battle_begin` wrappers and add a public method that calls it:

```ruby
module Battle
  class Scene
    def on_low_hp_taunt(launcher)
      call_event(:low_hp_taunt, launcher)
    end
  end
end
```

Call `scene.on_low_hp_taunt(...)` wherever your logic needs the hook (typically from a prepended battle method), and event files react to it like any built-in event:

```ruby
register_event(:low_hp_taunt) do |scene, launcher|
  # ...
end
```

This is exactly how the engine fires `:after_attack`, `:pre_battle_begin` and `:battle_turn_end` internally.

## Putting it together

A battle event file is several `register_event` calls inside one reopened `Battle::Scene`:

```ruby
module Battle
  class Scene
    register_event(:logic_init) do |scene|
      scene.logic.bank_effects[1].add(Battle::Effects::LightScreen.new(scene.logic, 1, 0, Float::INFINITY))
    end

    register_event(:battle_begin) do |scene|
      scene.show_event_message("So you finally made it. Do not expect me to go easy on you!")
    end
  end
end
```

Set the battle's `battle_id` to the file's digits (from a script with `bi.battle_id = 2`, or via the trainer's Battle Group ID in Studio), add the `show_event_message` helper to a custom script, and the scene runs each block at the right moment.

## Conclusion

- Battle events are Ruby files in `Data/Events/Battle/NNNNN*.rb`, selected by `battle_id` (default `-1`, which loads nothing; `1` for wild battles).
- Reopen `Battle::Scene` and register one block per moment with `register_event(:event)`; the block always receives `scene` first.
- Use the dialogue events with the `show_event_message` helper for mid-battle lines, `:logic_init` for starting effects, `:after_attack` to react to moves, and `:AI_force_action` to script the AI.
- Set `battle_id` from a `BattleInfo` (`bi.battle_id = N`) or via the trainer's Battle Group ID in Studio.
- Beyond the eight built-in events, register your own symbol and trigger it with a public `on_*` wrapper around `call_event` to expose battle hooks from a plugin.
