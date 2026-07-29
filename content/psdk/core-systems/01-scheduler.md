---
title: "Scheduler"
slug: scheduler
sidebar_position: 1
description: "The Scheduler runs your code at precise moments without editing the engine: scene lifecycle events like every frame or a warp, and map actions like a step or a jump. This guide covers both schedulers and when to reach for each."
---

The Scheduler runs your code at precise moments without editing the engine: scene lifecycle events like every frame or a warp, and map actions like a step or a jump. This guide covers both schedulers and when to reach for each.

## Why it exists

A PSDK scene already does a lot during its life: it initializes, updates every frame, handles warps, disposes itself. The map does its own work too: it moves the player, makes them jump, counts steps. When you want to add behaviour at one of those moments, the wrong reflex is to edit the engine's source. The next update would overwrite it, and you would fight the engine on every release.

The **Scheduler** is the clean alternative. Instead of editing the engine, you **register a task**: a piece of code plus the moment it should run. The engine runs it for you at the right time. It is the runtime companion to [monkey-patching](/getting-started/customize-psdk/monkey-patching-in-psdk): monkey-patching changes what a method does, the Scheduler adds code at well-known moments without touching any method at all.

## Two ways to schedule

PSDK ships two complementary schedulers, and the first thing to get right is which one a given need belongs to.

- **Scene lifecycle tasks** (`Scheduler`) react to the life of a **scene**: every frame, when it initializes, on a warp, when it disposes. Use them for anything tied to a scene being on screen.
- **Map event tasks** (`Scheduler::EventTasks`) react to the actions of a **character on the map**: a step, a jump, a slide. Use them for anything tied to the player (or an event) moving.

The rest of this guide covers each in turn, then how to choose.

## Scene lifecycle tasks

### How it works

The lifecycle scheduler is a registry of tasks indexed by two keys: a **reason** (the kind of moment) and a **scene class** (where it applies).

```ruby
# Conceptually:
tasks[reason][scene_class] = [task, task, ...]
```

There are only three operations, and keeping them straight removes most of the confusion:

- You **register** a task with `add_proc` or `add_message`. This is what you write.
- The engine **triggers** a reason with `start`, which runs every task registered under it. The engine already calls this at each lifecycle point, so you almost never call `start` yourself.
- You **unregister** a task with `__remove_task` when it is no longer needed.

In short: your job is to register; the engine does the triggering.

### The reasons

A **reason** is the lifecycle moment that triggers a task. There are ten, each fired by the engine at a specific point:

| Reason                     | When it fires                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `:on_update`               | Every frame, continuously while the scene is on screen. This is the main loop, the place for anything that must run all the time. |
| `:on_init`                 | Right after the scene is created, just before it appears on screen. The place to set things up.                                   |
| `:on_transition`           | When the scene plays its visual transition, the fade in or out between two scenes.                                                |
| `:on_scene_switch`         | Just before the scene hands control to another one, that is, when the game changes scene.                                         |
| `:on_dispose`              | When the scene closes and frees its resources. The place to clean up what you created.                                            |
| `:on_warp_start`           | The moment the player starts moving to another map (this is called a **warp**), before anything else happens.                     |
| `:on_warp_process`         | Once the player has arrived on the new map, but before the game states are refreshed.                                             |
| `:on_warp_end`             | When the map change is finished, just before the new map's transition plays.                                                      |
| `:on_hour_update`          | When the in-game clock rolls over to a new hour (day and night system), for example to refresh which wild Pokémon are available.  |
| `:on_getting_tileset_name` | When the map engine decides which **tileset**, the sheet of map tiles, to load for the current map.                               |

`:on_update` is the one you will reach for most often: it is the per-frame loop, the equivalent of a scene's own update, but contributed from outside.

### Registering: `add_proc` or `add_message`

There are two ways to register, and the choice is only about where your code lives.

`add_proc` runs a **block**. Use it for inline logic:

```ruby
Scheduler.add_proc(:on_update, Scene_Map, 'MyGame::MapHud', 100) do
  $map_hud&.update
end
```

`add_message` sends a **method** to an object. Use it when the behaviour already lives in a method of an object you have at hand:

```ruby
Scheduler.add_message(:on_update, Scene_Map, 'MyGame::MapHud', 100, $map_hud, :update)
```

Both take the same first four arguments:

- `reason` : one of the reasons above.
- `klass` : the scene class the task belongs to (a class like `Scene_Map`, or the symbol `:any` to run on every scene). The task only fires while a scene of that class is active.
- `name` : a string identifying the task. Namespace it (for example `'MyGame::MapHud'`) so it is unique and easy to remove later.
- `priority` : an integer ordering the task against the others (see below).

