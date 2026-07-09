---
title: "Set up the development environment"
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
4. Verify the installation by opening a terminal and typing the command below. To open a terminal, open the Start menu, type `cmd`, and press Enter: this is **Command Prompt**, the terminal used throughout this guide (not PowerShell).

```bash
ruby --version
```

The displayed version should start with `4.0`.

## Installing Git

Git is the version control tool used throughout PSDK, and VSCode relies on it for all its source-control features. Without it, the Git steps in the next guides will not work.

1. Download [Git for Windows](https://git-scm.com/download/win).
2. Run the installer. The default options are fine: keep clicking **Next**, then **Install**.
3. Verify it in **cmd**, from any folder:

```bash
git --version
```

A version number confirms Git is installed.

4. Configure your identity so Git can stamp every commit with an author. Still in **cmd**, from any folder:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Use the same email as your GitHub or GitLab account so your commits are linked to your profile. The `--global` flag applies this to every repository on your machine, so you only do it once.

## Installing Visual Studio Code

1. Download [Visual Studio Code](https://code.visualstudio.com).
2. Install and launch VSCode.
3. Install the following extensions from the Extensions panel (Ctrl+Shift+X):
   - **Ruby Solargraph**: autocompletion, hover documentation, diagnostics.
   - **Ruby LSP**: advanced Ruby language support (highlighting, navigation, formatting).

## Installing the gems

Open **cmd** **as administrator** (right-click the Command Prompt entry, "Run as administrator") and install Solargraph and Ruby LSP:

```bash
gem install solargraph
gem install ruby-lsp
```

## Configuring VSCode

Open the **User Settings (JSON)**: Ctrl+Shift+P, then run "Preferences: Open User Settings (JSON)". Add the following lines inside the existing `{ }`, separating each entry with a comma:

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

- **Via the pokemonsdk repository**: the forked repository becomes the source of truth. PSDK updates are **not** automatic — you must synchronize the repository with the official one yourself (see [Contribute to PSDK](/misc/using-git-with-psdk), section "Keeping your fork up to date").
- **Via the symbolic link**: the files point to the Pokémon Studio installation. When you update PSDK from Pokémon Studio, these files are updated automatically.

### Generating the solargraph.yml file

Both cases below edit `scripts/solargraph.yml`. If that file does not exist yet, generate it first. In **cmd**, from the **project root**:

```bash
cd scripts
solargraph config
```

Then follow the case that matches your project to fill in the `include` section.

### If the pokemonsdk repository is in the project

If the `pokemonsdk/` folder exists at the project root (after forking and cloning the repository, see [Contribute to PSDK](/misc/using-git-with-psdk)), the `solargraph.yml` file in `scripts/` should contain:

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

Open **cmd** **as administrator**, navigate to the `scripts/` folder of the project, and create the link:

```bash
cd C:\path\to\your-project\scripts
mklink /D psdk_scripts "%temp%\..\Programs\pokemon-studio\resources\psdk-binaries\pokemonsdk\scripts"
```

- `mklink /D` creates a directory symbolic link. Administrator mode is required. This command is specific to cmd (do not use PowerShell).
- `psdk_scripts` is the name of the virtual folder that will appear in `scripts/`. Do not put your own scripts in it.
- The target path points to the PSDK Ruby sources in the Pokémon Studio installation. `%temp%` is used to reach the user's `Programs` folder.

Check that the link worked: open the new `scripts/psdk_scripts` folder in the file explorer, it should show PSDK's `.rb` files. If it is empty, Pokémon Studio is installed elsewhere on your machine; adjust the target path to point to its `resources/psdk-binaries/pokemonsdk/scripts` folder.

Then adapt the `solargraph.yml` to include this link:

```yaml
---
include:
  - "psdk_scripts/**/*.rb"
  - ./**/*.rb
```

The rest of the file remains identical.

## Configuring RuboCop

RuboCop checks that code follows PSDK conventions (explicit returns, no `for` loops, etc.). The configuration is in the `.rubocop.yml` file. If this file does not exist in `scripts/`, copy it. Run the command in **cmd**, from the **project root**.

If you forked the pokemonsdk repository, copy it from there:

```bash
copy pokemonsdk\scripts\.rubocop.yml scripts\.rubocop.yml
```

For a standard Pokémon Studio project, copy it from the symbolic link created earlier (so do this only after the link exists):

```bash
copy scripts\psdk_scripts\.rubocop.yml scripts\.rubocop.yml
```

RuboCop activates automatically through Solargraph. Code lines that do not follow conventions will be underlined in blue in VSCode.

## Opening the right folder in VSCode

Always open the `scripts/` folder in VSCode, not the project root. In **cmd**, from the **project root**:

```bash
code scripts
```

This is the folder where Solargraph and RuboCop look for their configuration files (`solargraph.yml`, `.rubocop.yml`). If you open a different folder, autocompletion and linting will not work.

### Checking that the code is being parsed

When the folder opens, both language servers start and parse the Ruby files. On the first launch this can take a while (longer on slower machines), and autocompletion or hover documentation stay empty until it finishes. An empty result usually means parsing is still running, not a broken setup. There are two ways to follow its progress:

- **Ruby LSP** shows its progress in the status bar at the bottom of the window ("Initializing Ruby LSP", then an indexing indicator).
- **Solargraph** (the server that reads `solargraph.yml` and provides PSDK engine completion) does not use the status bar. Open the Output panel (Ctrl+Shift+U, or View menu, then Output) and select **Ruby Language Server** in the dropdown: its log shows the parsing in progress and any configuration error, such as a wrong path in `solargraph.yml`.

If autocompletion still shows nothing once parsing has finished, restart Solargraph: Ctrl+Shift+P, then run "Restart Solargraph".

## How PSDK loads your scripts

Configuring Solargraph only affects the editor. It does not change which files PSDK actually runs. The engine loads a script from `scripts/` only if its filename starts with **3 to 5 digits, then a space, then the name**, for example:

```
001 Test.rb
```

A file named `test.rb` or `pokemon_name.rb` is ignored by the engine: Solargraph still autocompletes it, but it never runs in-game, which is a common source of confusion. Official PSDK scripts use 3 digits; 4 or 5 also work, so older projects numbered on 5 digits keep loading. An underscore is accepted in place of the space (`001_Test.rb`), but the convention is a space.

PSDK loads these files in ascending order of their number, then alphabetically when numbers are equal. The number therefore controls the load order:

- Two independent files can share the same number without any conflict: `007 James.rb` and `007 Bond.rb` both load (Bond before James, alphabetically).
- If a file depends on a class or constant defined in another, the file it depends on must have the lower number. Loading `020 Battler.rb` before the `010 Creature.rb` it relies on crashes at startup.

Subfolders inside `scripts/` follow the same logic: PSDK only descends into a subfolder whose name also starts with a number (for example `001 My Plugin/`), and the files of a folder load before those of its numbered subfolders.

## Testing the environment

To verify everything works, create a test script named `001 Test.rb` in `scripts/` (the number prefix is required for PSDK to load it in-game, see the previous section):

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

To test in-game, launch the project. In **cmd**, from the **project root**:

```bash
psdk debug skip_title
```

Load a save, then call the method in the debug console:

```
pokemon_name(:pikachu)
```

If the console displays "Pikachu", everything is in place.

## GitLens (optional)

When working with others (see [Work together on a PSDK project](/getting-started/work-together-on-a-psdk-project)), the **GitLens** extension is a useful addition to VSCode. It shows, directly in the editor, who last changed each line, the history of a file, and the contributors of the project, which helps coordinate work and resolve conflicts.

Install it from the Extensions panel (Ctrl+Shift+X) by searching for **GitLens**.

You can also choose which GitLens views appear in the **Source Control** view, by adding the following setting to the same **User Settings (JSON)** as above, inside the existing `{ }`. For each view, `false` keeps it visible and `true` hides it, so the configuration below hides the **Contributors** and **Tags** views and keeps the others:

```json
"gitlens.views.scm.grouped.views": {
    "branches": false,
    "commits": false,
    "contributors": true,
    "launchpad": false,
    "remotes": false,
    "repositories": false,
    "searchAndCompare": false,
    "stashes": false,
    "tags": true,
    "worktrees": false
}
```

## Conclusion

- Install Ruby 4.0.1 with the devkit, then the gems `solargraph` and `ruby-lsp`.
- Install VSCode with the Ruby Solargraph and Ruby LSP extensions. Configure the User Settings (JSON) for tabsize, diagnostics, and the Ruby path.
- Make PSDK code visible to Solargraph via `solargraph.yml`: either a relative path to `pokemonsdk/`, or a `psdk_scripts/` symbolic link.
- Copy PSDK's `.rubocop.yml` into `scripts/` so RuboCop uses the project conventions.
- Always open the `scripts/` folder in VSCode so Solargraph and RuboCop find their configurations.
- Name every script `NNN Name.rb` (3 to 5 digits then a space) so PSDK loads it; the number sets the load order.
- Optionally, install **GitLens** for Git history, blame and contributor information, useful when collaborating on a project.
