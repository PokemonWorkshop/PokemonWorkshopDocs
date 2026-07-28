---
title: "Create a map and link it to Studio"
slug: create-and-link-a-map
sidebar_position: 7
description: "A Tiled file only becomes a playable map once Pokémon Studio knows about it. Studio offers one route for a single map and another for a batch, and in both cases it copies the .tmx into the project itself. This page covers creating a map, attaching a Tiled file to an existing one, and re-converting a map after editing it."
---

A Tiled file only becomes a playable map once Pokémon Studio knows about it. Studio offers one route for a single map and another for a batch, and in both cases it copies the `.tmx` into the project itself. This page covers creating a map, attaching a Tiled file to an existing one, and re-converting a map after editing it.

## What linking actually does

A Studio map is a database entry: a name, a description, a step count for wild encounters, a background music, and the name of the Tiled file that draws it. Linking is what writes that filename into the entry and makes Studio read the file.

This is why you never place a `.tmx` in `Data/Tiled/Maps` by hand and expect it to appear: the folder is where the file must **end up**, not how Studio learns it exists. Every route below copies the file there for you.

## Create a single map

From the map list, **New map** opens the creation editor:

1. Give the map a **name** and a description.
2. Set **Steps average**, the number of steps between two wild encounters, from 1 to 999. The default is 30.
3. In the **Map made with Tiled** field, drop the `.tmx` file. Studio copies it, and the tilesets and images it references, into the project.
4. Optionally set a background music and a background sound.
5. Click **Add the map**.

The Tiled field is optional. Creating the map first and drawing it later is a normal workflow.

If the file is refused, the message appears in red inside the **Musics** section of the editor, prefixed by the filename. Expand that section when you dropped a file and nothing seems to have happened.

## Attach a file to an existing map

Click the map's information block to open its **Information** editor. It carries the same **Map made with Tiled** field: drop the `.tmx` there.

Clearing that field detaches the file and discards the tile metadata Studio had built from it, so the map stops being playable until a file is attached again.

## Import several maps at once

For an existing set of `.tmx` files, which is the usual case when starting from a Tiled project built outside Studio or when migrating, Studio has a batch route. Open **New map**, then click **Assign** in the **Assign Tiled maps** panel. On a project that has no map at all, the same dialog is reachable from the **Import** button of the empty map list.

Select the folder and the files, then use the **Map in Pokémon Studio** column to decide **per file** what it becomes:

- **New map** creates a fresh Studio entry for it.
- An **existing map** in the list attaches the file to that entry instead, replacing whatever it was linked to.

That per-file choice is the whole point of the dialog: importing a project and attaching a file to a map you already created are the same operation, told apart only by what you pick in that column.

## Re-convert a map after editing it

Editing a map in Tiled does not update the game on its own. Each time the Studio window regains focus, it re-checks every linked `.tmx` against the modification date it recorded, and offers **Update modified maps** when something changed. Running it re-reads the files and rebuilds what the engine loads.

A map you edited but never updated keeps playing its previous version, which is the usual explanation for a change that stubbornly refuses to appear in game.

:::info[Open a map from Studio]

**Open with Tiled** launches the editor on the right file directly. Going through Studio rather than opening `Data/Tiled/Maps` in Tiled by hand guarantees you edit the file the map is actually linked to, and keeps you in one project per Tiled window.

:::

## Conclusion

- A Studio map entry stores the name of the Tiled file that draws it; linking is what makes a `.tmx` playable.
- **New map** creates one map and takes its `.tmx` in the **Map made with Tiled** field.
- **Assign**, in the **New map** editor, opens the **Assign Tiled maps** dialog, where each file becomes either a new map or an assignment to an existing one.
- Studio copies the `.tmx` and its dependencies into `Data/Tiled` itself; you do not place them by hand.
- After editing a map in Tiled, run **Update modified maps** or the change never reaches the game.
