---
title: "Create a map and link it to Studio"
slug: create-and-link-a-map
sidebar_position: 5
description: "A Tiled file only becomes a playable map once Pokémon Studio knows about it. Studio offers one route for a single map and another for a batch, and in both cases it copies the .tmx into the project itself. This page covers creating a map, attaching a Tiled file to an existing one, and re-converting a map after editing it."
---

A Tiled file only becomes a playable map once Pokémon Studio knows about it. Studio offers one route for a single map and another for a batch, and in both cases it copies the `.tmx` into the project itself. This page covers creating a map, attaching a Tiled file to an existing one, and re-converting a map after editing it.

## What linking actually does

A Studio map is a database entry: a name, a description, an average step count for wild encounters, a background music, and the name of the Tiled file that draws it. Linking writes that filename into the entry, then Studio reads the `.tmx`, extracts the tile metadata, and stores it so the engine-side converter can build the RPG Maker XP data.

This is why you never place a `.tmx` in `Data/Tiled/Maps` by hand and expect it to appear: the folder is where the file must **end up**, not how Studio learns it exists. Every route below copies the file there for you.

## Create a single map

From the map list, **New map** opens the creation editor:

1. Give the map a **name** and a description.
2. Set **Steps average**, the number of steps between two wild encounters, from 1 to 999. The default is 30.
3. In the **Map made with Tiled** field, drop the `.tmx` file. Studio copies it, and the tilesets and images it references, into the project.
4. Optionally set a background music and a background sound.

The Tiled field is optional. Creating the map first and drawing it later is a normal workflow, and the next section covers attaching the file afterwards.

## Import or assign several maps

The batch dialog handles an existing set of `.tmx` files, which is the usual case when starting from a Tiled project built outside Studio, or when migrating.

Select the files, then decide **per file** what it becomes:

- **New map** creates a fresh Studio entry for it.
- An **existing map** in the list attaches the file to that entry instead, replacing whatever it was linked to.

The same dialog therefore covers both **Import Tiled maps**, for files that should become new maps, and **Assign Tiled maps**, for files that belong to maps you already created.

## Re-convert a map after editing it

Editing a map in Tiled does not update the game on its own. Studio tracks the modification date and checksum of every linked `.tmx`, and when it detects a change it offers **Update modified maps**. Running it re-reads the files and refreshes the tile metadata.

A map you edited but never updated keeps playing its previous version, which is the usual explanation for a change that stubbornly refuses to appear in game.

:::info[Open a map from Studio]

**Open with Tiled** launches the editor on the right file directly. Going through Studio rather than opening `Data/Tiled/Maps` in Tiled by hand guarantees you edit the file the map is actually linked to, and keeps you in one project per Tiled window.

:::

## Conclusion

- A Studio map entry stores the name of the Tiled file that draws it; linking is what makes a `.tmx` playable.
- **New map** creates one map and takes its `.tmx` in the **Map made with Tiled** field.
- The batch dialog lets you choose, per file, between creating a new map and assigning the file to an existing one.
- Studio copies the `.tmx` and its dependencies into `Data/Tiled` itself; you do not place them by hand.
- After editing a map in Tiled, run **Update modified maps** or the change never reaches the game.
