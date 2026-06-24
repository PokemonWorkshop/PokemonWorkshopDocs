---
title: "Découvrir Git"
slug: decouvrir-git
sidebar_position: 2
description: "Git est l'outil de gestion de versions utilisé dans tout l'écosystème PSDK, aussi bien pour collaborer sur un jeu que pour contribuer au moteur. Ce guide couvre le vocabulaire nécessaire (dépôt, commit, branche, remote), les commandes essentielles, et comment configurer une clé SSH pour pouvoir push vers GitHub ou GitLab sans taper de mot de passe."
---

Git est l'outil de gestion de versions utilisé dans tout l'écosystème PSDK, aussi bien pour collaborer sur un jeu que pour contribuer au moteur. Ce guide couvre le vocabulaire nécessaire (dépôt, commit, branche, remote), les commandes essentielles, et comment configurer une clé SSH pour pouvoir push vers GitHub ou GitLab sans taper de mot de passe.

## Le dépôt (repository)

Un dépôt Git est un dossier dont l'historique de modifications est suivi. On transforme un simple dossier en dépôt soit en initialisant un nouveau dépôt avec `git init`, soit en copiant un dépôt existant avec `git clone`. Une fois suivi, chaque modification enregistrée reste dans l'historique et peut être consultée, partagée ou annulée.

## Le commit

Un commit est un instantané des modifications à un moment donné. Il contient :

- Les fichiers modifiés (le diff)
- Un message décrivant la modification
- Un auteur et une date
- Un identifiant unique (le hash, ex: `a1b2c3d`)

On crée un commit avec :

```bash
git add fichier_modifie.rb
git commit -m "Fix damage calculation for multi-hit moves"
```

- `git add` sélectionne les fichiers à inclure dans le commit. On peut ajouter plusieurs fichiers, ou utiliser `git add .` pour tout ajouter.
- `git commit -m "message"` crée le commit avec un message descriptif. Le message doit décrire **ce que fait** la modification, pas **comment**.

Dans **VS Code**, on fait la même chose graphiquement : dans la vue **Source Control**, on indexe (c'est-à-dire `git add`) les fichiers avec le **+**, on tape le message, puis on lance **`Git: Commit`** depuis la palette de commandes (`Ctrl+Shift+P`), ou on appuie sur `Ctrl+Entrée` dans le champ de message.

## La branche

Une branche est une ligne de développement indépendante. Par défaut, la branche principale s'appelle généralement `main` (certains projets utilisent `master`, et le moteur PSDK utilise `development`).

```bash
git branch                         # liste les branches locales
git checkout main                  # se placer sur main
git checkout -b feature/my-change  # créer une nouvelle branche depuis la position actuelle
```

- On ne travaille **jamais** directement sur la branche principale. On crée une branche pour chaque fonctionnalité ou correctif.
- Une fois le travail terminé, on fusionne la branche dans la principale, généralement via une **Pull Request** (GitHub) ou une **Merge Request** (GitLab) : une demande de fusion de sa branche qu'un coéquipier peut relire avant qu'elle soit acceptée.

Dans **VS Code**, on lance **`Git: Create Branch`** ou **`Git: Checkout to`** depuis la palette de commandes (`Ctrl+Shift+P`) pour créer une branche ou en changer ; la branche courante est affichée dans la barre d'état en bas.

## Le remote

Un remote est un dépôt distant hébergé sur un serveur comme GitHub ou GitLab. Un dépôt local peut être connecté à plusieurs remotes :

```bash
git remote -v   # liste les remotes et leurs URLs
```

Par défaut, le remote principal s'appelle `origin`.

## Les commandes essentielles

VS Code exécute tout cela graphiquement depuis le panneau Source Control, mais les commandes équivalentes dans le terminal sont utiles à connaître :

| Commande                    | Rôle                                         |
| --------------------------- | -------------------------------------------- |
| `git status`                | voir les fichiers modifiés/ajoutés/supprimés |
| `git add <fichier>`         | ajouter un fichier au prochain commit        |
| `git commit -m "message"`   | créer un commit                              |
| `git log --oneline`         | voir l'historique des commits                |
| `git push`                  | envoyer ses commits vers le remote           |
| `git pull`                  | récupérer les commits du remote              |
| `git checkout <branche>`    | changer de branche                           |
| `git checkout -b <branche>` | créer et se placer sur une nouvelle branche  |

## Configurer SSH

Git utilise SSH pour communiquer avec GitHub ou GitLab sans avoir à entrer un mot de passe à chaque push. On génère une clé SSH une fois et on l'ajoute à son compte.

C'est optionnel pour GitHub : on peut à la place se connecter à son compte GitHub depuis VS Code (il le demande au premier push) et utiliser l'URL HTTPS du dépôt. La clé SSH est l'option la plus simple pour GitLab, et pour contribuer au moteur PSDK (voir [Contribuer à PSDK](/getting-started/utiliser-git-avec-psdk)).

**Générer la clé SSH** :

```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
```

- Appuyer sur Entrée pour accepter l'emplacement par défaut (`C:\Users\votre-pseudo\.ssh\id_ed25519`).
- Choisir une passphrase (optionnel mais recommandé) ou appuyer sur Entrée pour ne pas en mettre.
- Deux fichiers sont créés : `id_ed25519` (clé privée, ne jamais la partager) et `id_ed25519.pub` (clé publique).

**Copier la clé publique** :

Dans l'invite de commandes, afficher la clé publique (ou ouvrir le fichier `id_ed25519.pub` dans un éditeur de texte) :

```bash
type %USERPROFILE%\.ssh\id_ed25519.pub
```

Copier l'intégralité de la ligne affichée (commence par `ssh-ed25519`). Bien copier le fichier `.pub`, jamais la clé privée `id_ed25519`.

**Ajouter la clé à son compte** :

- Sur **GitHub** : **Settings** > **SSH and GPG keys** > **New SSH key**, coller la clé, lui donner un titre et cliquer sur **Add SSH key**.
- Sur **GitLab** : **Preferences** > **SSH Keys**, coller la clé dans le champ **Key**, lui donner un titre et cliquer sur **Add key**.

**Vérifier la connexion** :

```bash
ssh -T git@github.com   # ou : ssh -T git@gitlab.com
```

La première fois, SSH demande de confirmer l'empreinte du serveur : taper `yes` et appuyer sur Entrée. GitHub répond alors `Hi votre-pseudo!...`, GitLab `Welcome to GitLab, @votre-pseudo!`. Si on obtient `Permission denied (publickey)`, la clé n'a pas été ajoutée correctement : refaire l'étape précédente.

## Conclusion

- Un dépôt Git suit l'historique d'un dossier. On en crée un avec `git init` ou `git clone`.
- Un commit est un instantané, une branche est une ligne de travail indépendante, un remote est un dépôt distant (GitHub, GitLab).
- On ne travaille jamais directement sur la branche principale : une branche par fonctionnalité, puis fusion via une Pull Request (GitHub) ou Merge Request (GitLab).
- On configure une clé SSH une fois pour push sans mot de passe.
