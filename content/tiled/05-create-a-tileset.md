---
title: "Create a Tiled tileset"
slug: create-a-tileset
sidebar_position: 5
description: "A tileset is created in Tiled from a PNG placed in the project's Assets folder, and saved as a .tsx file next to the other tilesets. Two settings decide whether the map will convert at all: a tile size of 32 by 32 pixels, and the tileset staying external rather than embedded. This page walks through the creation and how to check a sheet really is a 32 by 32 tileset."
---

A tileset is created in Tiled from a PNG placed in the project's `Assets` folder, and saved as a `.tsx` file next to the other tilesets. Two settings decide whether the map will convert at all: a tile size of 32 by 32 pixels, and the tileset staying external rather than embedded. This page walks through the creation and how to check a sheet really is a 32 by 32 tileset.

## Add the source image

Copy the `.png` into `Data/Tiled/Assets`. The tileset file will reference it from there by relative path, so an image left anywhere else breaks as soon as the project moves or is cloned. See [The Data/Tiled folder](/tiled/tiled-project-structure).

## Create the tileset

In Tiled, **File**, then **New**, then **New Tileset**:

1. Pick the `.png` from `Data/Tiled/Assets`.
2. Keep the type set to **Based on Tileset Image**.
3. Set the tile width and height to **32** and **32**.
4. Leave **Embed in map** unchecked.
5. Apply a transparent color if the sheet uses one instead of an alpha channel.
6. Save the file into `Data/Tiled/Tilesets`.

The resulting `.tsx` is short and readable, which makes it easy to verify:

```markdown
<tileset version="1.10" name="HGSS Nature" tilewidth="32" tileheight="32" tilecount="3451" columns="48">
 <image source="../Assets/TECH-Nature.png" trans="f05ba1" width="1536" height="2080"/>
</tileset>
```

The tileset's internal `name` is independent of its filename, and nothing requires them to match.

:::danger[Never embed a tileset in the map]

An embedded tileset lives inside the `.tmx` instead of its own `.tsx` file. Studio rejects the map outright, with *Embedded tilesets are not supported* shown next to the filename. Leave **Embed in map** unchecked, always.

:::

## Check the tile size

A tileset drawn on a grid other than 32 by 32 does not raise an error. The conversion assumes 32 pixel tiles everywhere, so it slices the image on that grid regardless, and the map renders as a shifted mess with no message explaining why.

Checking takes a few seconds: open the `.png` in an image editor, select a single tile, preferably a square one with clear edges, and read the selection size. It must be 32 by 32. If it reads 16 by 16 or 48 by 48, the sheet has to be rescaled or redrawn before use.

## Transparency

Two ways of handling transparency work:

- A **PNG with an alpha channel**, nothing else to do.
- A **flat colour** declared as transparent in the tileset, recorded as the `trans` attribute. The demo tilesets use magenta, `f05ba1`, a colour chosen because it appears nowhere in the artwork.

The transparent colour is applied when the tileset image is turned into engine graphics, so it must be set on the tileset, not merely avoided while mapping.

## Conclusion

- The source `.png` goes into `Data/Tiled/Assets`, the `.tsx` into `Data/Tiled/Tilesets`.
- Tiles must be 32 by 32; any other grid silently produces a broken map.
- **Embed in map** must stay unchecked, or the map cannot be converted at all.
- Transparency comes either from an alpha channel or from a colour declared on the tileset.
- The `.tsx` is plain XML: open it to check the tile size, the image path and the transparent colour.
