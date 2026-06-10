---
title: "How to prepare the assets and text before creating a UI in PSDK?"
slug: prepare-ui-assets
sidebar_position: 0
description: "Before writing any Ruby, a UI needs its graphics and its translated text in place. This preparation step installs the Mystery Gift assets and CSV so the scene actually renders."
---

This guide is the preparation step of a series of 10 where we build a complete Mystery Gift UI step by step. Before writing any Ruby in [the next guide](./01-ui-scene.md), your UI needs two kinds of non-code resources in place: its **graphics** and its **translated text**. Without them, the scene loads but shows nothing on screen. Here we install both for the Mystery Gift example.

## Principle

A UI in PSDK is more than Ruby files. Two resource categories live **outside** the `scripts/` folder, in the game project itself:

- **Graphics**: PNG images loaded from the project's cache folders. The Mystery Gift UI uses the `interface` cache, so its images live under `graphics/interface/`.
- **Text** (i18n): every player-visible string is stored in a CSV file under `Data/Text/Dialogs/`, identified by a numeric ID. In development the engine reads these CSVs directly, and keeps a per-language `.dat` cache to speed things up.

The Ruby code references these resources by name (`'mystery_gift/header'`) or by ID (`TEXT_FILE_ID = 311_125`). If a resource is missing or misplaced, the reference silently fails: a blank sprite, or English text where a translation was expected.

## Where everything goes

| Resource         | Source (download below)                         | Target path in your project                  |
| ---------------- | ----------------------------------------------- | -------------------------------------------- |
| 7 graphics       | `*.png`                                          | `graphics/interface/mystery_gift/`           |
| i18n text        | `311125.csv`                                     | `Data/Text/Dialogs/311125.csv`               |

The folder name `mystery_gift` (under `graphics/interface/`) is the prefix used in every `add_sprite`/`add_background` call, e.g. `add_sprite(0, 0, 'mystery_gift/header')`. The CSV filename `311125.csv` matches the `TEXT_FILE_ID = 311_125` constant the code uses with `ext_text`.

## Graphics

Create the folder `graphics/interface/mystery_gift/` in your project and drop the 7 images below into it. Each is shown at its real size, with its role and dimensions.

### `background.png` — full-screen background

![background.png](/assets/psdk/ui-development/mystery-gift/background.png)

- **Target:** `graphics/interface/mystery_gift/background.png` · **Size:** 320×240 (the full screen)
- Drawn behind everything by `GenericBase`. Returned by the `background_filename` override.
- [Download background.png](/assets/psdk/ui-development/mystery-gift/background.png)

### `header.png` — title bar

![header.png](/assets/psdk/ui-development/mystery-gift/header.png)

- **Target:** `graphics/interface/mystery_gift/header.png` · **Size:** 320×18
- The bar behind the scene title, drawn by the Composition at the top of the screen.
- [Download header.png](/assets/psdk/ui-development/mystery-gift/header.png)

### `frame.png` — content frame

![frame.png](/assets/psdk/ui-development/mystery-gift/frame.png)

- **Target:** `graphics/interface/mystery_gift/frame.png` · **Size:** 304×188 (matches `FRAME_WIDTH` × `FRAME_HEIGHT`)
- The panel that holds the gift list. Its size drives the `FRAME_*` layout constants.
- [Download frame.png](/assets/psdk/ui-development/mystery-gift/frame.png)

### `received_banner.png` — "gift received" banner

![received_banner.png](/assets/psdk/ui-development/mystery-gift/received_banner.png)

- **Target:** `graphics/interface/mystery_gift/received_banner.png` · **Size:** 280×28 (matches `BANNER_WIDTH` × `BANNER_HEIGHT`)
- Background of the banner that fades in when a gift is claimed (see the animations guide).
- [Download received_banner.png](/assets/psdk/ui-development/mystery-gift/received_banner.png)

### `button_background.png` — bottom button bar

![button_background.png](/assets/psdk/ui-development/mystery-gift/button_background.png)

- **Target:** `graphics/interface/mystery_gift/button_background.png` · **Size:** 320×26
- The strip behind the ctrl buttons at the bottom. Returned by the `button_background_filename` override.
- [Download button_background.png](/assets/psdk/ui-development/mystery-gift/button_background.png)

### `gift_row.png` — gift row (spritesheet)

![gift_row.png](/assets/psdk/ui-development/mystery-gift/gift_row.png)

