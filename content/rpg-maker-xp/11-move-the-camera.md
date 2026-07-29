---
title: "Move the camera to an event or tile"
slug: move-the-camera
sidebar_position: 11
description: "PSDK can smoothly pan the map camera away from the player to an event or a tile, then bring it back, all from an event's Script command. This guide covers move_camera_to_event and move_camera_to_tiles, how to return the camera to the player, whether the event waits for the pan or keeps running, and the curve the movement follows."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can smoothly pan the map camera away from the player to an event or a tile, then bring it back, all from an event's Script command. This guide covers `move_camera_to_event` and `move_camera_to_tiles`, how to return the camera to the player, whether the event waits for the pan or keeps running, and the curve the movement follows.

## Why move the camera at all

The map camera normally stays locked on the player: wherever the player walks, the view follows. That is what you want almost all the time, but not during a cutscene. When a door opens on the far side of town, a rival walks in from the edge of the screen, or a switch reveals a hidden staircase, the player should be looking at *that*, not at their own character standing still. Sliding the camera over to the action, holding it there, then sliding it back is what sells the moment.

RPG Maker XP does have a native **Scroll Map** command, but it only nudges the view a fixed number of tiles in one direction: you have to know the distance in advance, it never aims at anything, and the motion is flat. PSDK replaces it with two commands that take a **target**, an event or a tile, work out the scroll for you, ease the motion, and keep the view inside the map.

Both are [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): called from an event's Script command without any prefix. They act on the map, not on the event running them, so it does not matter which event you call them from.

## Pan the camera to an event

`move_camera_to_event` centres the view on an event over a set time. It takes the event's ID and a duration in seconds:

```ruby
move_camera_to_event(8, 1.5)
```

This glides the camera onto event 8 over 1.5 seconds. The ID is the number RPG Maker XP shows next to the event in the map editor, and the event must be on the current map. If no event has that ID, the command does nothing rather than raising an error.

A duration of `0` jumps straight to the target with no animation, useful when you want a hard cut rather than a glide:

```ruby
move_camera_to_event(8, 0)
```

## Pan the camera to a tile

When the spot you want to show is not an event, point the camera at raw tile coordinates with `move_camera_to_tiles`. It takes an x, a y and a duration:

```ruby
move_camera_to_tiles(20, 12, 1.5)
```

This centres the view on the tile at x = 20, y = 12 over 1.5 seconds. The coordinates are map tiles, the same numbers RPG Maker XP shows in the status bar when you hover a tile in the map editor. Use this to frame a part of the map that has no event on it, a bridge, a gate, a patch of ground about to change.

## Bring the camera back to the player

After a pan the view stays where you left it, it does **not** snap back on its own. End every cutscene by returning the camera to the player, or control will feel broken when the player tries to walk.

The player counts as event `-1`, so the same command brings the view home:

```ruby
move_camera_to_event(-1, 1.5)
```

There is also a named shortcut for exactly this, called on the map:

```ruby
$game_map.reset_camera_to_player(1.5)
```

Both glide the camera back onto the player over 1.5 seconds. From that point the camera resumes following the player normally.

## Make the event wait, or keep going: the block_interpreter argument

By default the event **waits** for the pan to finish before running its next command. That is the third argument, `block_interpreter`, and it defaults to `true`:

```ruby
move_camera_to_event(8, 1.5)            # event pauses here until the pan ends
show_message("There it is!")            # runs only once the camera has arrived
```

This is what you want for a scripted sequence: pan, then speak, then pan back, each step waiting for the last. Pass `false` to let the event carry on while the camera moves in the background:

```ruby
move_camera_to_event(8, 1.5, false)     # pan starts, event keeps running at once
```

With `false` the pan still plays out over its full duration, but the following commands fire immediately. Use it when the camera drift is a backdrop to something else happening at the same time, not a step the rest of the event should wait on.

## Choose the movement curve: the distortion argument

The fourth argument, `distortion`, sets how the speed of the pan is spread across its duration. It defaults to `:UNICITY_DISTORTION`, a constant, linear glide. Pass another symbol to change the feel:

| Distortion              | What the pan does                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `:UNICITY_DISTORTION`   | Constant speed from start to finish (the default).                                                                                 |
| `:SMOOTH_DISTORTION`    | A softened, non-linear pace instead of a flat speed, for a gentler glide.                                                          |
| `:SQUARE010_DISTORTION` | Travels all the way to the target by the halfway point, then returns to the start by the end, a single "peek" within the duration. |

```ruby
move_camera_to_event(8, 1.5, true, distortion: :SMOOTH_DISTORTION)
```

These symbols come from PSDK's animation system, which defines several more curves (oscillating and bouncing ones) meant for sprite effects rather than a camera. For most cutscenes `:UNICITY_DISTORTION` or `:SMOOTH_DISTORTION` is all you need.

## A short cutscene

The commands compose into a complete sequence inside one Script command. Pan to an event, wait, say a line, then return to the player, each step blocking by default so they play in order:

```ruby
move_camera_to_event(8, 1.0)            # glide to event 8, wait for it
show_message("The gate creaks open...")
move_camera_to_event(-1, 1.0)           # glide back to the player, wait for it
```

Because `block_interpreter` is `true` by default, you do not need to add any wait command between the steps, each one holds the event until its pan is done.

## Stay inside the map edges

On a stand-alone map, PSDK clamps the target so the camera never scrolls past the edges of the map: aim at an event in the corner and the view stops at the border instead of showing the void beyond it. On maps linked together with the map linker, that clamp is lifted so the camera can pan smoothly across the seam into the neighbouring map. You do not configure this, it follows from how the map is set up, but it explains why a pan toward an edge sometimes stops short of perfectly centring its target.

## Conclusion

- `move_camera_to_event(event_id, duration)` smoothly centres the camera on an event over `duration` seconds; the event must be on the current map.
- `move_camera_to_tiles(x, y, duration)` does the same for raw tile coordinates, for spots with no event on them.
- The camera does not return on its own: end a cutscene with `move_camera_to_event(-1, duration)` or `$game_map.reset_camera_to_player(duration)` to hand control back to the player.
- A `duration` of `0` cuts instantly instead of gliding.
- `block_interpreter` (third argument, default `true`) makes the event wait for the pan; pass `false` to keep running while the camera moves.
- `distortion` (default `:UNICITY_DISTORTION`) sets the motion curve; `:SMOOTH_DISTORTION` softens it, `:SQUARE010_DISTORTION` peeks and returns.
- On a single map the camera stays within the map edges; linked maps let it pan across the seam.
