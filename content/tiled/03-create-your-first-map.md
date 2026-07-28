---
title: "Create your first map"
slug: create-your-first-map
sidebar_position: 3
description: "The fastest way to get a playable map is to start from the blank template shipped with the base project, rather than from an empty Tiled file. This page walks through the whole loop once, from duplicating the template to walking on the map in game, so that the reference pages that follow have something concrete to attach to."
---

The fastest way to get a playable map is to start from the blank template shipped with the base project, rather than from an empty Tiled file. This page walks through the whole loop once, from duplicating the template to walking on the map in game, so that the reference pages that follow have something concrete to attach to.

Nothing here needs to be understood in depth on the first pass. Follow the steps, get a map you can walk on, then come back to the pages that explain each piece.

## Before starting

Tiled must be installed and its path declared in Pokémon Studio. If **Open with Tiled** does nothing for you yet, start with [Install and configure Tiled](/tiled/install-and-configure-tiled).

## 1. Duplicate the template

In your project, open the folder `Data/Tiled/Maps`. Copy and paste `000 Blank_Template.tmx`, and rename the copy after your map, for example `My_first_town.tmx`.

Starting from the template rather than from a new Tiled file saves you the whole layer setup: the layers are already named, already ordered, and the two special layers the engine needs are already there.

Because the file is already inside `Data/Tiled/Maps`, Studio will use it where it is instead of copying it again.

## 2. Create the map in Pokémon Studio

In Studio, go to the map list and click **New map**:

1. Give it a name.
2. Leave **Steps average** at 30 for now. That field controls how often wild encounters trigger.
3. In the **Map made with Tiled** field, select the `.tmx` you just created.
4. Validate.

The map now exists in your game, empty but real.

## 3. Paint something

Still in Studio, use **Open with Tiled** on your map. Tiled opens on the right file.

On the left you have the layer list, on the right the tilesets loaded by the template. To paint:

1. Pick a layer whose name ends with `1`, for example `Grass_1`. These are the ground layers, the ones drawn under the player.
2. Pick a tileset and a tile in it.
3. Draw on the map.

Do not rename the layers and do not delete them. Their names are what tells the conversion where each one goes, and the reasons are on [Layers and superposition priorities](/tiled/layers-and-priorities).

## 4. Block what should not be walked through

A map where the player walks through walls is not finished. Select the `passages` layer, pick the `passages` tileset, and paint the blocking tile over every tile the player should not cross.

This layer is not decoration: it is read as a property of each tile, not drawn on screen. That is why it must only ever receive tiles from its own tileset.

## 5. Save, then update in Studio

Save in Tiled, then come back to Studio. Studio notices the file changed and offers **Update modified maps**. Run it.

This step is not optional. Studio re-reads the `.tmx` and rebuilds the data the engine loads. Skipping it means the game keeps playing the previous version of the map, which is the single most common reason a change does not show up.

## 6. Test in game

Launch your game and go to the map. If you can walk on it and the walls block you, the loop is complete: **edit in Tiled, save, update in Studio, test**. Every map you build from now on is that same loop.

## What to read next

Now that the loop makes sense, the rest of the section fills it in:

| You want to | Read |
| --- | --- |
| Understand where files live and why | [The Data/Tiled folder](/tiled/tiled-project-structure) |
| Add maps in batches, or attach a file to an existing map | [Create a map and link it to Studio](/tiled/create-and-link-a-map) |
| Use your own tile sheets | [Create a Tiled tileset](/tiled/create-a-tileset) |
| Draw things above the player, or add tile behaviours | [Layers and superposition priorities](/tiled/layers-and-priorities) |
| Animate water, flowers or grass | [Animated tiles](/tiled/animated-tiles) |

## Conclusion

- Duplicating `000 Blank_Template.tmx` gives you a ready-made layer stack instead of an empty file.
- The map is created in Pokémon Studio, and the `.tmx` is selected in the **Map made with Tiled** field.
- Layers ending with `1` are the ground; the `passages` layer decides what blocks the player.
- Layer names must not be changed: they are what the conversion reads.
- The loop is always edit in Tiled, save, **Update modified maps** in Studio, test in game.
