---
title: "Découvrir Git"
slug: decouvrir-git
sidebar_position: 1
description: "Git est l'outil de gestion de versions utilisé dans tout l'écosystème PSDK, aussi bien pour collaborer sur un jeu que pour contribuer au moteur. Ce guide couvre le vocabulaire nécessaire (dépôt, commit, branche, remote), les commandes essentielles, et comment configurer une clé SSH pour pouvoir push vers GitHub ou GitLab sans taper de mot de passe."
---

Git est l'outil de gestion de versions utilisé dans tout l'écosystème PSDK, aussi bien pour collaborer sur un jeu que pour contribuer au moteur. Ce guide couvre le vocabulaire nécessaire (dépôt, commit, branche, remote), les commandes essentielles, et comment configurer une clé SSH pour pouvoir push vers GitHub ou GitLab sans taper de mot de passe.

## Le dépôt (repository)

Un dépôt Git est un dossier dont l'historique de modifications est suivi. Une fois suivi, chaque modification enregistrée reste dans l'historique et peut être consultée, partagée ou annulée. On transforme un simple dossier en dépôt de deux façons, toutes deux dans VS Code depuis la **palette de commandes** (`Ctrl+Shift+P`) : **`Git: Initialize Repository`** met le dossier ouvert sous suivi, et **`Git: Clone`** télécharge une copie d'un dépôt existant.

## Le commit

Un commit est un instantané des modifications à un moment donné. Il contient :

- Les fichiers modifiés (le diff)
- Un message décrivant la modification
- Un auteur et une date
- Un identifiant unique (le hash, ex: `a1b2c3d`)

Dans **VS Code**, on en crée un depuis la vue **Source Control** (l'icône de branche dans la barre de gauche, ou `Ctrl+Shift+G`) : on indexe les fichiers à inclure avec le **+**, on tape un message, puis on lance **`Git: Commit`** depuis la palette de commandes (`Ctrl+Shift+P`), ou on appuie sur `Ctrl+Entrée` dans le champ de message.

- Indexer avec le **+** sélectionne les fichiers qui entrent dans le commit. On peut en indexer un seul, plusieurs, ou tous d'un coup.
- Le message doit décrire **ce que fait** la modification, pas **comment**, par exemple `Fix damage calculation for multi-hit moves`.

## La branche

Une branche est une ligne de développement indépendante. Par défaut, la branche principale s'appelle généralement `main` (certains projets utilisent `master`, et le moteur PSDK utilise `development`).

- On ne travaille **jamais** directement sur la branche principale. On crée une branche pour chaque fonctionnalité ou correctif.
- Une fois le travail terminé, on fusionne la branche dans la principale, généralement via une **Pull Request** (GitHub) ou une **Merge Request** (GitLab) : une demande de fusion de sa branche qu'un coéquipier peut relire avant qu'elle soit acceptée.

Dans **VS Code**, on lance **`Git: Create Branch`** pour créer une nouvelle branche depuis la position actuelle, ou **`Git: Checkout to`** pour basculer sur une branche existante, depuis la palette de commandes (`Ctrl+Shift+P`). La branche courante est toujours affichée dans la barre d'état en bas.

## Le remote

Un remote est un dépôt distant hébergé sur un serveur comme GitHub ou GitLab. Un dépôt local peut être connecté à plusieurs remotes ; par défaut, le principal s'appelle `origin`. Dans **VS Code**, on lance **`Git: Add Remote`** depuis la palette de commandes (`Ctrl+Shift+P`) pour le connecter à l'un d'eux.

## Les commandes essentielles

On peut faire tout ce qui précède sans ouvrir de terminal. Les commandes ci-dessous sont les équivalents terminal, utiles à reconnaître quand on lit de la documentation Git ailleurs, ou quand on passe à la contribution au moteur, où quelques étapes nécessitent le terminal :

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

C'est optionnel pour GitHub : on peut à la place se connecter à son compte GitHub depuis VS Code (il le demande au premier push) et utiliser l'URL HTTPS du dépôt. La clé SSH est l'option la plus simple pour GitLab, et pour contribuer au moteur PSDK (voir [Contribuer à PSDK](/misc/utiliser-git-avec-psdk)).

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

- Un dépôt Git suit l'historique d'un dossier. On en crée un avec `Git: Initialize Repository` ou `Git: Clone`.
- Un commit est un instantané, une branche est une ligne de travail indépendante, un remote est un dépôt distant (GitHub, GitLab).
- On ne travaille jamais directement sur la branche principale : une branche par fonctionnalité, puis fusion via une Pull Request (GitHub) ou Merge Request (GitLab).
- On configure une clé SSH une fois pour push sans mot de passe.
