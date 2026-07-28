---
title: "Layers and superposition priorities"
slug: layers-and-priorities
sidebar_position: 7
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

A reserved layer requires its tileset to be present in the map. Adding a `systemtags` layer without also loading `systemtags.tsx` fails the conversion, and an empty layer added out of habit is exactly the case where the tileset never got loaded. Studio then shows *Failed to find tileset: systemtags.tsx* next to the name of the offending file.

Reserved layers are also the exception to Tiled's visibility rules: hiding one in the editor changes nothing, it is still read. An ordinary layer hidden in Tiled, on the other hand, is dropped from the conversion entirely. That last point is worth remembering, since a layer hidden while working on something else disappears from the game if you forget to show it again.

## Superposition priority

Every layer that is not reserved must tell the conversion where it stands in the stack. The rule is simple: **the name ends with a digit from 1 to 6**.

```markdown
Grass_1
Tree_trunk_3
Roof_6
```

Only the final digit is read. The underscore is a readability convention, `Roof6` is understood the same way. A layer whose name ends with anything else, like `Bld_input`, falls back to priority 1.

The six levels map onto three distinct behaviours:

| Trailing digit | Behaviour |
| --- | --- |
| `1` | ground, drawn under the player |
| `2` | drawn over the player |
| `3` to `6` | drawn over the player, at increasing priority |

Six levels of authoring collapse into the three tile layers RPG Maker XP provides. That compression is what the rule of three, on the [animated tiles](/tiled/animated-tiles) page, is about.

:::note[The `Z=` folders in the template do not set a priority]

Opening the Blank Template, you will see empty folders named `Z=0` to `Z=4` in the layer list. They are **visual markers** separating the priority groups, nothing more: they contain no layers and the conversion does not read them. Every real layer in the template already carries its priority as a trailing digit. Keep them, delete them or add more, it changes nothing in the result.

:::

## Reference maps

Three maps of the technical demo are worth opening rather than reading about:

- `008 Marsh.tmx` is the only demo map carrying a `terrain_tag` layer, alongside `systemtags` and `passages`.
- `005 River.tmx` and `011 RocketHQ.tmx` use `systemtags_bridge1`, the layer that makes a bridge walkable over and under.
- `000 Blank_Template.tmx` shows a full layer stack, with its priorities already spelled out in the names.

## One more constraint

Infinite maps are not supported. Tiled offers the option when creating a map, and Studio refuses the file with *Infinite maps are not supported*. Uncheck it at creation, and give the map a fixed width and height.

## Conclusion

- Five layer names are reserved: `passages`, `systemtags`, `systemtags_bridge1`, `systemtags_bridge2` and `terrain_tag`, each tied to one tileset.
- Reserved names are case sensitive, and a reserved layer is read even when hidden.
- Adding a reserved layer without loading its tileset fails the conversion.
- Every other layer declares its priority through a trailing digit from 1 to 6: 1 is ground, 2 and above are drawn over the player.
- `Z=` folders in the demo maps are visual separators, not priority declarations.
- Maps must have a fixed size; infinite maps are rejected.
