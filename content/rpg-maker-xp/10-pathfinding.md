---
title: "Move a character with pathfinding"
slug: pathfinding
sidebar_position: 10
description: "PSDK can make an event or the player walk to a destination on its own, finding a route around walls and obstacles instead of following a fixed move route. This guide covers the find_path command, the kinds of target it accepts (coordinates, another character to chase or flee, a map edge), and how to make a character run, stop, or move the player the same way."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can make an event or the player walk to a destination on its own, finding a route around walls and obstacles instead of following a fixed move route. This guide covers the `find_path` command, the kinds of target it accepts (coordinates, another character to chase or flee, a map edge), and how to make a character run, stop, or move the player the same way.

## Why pathfinding instead of a fixed move route

RPG Maker XP's own way to move an event somewhere is the **Set Move Route** command: you spell out every step by hand, or pick **Move toward Player**, which only ever takes one step in the player's direction and walks straight into the first wall it meets. Neither knows the shape of the map. PSDK adds **pathfinding**: you name a destination, and the engine works out a full route to it, walking around walls, water and other obstacles, and recalculating on its own when something blocks the way.

Everything here goes through a **Script** command, there is no native RMXP event command for it. The commands are [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): called from an event's Script command without any prefix, they act on **that event**. The same methods work on the player and on any other character, as shown at the end.

Under the hood the route comes from a weighted search: each tile has a cost, so the path is not only short but natural, it prefers roads and avoids terrain like tall grass or swamp. Those preferences and a debug view are covered in the last section.

## Send a character to coordinates

The core command is `find_path`. Its only required argument is `to:`, the destination. Give it an `[x, y]` array of tile coordinates and the event walks there:

```ruby
find_path(to: [10, 15])
```

Called from an event's Script command, this sends that event to the tile at x = 10, y = 15, stepping around anything in the way. The coordinates are map tiles, the same numbers RPG Maker XP shows in the status bar when you hover a tile in the map editor.

A third value sets the z layer, for bridges and multi-level maps:

```ruby
find_path(to: [10, 15, 0])
```

## Stop short of the target: the radius argument

By default the character walks until it stands exactly on the target tile. The `radius` argument loosens that: it is the distance, in tiles, at which the target counts as reached. The distance is measured as the **Manhattan distance**, the sum of the horizontal and vertical gaps (`|dx| + |dy|`), not a straight line.

```ruby
find_path(to: [10, 15], radius: 3)
```

Here the event stops as soon as it gets within 3 tiles of (10, 15). A radius helps when the exact tile may be occupied, or when "near enough" is all you need, for an NPC that should walk up to a spot without standing precisely on it.

## Chase or flee a character

Instead of fixed coordinates, `to:` accepts another character, and the path then tracks it: if the target moves, PSDK recalculates the route automatically. You point at a character with `get_character`:

| `get_character` argument | Who it returns |
| --- | --- |
| `0` | the current event (the one running the script) |
| `-1` | the player |
| a positive number | the event with that ID on the map |

So an event that chases the player and stops one tile away:

```ruby
find_path(to: get_character(-1), radius: 1)
```

`get_character(-1)` and the `$game_player` global are interchangeable here:

```ruby
find_path(to: $game_player, radius: 1)
```

To chase another event, pass its ID, here event 8:

```ruby
find_path(to: get_character(8))
```

### Flee instead of chase

The same character target, with `type: :Character_Reject`, inverts the goal: the character moves **away** until it is more than `radius` tiles from the target. It is the command for an NPC or a wild Pokémon that runs from the player:

```ruby
find_path(to: $game_player, type: :Character_Reject, radius: 5, tries: :infinity)
```

This keeps the event fleeing until it is more than 5 tiles away, retrying forever (`tries: :infinity`, explained below) so it never gives up while the player keeps closing in.

## Walk to a map edge

The `:Border` target sends the character to one side of the map, named by a direction symbol: `:north`, `:south`, `:east` or `:west`.

```ruby
find_path(to: :north, type: :Border)
```

This walks the event to the top edge of the map. It is handy for an NPC that should leave the screen, walking off the nearest edge before you delete or hide it.

## Retry behaviour: the tries argument

