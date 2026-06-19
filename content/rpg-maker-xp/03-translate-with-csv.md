---
title: "Translate your game with CSV files"
slug: translate-your-game-with-csv
sidebar_position: 3
description: "PSDK keeps every line of event dialogue in CSV files where each column is a language. This guide explains how to extract your game's text into those files with the eventtext2csv tool, translate it in Pokémon Studio, and let players switch language in game."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK keeps every line of event dialogue in **CSV files** where each column is a language. This guide explains how to extract your game's text into those files with the **eventtext2csv** tool, translate it in **Pokémon Studio**, and let players switch language in game.

## The principle

A multilingual game cannot duplicate every event once per language: the maps would be unmaintainable, and fixing a single typo would mean fixing it in every language by hand. PSDK solves this by keeping dialogue text **out** of the events. Every line lives in a CSV file under `Data/Text/Dialogs/`, where each **row** is one line of text and each **column** is one language. An event no longer holds the sentence itself, only a **reference** to a row. At runtime, the engine reads the column that matches the player's language and shows it.

So the workflow has four steps: write your game once in a single language, extract all of its text into CSV files, translate it in Pokémon Studio, and declare which languages the player can pick.

## Step 1: Write your game in one language

Build your game in RMXP as usual, writing every dialogue in plain text in your source language, the one you author in. A **Show Text** command simply contains the readable sentence, exactly as the player will see it. Do not think about translation yet: the extraction comes later, once the content exists. This keeps the writing phase fast and lets you focus on the game itself.

## Step 2: Extract the text with eventtext2csv

PSDK ships a tool, **eventtext2csv**, that reads every map, collects the text of each message and each choice, writes it into CSV files, and rewrites each event so it points at the matching row. You get one CSV file per map, named after the map: the engine uses the id `1000 + map_id`, so map 5 produces `Data/Text/Dialogs/1005.csv`.

Run it from the project folder, with the project **uncompiled** so the source is available (see [Set up the development environment](/getting-started/setup-development-environment)):

```bash
psdk --util=eventtext2csv
```

The tool asks which languages to prepare, as a comma-separated list of codes (for example `en,fr,it,de,es`). Press **Enter** to use every language the project declares as available. It then creates one column per language in each file.

A few things worth knowing:

- It only touches events that contain text. A map with no dialogue produces no file.
- It is **idempotent**: a line that already points at a CSV row is left untouched. You can write new events later and run the tool again to extract only the new text.
- After extraction, the event still shows the original sentence in RMXP (the tool keeps it after the reference, as a reminder), but at runtime only the reference is read.
- The base id `1000` can be shifted with the `TEXT_EVENT_OFFSET` environment variable, but the default suits most projects.

:::note

The tool is interactive (it reads your answer from the console) and only exists in an uncompiled project. It is not available in a released build.

:::

## Step 3: Translate the text in Pokémon Studio

Once the text is extracted, you translate it in **Pokémon Studio**, which edits PSDK's text files through a dedicated interface, so you never have to open a CSV yourself. Open your project and click **Text Management** in the left navigation rail. It has two tabs:

- The **Texts** tab lists every text file by its number. Pick the one for your map, for example `1005`, to see its entries in the source language. From there you can edit a line, add a new entry, or search the file.
- The **Translation** tab is where you translate: it shows one entry at a time, with the source language on one side and a field for every other language. You fill in each translation, pick the target language, and move on to the next entry.

Studio saves straight back to the game's text files. In development, relaunching the game is enough to see the new text: PSDK recompiles the changed files automatically, with no manual build step.

## Step 4: Let the player choose the language

You declare the languages your game offers in Pokémon Studio, on the **Language** page. Reach it with the **Manage languages** button on the Text Management page, then pick the **Default language**, the languages available in game, and any other translation languages.

Studio stores this in `Data/configs/language_config.json`:

```json
{
  "defaultLanguage": "en",
  "choosableLanguageCode": ["en", "fr"],
  "choosableLanguageTexts": ["English", "Français"]
}
```

- `defaultLanguage` is the code used before the player has made a choice.
- `choosableLanguageCode` lists the codes the player can switch between.
- `choosableLanguageTexts` is the label shown for each, in the same order.

The player then switches language from the in-game **Options** menu; the engine reloads every text in the chosen language, and the choice is stored in the player's options.

:::note

This guide covers translating text authored in RMXP events. To read these texts from your own Ruby scripts, see [Add i18n text](/psdk/ui-development/mystery-gift/add-i18n-text).

:::

## Conclusion

- Event dialogue is not stored in the events but in PSDK's **text files**, with one entry per row and one **language per column**.
- Write your game in one language, then run **`psdk --util=eventtext2csv`** to extract every message and choice into per-map files (`1000 + map_id`) and rewrite the events as references.
- **Translate** the extracted text in **Pokémon Studio**'s Text Management editor; dev mode recompiles the changed files automatically.
- Declare the offered languages on Studio's **Language** page; the player switches from the **Options** menu and the choice is saved.
