---
title: "Contribute to PSDK"
slug: using-git-with-psdk
sidebar_position: 2
description: "Contributing to the PSDK engine means working with Git on the official GitLab repository: forking it, proposing your changes through a Merge Request, and keeping your fork synchronized with the official one. This guide covers forking the PSDK repository on GitLab, keeping your fork up to date, and the branch workflow for a contribution."
---

Contributing to the PSDK engine means working with Git on the official GitLab repository: forking it, proposing your changes through a Merge Request, and keeping your fork synchronized with the official one. This guide covers forking the PSDK repository on GitLab, keeping your fork up to date, and the branch workflow for a contribution.

This guide is about contributing to the **engine itself**. If you instead want to collaborate with other makers on your own game, see [Work together on a PSDK project](/pokemon-studio/collaboration/work-together-on-a-psdk-project). It also assumes you are comfortable with the Git basics (repository, commit, branch, remote) and have an SSH key configured; if not, start with [Discover Git](/misc/discover-git). The everyday actions (clone, branch, commit, push) are done graphically in VS Code, as in that guide. The steps that synchronize your fork with the official repository (fetch, rebase, reset) have no reliable graphical equivalent, so they are shown in a terminal (cmd, or VS Code's integrated terminal).

## Forking the PSDK repository

A PSDK project created with Pokémon Studio does not contain a Git repository by default, the engine code is bundled internally by Pokémon Studio. The `pokemonsdk/` folder only appears when you fork and clone the official repository, and it then becomes the source of truth for the engine code (updates are no longer automatic).

A fork is a personal copy of the official repository on GitLab. You work on your fork, then propose your changes to the official repository via a Merge Request. Pushing to GitLab requires an SSH key (see [Setting up SSH](/misc/discover-git#setting-up-ssh)).

### Creating the fork

1. Go to the [official PSDK repository](https://gitlab.com/pokemonsdk/pokemonsdk).
2. Click the **Fork** button.
3. GitLab creates a copy of the repository under your account (e.g. `gitlab.com/your-username/pokemonsdk`).

### Cloning the fork into the project

In VS Code, open the **Command Palette** (`Ctrl+Shift+P`), run **`Git: Clone`**, paste your fork's URL (the SSH URL if you set up an SSH key, otherwise the HTTPS URL), and choose the **root of the PSDK project** as the destination. This creates the `pokemonsdk/` folder.

- The SSH URL (starts with `git@gitlab.com:`) uses the SSH key you configured (see [Setting up SSH](/misc/discover-git#setting-up-ssh)). No password needed on every push.
- The `pokemonsdk/` folder appears at the project root. It contains the full PSDK source code and becomes the source of truth (see [Set up the development environment](/getting-started/customize-psdk/setup-development-environment) to configure Solargraph with this folder).
- `origin` automatically points to your fork. When you push, commits go to your fork, not to the official repository.

If you prefer the terminal, the equivalent command from the project root is `git clone git@gitlab.com:your-username/pokemonsdk.git`.

## Keeping your fork up to date

The official PSDK repository evolves constantly. Unlike a standard Pokémon Studio project where updates are automatic, with a fork you must synchronize yourself. To do this, you need to add the official repository as a remote so you can fetch its new commits and rebase your `development` branch on top. These synchronization steps (add remote, fetch, rebase, reset) have no reliable graphical equivalent, so do them in a terminal (cmd) from the `pokemonsdk` folder.

### Adding the official remote

By default, `origin` points to your fork. Add the official repository as a second remote, called `upstream`:

```bash
cd pokemonsdk
git remote add upstream git@gitlab.com:pokemonsdk/pokemonsdk.git
```

You now have two remotes:

| Remote     | Points to           | Usage                                   |
| ---------- | ------------------- | --------------------------------------- |
| `origin`   | your fork           | pushing your branches                   |
| `upstream` | official repository | fetching new commits to keep up to date |

You can verify with `git remote -v`.

### Synchronizing development

The synchronization procedure is simple: fetch new commits from the official repository, then rebase your `development` branch on top.

```bash
git checkout development
git fetch upstream
git rebase upstream/development
git push
```

- `git checkout development`: switch to the `development` branch (the first time, this creates a local branch that tracks `origin/development`).
- `git fetch upstream`: download new commits from the official repository without modifying any local files. This is a safe operation.
- `git rebase upstream/development`: place your `development` branch on top of `upstream/development`. Since you never commit directly on `development`, this is a simple fast-forward: Git moves the branch pointer without creating any additional commit.
- `git push`: push the updated branch to your fork (`origin`).

If `git push` refuses with a `non-fast-forward` message, it means a commit was accidentally made directly on `development`. In that case, see the next section.

### Fixing a diverged development

If accidental commits were made on `development`, the branch diverges from the official repository and the rebase will fail. To fix this:

```bash
git checkout development
git fetch upstream
git reset --hard upstream/development
git push --force-with-lease
```

- `git reset --hard upstream/development`: replaces the local `development` branch with the official one. **Accidental commits on `development` are lost** — if you want to keep them, run `git branch backup-development` before this command to save them on another branch.
- `git push --force-with-lease`: force pushes to the fork. `--force-with-lease` is safer than `--force` because it checks that nobody else has pushed in the meantime.

## Working on a feature

Once `development` is up to date, create a working branch in VS Code: make sure you are on `development` (run **`Git: Checkout to`** and pick `development`), then run **`Git: Create Branch`** and name it `feature/my-new-feature`.

Do the work and commit it from the **Source Control** view (stage with the **+**, type a message, run **`Git: Commit`**). When ready, publish the branch to your fork with **`Git: Push`** (the first time, the command is **`Git: Publish Branch`**).

Before creating the Merge Request, update the branch on top of the latest `development`. This relies on a rebase onto the official repository, which has no reliable graphical equivalent, so do it in a terminal (cmd, or VS Code's integrated terminal) from the `pokemonsdk` folder:

```bash
git fetch upstream
git rebase upstream/development
```

If there are conflicts, Git stops and asks to resolve them file by file. Fix them in VS Code's merge editor (see the conflict section of [Work together on a PSDK project](/pokemon-studio/collaboration/work-together-on-a-psdk-project)). After clicking **Complete Merge** there, return to the terminal to finish the rebase:

```bash
git add resolved_file.rb
git rebase --continue
```

Once the rebase completes without conflicts, push the rewritten branch, still in the terminal:

```bash
git push --force-with-lease
```

The `--force-with-lease` is necessary after a rebase because the branch history has been rewritten. It is safer than `--force` because it checks that nobody else has pushed in the meantime.

## Conclusion

- Forking the official PSDK repository creates a personal copy. You work on your fork and propose changes via Merge Request.
- Two remotes: `origin` (your fork) for pushing, `upstream` (official repository) for fetching.
- Synchronize `development` regularly with `git fetch upstream` then `git rebase upstream/development`. Since you never commit on `development`, this is a simple fast-forward.
- Always create a working branch from an up-to-date `development`. Never commit directly on `development`.
