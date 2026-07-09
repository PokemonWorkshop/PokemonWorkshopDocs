---
title: "Discover Git"
slug: discover-git
sidebar_position: 1
description: "Git is the version control tool used across the PSDK ecosystem, both to collaborate on a game and to contribute to the engine. This guide covers the vocabulary you need (repository, commit, branch, remote), the essential commands, and how to set up an SSH key so you can push to GitHub or GitLab without typing a password."
---

Git is the version control tool used across the PSDK ecosystem, both to collaborate on a game and to contribute to the engine. This guide covers the vocabulary you need (repository, commit, branch, remote), the essential commands, and how to set up an SSH key so you can push to GitHub or GitLab without typing a password.

## The repository

A Git repository is a folder whose change history is tracked. Once tracked, every change you record stays in the history and can be reviewed, shared, or reverted. You turn a plain folder into a repository in two ways, both in VS Code from the **Command Palette** (`Ctrl+Shift+P`): **`Git: Initialize Repository`** starts tracking the folder you have open, and **`Git: Clone`** downloads a copy of an existing repository.

## The commit

A commit is a snapshot of changes at a given point in time. It contains:

- The modified files (the diff)
- A message describing the change
- An author and a date
- A unique identifier (the hash, e.g. `a1b2c3d`)

In **VS Code**, you create one from the **Source Control** view (the branch icon in the left bar, or `Ctrl+Shift+G`): stage the files you want to include with the **+**, type a message, then run **`Git: Commit`** from the Command Palette (`Ctrl+Shift+P`), or press `Ctrl+Enter` in the message box.

- Staging with the **+** selects which files go into the commit. You can stage a single file, several, or all of them at once.
- The message should describe **what** the change does, not **how**, for example `Fix damage calculation for multi-hit moves`.

## The branch

A branch is an independent line of development. By default, the main branch is usually called `main` (some projects use `master`, and the PSDK engine uses `development`).

- You should **never** work directly on the main branch. Create a branch for each feature or bugfix.
- Once the work is done, you merge the branch back into the main one, usually through a **Pull Request** (GitHub) or a **Merge Request** (GitLab): a request to merge your branch that a teammate can review before it is accepted.

In **VS Code**, run **`Git: Create Branch`** to start a new branch from your current position, or **`Git: Checkout to`** to switch to an existing one, both from the Command Palette (`Ctrl+Shift+P`). The current branch is always shown in the status bar at the bottom.

## The remote

A remote is a distant repository hosted on a server such as GitHub or GitLab. A local repository can be connected to several remotes; by default, the main one is called `origin`. In **VS Code**, run **`Git: Add Remote`** from the Command Palette (`Ctrl+Shift+P`) to connect your repository to one.

## Essential commands

You can do everything above without opening a terminal. The commands below are the terminal equivalents, useful to recognize when you read about Git elsewhere, or when you move on to contributing to the engine, where a few steps need the terminal:

| Command | Purpose |
| --- | --- |
| `git status` | see modified/added/deleted files |
| `git add <file>` | add a file to the next commit |
| `git commit -m "message"` | create a commit |
| `git log --oneline` | view commit history |
| `git push` | send commits to the remote |
| `git pull` | fetch commits from the remote |
| `git checkout <branch>` | switch branch |
| `git checkout -b <branch>` | create and switch to a new branch |

## Setting up SSH

Git uses SSH to communicate with GitHub or GitLab without typing a password on every push. You generate an SSH key once and add it to your account.

This is optional for GitHub: you can instead sign in to your GitHub account from VS Code (it prompts on the first push) and use the HTTPS repository URL. An SSH key is the simplest option for GitLab, and for contributing to the PSDK engine (see [Contribute to PSDK](/misc/using-git-with-psdk)).

**Generate the SSH key**:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

- Press Enter to accept the default location (`C:\Users\your-username\.ssh\id_ed25519`).
- Choose a passphrase (optional but recommended) or press Enter to skip.
- Two files are created: `id_ed25519` (private key, never share it) and `id_ed25519.pub` (public key).

**Copy the public key**:

In Command Prompt, display the public key (or open the `id_ed25519.pub` file in a text editor):

```bash
type %USERPROFILE%\.ssh\id_ed25519.pub
```

Copy the entire displayed line (starts with `ssh-ed25519`). Make sure you copy the `.pub` file, never the private key `id_ed25519`.

**Add the key to your account**:

- On **GitHub**: **Settings** > **SSH and GPG keys** > **New SSH key**, paste the key, give it a title, and click **Add SSH key**.
- On **GitLab**: **Preferences** > **SSH Keys**, paste the key in the **Key** field, give it a title, and click **Add key**.

**Verify the connection**:

```bash
ssh -T git@github.com   # or: ssh -T git@gitlab.com
```

The first time, SSH asks to confirm the server's fingerprint: type `yes` and press Enter. GitHub then replies with `Hi your-username!...`, GitLab with `Welcome to GitLab, @your-username!`. If you get `Permission denied (publickey)`, the key was not added correctly: redo the previous step.

## Conclusion

- A Git repository tracks the history of a folder. Create one with `Git: Initialize Repository` or `Git: Clone`.
- A commit is a snapshot, a branch is an independent line of work, a remote is a distant repository (GitHub, GitLab).
- Never work on the main branch directly: branch per feature, then merge through a Pull Request (GitHub) or Merge Request (GitLab).
- Set up an SSH key once to push without a password.