- **Target:** `graphics/interface/mystery_gift/gift_row.png` · **Size:** 577×24
- **Spritesheet 2×1**: two columns (left = normal, right = selected), one row. `set_rect_div(0, 0, 2, 1)` shows the normal cell, `set_rect_div(1, 0, 2, 1)` the selected one. Each cell is 288 wide (576 / 2, plus a 1px transparent separator → 577 total), matching `GIFT_ROW_WIDTH`.
- [Download gift_row.png](/assets/psdk/ui-development/mystery-gift/gift_row.png)

### `buttons.png` — ctrl buttons (spritesheet)

![buttons.png](/assets/psdk/ui-development/mystery-gift/buttons.png)

- **Target:** `graphics/interface/mystery_gift/buttons.png` · **Size:** 149×39
- **Spritesheet 2×2**: column 0 = A/X/Y, column 1 = B; row 0 = normal, row 1 = pressed. Cells are separated by 1px of transparency (≈74×19 per cell). Returned by the `button_texture` override on the custom ControlButton (see the GenericBase guide).
- [Download buttons.png](/assets/psdk/ui-development/mystery-gift/buttons.png)

### Replacing the graphics

You can replace any image with your own as long as you keep the same filename, the same target folder, and — for the two spritesheets — the same grid layout (same number of cells, 1px transparent separators). If you change a sprite's dimensions, update the matching layout constant in `001 Constants.rb` (for example `FRAME_WIDTH` if you resize `frame.png`).

## Text (i18n CSV)

All player-visible text lives in one CSV file. Download it and place it at `Data/Text/Dialogs/311125.csv`:

[Download 311125.csv](/assets/psdk/ui-development/mystery-gift/311125.csv)

```csv
en,fr,it,de,es,ko,kana
Enter Code,Code,,,,,
Quit,Quitter,,,,,
Mystery Gift,Cadeau Mystère,,,,,
Enter your gift code,Entrez votre code cadeau,,,,,
Invalid code!,Code invalide !,,,,,
Gift already claimed!,Cadeau déjà réclamé !,,,,,
You received %s!,Vous avez reçu %s !,,,,,
No gifts claimed yet,Aucun cadeau réclamé,,,,,
Claim this gift?,Réclamer ce cadeau ?,,,,,
Gift received!,Cadeau reçu !,,,,,
Yes,Oui,,,,,
No,Non,,,,,
```

- The filename **must** be `311125.csv`, matching `TEXT_FILE_ID = 311_125` declared in `001 Constants.rb`. The code reads a row with `ext_text(TEXT_FILE_ID, row_index)`.
- Row 0 (after the header) is ID 0, row 1 is ID 1, and so on — these indexes map to the `TEXT_*` constants (the i18n guide covers this in detail).
- The first column is the language code. Empty cells fall back to the `en` value, so a project running in any unfilled language still shows English.

### How PSDK loads the text

In development you do not need to compile anything. When a text is requested, PSDK first looks for a compiled `.dat` cache (e.g. `311125.fr.dat`), and **falls back to reading `311125.csv` directly** when no cache exists. So the text shows up as soon as the CSV is in place.

PSDK also keeps that cache up to date on its own: at every launch it rebuilds the `.dat` files when a CSV is **newer** than its cache (a modification-time check). After **editing** the CSV, just relaunch the game with `debug_fast.bat` and the change is picked up.

**If an edit does not show up in game**, force a full rebuild by deleting **all** the `.dat` files in `Data/Text/Dialogs/`, then relaunch. Deleting only one or two does nothing: PSDK recompiles everything only when the cache is entirely gone or a CSV is newer than its `.dat` — a single missing `.dat` is never detected on its own (the text simply falls back to the CSV). When you later compile your game for release, the standard project compilation bundles the texts for you — no manual step during development.

## Verification

Before moving on, check that:

- `graphics/interface/mystery_gift/` contains the 7 PNG files.
- `Data/Text/Dialogs/311125.csv` exists.

With the assets and text in place, you are ready to write the first Ruby file in [the scene guide](./01-ui-scene.md).

## Conclusion

- A UI needs two non-code resource types: graphics (under `graphics/interface/`) and i18n text (a CSV under `Data/Text/Dialogs/`).
- Graphics are referenced by name (`'mystery_gift/<file>'`); the folder name is the prefix used in `add_sprite`/`add_background`.
- Spritesheets (`gift_row`, `buttons`) pack several states in one image, sliced with `set_rect_div` — keep the grid layout when replacing them.
- The CSV filename matches `TEXT_FILE_ID`; row indexes map to `TEXT_*` constants.
- In development, the CSV is read directly — placing it is enough; the `.dat` cache rebuilds automatically when the CSV is newer. To force a rebuild, delete **all** the `.dat` files in `Data/Text/Dialogs/`.
