---
title: "How to use Git with PSDK?"
slug: using-git-with-psdk
sidebar_position: 2
description: "Git is the versioning tool used by PSDK. It allows tracking the history of changes, working on multiple features in parallel, and synchronizing your work with the official repository. This guide covers the basics of Git, how to fork the PSDK repository on GitLab, and how to keep your fork up to date."
---

Git is the versioning tool used by PSDK. It allows tracking the history of changes, working on multiple features in parallel, and synchronizing your work with the official repository. This guide covers the basics of Git, how to fork the PSDK repository on GitLab, and how to keep your fork up to date.

## Git basics

### The repository

A Git repository is a folder whose change history is tracked. A PSDK project created with Studio does not contain a Git repository by default — the engine code is bundled internally by Studio. The `pokemonsdk/` folder only appears when you fork and clone the official repository (see the "Forking the PSDK repository" section below). This folder then becomes the source of truth for the engine code, and updates are no longer automatic.

### The commit

A commit is a snapshot of changes at a given point in time. It contains:

- The modified files (the diff)
- A message describing the change
- An author and a date
- A unique identifier (the hash, e.g. `a1b2c3d`)

A commit is created with:

```bash
git add modified_file.rb
git commit -m "Fix damage calculation for multi-hit moves"
```

- `git add` selects the files to include in the commit. You can add multiple files, or use `git add .` to add everything.
- `git commit -m "message"` creates the commit with a descriptive message. The message should describe **what** the change does, not **how**.

### The branch

A branch is an independent line of development. By default, the main branch in PSDK is called `development`.

```bash
git branch                         # list local branches
git checkout development           # switch to development
git checkout -b feature/my-change  # create a new branch from the current position
```

- You should **never** work directly on `development`. Create a branch for each feature or bugfix.
- Once the work is done, submit a Merge Request (MR) to integrate the branch into `development`.

### The remote

A remote is a distant repository hosted on a server (GitLab in the case of PSDK). A local repository can be connected to multiple remotes:

```bash
git remote -v   # list remotes and their URLs
```

By default, the main remote is called `origin`. We will see later how to add a second one.

### Essential commands

| Command | Purpose |
|---|---|
| `git status` | see modified/added/deleted files |
| `git add <file>` | add a file to the next commit |
| `git commit -m "message"` | create a commit |
| `git log --oneline` | view commit history |
| `git push` | send commits to the remote |
| `git pull` | fetch commits from the remote |
| `git checkout <branch>` | switch branch |
| `git checkout -b <branch>` | create and switch to a new branch |

## Forking the PSDK repository

A fork is a personal copy of the official repository on GitLab. You work on your fork, then propose your changes to the official repository via a Merge Request.

### Setting up SSH for GitLab

Git uses SSH to communicate with GitLab without having to enter a password on every push. You need to generate an SSH key and add it to your GitLab account.

**Generate the SSH key**:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

- Press Enter to accept the default location (`C:\Users\your-username\.ssh\id_ed25519`).
- Choose a passphrase (optional but recommended) or press Enter to skip.
- Two files are created: `id_ed25519` (private key, never share it) and `id_ed25519.pub` (public key).

**Copy the public key**:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire displayed line (starts with `ssh-ed25519`).

**Add the key on GitLab**:

1. Log in to GitLab, go to **Preferences** (profile icon at top left) > **SSH Keys**.
2. Paste the public key in the **Key** field.
3. Give it a title (e.g. "My PC") and click **Add key**.

**Verify the connection**:

```bash
ssh -T git@gitlab.com
```

If the setup is correct, GitLab responds with `Welcome to GitLab, @your-username!`.

### Creating the fork

1. Go to the [official PSDK repository](https://gitlab.com/pokemonsdk/pokemonsdk).
2. Click the **Fork** button.
3. GitLab creates a copy of the repository under your account (e.g. `gitlab.com/your-username/pokemonsdk`).

### Cloning the fork into the project

From the root of the PSDK project, clone your fork. This creates the `pokemonsdk/` folder:

```bash
git clone git@gitlab.com:your-username/pokemonsdk.git
```

- The SSH URL (starts with `git@gitlab.com:`) uses the key configured above. No password needed on every push.
- The `pokemonsdk/` folder appears at the project root. It contains the full PSDK source code and becomes the source of truth (see guide 003 to configure Solargraph with this folder).
- `origin` automatically points to your fork. When you `git push`, commits go to your fork, not to the official repository.

## Keeping your fork up to date

The official PSDK repository evolves constantly. Unlike a standard Studio project where updates are automatic, with a fork you must synchronize yourself. To do this, you need to add the official repository as a remote so you can fetch its new commits and rebase your `development` branch on top.

### Adding the official remote

By default, `origin` points to your fork. Add the official repository as a second remote, called `upstream`:

```bash
cd pokemonsdk
git remote add upstream git@gitlab.com:pokemonsdk/pokemonsdk.git
```

You now have two remotes:

| Remote     | Points to             | Usage                                            |
| ---------- | --------------------- | ------------------------------------------------ |
| `origin`   | your fork             | pushing your branches                            |
| `upstream` | official repository   | fetching new commits to keep up to date          |

You can verify with `git remote -v`.

### Synchronizing development

The synchronization procedure is simple: fetch new commits from the official repository, then rebase your `development` branch on top.

```bash
git checkout development
git fetch upstream
git rebase upstream/development
git push
```

- `git checkout development`: switch to the local `development` branch.
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

- `git reset --hard upstream/development`: replaces the local `development` branch with the official one. Accidental commits are lost (copy them to a branch first if needed).
- `git push --force-with-lease`: force pushes to the fork. `--force-with-lease` is safer than `--force` because it checks that nobody else has pushed in the meantime.

## Working on a feature

Once `development` is up to date, create a working branch:

```bash
git checkout development
git checkout -b feature/my-new-feature
```

Work, commit, and when ready push the branch to your fork:

```bash
git push -u origin feature/my-new-feature
```

- `-u origin` associates the local branch with the `origin` remote. Subsequent `git push` on this branch will no longer need to specify the remote.

Before creating the Merge Request, make sure the branch is up to date with `development`:

```bash
git fetch upstream
git rebase upstream/development
```

If there are conflicts, Git stops and asks to resolve them file by file. After resolving:

```bash
git add resolved_file.rb
git rebase --continue
```

Once the rebase completes without conflicts, push the branch:

```bash
git push --force-with-lease
```

The `--force-with-lease` is necessary after a rebase because the branch history has been rewritten.

## Conclusion

- Git tracks the history of changes. A commit is a snapshot, a branch is an independent line of work, a remote is a distant repository.
- Forking the official PSDK repository creates a personal copy. You work on your fork and propose changes via Merge Request.
- Two remotes: `origin` (your fork) for pushing, `upstream` (official repository) for fetching.
- Synchronize `development` regularly with `git fetch upstream` then `git rebase upstream/development`. Since you never commit on `development`, this is a simple fast-forward.
- Always create a working branch from an up-to-date `development`. Never commit directly on `development`.
