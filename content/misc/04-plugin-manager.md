---
title: "Create a plugin for the community"
slug: create-a-psdk-plugin
sidebar_position: 4
description: "The Plugin Manager packages script extensions into a single installable file that handles dependencies, version checks and compatibility between plugins. This guide explains how to build, verify and distribute one."
---

The Plugin Manager packages script extensions into a single installable file that handles dependencies, version checks and compatibility between plugins. This guide explains how to build, verify and distribute one.

Say you wrote a script add-on you want to share: extra scenes, a custom UI, a battle tweak. Without a plugin, the only way to ship it is to hand over a pile of scripts and ask people to paste them in the right order, hope they have the libraries it relies on, and pray nothing clashes with their other add-ons. A **plugin** turns all of that into a single file the user drops into their project. PSDK then installs it, pulls in whatever it depends on, and refuses to load it if something is incompatible.

## How the Plugin Manager works

A plugin is one archive file with the `.psdkplug` extension, stored in `project_root/scripts` (for example `project_root/scripts/ebdx.psdkplug`). Everything the plugin needs to install itself lives inside that archive.

The core rules:

- A plugin stores its own configuration under `project_root/Data/configs/plugins`, so the user can tune it without touching scripts.
- Plugins are installed in dependency order, and a cyclic dependency (A needs B, B needs C, C needs A) is rejected.
- When a plugin depends on another plugin that is missing, the Plugin Manager downloads it automatically.
- A plugin can run a test script to check that PSDK provides what it needs, and another to check that other installed plugins do not interfere with it.
- A plugin can ship graphics, audio and `Data` files alongside its scripts.
- When a plugin is removed, the user is asked whether they want to keep or delete the files it installed.

:::note[The plugin scripts folder is volatile]
`project_root/scripts/00000 Plugins` is wiped and rebuilt every time plugins are installed or removed. Never put your own scripts there: write them inside your plugin folder (see below) and let the Plugin Manager extract them.
:::

## When plugins are installed

The Plugin Manager only does its work when something actually changed. It reinstalls (or removes) plugins when any of these is true:

- A `.psdkplug` file was added to or removed from `scripts`.
- The PSDK version changed, typically after an update.
- You explicitly ran `psdk --util=plugin load`.

If nothing changed since the last run, it stays out of the way and your game boots normally.

## Installing psdk-cli

Building and managing plugins is handled through the `psdk-plugin` command, provided by the `psdk-cli` RubyGem.

To install it, open a terminal and run:

```bash
gem install psdk-cli
```

:::note[Ruby requirement]
`psdk-cli` requires Ruby 3.2.0 or newer. If you have already set up your development environment for PSDK (see [Set up the development environment](/getting-started/customize-psdk/setup-development-environment)), Ruby is already available.
:::

To confirm the installation, run:

```bash
psdk-plugin --help
```

## Building a plugin

### Structuring the plugin folder

A plugin can be structured either inside an existing PSDK project (convenient for testing while developing) or as a standalone folder / repository (convenient for version control and CI/CD).

#### In a PSDK project

Create a folder named after your plugin in `project_root/scripts` (e.g. `project_root/scripts/your_plugin`). Inside, PSDK expects this layout:

- `config.yml` at the root of the plugin folder (`scripts/your_plugin/config.yml`): the plugin manifest (described below).
- A `scripts` subfolder holding your actual code (`scripts/your_plugin/scripts/`). Each script file follows the PSDK naming norm, `XXXXX NameOfScript.rb`.
- Compatibility test scripts, if any, sit at the root of the plugin folder next to `config.yml`.
- **Additional files** (such as default configs in `Data/configs/plugins/`, graphics, audio): these must **not** be placed inside `scripts/your_plugin/`. Instead, they reside directly at their destination paths relative to the **project root** (e.g. `project_root/Data/configs/your_plugin_user_config.json`, `project_root/graphics/...`). When building inside a project, the builder resolves paths relative to the project root.

#### In a standalone repository

If you develop the plugin in its own dedicated repository outside a PSDK project:

- `config.yml` at the root of the repository.
- A `scripts` subfolder holding your Ruby scripts (`scripts/XXXXX NameOfScript.rb`).
- Compatibility test scripts, if any, sit at the root next to `config.yml`.
- **Additional files**: mirror the PSDK project structure directly at the root of your repository (e.g. `your_repo/Data/configs/your_plugin_user_config.json`, `your_repo/graphics/...`). When building in standalone mode, the builder resolves paths relative to the repository root.

