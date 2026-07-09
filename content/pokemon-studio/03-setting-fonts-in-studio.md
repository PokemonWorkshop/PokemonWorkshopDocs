---
title: "Configure fonts, sizes and per-scene text"
slug: configure-fonts
sidebar_position: 3
description: "Pokémon Studio lets you add custom fonts, define extra text sizes, and pick which font your messages and choices use. This guide explains where font settings live, how to set the default font through its ID, and how to assign specific fonts to scenes and choices."
---

Pokémon Studio lets you add custom fonts, define extra text sizes, and pick which font your messages and choices use. This guide explains where font settings live, how to set the default font through its ID, and how to assign specific fonts to scenes and choices.

## Where fonts are configured

Everything related to fonts lives in **Dashboard > Texts**, under the **General settings** group. Saving this screen writes the file `Data/configs/texts_config.json` in your project, which is what PSDK reads at runtime.

The page is split into four areas:

- **Fonts**: the typefaces available in your game, each backed by a `.ttf` file.
- **Alternative sizes**: extra size profiles you can reuse without adding a new font file.
- **Messages**: how text reads in message windows, including which font they use.
- **Choices**: the same settings for choice windows.

The key idea to keep in mind: a font is never referenced by its name in the rest of the configuration, it is referenced by its **ID**. Every place that picks a font (the default font, a per-scene message font, a choice font) stores a font ID, not a file name. Understanding this is what makes the rest of the screen, and the default-font trick below, make sense.

The **Fonts** section also has a **Use special characters for numbers** toggle. Leave it on if your font ships custom glyphs for digits (most PSDK fonts do); it has no effect on which font is used, only on how numbers are drawn.

## Add a new font

A font in Studio is two things that must agree: a `.ttf` file on disk and an entry in the **Fonts** table.

1. Copy your `.ttf` file into the project's `Fonts/` folder (for example `Fonts/MyFont.ttf`).
2. In **Dashboard > Texts**, in the **Fonts** section, click **Add a font**.
3. Fill in the fields, then click **Add the font**:
   - **ID**: a unique number for this font. It is how the rest of the game refers to it.
   - **Name**: the file name **without** the `.ttf` extension. It must match the file exactly, so `MyFont` for `Fonts/MyFont.ttf`.
   - **Size**: the render size in pixels.
   - **Line height**: the vertical space one line takes, in pixels.

The new font appears in the table as a row. In `texts_config.json`, it is one entry in `fonts.ttfFiles`:

```json
{
  "id": 30,
  "name": "MyFont",
  "size": 16,
  "lineHeight": 20
}
```

Studio keeps the table sorted by **ID** and flags an ID that is already used, so no two fonts can share a number. If the **Name** does not match a real file in `Fonts/`, the font will not load in game even though Studio accepts the entry.

## Set the default font

PSDK uses the font with **ID 0** as its default: anywhere the game draws text without asking for a specific font, it falls back to font 0. The default project ships `PokemonDS` at ID 0. So changing "the game's font" does not mean editing a single dropdown, it means making **your** font the one with ID 0.

This is the hidden manipulation the screen does not spell out. You cannot simply set your font's ID to 0 while another font already holds 0, because Studio rejects duplicate IDs. You have to **swap** the two IDs, using a free number as a stepping stone:

1. Give the current font 0 a temporary free ID (for example change `PokemonDS` from `0` to `99`).
2. Change your font's ID to `0`. Your font is now the default.
3. Optionally, give the old font a permanent ID by editing it again (for example move `PokemonDS` from `99` to `30`), so it stays available for scenes that still want it.

Because the table re-sorts by ID after each change, follow the rows by name rather than by position while you swap. Once your font sits at ID 0, every message, choice and UI element that did not request a specific font will use it.

## Create extra sizes

A font entry already carries one **Size** and one **Line height**. When you need the *same* look at a different size, you do not have to add a second `.ttf`. The **Alternative sizes** section lets you define standalone size profiles, each identified by its own ID.

In the **Alternative sizes** section, click **Add an alternative size**, fill **ID**, **Size** and **Line height** (there is no name, since no file is involved), then click **Add the alternative size**.

```json
{
  "id": 2,
  "size": 22,
  "lineHeight": 26
}
```

These profiles do not carry a typeface of their own. They are size overrides that the engine and scripts apply to existing text when a specific size ID is requested. As with fonts, IDs must be unique and the list is kept sorted.

## Assign a font to a specific scene

The **Messages** section controls message windows. It is organised by **reference scene**, so you can give one scene a different look from the rest of the game:

- **Default messages**: used everywhere unless a more specific entry matches. This is the entry whose **Reference scene** is left blank.
- **Battle messages**: the built-in entry for the battle scene.
- Click **Add a type of messages** to target another scene. Set its **Reference scene** to the scene's class name (for example `Battle::Scene`). The help text confirms the rule: *leave the reference scene blank to apply the configuration to every scene*.

Within each entry, the **Text font of the messages** dropdown is where you pick the font, listed as `ID - Name`. The other fields shape the same window: **Text color of the messages**, **Dialog box** and **Box of names** (the window skins), **Line count** and **Border spacing**.

Each entry is one record under `messages` in the config, keyed by the reference scene (`any` is the blank, catch-all entry):

```json
"messages": {
  "any": {
    "windowSkin": null,
    "nameWindowSkin": null,
    "lineCount": 2,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  },
  "Battle::Scene": {
    "windowSkin": null,
    "nameWindowSkin": null,
    "lineCount": 2,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  }
}
```

Note that `defaultFont` stores the font **ID** you picked, which is the whole reason IDs matter: a per-scene font is just a different ID in this field.

## Assign a font to choices

The **Choices** section mirrors the Messages section for choice windows, with fewer fields. It has the same **Default choices** entry (blank reference scene) and the same **Add a type of choices** button to target a specific scene.

Pick the font with the **Default text font** dropdown, set **Default text color**, the **Choices box** skin and the **Border spacing**. Each entry is a record under `choices`, again keyed by reference scene:

```json
"choices": {
  "any": {
    "windowSkin": null,
    "borderSpacing": 2,
    "defaultFont": 0,
    "defaultColor": 0,
    "colorMapping": {}
  }
}
```

## Conclusion

- All font settings live in **Dashboard > Texts** and are saved to `Data/configs/texts_config.json`.
- A font is a `.ttf` in `Fonts/` plus an entry (**ID**, **Name**, **Size**, **Line height**); everything else references a font by its **ID**, never its name.
- The default font is the one with **ID 0**: to change it, swap your font into ID 0 using a free ID as a temporary step, since Studio forbids duplicate IDs.
- **Alternative sizes** add reusable size profiles by ID without needing a new font file.
- **Messages** and **Choices** are organised by **reference scene**: a blank reference scene is the default, a class name like `Battle::Scene` targets one scene, and the font is set per entry through its ID.