There is a subtle but important difference. `add_message` captures the object **at registration time**, so `$map_hud` must already exist when you register. `add_proc` evaluates its block **each time the task runs**, so it can read a global that is set later. When the target may not exist yet, prefer `add_proc` with safe navigation, as shown above.

### Priority and `:any`

When several tasks share the same reason and class, **priority** decides the order: a higher priority number runs first. A task registered with priority `1000` runs before one registered with priority `100`.

The `:any` class is special. Its tasks run for **every** scene of that reason, and they run **before** the tasks tied to a specific class. So with both an `:any` task and a `Scene_Map` task on `:on_update`, the `:any` task runs first on the map. Use `:any` for behaviour that must follow the player across every scene (a global hotkey, a debug overlay), and a concrete class when the behaviour only makes sense in one scene.

### Removing a task, and a word on `start`

A task lives until you remove it. Use `__remove_task` with the **same** reason, class, name and priority you registered with:

```ruby
Scheduler.__remove_task(:on_update, Scene_Map, 'MyGame::MapHud', 100)
```

The `name` and `priority` are how the Scheduler finds the exact task to drop, which is why a unique, namespaced name matters. This is how a feature that toggles on and off (a weather effect, a dynamic light) registers itself when enabled and removes itself when disabled.

You will see `Scheduler.start(reason, scene_class)` in the engine, but you rarely call it yourself: it is the engine triggering a reason, not you. For instance `Graphics.update` runs `Scheduler.start(:on_update)` every frame, and a scene runs `Scheduler.start(:on_init, self.class)` inside its `main`. You only call `start` if you invent your own reason, which also means declaring it in `Scheduler.init` first, and choose where to fire it. This is uncommon (see [Firing your own action](#firing-your-own-action) for the easier event-side equivalent).

### What PSDK schedules this way

These tasks are not a special API: the engine's own features are built on the exact calls above. Seeing them makes the role concrete:

| Feature          | Reason                                   | What it does                                                                |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Berry growth     | `:on_update`                             | Grows planted berries using the time system.                                |
| Dynamic lighting | `:on_update`, `:on_init`, `:on_warp_end` | Updates the map's light sources each frame and rebuilds them on map change. |
| Debug overlay    | `:on_update` (`:any`)                    | Refreshes the debugger on top of every scene.                               |
| Soft reset       | `:on_update` (`:any`)                    | Watches for the soft-reset key combination on every scene.                  |

The dynamic lighting system, for example, registers its per-frame update on the map and removes it when it is no longer needed, exactly as your own code would:

```ruby
Scheduler.add_message(:on_update, Scene_Map, 'NuriYuri::DynamicLight', 100, self, :update)
# ...later, when disabled:
Scheduler.__remove_task(:on_update, Scene_Map, 'NuriYuri::DynamicLight', 100)
```

### A complete example

Suppose you built a custom HUD that must refresh every frame while the player is on the map. Put a single script in your project (for example `scripts/My_Project/0001 Map HUD.rb`) that registers the task at load time:

```ruby
module MyProject
  # Your custom map HUD, created and stored in a global when the map opens.
  module_function

  def update_map_hud
    $map_hud&.update
  end
end

# Register once, at script load. The engine handles the rest.
Scheduler.add_proc(:on_update, Scene_Map, 'MyProject::MapHud', 100) do
  MyProject.update_map_hud
end
```

That is the whole integration. Because the task is tied to `Scene_Map`, it only runs on the map, never in battle or in a menu, so no scene check is needed inside the block. You never edited a single engine file, and the next PSDK update leaves your code untouched.

## Map event tasks

The lifecycle scheduler knows nothing about the player walking around. That is the job of the second scheduler, `Scheduler::EventTasks`. It reacts to the **actions of a character on the map**, and it is what powers movement-driven mechanics.

### How it works

An event task is registered against three things: an **action type**, an **event** and a **map**. When a character performs that action, the engine triggers the matching tasks and passes them the character that moved.

The six action types are the start and end of the three ways a character can move:

- `:begin_step` / `:end_step` : a tile-by-tile step.
- `:begin_jump` / `:end_jump` : a jump, such as dropping down a ledge or a "Jump" move command.
- `:begin_slide` / `:end_slide` : a slide, such as on ice or rapids.

`:end_step` is by far the most common: "the player just took a step" is the hook behind most overworld mechanics.

### Registering and removing

You register with `on`, and the block receives the character that triggered the task:

```ruby
# Run code every time the player finishes a step
Scheduler::EventTasks.on(:end_step, 'MyGame::StepCounter', -1) do |event|
  $game_variables[STEP_COUNT_ID] += 1
end
```

The arguments are:

- `task_type` : one of the six actions above.
- `description` : a string identifying the task, like the `name` of a lifecycle task. Used to remove it later.
- `event_id` : which character triggers it. `-1` is the player, `-2` its first follower, `-3` the second, and so on; a positive number is a map event by its id; `:any` matches every character. Defaults to `:any`.
- `map_id` : which map it triggers on, or `:any` for every map. Defaults to `:any`.

The block is called with `|event, event_id, map_id|`: the `Game_Character` that moved, and (useful for `:any` tasks) which event and map it was.

Remove a task with `delete`, using the same type, description, event and map:

```ruby
Scheduler::EventTasks.delete(:end_step, 'MyGame::StepCounter', -1, :any)
```

### Firing your own action

The six actions above are the ones the map engine triggers, but the system does not hard-code them: `EventTasks` accepts any action type you invent. To add your own, register a handler with `on` under a new symbol, then call `trigger` wherever that action should happen, passing the character it concerns:

```ruby
# A custom action you fire yourself from your own (monkey-patched) code
Scheduler::EventTasks.on(:begin_surf, 'MyGame::SurfSplash', -1) do |event|
  # play a splash where the player starts surfing
end

# ...at the point where surfing begins, in your patch:
Scheduler::EventTasks.trigger(:begin_surf, $game_player)
```

This works because an event task type is created on demand. The lifecycle scheduler is stricter: its reasons are a fixed list set up at boot, and registering a task on an unknown reason is **silently ignored**. Adding a brand-new lifecycle reason means patching `Scheduler.init` to declare it first. That is why, in practice, you reuse the ten existing reasons and only invent new triggers on the event side.

### What PSDK schedules this way

Most of what happens "as the player walks" is an event task on the player (`event_id -1`):

| Task            | Action        | What it does                                            |
| --------------- | ------------- | ------------------------------------------------------- |
| Repel count     | `:end_step`   | Counts down the remaining Repel steps.                  |
| Poison          | `:end_step`   | Applies poison damage while walking.                    |
| Hatch check     | `:end_step`   | Advances eggs toward hatching.                          |
| Daycare         | `:end_step`   | Updates the Day Care state.                             |
| Step evolution  | `:end_step`   | Handles evolutions that depend on steps walked.         |
| Battle starting | `:begin_step` | Rolls for a wild encounter as the step begins.          |
| Jump dust       | `:end_jump`   | Spawns dust or water particles where a character lands. |

The jump-dust task is a good template because it applies to every character, not just the player:

```ruby
Scheduler::EventTasks.on(:end_jump, 'Dust after jumping') do |event|
  next if event.particles_disabled

  particle = Game_Character::SurfTag.include?(event.system_tag) ? :water_dust : :dust
  Yuki::Particles.add_particle(event, particle)
end
```

## Which one should I use?

- The behaviour must run **continuously or at a scene boundary** (every frame, on init, on warp, on dispose): use a **lifecycle task** (`Scheduler.add_proc` / `add_message`).
- The behaviour must run **when a character moves** on the map (a step, a jump, a slide): use a **map event task** (`Scheduler::EventTasks.on`).

A step counter is an event task. A per-frame HUD refresh is a lifecycle task. When in doubt, ask whether the trigger is "the player did something" (event task) or "the scene reached a moment" (lifecycle task).

## Conclusion

- The **Scheduler** runs your code at precise moments without editing the engine, through two complementary systems.
- **Lifecycle tasks** (`Scheduler`) are indexed by a **reason** and a **scene class**. You register with `add_proc` (block) or `add_message` (method on an object); the engine triggers them with `start`; you remove them with `__remove_task`.
- **Priority** orders lifecycle tasks (higher runs first), and `:any` tasks run on every scene, before the class-specific ones.
- **Event tasks** (`Scheduler::EventTasks`) are indexed by an **action** (`:end_step`, `:end_jump`, ...), an **event** and a **map**. You register with `on` and remove with `delete`; the block receives the character that moved. You can also invent your own action type and fire it with `trigger`.
- PSDK's own features ride on both: dynamic lighting and berry growth are lifecycle tasks; Repel, poison, hatching and jump dust are event tasks.
- Choose by the trigger: a scene moment is a lifecycle task, a character moving is an event task.