If you need a concrete example, the [psdk-plugins repository](https://gitlab.com/NuriYuri/psdk-plugins) shows how plugin source folders are laid out.

### The config.yml file

This file is the plugin manifest. It looks like this:

```yaml
--- !ruby/object:PluginManager::Config
name: test
authors:
- Yuri
version: 0.0.0.0
deps: []
psdk_compatibility_script: psdk.rb
retry_psdk_compatibility_after_plugin_load: false
additional_compatibility_script: add.rb
added_files:
- Data/configs/plugins/test/*.yml
```

Each field:

- `name`: the plugin name, as a string. It must be a valid filename.
- `authors`: the list of authors who worked on the plugin.
- `version`: the current version, in the format `m.b.a.c` where `m` is major, `b` is beta, `a` is alpha and `c` is correction. All four are numbers.
- `deps`: the list of dependencies and incompatibilities (detailed below).
- `psdk_compatibility_script`: the name of the script that checks the plugin is compatible with PSDK. Optional, remove the line if you do not use it.
- `retry_psdk_compatibility_after_plugin_load`: a boolean telling whether `psdk_compatibility_script` should also run once all plugins are installed and loaded.
- `additional_compatibility_script`: the name of the script that checks the plugin works with the other installed plugins. Optional, remove the line if you do not use it.
- `added_files`: the list of files the plugin ships. This value is passed to Ruby's `Dir[]`, so it accepts globs or explicit file paths. Note that where these files are read from depends on where you run the build:
  - **In a PSDK project**: paths are read relative to the **project root** (e.g. `Data/configs/plugins/test/*.yml` looks in `project_root/Data/configs/plugins/test/`). The files must already exist at their final location in your project.
  - **In a standalone repository**: paths are read relative to the **root of your plugin repository** (e.g. `Data/configs/plugins/test/*.yml` looks in `your_repo/Data/configs/plugins/test/`).
  When a user installs the `.psdkplug` archive, these files are extracted to these exact paths relative to their project root. To ship a file located at the root, prefix its path with `./`, for example `./my_file.extension`.

:::important[Path resolution for additional files]
Because `added_files` records the exact relative path where files will be unpacked in the user's project:

- Inside a **PSDK project**, do not put additional files in `scripts/your_plugin/`. Place them in their real project locations (`Data/...`, `graphics/...`).
- In a **standalone repository**, replicate the target folder structure from the root of your repository (`Data/...`, `graphics/...`).

:::

### Declaring dependencies and incompatibilities

The `deps` list describes both the plugins this one needs and the plugins it cannot coexist with. Version bounds are optional and inclusive. Each entry accepts:

- `:name`: the name of the dependency (or of the incompatible plugin).
- `:incompatible`: a boolean. When `true`, the named plugin is declared incompatible instead of being a dependency.
- `:url`: the URL of the plugin file, used to download it when it is a missing dependency.
- `:version_min`: the minimum accepted version (optional, inclusive).
- `:version_max`: the maximum accepted version (optional, inclusive).

The example below depends on `super_plugin`, on `ruby_descr` from version `3.0.1.0`, on `yaml` up to `1.5.3.0`, on `litergss` between `2.0.0.0` and `2.255.255.255`, and declares `rgss` and `essentials` (between `1.0.0.0` and `25.0.0.0`) as incompatible:

```yaml
deps:
- :name: super_plugin
  :url: https://download.psdk.pokemonworkshop.com/plugins/super_plugin.psdkplug
- :name: ruby_descr
  :url: https://download.psdk.pokemonworkshop.com/plugins/ruby_descr.psdkplug
  :version_min: 3.0.1.0
- :name: yaml
  :url: https://download.psdk.pokemonworkshop.com/plugins/yaml.psdkplug
  :version_max: 1.5.3.0
- :name: litergss
  :url: https://download.psdk.pokemonworkshop.com/plugins/litergss.psdkplug
  :version_min: 2.0.0.0
  :version_max: 2.255.255.255
- :name: rgss
  :incompatible: true
- :name: essentials
  :incompatible: true
  :version_min: 1.0.0.0
  :version_max: 25.0.0.0
```

:::warning[Dependency URLs must download directly]
A dependency URL has to let PSDK fetch the file over HTTPS without any "download wall". Hosts like MediaFire or Mega require a browser to reach the actual file, so PSDK cannot download from them. Use a host that serves the `.psdkplug` file directly.
:::

### Building the .psdkplug file

Plugins are compiled into `.psdkplug` archives using the `psdk-plugin build` command from `psdk-cli`.

#### Building inside a PSDK project

When you are inside a PSDK project (a folder containing `project.studio`), pass the plugin folder name:

```bash
psdk-plugin build plugin_name
```

Replace `plugin_name` with the name of the folder under `scripts/`. By default, this builds the archive into the current directory.

To output the compiled `.psdkplug` file directly into your `scripts/` folder so PSDK can detect and install it:

```bash
psdk-plugin build plugin_name --out-dir=scripts
```

#### Building in standalone mode (outside a PSDK project)

If you develop your plugin in an isolated folder or Git repository, navigate to the plugin's root directory and run:

```bash
psdk-plugin build
```

When run outside a PSDK project, `psdk-plugin build` automatically defaults to the current directory (`.`) as the plugin source.

You can also target another folder or specify an output directory:

```bash
psdk-plugin build path/to/plugin --out-dir=dist
```

If you are working inside a PSDK project directory but want to build a standalone plugin folder without using the project structure, use the `--no-psdk-project` flag:

```bash
psdk-plugin build path/to/plugin --no-psdk-project
```

#### Command options

| Option | Description |
| --- | --- |
| `[PLUGIN_NAME]` | Name of the plugin folder inside `scripts/` (when in a project) or directory path (in standalone mode, defaults to `.`). |
| `--out-dir` | Output directory for the generated `.psdkplug` file (default: `.`). |
| `--no-psdk-project` | Force standalone mode, ignoring PSDK project detection. |

### Checking the bundled files

Once built, ensure the `.psdkplug` file is in your project's `scripts/` folder. The easiest way to confirm every file made it into the archive is to force a reinstall:

```bash
psdk --util=plugin load
```

This reinstalls the plugin and prints every file it skipped because the file already exists at its destination. Here is the output for a plugin called `test` that ships three files:

```text
================================================================================
#                           PSDK Plugin Manager v1.0                           #
# Something changed in your plugins!                                           #
================================================================================
PSDK checked!
Extracting scripts for test plugin...
Extracting resources of test plugin...
Skipping Data/configs/credits_config.yml (exist)
Skipping Data/configs/save_config.yml (exist)
Skipping Data/configs/scene_title_config.yml (exist)
```

Seeing your files listed as skipped confirms they were bundled.

### Compatibility scripts

Compatibility scripts let a plugin abort installation with a clear reason instead of crashing the game later. They are plain Ruby scripts that `raise` when something is wrong:

- `psdk_compatibility_script` runs before the plugin is loaded, to verify PSDK itself provides what the plugin needs.
- `additional_compatibility_script` runs after every plugin has been loaded, to verify the other installed plugins do not interfere.
- `retry_psdk_compatibility_after_plugin_load`, when `true`, runs `psdk_compatibility_script` a second time after all plugins are loaded, useful when another plugin could have altered what the first check relied on.

If any of these scripts raises, the Plugin Manager reports the plugin as incompatible and stops.

## Listing installed plugins

To see what plugins are currently installed in your PSDK project, along with each plugin's version and authors, run:

```bash
psdk-plugin list
```

:::note[Run inside a PSDK project]
`psdk-plugin list` must be run from inside a PSDK project directory. It inspects the installed plugins recorded in `scripts/plugins.dat`.
:::

## Distributing a plugin

How you distribute a plugin depends on whether other plugins will depend on it.

If it can be a dependency, host the `.psdkplug` file somewhere reachable over HTTPS with a direct download (the same "no download wall" rule as dependency URLs), or ask Pokémon Workshop whether they can host it. That way, the Plugin Manager can fetch it automatically for anyone who depends on it.

If it is standalone, the user only needs to drop the file into `project_root/scripts`. As long as you described the dependencies correctly, everything is handled on install.

:::tip[Warn about incompatibilities upfront]
If your plugin is incompatible with another plugin or with some PSDK versions, tell users before they download it. The Plugin Manager will catch the conflict, but a heads-up saves them the surprise.
:::

## Conclusion

A plugin is a folder with a `config.yml` manifest, built into a single `.psdkplug` file with `psdk-plugin build` from `psdk-cli`. The manifest declares the version, the files to ship, the dependencies to download and the incompatibilities to reject, while optional compatibility scripts let the plugin fail fast with a readable message. Once built and verified with `psdk --util=plugin load`, you distribute it as a direct HTTPS download, and the Plugin Manager takes care of installing it in the right order on every project.
