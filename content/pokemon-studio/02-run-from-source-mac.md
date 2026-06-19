---
title: "Run Pokémon Studio from source on macOS"
slug: run-pokemon-studio-from-source-macos
sidebar_position: 2
description: "Running Pokémon Studio from its source code gives you a development build that updates every time you pull the latest changes with Git. This guide walks through the full setup on macOS: Homebrew, Node.js via nvm, cloning the repository with its submodules, installing the PSDK binaries, and launching the app."
---

Running Pokémon Studio from its source code gives you a development build that updates every time you pull the latest changes with Git. This guide walks through the full setup on macOS: Homebrew, Node.js via nvm, cloning the repository with its submodules, installing the PSDK binaries, and launching the app.

The packaged macOS release does not auto-update, so building from source is the most convenient way to stay on the latest version. If you prefer to keep using a packaged release instead, see [Update Pokémon Studio and fix the "damaged" error on macOS](/pokemon-studio/update-pokemon-studio-macos).

## Installing Homebrew and Git

**Homebrew** is the de facto package manager for macOS. It is the simplest way to install the command-line tools the build needs. If you do not have it yet, open the **Terminal** application and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install **Git**, used to clone the repository and to pull updates later:

```bash
brew install git
```

## Installing Node.js with nvm

Pokémon Studio is built on Electron and requires a specific Node.js version: **Node.js 22.17.0**. Using the wrong major version will make the install or the build fail, so pin it precisely. The cleanest way to manage Node versions on macOS is **nvm** (Node Version Manager).

Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

Close and reopen the terminal (or reload your shell profile) so the `nvm` command becomes available, then install and select the required version:

```bash
nvm install 22.17.0
nvm use 22.17.0
```

`npm` ships with Node.js, so there is no separate npm install step. Installing npm on its own (for example through Homebrew) would conflict with the version nvm manages, so avoid it.

## Cloning the repository

Move into the folder where you want the project to live (any folder works, the **Desktop** is a common choice), then clone the repository and enter it:

```bash
cd ~/Desktop
git clone https://github.com/PokemonWorkshop/PokemonStudio.git
cd PokemonStudio
```

Pokémon Studio embeds the PSDK engine sources as a Git **submodule**. A plain clone leaves that submodule empty, so fetch it explicitly:

```bash
git submodule update --init --recursive
```

## Installing the PSDK binaries

The **PSDK binaries** are what let Studio start PSDK projects and run operations on them. They are not bundled in the repository and must be added by hand:

1. Download the latest **PSDK binary archive** from the [PokemonSDKBinaries releases page](https://github.com/PokemonWorkshop/PokemonSDKBinaries/releases). The archive covers Windows, Linux and macOS (Apple Silicon, M1 and newer).
2. Extract the **entire content** of the archive into the `psdk-binaries` folder at the root of the cloned repository.

Extract the whole archive, not just part of it: Studio expects the complete set of files in that folder, including the bundled Ruby distribution.

## Installing dependencies and launching

Install the project dependencies, then start the app:

```bash
npm i
npm start
```

The Pokémon Studio window opens. If you can open, create and edit a project, your environment is set up correctly.

To launch it again later, open the `PokemonStudio` folder in a terminal and run `npm start` once more. Because this is a development build, running `git pull` in that folder before starting it brings in the latest changes, so the app effectively updates itself.

## Conclusion

- Building from source produces a development build of Pokémon Studio that stays up to date through `git pull`, unlike the packaged macOS release.
- Install **Homebrew** and **Git**, then use **nvm** to install the required **Node.js 22.17.0**. Do not install npm separately.
- Clone the repository, then run `git submodule update --init --recursive` to fetch the embedded PSDK engine sources.
- Download the **PSDK binaries** from the releases page and extract their full content into the `psdk-binaries` folder.
- Run `npm i` followed by `npm start`. Re-run `npm start` from the project folder to launch it again later.
