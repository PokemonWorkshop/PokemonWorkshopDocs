---
title: "Modify an event's attributes through its name"
slug: event-name-attributes
sidebar_position: 4
description: "In PSDK, an event's name is more than a label: it carries tags that change how the event behaves and how it is drawn on the map. This page lists every attribute you can set through the name and explains what each one does."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

In PSDK, an event's name is more than a label: it carries **tags** that change how the event behaves and how it is drawn on the map. This page lists every attribute you can set through the name and explains what each one does.

## How the name is parsed

When a map loads, PSDK reads each event's name once and pulls the attributes out of it. Two consequences follow from this:

- The name is read **only when the event is created**. Renaming an event while the game runs has no effect until the map is reloaded.
- You can stack several attributes in a single name, as long as they do not conflict (see [Combining attributes](#combining-attributes)).

Attributes come in three shapes:

- **Leading characters**, which only work at the very start of the name (`§`, `¤`).
- **Bracket tags**, which the engine finds anywhere in the name (`[particle=off]`, `[offset_y=-8]`, ...).
- **Substrings**, which the engine also looks for anywhere (`surf_`, `invisible_`, `$`).

The readable part of the name is irrelevant to the player, who never sees it. So `surf_Lapras` or `[sprite=off]Intro cutscene` are perfectly valid names.

### Quick reference

| Attribute | Form | Effect |
| --- | --- | --- |
| `§` | leading character | Removes the event's shadow |
| `¤` | leading character | Draws the event above the player when they overlap |
| `$` | anywhere | Reuses page 1's appearance on every page |
| `[particle=off]` | anywhere | Disables movement particles |
| `[sprite=off]` | anywhere | Creates no sprite at all (logic-only event) |
| `[reflection=on]` | anywhere | Adds a water reflection |
| `[offset_x=N]` | anywhere | Shifts the event horizontally |
| `[offset_y=N]` | anywhere | Shifts the event vertically |
| `[z=N]` | anywhere | Sets the event's altitude layer |
| `[noslide=on]` | anywhere | Ignores sliding tiles (ice, rapids) |
| `[alias=name]` | anywhere | Gives the event a stable name for scripts |
| `surf_` | anywhere | Makes the event move on water only |
| `invisible_` | anywhere | Hidden object, found by facing it or with the Itemfinder |

## Rendering and depth

### Remove the shadow — `§`

By default PSDK draws a small translucent shadow under every character. For a statue, a sign, or any object that should sit flat on the ground, that shadow looks wrong. Make `§` the **first character** of the name (`§Statue`) to remove it. It only works as the leading character: a `§` placed later in the name is ignored.

### Draw the event above the player — `¤`

When an event and the player end up on the same tile, the engine decides who is drawn on top from their positions, and the player usually wins. Start the name with `¤` to raise the event's draw priority so it is rendered **above** the player when they overlap. Like `§`, it only works as the first character.

Because both `§` and `¤` rely on being the first character, **you cannot use both on the same event**.

### Disable movement particles — `[particle=off]`

When a character moves over certain tiles (tall grass, sand, puddles) PSDK spawns small particles under it. Add `[particle=off]` anywhere in the name to suppress them for this event.

### Add a water reflection — `[reflection=on]`

Add `[reflection=on]` so the engine draws a mirrored reflection of the event on reflective water tiles, the same way the player is reflected. It has no effect if water reflections are disabled globally.

### Set the altitude layer — `[z=N]`

`[z=N]` places the event on altitude layer `N` (an integer). The layer affects both the draw order and which level the player interacts with the event on. It is how multi-level structures such as bridges keep their upper and lower events apart. Leave it unset unless you are building layered terrain.

## Offset the event on screen

`[offset_x=N]` and `[offset_y=N]` nudge the event away from its tile **visually**, without moving it logically: its position for collisions and triggers stays on the tile. The value is expressed in the engine's internal screen units, where one tile spans 32 units, so `[offset_y=-8]` lifts the event by a quarter of a tile.

- `[offset_y=N]` — vertical. A positive value moves the event **down**, a negative value moves it **up**. Use a negative value to make an event hover above the ground (a flying creature, a floating platform).
- `[offset_x=N]` — horizontal. The same offset is also applied to the event's shadow, so it stays aligned under the sprite.

## Visibility

### Hide the sprite entirely — `[sprite=off]`

Some events exist only to run logic: an autorun event that drives a cutscene, a parallel-process event that watches a condition. They have no reason to be drawn. `[sprite=off]` tells PSDK not to create any sprite for the event at all, which is lighter than giving it a blank graphic or zero opacity. The event still runs according to its trigger.

### Create an invisible object — `invisible_` (or `OBJ_INVISIBLE`)

A hidden item on the ground has no visible graphic, yet the player can pick it up by facing the spot and pressing the action key, and the Itemfinder can locate it. Put `invisible_` anywhere in the name (or name the event exactly `OBJ_INVISIBLE`) to get this behavior: the event becomes triggerable by facing it even without a graphic, and the Itemfinder's search includes it (within a range of about 10 tiles horizontally and 7 vertically).

## Movement behavior

### Walk on water — `surf_`

A swimmer or a water Pokémon should move on water and be blocked on land, the opposite of a normal character. Put `surf_` anywhere in the name (`surf_Swimmer`): the event can then only step on surfable water tiles, and is blocked on land, waterfalls and whirlpools.

### Ignore sliding tiles — `[noslide=on]`

Ice and current tiles normally force a character to keep sliding in one direction. Add `[noslide=on]` so the event ignores them and moves tile by tile as usual.

## Authoring helpers

### Reuse page 1's appearance — `$`

An event with several pages usually repeats the same graphic on every page, which is tedious to set up and easy to get wrong. Include `$` anywhere in the name and PSDK always uses **page 1's appearance**, whatever page is active. Set the graphic once on page 1 and ignore it on the others.

### Reference an event from a script — `[alias=name]`

Referring to an event by its numeric ID is fragile: insert or delete an event and the IDs shift. `[alias=name]` registers a stable symbol for the event so a [Script command](/rpg-maker-xp/using-the-interpreter-in-an-event) can fetch it by name instead of by ID. The alias may contain lowercase letters, digits, hyphens and underscores, and it must be unique on the map (PSDK logs an error if the same alias appears twice).

## Combining attributes

Tags stack freely as long as no two of them need to be the first character, which is why `§` and `¤` are mutually exclusive. The readable part can go anywhere. For example:

`$[offset_y=-24][reflection=on][particle=off] Wingull`

reuses page 1's appearance (`$`), hovers three quarters of a tile above the ground (`[offset_y=-24]`), casts a reflection on the water below (`[reflection=on]`) and spawns no particles (`[particle=off]`). The player only ever sees the creature, never its name.

## Conclusion

- An event's name carries attributes in three forms: leading characters (`§`, `¤`), bracket tags (`[...]`) and substrings (`surf_`, `invisible_`, `$`).
- The name is parsed once, when the map loads. Rename then reload to apply a change.
- `§` and `¤` must be the first character and cannot be combined. Every other tag can appear anywhere and stack.
- Use the tags to control rendering (`§`, `¤`, `[particle=off]`, `[reflection=on]`, `[z=N]`), position (`[offset_x=N]`, `[offset_y=N]`), visibility (`[sprite=off]`, `invisible_`), movement (`surf_`, `[noslide=on]`) and authoring (`$`, `[alias=name]`).
