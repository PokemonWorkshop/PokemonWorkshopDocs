---
title: "Introduction to Tiled"
slug: introduction-to-tiled
sidebar_position: 1
description: "Since Pokémon Studio 2.0, the maps of a PSDK project are built in Tiled rather than in RPG Maker XP. Tiled is a free, general-purpose map editor whose files are read by Pokémon Studio and converted into the data the engine expects. This page explains what Tiled brings to a project, what it does not handle, and where to learn the editor itself."
---

Since Pokémon Studio 2.0, the maps of a PSDK project are built in **Tiled** rather than in RPG Maker XP. Tiled is a free, general-purpose map editor whose files are read by Pokémon Studio and converted into the data the engine expects. This page explains what Tiled brings to a project, what it does not handle, and where to learn the editor itself.

## What Tiled is

Tiled is a standalone map editor, free and open source, with no connection to PSDK. It is used by many games outside the Pokémon fangame world, which is why its documentation and its community are far larger than anything a fangame-specific tool could offer.

It works with two file formats, both plain XML:

- `.tmx` for a **map**, the grid itself and its layers.
- `.tsx` for a **tileset**, the description of a tile sheet: tile size, transparency, animations.

Both formats are readable text, which matters for a project under version control: two makers can work on different maps without producing an unmergeable binary file.

## The vocabulary of mapping

Four words come back on every page of this section. If you have never used a map editor, read these first:

- A **tile** is one square of the map, 32 by 32 pixels. A map is a grid of tiles, and you never draw pixel by pixel.
- A **tileset** is a sheet of artwork cut into tiles, the palette you pick from. A map uses as many as it needs.
- A **layer** is one level of drawing. A map stacks several: the ground, then what stands on it, then what passes over the player's head. Tiled shows them as a list you paint on one at a time.
- **Automapping** is a Tiled feature that replaces tiles automatically from rules you write, which takes repetitive placement off your hands.

## Why PSDK uses Tiled

The RPG Maker XP map editor only offers three layers, a single tileset per map, and animation only through its seven autotile slots. Tiled lifts those limits at authoring time: as many layers as you want, group layers to organise them, animated tiles, tile flipping and rotation, and automapping.

The chain that turns a Tiled map into something the engine can run has two steps:

1. **Pokémon Studio** reads the `.tmx` and its `.tsx` files, and writes the map metadata into the project's Studio data.
2. A converter shipped with the engine reads that metadata and produces the RPG Maker XP data files the map engine loads at runtime.

This second step is why some of the rules documented in this section look arbitrary. They are not Tiled limitations: they come from the RPG Maker XP data format the conversion targets. The clearest example is the **three tile layers** a map is compressed into, which drives the layer priority system and the animated tile budget.

:::info[These constraints are tied to RPG Maker XP]

Pokémon Studio v3.0 will move away from RPG Maker. The limits documented in this section that come from that target format, rather than from Tiled itself, are expected to be relaxed then. Which ones, and how far, is not settled: map with the rules as they stand today.

:::

## What Tiled does not handle

Tiled only produces the map. Everything else lives elsewhere:

- The **game database**, creatures, moves, items, encounter groups, is managed in Pokémon Studio.
- The **events**, NPCs, dialogues, doors, cutscenes, are still created in RPG Maker XP. See [RPG Maker XP basics](/rpg-maker-xp/rpg-maker-xp-basics).

A map therefore exists in two places at once: its visual and physical description in the `.tmx` file, and its events in the RPG Maker XP map that Pokémon Studio keeps in sync with it.

## Learn Tiled

This section documents what is **specific to a PSDK project**: folder layout, reserved layer names, conversion constraints. It does not teach the editor itself. For that, start here:

| Resource | Language | Link |
| --- | --- | --- |
| Official Tiled manual | English | [doc.mapeditor.org](https://doc.mapeditor.org/en/stable/) |
| Official Tiled manual | French | [doc.mapeditor.org](https://doc.mapeditor.org/fr/stable/) |
| Video tutorial by Invatorzen | English | [YouTube](https://www.youtube.com/watch?v=5A8gjBRGAAI) |
| Video tutorial by SirLinfey | French | [YouTube](https://www.youtube.com/watch?v=0WnjTuulYMY) |
| Moving from RPG Maker XP to Tiled, by Fuyutaa | French | [YouTube](https://www.youtube.com/watch?v=ItE0JN9ben0) |

The technical demo shipped with the base project is the other reference worth using. Its maps are real, converted, working maps, and reading one in Tiled answers most questions faster than any guide.

## Conclusion

- Tiled is a free, general-purpose map editor, and it has been the map tool for PSDK projects since Pokémon Studio 2.0.
- It stores maps as `.tmx` and tilesets as `.tsx`, both plain XML, which keeps them mergeable under version control.
- Pokémon Studio reads those files and an engine-side converter turns them into RPG Maker XP data.
- Most constraints documented in this section come from that RPG Maker XP target format, not from Tiled.
- The database stays in Pokémon Studio and the events stay in RPG Maker XP.
