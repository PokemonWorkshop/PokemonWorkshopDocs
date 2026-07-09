---
title: "Add a new type"
slug: add-a-new-type
sidebar_position: 2
description: "Adding a new type in Pokémon Studio creates its data but not its graphics, so the type icons come out broken in battle and in the menus. This guide creates the type in Studio, explains why PSDK mis-slices the type spritesheets when you add a type, and lists every image file to update."
---

Adding a new type in **Pokémon Studio** creates its data but not its graphics, so the type icons come out broken in battle and in the menus. This guide creates the type in Studio, explains why PSDK mis-slices the type spritesheets when you add a type, and lists every image file to update.

## Create the type in Studio

In Pokémon Studio, open **Database > Types** and click **New type**. Two fields matter:

- **Name**: the type's display name, the text shown wherever the type is named.
- **Color**: the color stored for the type.

Studio assigns the **next free id** automatically, then saves the type to `Data/Studio/types/<db_symbol>.json`. That record holds the type's `id`, `dbSymbol`, `color`, `textId` and its type-chart data (`damageTo`). There is no image field anywhere in it: **Studio never creates or resizes a graphic.** The **Color** you pick is stored as data, it is not used to draw the type's icon.

This is the whole reason the rest of this guide exists. As far as Studio is concerned the type is complete, but in game its icon is missing, and adding it shifts the icon of every other type too.

## Why the type icons break in battle

The symptom appears in battle: the type image shown on a move is wrong. It shows the wrong type, a picture shifted up by a few pixels, or a clipped sliver. Deleting the new type makes everything display correctly again, which is what makes the cause hard to guess.

PSDK stores each set of type icons as a single image: a vertical spritesheet with **one row per type**, stacked in type-id order. Row 0 is the empty "none" type (id 0), row 1 is the first real type, and so on down the strip.

The catch is that the file does not record how tall one row is. At load time PSDK cuts the image into as many equal rows as there are types in your database:

```ruby
# UI helper: as many rows as there are types in the database
super(viewport, 1, each_data_type.size)
```

```ruby
# SpriteSheet: a row's height is derived, never stored
h = value.height / @nb_y
```

So each row's height is `image height ÷ number of types`. With the 18 default types plus the "none" slot, the shipped spritesheets are 19 rows tall and every row falls on a clean boundary. The moment you add a type, `each_data_type.size` becomes 20, PSDK cuts the **same** image into 20 rows, every row gets shorter, and each icon is read from the wrong slice. The whole strip looks shifted and clipped. That is the bug.

The fix follows directly: the type count grew, so each image has to grow by one row to keep the per-row height unchanged.

## The spritesheets to update

PSDK ships ten type-indexed spritesheets across two folders, `graphics/interface/` (battle and menus) and `graphics/pokedex/` (the Pokédex screen). Each is a single column with one row per type, currently **19 rows** (the "none" type plus the 18 default types):

| File | Current size | Cell height | What it feeds |
| ---- | ------------ | ----------- | ------------- |
| `graphics/interface/battle/types.png` | 120 × 513 | 27 px | Type icon on moves in the battle move menu |
| `graphics/interface/battle_attack_dummy.png` | 155 × 1007 | 53 px | Type plate handled by the `AttackDummySprite` helper |
| `graphics/interface/types.png` | 32 × 266 | 14 px | Type icons in menus; fallback when no localized file exists |
| `graphics/interface/types_en.png` | 32 × 266 | 14 px | English variant of `interface/types.png` |
| `graphics/interface/types_fr.png` | 32 × 266 | 14 px | French variant of `interface/types.png` |
| `graphics/interface/types_es.png` | 32 × 266 | 14 px | Spanish variant of `interface/types.png` |
| `graphics/pokedex/types.png` | 48 × 304 | 16 px | Type icons on the Pokédex screen; fallback when no localized file exists |
| `graphics/pokedex/types_en.png` | 48 × 304 | 16 px | English variant of `pokedex/types.png` |
| `graphics/pokedex/types_fr.png` | 48 × 304 | 16 px | French variant of `pokedex/types.png` |
| `graphics/pokedex/types_es.png` | 48 × 304 | 16 px | Spanish variant of `pokedex/types.png` |

Both folders carry localized variants (`types_en.png`, `types_fr.png`, `types_es.png`): the icon includes the type's name as text, so there is one image per language. PSDK loads `types_<language>.png` from the relevant folder for the current language and falls back to that same folder's `types.png` when the localized file is missing. Update the variant for every language your game ships; if you keep only `types.png` in a folder, that single file is enough there.

## Add your type's row

For every file in the table, the operation is the same:

1. Open the spritesheet in an image editor that preserves transparency (PNG alpha).
2. Increase the **canvas height** by exactly one cell height, the value in the table: `interface/battle/types.png` goes from 513 to 540, `battle_attack_dummy.png` from 1007 to 1060, `interface/types.png` and its variants from 266 to 280, `pokedex/types.png` and its variants from 304 to 320. Keep the width unchanged.
3. Draw your type's icon in the **new bottom row**. Its row index is your type's id, so the type added last sits in the last row.
4. Keep every row the same height. The engine assumes equal rows, so a misaligned or half-height row shifts everything below it.

Save each file back to its original path under `graphics/interface/` or `graphics/pokedex/`. Copying an existing row as a template is the safest way to keep the new icon's dimensions and baseline consistent with the others.

## Verify in battle

Type-icon changes are only visible in game, never in Studio:

1. Launch your game.
2. Start a battle with a move that uses the new type.
3. Open the move menu and check the type icon on the move, then open a Pokémon's summary and the Pokédex to check the menu and Pokédex icons.

If an icon is shifted or clipped, the matching spritesheet's height is off by a row: re-check that `image height ÷ type count` gives a whole number and that every row has the same height.

## Conclusion

- **Pokémon Studio creates type data only** (`Data/Studio/types/<db_symbol>.json`); it never generates or resizes the type icons.
- PSDK slices each type spritesheet into `image height ÷ type count` rows, so adding a type without growing the images misaligns every icon.
- Update all ten type-indexed spritesheets across `graphics/interface/` (`battle/types.png`, `battle_attack_dummy.png`, `types.png` and its `types_en/fr/es.png` variants) and `graphics/pokedex/` (`types.png` and its `types_en/fr/es.png` variants), adding one row per new type.
- The new icon goes in the **last row** (row index = type id), and every row must keep the same height.
- Type icons render in game only: verify in a real battle, in the summary and in the Pokédex, not in Studio.
