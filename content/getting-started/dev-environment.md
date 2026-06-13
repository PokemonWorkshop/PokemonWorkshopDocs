---
title: "How to set up the development environment?"
slug: setup-development-environment
sidebar_position: 1
description: "Before writing scripts for a PSDK project, you need to install Ruby, configure a code editor, and set up autocompletion to have access to PSDK documentation and methods while coding. This guide covers the complete installation step by step."
---

Before writing scripts for a PSDK project, you need to install Ruby, configure a code editor, and set up autocompletion to have access to PSDK documentation and methods while coding. This guide covers the complete installation step by step.

## Principle

The PSDK development environment relies on three pillars:

- **Ruby**: the language PSDK is written in. It must be installed on your machine.
- **Visual Studio Code (VSCode)**: the recommended code editor. With the right extensions, it provides autocompletion, hover documentation, and linting.
- **Solargraph**: a Ruby language server that analyzes PSDK code and provides autocompletion. It needs access to the PSDK source code to work.

## Installing Ruby

1. Go to [rubyinstaller.org](https://rubyinstaller.org/downloads/).
2. Download **Ruby 4.0.1** with the devkit (`Ruby+Devkit 4.0.1 (x64)` version).
3. Run the installer and follow the steps. When MSYS2 is offered, accept the installation.
4. Verify the installation by opening a terminal and typing:

```bash
ruby --version
```

The displayed version should start with `4.0`.

## Installing Visual Studio Code

1. Download [Visual Studio Code](https://code.visualstudio.com).
2. Install and launch VSCode.
3. Install the following extensions from the Extensions panel (Ctrl+Shift+X):
   - **Ruby Solargraph**: autocompletion, hover documentation, diagnostics.
   - **Ruby LSP**: advanced Ruby language support (highlighting, navigation, formatting).

## Installing the gems

Open a terminal **as administrator** (right-click on Command Prompt, "Run as administrator") and install Solargraph and Ruby LSP:

```bash
gem install solargraph
gem install ruby-lsp
```

## Configuring VSCode

Open VSCode JSON settings: Ctrl+Shift+P, then search for "Preferences: Open User Settings (JSON)". Add the following lines:

```json
"editor.tabSize": 2,
"solargraph.diagnostics": true,
"solargraph.formatting": false,
"rubyLsp.enabledFeatures": {
    "codeActions": true,
    "diagnostics": true,
    "documentHighlights": true,
    "documentLink": true,
    "documentSymbols": true,
    "foldingRanges": true,
    "formatting": true,
    "hover": true,
    "inlayHint": true,
    "onTypeFormatting": true,
    "selectionRanges": true,
    "semanticHighlighting": true,
    "completion": true,
    "codeLens": true,
    "definition": true,
    "workspaceSymbol": true,
    "signatureHelp": true,
    "typeHierarchy": true
},
"rubyLsp.formatter": "none",
"rubyLsp.rubyExecutablePath": "C:\\Ruby40-x64\\bin"
```

- Adapt the path `C:\\Ruby40-x64\\bin` to the `bin` folder of your Ruby installation. The RubyInstaller folder name reflects the installed version (for example `C:\\Ruby40-x64` for Ruby 4.0, `C:\\Ruby34-x64` for Ruby 3.4).
- `editor.tabSize: 2`: PSDK uses 2-space indentation.
- `solargraph.diagnostics: true`: enables RuboCop diagnostics through Solargraph.

## Making PSDK code visible to Solargraph

Solargraph needs access to the PSDK source code to provide autocompletion on engine classes (`Battle::Logic`, `GamePlay::Base`, `UI::SpriteStack`, etc.). Since PSDK code is not directly in the `scripts/` folder, you need to tell Solargraph where to find it.

There are two ways to access the PSDK code, and the choice determines how updates work:

- **Via the symbolic link**: the files point to the Pokémon Studio installation. When you update PSDK from Pokémon Studio, these files are updated automatically.
- **Via the pokemonsdk repository**: the forked repository becomes the source of truth. PSDK updates are **not** automatic — you must synchronize the repository with the official one yourself (see guide 002, section "Keeping your fork up to date").

### If the pokemonsdk repository is in the project

If the `pokemonsdk/` folder exists at the project root (after forking and cloning the repository, see guide 002), the `solargraph.yml` file in `scripts/` should contain:

```yaml
---
include:
  - "../pokemonsdk/**/*.rb"
  - ./**/*.rb
exclude:
  - spec/**/*
  - test/**/*
  - vendor/**/*
  - ".bundle/**/*"
require: []
domains: []
reporters:
  - rubocop
  - require_not_found
formatter:
  rubocop:
    cops: safe
    except: []
    only: []
    extra_args: []
require_paths: []
plugins: []
max_files: 5000
```

- `"../pokemonsdk/**/*.rb"`: tells Solargraph to include all Ruby files from the pokemonsdk repository. This is the relative path from `scripts/`.
- `./**/*.rb`: also includes all user scripts in `scripts/`.

### If the repository is not in the project (standard Pokémon Studio project)

For a project created with Pokémon Studio without forking the repository, the PSDK scripts are bundled internally by Pokémon Studio. You need to create a **symbolic link** so Solargraph can access them.

Open **cmd** (Command Prompt) **as administrator**, navigate to the `scripts/` folder of the project, and create the link:

```bash
cd C:\path\to\your-project\scripts
mklink /D psdk_scripts "%temp%\..\Programs\pokemon-studio\resources\psdk-binaries\pokemonsdk\scripts"
```

- `mklink /D` creates a directory symbolic link. Administrator mode is required. This command is specific to cmd (do not use PowerShell).
- `psdk_scripts` is the name of the virtual folder that will appear in `scripts/`. Do not put your own scripts in it.
- The target path points to the PSDK Ruby sources in the Pokémon Studio installation. `%temp%` is used to reach the user's `Programs` folder.

Then adapt the `solargraph.yml` to include this link:

```yaml
---
include:
  - "psdk_scripts/**/*.rb"
  - ./**/*.rb
```

The rest of the file remains identical.

### Generating the solargraph.yml file

If the `solargraph.yml` file does not yet exist in `scripts/`, generate it:

```bash
cd scripts
solargraph config
```

Then edit the generated file to add the path to PSDK in the `include` section.

## Configuring RuboCop

RuboCop checks that code follows PSDK conventions (explicit returns, no `for` loops, etc.). The configuration is in the `.rubocop.yml` file. If this file does not exist in `scripts/`, copy it from the pokemonsdk repository:

```bash
cp pokemonsdk/scripts/.rubocop.yml scripts/.rubocop.yml
```

For a project without the repository, copy the file from the symbolic link:

```bash
cp scripts/psdk_scripts/.rubocop.yml scripts/.rubocop.yml
```

RuboCop activates automatically through Solargraph. Code lines that do not follow conventions will be underlined in blue in VSCode.

## Opening the right folder in VSCode

Always open the `scripts/` folder in VSCode, not the project root:

```bash
code scripts
```

This is the folder where Solargraph and RuboCop look for their configuration files (`solargraph.yml`, `.rubocop.yml`). If you open a different folder, autocompletion and linting will not work.

If Solargraph does not launch correctly after opening, restart it manually: Ctrl+Shift+P, then search for "Restart Solargraph".

## Testing the environment

To verify everything works, create a test script in `scripts/`:

```ruby
# Get the name of a Pokemon from its db_symbol
# @param db_symbol [Symbol] the db_symbol of the Pokemon
# @return [String] the name of the Pokemon
def pokemon_name(db_symbol)
  return data_creature(db_symbol).name
end
```

- When typing `data_`, Solargraph should suggest `data_creature` in autocompletion. If it does, the environment is correctly configured.
- When hovering over `pokemon_name` with the mouse, VSCode should display the YARD documentation (description, parameter, return).
- If lines are underlined in blue, RuboCop is working. Fix the warnings to verify that the PSDK configuration is active (for example, explicit `return` should **not** be flagged as redundant).

To test in-game, launch the project from the project terminal:

```bash
psdk debug skip_title
```

Load a save, then call the method in the debug console:

```
pokemon_name(:pikachu)
```

If the console displays "Pikachu", everything is in place.

## Conclusion

- Install Ruby 4.0.1 with the devkit, then the gems `solargraph` and `ruby-lsp`.
- Install VSCode with the Ruby Solargraph and Ruby LSP extensions. Configure the JSON settings for tabsize, diagnostics, and the Ruby path.
- Make PSDK code visible to Solargraph via `solargraph.yml`: either a relative path to `pokemonsdk/`, or a `psdk_scripts/` symbolic link.
- Copy PSDK's `.rubocop.yml` into `scripts/` so RuboCop uses the project conventions.
- Always open the `scripts/` folder in VSCode so Solargraph and RuboCop find their configurations.
