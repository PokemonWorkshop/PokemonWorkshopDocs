---
title: "Install and configure Tiled"
slug: install-and-configure-tiled
sidebar_position: 2
description: "Pokémon Studio does not bundle Tiled: it launches the copy installed on the machine, both to open a map and to render the map overviews it displays. It therefore needs the exact path to that installation, and what it expects there differs on Windows, Linux and macOS. This page covers installing Tiled and declaring its path correctly."
---

Pokémon Studio does not bundle Tiled: it launches the copy installed on the machine, both to open a map and to render the map overviews it displays. It therefore needs the exact path to that installation, and what it expects there differs on Windows, Linux and macOS. This page covers installing Tiled and declaring its path correctly.

## Install Tiled

Tiled is downloaded from its [official website](https://www.mapeditor.org). It is free, and available for Windows, Linux and macOS.

Install it in its default location. A portable copy extracted to a temporary folder works until that folder is cleaned up, at which point Pokémon Studio loses the editor without any obvious explanation.

## Why Pokémon Studio needs the path

Two features depend on it:

- **Opening a map.** The **Open with Tiled** action launches the editor on the `.tmx` file of the selected map.
- **Rendering map previews.** The image shown in a map's **Map** tab is produced by a tool that ships with Tiled, not by Studio. Without the path, the **Generate map overview** button stays disabled.

A wrong path breaks both at once, and neither failure says why.

## Declare the path in Pokémon Studio

The setting lives in **Settings**, tab **Maps**, under the **Tiled installation path** field. Drop the file there, or click the field to browse for it.

### Windows

Point at the **Tiled executable** itself, not at its folder. The file must be `tiled.exe`, typically:

```bash
C:\Program Files\Tiled\tiled.exe
```

Studio checks the filename and rejects anything else with *The Tiled installation path chosen is invalid.*

### Linux

Point at the Tiled **AppImage** if that is how Tiled was installed, or at the `tiled` binary for a package-manager installation.

### macOS

Point at the Tiled application in the **Applications** folder.

## Check that it works

Open any map with **Open with Tiled**. If the editor starts on the right `.tmx`, the path is valid. If Studio reports *The Tiled installation path has not been configured.*, the field is still empty and the **Configure installation path** button takes you straight to the right settings page.

## Conclusion

- Tiled is installed separately and downloaded from `mapeditor.org`; Pokémon Studio only launches it.
- The path is declared in **Settings**, tab **Maps**, field **Tiled installation path**.
- On Windows the field expects the `tiled.exe` file, on Linux the AppImage or the binary, on macOS the application bundle.
- Studio needs the path both to open maps and to run `tmxrasterizer`, which renders the overviews stored in `Data/Tiled/Overviews`.
- Installing in a temporary or portable folder works until that folder disappears.
