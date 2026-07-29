---
title: "Create a playable version"
slug: create-a-playable-version
sidebar_position: 4
description: "Pokémon Studio turns your project into a standalone game that players can run without installing Studio, PSDK or Ruby. This guide covers the Compilation window: how to open it from the Dashboard, what the game name, version number and four update options control, and where to find the ready-to-share Release folder it produces."
---

**Pokémon Studio** turns your project into a standalone game that players can run without installing Studio, PSDK or Ruby. This guide covers the Compilation window: how to open it from the Dashboard, what the game name, version number and four update options control, and where to find the ready-to-share Release folder it produces.

## Compiling or playing the game?

Two different buttons produce two very different results, and it is worth telling them apart before you compile.

The **play button** in the navigation bar, **Play the game**, with **Debug mode** and **Fast Debug Mode** in its dropdown, runs your project in place, straight from its source files. It is how you test what you are building. It never produces anything you can hand to someone else, and **Play the game** here means "run without the debug tools", not "run the finished build".

**Compilation** is the only feature that produces a distributable game: a self-contained `Release/` folder with its own copy of the engine, ready to zip and share. Reach for it when you want to ship a version; keep using the play button while you are still working.

## Open the Compilation window

Go to the **Dashboard**. Its control bar, at the top of the page, holds a single button: **Create a playable version**. Clicking it opens the **Creating a playable version** dialog.

## Configure the version

The dialog asks for two things about the build, then how much of it to recompile.

- **Game name**: pre-filled with your project's current title. It is the name stored in the compiled game.
- **Version number**: a whole number, pre-filled with your current version plus one, since Studio assumes each compilation is a new release. The value is written back to your project, so the next compilation suggests the number after it.

Below them, **Compilation options** is a set of four toggles, all on by default:

| Option                   | What it recompiles                                                          |
| ------------------------ | --------------------------------------------------------------------------- |
| Update visuals           | Changes made to the graphics                                                |
| Update libraries         | Changes applied to the Ruby libraries                                       |
| Update audio             | Changes applied to the audio                                                |
| Update the game binaries | Changes applied to the binary files (the engine executable and its runtime) |

Why toggles at all? Compilation writes into the `Release/` folder and keeps it between runs. Turning an option off tells Studio to skip that part and reuse whatever the previous compilation already put there.

The rule that follows: for a project's **first** compilation, leave all four on, otherwise the build ships without those files. On later compilations, switch off the parts you have not touched (audio and binaries rarely change) to make the build noticeably faster. Your game's scripts and data are always recompiled, whatever the toggles say.

:::note[Windows only]
The executable Studio builds runs only on Windows 10 and Windows 11 systems. The dialog shows the matching notice when you compile on macOS or Linux.
:::

## Start the compilation

Click **Compile the project**. Studio opens a separate window that tracks the build: a progress bar advancing through each step (scripts, graphics, data, libraries, audio, binaries) and a live log of everything the engine prints.

When it finishes, the window reports **The game executable has been successfully created!** and offers three actions:

- **Show in folder** opens the `Release/` folder with the game selected.
- **Copy to clipboard** copies the full log.
- **Save logs** writes the log to your project's `logs` folder, handy if something failed and you want to report it.

## Get your build

The compiled game lives in a **`Release/`** folder at the root of your project. It is self-contained: on Windows it holds `Game.exe` alongside the engine, its data and its own Ruby runtime, so a player only needs to unzip the folder and double-click `Game.exe`. No Studio, no PSDK, no Ruby install required.

To distribute it, zip the whole `Release/` folder and share the archive. That is the file your players download.

On macOS and Linux, the folder ships a `Game.sh` launcher and a bundled Ruby distribution instead of `Game.exe`.

## Conclusion

Compilation is Studio's one-click replacement for the old command-line build: fill in a name and version, pick what to recompile, and let it produce a standalone `Release/` folder you can zip and share. Keep the play button for day-to-day testing, and compile whenever you have a version worth handing to players.
