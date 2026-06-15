---
title: "Use the Interpreter in an event"
slug: using-the-interpreter-in-an-event
sidebar_position: 2
description: "In RMXP, when creating an event, you have access to standard commands: show a message, give an item, teleport the player. But these commands are limited. PSDK provides dozens of ready-to-use methods that can be called directly from an event's Script command."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

In RMXP, when creating an event, you have access to standard commands: show a message, give an item, teleport the player. But these commands are limited. PSDK provides dozens of ready-to-use methods that can be called directly from an event's **Script** command. This guide explains where these methods come from, how to use them, and most importantly how to find them.

## What is the Interpreter?

When an event runs on the map, an object called the **Interpreter** processes each command one by one. This object is created when the map loads and lives as long as the map is active. Each RMXP command (show a message, move an event, play a sound) corresponds to a method on this object.

What makes the Interpreter powerful in PSDK is that the engine **extends** it with many additional methods. Where base RMXP can only do simple things, PSDK adds methods to manage Pokémon, start battles, open menus, move the camera, and much more.

## The Script command

The RMXP **Script** command lets you write Ruby code that runs **inside** the Interpreter. This means you can call all its methods directly, without any prefix:

```ruby
message("Hello!")
add_pokemon(:pikachu, 10)
emotion(:exclamation)
```

These three lines call three Interpreter methods. You don't need to write `self.message(...)` or reference any object — the code already runs in the right context.

You can also write any valid Ruby expression. You have access to global variables (`$game_variables`, `$game_switches`, `$actors`, `$bag`...) and all of the engine's code.

## Access shortcuts

The Interpreter exposes shortcuts to quickly access the game's global objects:

| Shortcut | Returns        | Full name              |
| -------- | -------------- | ---------------------- |
| `gv`     | Game variables | `$game_variables`      |
| `gs`     | Game switches  | `$game_switches`       |
| `gt`     | Game temp      | `$game_temp`           |
| `gm`     | Game map       | `$game_map`            |
| `gp`     | Game player    | `$game_player`         |
| `ge(id)` | A map event    | `$game_map.events[id]` |
| `party`  | Game state     | `PFM.game_state`       |

For example:

```ruby
# Set variable 10 to 42
gv[10] = 42

# Enable switch 5
gs[5] = true

# Get the player's speed
gp.move_speed

# Get event 3 on the current map
ge(3)
```

These shortcuts are simply methods that return the corresponding global objects. They are used to write more concise code in the Script command.

## Script conditions

In RMXP, the **Conditional Branch** command has a **Script** tab. The code written there also runs inside the Interpreter, but it must return a value: if it's **truthy** (neither `false` nor `nil`), the condition is true.

```ruby
# Does the player have a Pikachu?
$actors.any? { |pokemon| pokemon.db_symbol == :pikachu }

# Is variable 10 greater than 50?
gv[10] >= 50

# Is the party full?
$actors.size == 6

# Does the player have a Master Ball?
$bag.contain_item?(:master_ball)
```

Any Ruby expression works. This is where the shortcuts (`gv`, `gs`, etc.) become very useful to keep code short.

## Where to find available methods

This is the key question: how to know which methods exist and what parameters they accept?

### The online documentation

The PSDK YARD documentation is available at:

<https://psdk.pokemonworkshop.fr/yard/Interpreter.html>

The `Interpreter` class is documented there with all its methods, their parameters, and their types. This is the most accessible reference — it requires no installation.

### The source files

For those who prefer reading the code directly, all Interpreter methods are defined in `pokemonsdk/scripts/2 PSDK Event Interpreter/`. Each file corresponds to a theme:

| File                               | Theme                                   |
| ---------------------------------- | --------------------------------------- |
| `100 Interpreter_Environnement.rb` | Player detection, event deletion        |
| `105 Interpreter_Camera.rb`        | Camera movement                         |
| `110 Interpreter_Pokemon.rb`       | Add, remove, modify Pokémon             |
| `120 Interpreter_Shortcut.rb`      | Shortcuts, emotions, menus, pathfinding |
| `121 Interpreter_add_item.rb`      | Item management                         |
| `125 Interpreter_Fiber.rb`         | Messages and choices                    |
| `130 Interpreter_Sequences.rb`     | Battle sequences, trades                |
| `140 Interpreter_Player.rb`        | Player profile management               |
| `150 Interpreter_Time.rb`          | Timed events                            |
| `160 Interpreter_Overlay.rb`       | Map overlays                            |
| `165 Interpreter_Message_Font.rb`  | Message font                            |

These files are part of PSDK's internal code. To access them, you need to follow guide **003 How to set up the development environment** which explains how to retrieve the engine's source code. Without this step, the `pokemonsdk/` folder is not visible in the project.

Each method in these files is documented with YARD comments that describe the parameters and their types. By reading a file, you can quickly discover everything available for a given theme.

## Adding your own methods

The Interpreter is a Ruby class like any other. You can **reopen** it from your own scripts to add methods. All scripts placed in the `scripts/` folder at the root of the project are loaded by PSDK after the engine's code.

For example, if you want a reusable method to heal the entire party:

```ruby
# my-project/scripts/001 Interpreter.rb
class Interpreter
  # Heal all Pokemon in the party
  def heal_all_pokemon
    $actors.each do |pokemon|
      pokemon.hp = pokemon.max_hp
      pokemon.status = 0
      pokemon.skills_set.each { |skill| skill.pp = skill.ppmax if skill }
    end
  end
end
```

Once this file is in place, the method is available in all events in the game:

```ruby
# In a Script command
heal_all_pokemon
message("Your Pokemon have been fully healed!")
```

This is the same principle as the monkey-patching described in guide **001 What is monkey-patching and how to apply it in PSDK**: you reopen the class, add a method, and it becomes accessible everywhere. The difference is that here you're not modifying an existing method — you're creating a new one.

This is useful for several reasons:

- **Factoring out code**: instead of copy-pasting the same Script block in multiple events, you write it once in a method and call it by name.
- **Simplifying events**: RMXP's event editor is not designed to handle complex logic. Nested conditional branches, lengthy events and mixing RMXP commands with Script blocks quickly become unreadable. By moving that logic into a Ruby method, the event is reduced to a simple call, and the code is easier to read, test and modify.

## Conclusion

- The **Interpreter** is the object that executes event commands. PSDK extends it with dozens of additional methods.
- The **Script** command and the **Script** tab in conditional branches execute Ruby directly inside the Interpreter.
- The shortcuts (`gv`, `gs`, `gp`, `ge`, `party`) simplify access to game data.
- To discover available methods: check the [YARD documentation](https://psdk.pokemonworkshop.fr/yard/) or read the source files after following guide **003**.
