---
title: "How to update Pokémon Studio and fix the \"damaged\" error on macOS?"
slug: update-pokemon-studio-macos
sidebar_position: 1
description: "On macOS, Pokémon Studio does not auto-update, and a freshly downloaded release often refuses to open with a misleading \"damaged\" error. This guide explains why it happens and how to update Pokémon Studio manually and unblock it."
---

On macOS, Pokémon Studio does not auto-update, and a freshly downloaded release often refuses to open with a misleading "damaged" error. This guide explains why it happens and how to update Pokémon Studio manually and unblock it.

## Why the "damaged" message appears

When you download an application outside of the App Store, macOS tags it with a **quarantine** flag — an extended attribute named `com.apple.quarantine`. On the first launch, **Gatekeeper** (the macOS security layer) inspects this flag and verifies that the app is signed and notarized by a registered Apple Developer ID.

Pokémon Studio is an open-source, community-built application that is **not notarized by Apple**. Gatekeeper therefore refuses to run it and displays a message such as:

```text
"Pokémon Studio" is damaged and can't be opened. You should move it to the Trash.
```

The app is **not** actually damaged. The message is simply how macOS reports a blocked, un-notarized application. Removing the quarantine flag tells Gatekeeper to let it run.

## Dev builds vs manual updates

How you update depends on which kind of build you run:

- **Dev build**: if you cloned Pokémon Studio from GitHub and run it from source, it updates automatically every time you pull the latest changes with Git. Nothing else is required.
- **Release build**: if you use a packaged release, there is **no auto-update on macOS**. This is the main difference from Windows, where Studio updates itself. On macOS you download each new version manually and clear the quarantine flag again.

If you come from Windows and are used to Studio updating on its own, this manual step is expected — not a bug.

## Downloading the latest release

1. Open the [Pokémon Studio releases page](https://github.com/PokemonWorkshop/PokemonStudio/releases).
2. Download the **darwin** asset of the latest release (`darwin` is the internal name macOS uses for its core).
3. Extract the archive. Some browsers (for example Arc) extract it automatically into your **Downloads** folder; otherwise, double-click the downloaded file to unpack the `Pokemon Studio.app` application.

## Removing the quarantine attribute

Open the **Terminal** application and move into the folder that contains the app — usually `Downloads`:

```bash
cd ~/Downloads
```

Then clear the extended attributes on the application:

```bash
xattr -cr "Pokemon Studio.app"
```

- `xattr` manages extended attributes on files. The `-c` flag **c**lears them, and `-r` applies the change **r**ecursively to everything inside the `.app` bundle.
- The bundle on disk is named `Pokemon Studio.app` **without an accent** (even though the app displays as **Pokémon Studio**), so type it exactly as shown. If you renamed it, adjust the command accordingly.

If the command returns a permission error, prepend `sudo` and enter your Mac password when prompted:

```bash
sudo xattr -cr "Pokemon Studio.app"
```

Once the command completes, double-click `Pokemon Studio.app`. Gatekeeper no longer sees the quarantine flag, and the application opens normally. You can now move it to your **Applications** folder if you want to keep it there.

## Conclusion

- The "damaged" message is misleading: it means macOS Gatekeeper blocked an un-notarized app, not that the file is corrupt.
- Dev builds pulled from GitHub update automatically; packaged releases on macOS must be updated manually, with no auto-update.
- Download the **darwin** asset from the releases page and extract the `Pokemon Studio.app`.
- Run `xattr -cr "Pokemon Studio.app"` (add `sudo` if needed) to clear the quarantine flag, then launch the app normally.