When no path exists yet, the character is fenced in, or the target tile is unreachable, the search does not give up at once. It waits and tries again, up to `tries` times (default **5**). Each failed search pauses about a second before the next attempt.

```ruby
find_path(to: [10, 15], tries: 10)
```

Pass the symbol `:infinity` to retry forever, for a chase or a guard that should keep looking no matter what:

```ruby
find_path(to: $game_player, tries: :infinity)
```

This matters because the world can change between attempts: a door the player opens, an event that steps aside, a bridge that lowers. Each retry searches the map again from scratch, so a route that did not exist a second ago can be found on the next try.

## Run instead of walk

By default the character moves at its normal walking speed. Set `running: true` to make it move faster for the duration of the path, returning to its previous speed once it arrives:

```ruby
find_path(to: [10, 15], running: true)
```

On the player this triggers the actual running state; on an event it raises the move speed while the path lasts.

## Stop an ongoing path

A path normally ends on its own: when the character reaches the target, the request clears itself and the character stands still. To interrupt it before then, call `stop_path`:

```ruby
stop_path
```

Called from an event's Script command, this cancels that event's current path and leaves it where it stands. Use it to call off a chase when a switch flips, or to halt an NPC mid-route when the player triggers something. Starting a new `find_path` on the same character also replaces any path already running, so you only need `stop_path` when you want the character to simply stop.

## Move the player too

Everything above works on the player as well as on events. The shortest way to send the player somewhere is `fast_travel`, a helper that runs pathfinding on `$game_player`:

```ruby
fast_travel(x, y = nil, ms = 5)
```

- `x`, `y` — the destination tile.
- `ms` — the move speed for the trip. Optional, defaults to `5`.

```ruby
fast_travel(15, 20)
```

This sets the player's speed and walks them to (15, 20). To send the player to a map edge instead, pass a single border symbol and no `y`:

```ruby
fast_travel(:south)
```

For the full set of options on the player, call `find_path` directly on the `$game_player` global, exactly as on an event:

```ruby
$game_player.find_path(to: [15, 20], running: true)
```

Cancel it with `$game_player.stop_path`.

## Tuning and troubleshooting

### Visualise the path

When a character will not move where you expect, switch on the debug overlay to see the computed route drawn on the map:

```ruby
Pathfinding.debug = true
```

Each node of the path is marked on screen, with the destination highlighted. Turn it back off with `Pathfinding.debug = false`. This is the fastest way to tell whether the search found a route at all, or gave up because the target is walled off.

### Terrain the path prefers

The search weights tiles by their system tag, so the route is not just the shortest but the most natural. Roads and sand are cheap and favoured; tall grass and swamp tiles cost much more and are avoided whenever a detour exists. These weights live in `Pathfinding::TAGS_WEIGHT` and can be adjusted in a script if your maps need different priorities, but the defaults suit most games.

### Turn pathfinding off globally

Pathfinding runs every frame for every active request, and is enabled by default. To switch the whole system off, for a performance test or a minimal project, set the constant in a script:

```ruby
Game_Map::PATH_FINDING_ENABLED = false
```

If many characters pathfind at once and the frame rate dips, you can instead lower how many search steps run per frame:

```ruby
Pathfinding.operation_per_frame = 50
```

The default is `150`; a lower number spreads the work over more frames at the cost of slower path discovery.

## Conclusion

- `find_path(to: ...)` sends a character to a destination and routes around obstacles; called bare in a Script command it moves the current event.
- The `to:` target can be coordinates (`[x, y]`), another character (`get_character(id)` or `$game_player`) to chase, or a map edge (`type: :Border`).
- `radius` stops the character short of the target (Manhattan distance); `type: :Character_Reject` makes it flee instead of chase.
- `tries` sets how many times a blocked search retries (`:infinity` to never give up); `running: true` moves the character faster for the trip.
- `stop_path` cancels a path, and starting a new `find_path` replaces the current one.
- The player has the same abilities: `fast_travel(x, y)` (or a border symbol) is the shortcut, or call `$game_player.find_path` directly.
- Use `Pathfinding.debug = true` to see the route; the path prefers roads and avoids tall grass and swamp.
