---
title: "The Data/Tiled folder"
slug: tiled-project-structure
sidebar_position: 4
description: "Everything Tiled-related in a PSDK project lives under Data/Tiled, split into Maps, Tilesets, Assets and Overviews. Three of these folders belong to the maker and one is written by Pokémon Studio. This page describes what goes where, why a map records its tilesets as relative paths, and what the demo maps are for."
---

Everything Tiled-related in a PSDK project lives under `Data/Tiled`, split into `Maps`, `Tilesets`, `Assets` and `Overviews`. Three of these folders belong to the maker and one is written by Pokémon Studio. This page describes what goes where, why a map records its tilesets as relative paths, and what the demo maps are for.

## The four folders

| Folder | Contents | Written by |
| --- | --- | --- |
| `Maps` | the maps of the project, `.tmx` files only | you |
| `Tilesets` | the tilesets of the project, `.tsx` files only | you |
| `Assets` | the `.png` images the tilesets are cut from | you |
| `Overviews` | one `.png` preview per map | Pokémon Studio |

You never edit `Overviews` by hand. Pokémon Studio fills it by running Tiled's renderer, with the reserved layers hidden: automatically when maps are imported or updated, and on demand from a map's **Map** tab when its image is missing.

A fifth entry, the hidden `.jobs` folder, holds the conversion queue Studio writes and the engine consumes. It is internal plumbing: leave it alone.

## Why the split matters

A `.tmx` does not embed its tilesets. It references them by **relative path**, from the map file to the tileset file:

```markdown
<tileset firstgid="1" source="../Tilesets/TECH-borders.tsx"/>
```

A `.tsx` in turn references its `.png` the same way. That chain only resolves if each kind of file sits in the folder the others expect. A tileset saved next to the map, or a `.png` left on the desktop, produces a map that opens fine on your machine and cannot be converted, or cannot be opened at all by anyone else who clones the project.

The upside of relative paths is that the whole `Data/Tiled` tree is portable: it moves, it is archived, it is committed to Git as-is.

## One project per Tiled window

Tiled makes the tilesets of every open map available to every other open map in the same window. With two projects open side by side, nothing stops you from painting a tile from project A onto a map of project B. The map records that tileset as a relative path pointing outside its own project, and the conversion fails.

Opening several maps of the **same** project at once is fine and useful. Working on two projects at once means launching **two separate instances of Tiled**, one per project.

:::warning[One Tiled window per project]

Never open maps from two different projects in the same Tiled window. Their tilesets become mutually available, and a map that borrows one is no longer convertible.

:::

## The Technical Demo maps

The base project ships with the maps of the technical demo, numbered `001` to `021` in `Maps`. They are real, converted, working maps, and they are the fastest reference available: an animated tileset, a map carrying all the reserved layers, a bridge, a cave, an interior.

Keep them. Deleting them costs you that reference and gains you little, since they are not reachable from your own game unless you link them. If you would rather ship a clean project, the usual approach is to keep two: yours, and a second one kept solely to open the demo and look things up.

Playing the demo before dissecting it is worth the three to four hours it takes. Its events are written to be read, and knowing what a map does in game makes its structure obvious in the editor.

## The Blank Template

`000 Blank_Template.tmx` is a starting map with its layer stack already set up: layers named for their role and their superposition priority, and the reserved layers at the bottom of the stack. It was built around SirMalo's HGSS tilesets and the automapping rules shipped next to it in `Maps`, as `rules.txt` and the `rules_TECH_*.tmx` files.

If you use those tilesets, start from a copy of the template. If you do not, the template's layer names will not match your automapping rules, and you are better off building your own template once and copying it for every new map.

## Conclusion

- `Data/Tiled` holds `Maps` for `.tmx`, `Tilesets` for `.tsx`, `Assets` for the `.png` sources, and `Overviews` for the previews Studio generates.
- Maps reference tilesets by relative path, so a file saved in the wrong folder breaks the map for everyone but you.
- Two projects open in one Tiled window can borrow each other's tilesets; use one instance per project.
- The technical demo maps are the reference to keep, and the demo is worth playing before reading it.
- `000 Blank_Template.tmx` is a ready-made layer stack, tied to the HGSS tilesets and their automapping rules.
