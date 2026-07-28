---
title: "Animated tiles"
slug: animated-tiles
sidebar_position: 8
description: "Tiled's animated tiles work in a PSDK project, under constraints inherited from the RPG Maker XP format the conversion targets: frames must share one tileset, durations are quantised to a fixed step, and each map has a hard budget of distinct animated tiles. This page covers building an animated tile and staying inside that budget."
---

Tiled's animated tiles work in a PSDK project, under constraints inherited from the RPG Maker XP format the conversion targets: frames must share one tileset, durations are quantised to a fixed step, and each map has a hard budget of distinct animated tiles. This page covers building an animated tile and staying inside that budget.

## Build an animated tile

An animation is defined in the tileset, not in the map. Every frame is a tile of that same `.tsx`, so a tile animated across two tilesets is not possible: put all the frames on one sheet.

The demo ships a reference, `TECH-Animations.tsx`, used by several maps including `006 Beach.tmx`. Opening it shows how frames are laid out on the sheet before being tied together.

Declaring an animation frame by frame in Tiled's animation editor gets tedious quickly. The [Bulk Animations plugin](https://github.com/lukas-shawford/tiled-bulk-animations) automates it across a whole tileset. If you use it, credit its authors in your game: work like this deserves to be named.

## Frame durations

Durations are set in milliseconds in Tiled, and the conversion **quantises** them. The step comes from the project's display configuration, specifically the number of engine frames an autotile holds, which is 6 by default. At 60 frames per second that gives a step of **100 milliseconds**.

Two consequences follow:

- A duration is truncated down to the step. 250 ms becomes 200 ms, not 300.
- Any duration below the step is raised to one step. 40 ms plays at 100 ms.

Using multiples of 100 ms therefore means the animation plays at the speed you designed, rather than at whatever the truncation leaves.

The frame count itself is not capped by the conversion, but every frame adds a row to the generated texture. Long animations produce tall images, which is a cost worth keeping in mind on weaker machines.

## The budget of distinct animated tiles

RPG Maker XP holds animated tiles in seven autotile slots of 32 tiles each. That gives a hard ceiling of **224 distinct animated tiles per map**. Past it, the conversion stops with:

```bash
[RMXP ERROR] This map has too many animated diverse tiles
```

This one does not appear in Studio. Unlike the checks above, which reject a file the moment Studio reads it, this limit is only hit later, on the engine side, so the message shows up in the compilation output rather than next to a filename.

The count is not a simple total. Animated tiles are grouped by **number of frames**, and each group is rounded up to a multiple of 32. A map using 33 tiles of 4 frames and 2 tiles of 8 frames spends 64 plus 32, so 96 of its 224, not 35. Keeping animations to a small number of frame counts costs far less budget than spreading them across many.

### The rule of three

A converted map has exactly three tile layers, because that is all RPG Maker XP offers. When more than three tiles stack on one position, the conversion **merges** them into composite tiles. A composite tile containing an animated tile is itself a new distinct animated tile, and it eats budget that nothing on screen justifies.

The practical rule: at a position carrying an animated tile, keep at most three superposed tiles. In other words, only map what is visible. Tiles hidden under an opaque layer cost budget and show nothing.

This does not apply to animated tiles stacked on each other: the conversion fuses as many of them as it can, based on their frame counts.

## Conclusion

- All the frames of an animation live on the same tileset, and the animation is declared there rather than on the map.
- Durations are truncated to a 100 millisecond step by default, and anything shorter is raised to one step.
- A map may hold 224 distinct animated tiles, counted by frame-count groups rounded up to multiples of 32.
- More than three superposed tiles on one position makes the conversion merge them, which creates extra animated tiles.
- `TECH-Animations.tsx` and `006 Beach.tmx` are the working references to open.
