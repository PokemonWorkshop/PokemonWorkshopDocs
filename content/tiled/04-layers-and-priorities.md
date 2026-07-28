---
title: "Layers and superposition priorities"
slug: layers-and-priorities
sidebar_position: 4
description: "The conversion reads a Tiled map through its layer names: five reserved names carry the tile properties the engine needs, and every other layer declares its superposition priority through the digit ending its name. A wrong name means a layer that is ignored, misread, or that breaks the conversion. This page lists the reserved layers, the tileset each one requires, and how priorities are declared."
---

The conversion reads a Tiled map through its layer names: five reserved names carry the tile properties the engine needs, and every other layer declares its superposition priority through the digit ending its name. A wrong name means a layer that is ignored, misread, or that breaks the conversion. This page lists the reserved layers, the tileset each one requires, and how priorities are declared.

## Reserved layers

Five layer names are reserved. Each one is read as tile **properties** rather than as graphics, and each one only accepts tiles from one specific tileset:

| Layer name | Role | Required tileset |
| --- | --- | --- |
| `passages` | which directions a tile can be crossed from | `passages.tsx` |
| `systemtags` | tile behaviour read by the map engine | `systemtags.tsx` |
| `systemtags_bridge1` | behaviour of the first bridge level | `systemtags.tsx` |
| `systemtags_bridge2` | behaviour of the second bridge level | `systemtags.tsx` |
| `terrain_tag` | variants of one tile, for example different encounter groups between two patches of tall grass | `terrain_tag.tsx` |

The names are matched exactly and are case sensitive. `SystemTags` or `Passages` are ordinary layers as far as the conversion is concerned, and their contents end up drawn on the map as graphics.

For what the System Tags themselves mean, and the full catalogue of them, see [Understanding System Tags](/psdk/core-systems/system-tags). This page only covers where they are painted.

:::danger[A reserved layer only accepts its own tileset]

Painting a tile from any other tileset on one of these five layers produces values the conversion cannot interpret. The tileset column above is not a recommendation.

:::

## Add a reserved layer only when you use it

A reserved layer requires its tileset to be present in the map. Adding a `systemtags` layer without also loading `systemtags.tsx` fails the conversion with *Failed to find tileset: systemtags.tsx*, and an empty layer added out of habit is exactly the case where the tileset never got loaded.

Reserved layers are also the exception to Tiled's visibility rules: hiding one in the editor changes nothing, it is still read. An ordinary layer hidden in Tiled, on the other hand, is dropped from the conversion entirely. That last point is worth remembering, since a layer hidden while working on something else disappears from the game if you forget to show it again.

The exemption is on the layer itself, not on what contains it. A reserved layer placed inside a hidden folder disappears with the folder, unless that folder's name starts with `system`.

## Superposition priority

Every layer that is not reserved must tell the conversion where it stands in the stack. The rule is simple: **the name ends with a digit from 1 to 6**.

```markdown
Grass_1
Tree_trunk_3
Roof_6
```

Only the final digit is read. The underscore is a readability convention, `Roof6` is understood the same way. A layer whose name ends with anything else, like the template's `▬_Bld_input`, falls back to the priority of the folder that contains it, which is 1 at the top level of the layer list.

The six levels map onto three distinct behaviours:

| Trailing digit | Behaviour |
| --- | --- |
| `1` | ground, drawn under the player |
| `2` | drawn over the player |
| `3` to `6` | drawn over the player, at increasing priority |

Six levels of authoring collapse into the three tile layers RPG Maker XP provides. That compression is what the rule of three, on the [animated tiles](/tiled/animated-tiles) page, is about.

### Priority on a folder

A folder can carry the priority for everything inside it. Name it `z=` followed by a digit, in **lowercase**, and every layer it contains that does not already end with its own digit takes that priority. The scale is the same as for layer names: `z=1` is the ground.

:::warning[The template's `Z=` folders are inert, and that is a trap]

Opening the Blank Template, you will see empty folders named `Z=0` to `Z=4` in the layer list. They declare nothing, for two reasons: they contain no layers, and the match is case sensitive, so an uppercase `Z=` is never read as a priority. Every real layer in the template carries its priority as a trailing digit instead.

Keep them or delete them, it changes nothing for the template as shipped. But do not copy that naming for a folder of your own: a folder you actually put layers into is only read if you name it `z=` in lowercase. Named `Z=`, it silently declares nothing and its layers fall back to the priority of whatever contains them.

:::

## Reference maps

Three maps of the technical demo are worth opening rather than reading about:

- `008 Marsh.tmx` is the only demo map carrying a `terrain_tag` layer, alongside `systemtags` and `passages`.
- `005 River.tmx` and `011 RocketHQ.tmx` use `systemtags_bridge1`, the layer that makes a bridge walkable over and under.
- `000 Blank_Template.tmx` shows a full layer stack, with its priorities already spelled out in the names.

## One more constraint

Infinite maps are not supported. When you create a map, Tiled's **New Map** dialog offers a **Map size** choice between **Fixed** and **Infinite**. Leave it on **Fixed**, which is the default, and give the map a width and a height in tiles. A map saved as infinite is refused with *Infinite maps are not supported.*

## Conclusion

- Five layer names are reserved: `passages`, `systemtags`, `systemtags_bridge1`, `systemtags_bridge2` and `terrain_tag`, each tied to one tileset.
- Reserved names are case sensitive, and a reserved layer is read even when hidden, unless a hidden folder contains it.
- Adding a reserved layer without loading its tileset fails the conversion.
- Every other layer declares its priority through a trailing digit from 1 to 6: 1 is ground, 2 and above are drawn over the player.
- A folder named `z=` in lowercase carries the priority of the layers inside it; the template's uppercase `Z=` folders declare nothing.
- Maps must have a fixed size; infinite maps are rejected.
