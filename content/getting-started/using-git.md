---
title: "Comment utiliser Git avec PSDK ?"
slug: utiliser-git-avec-psdk
sidebar_position: 2
description: "Git est l'outil de versioning utilisé par PSDK. Il permet de suivre l'historique des modifications, de travailler sur plusieurs fonctionnalités en parallèle, et de synchroniser son travail avec le dépôt officiel. Ce guide couvre les bases de Git, comment forker le dépôt PSDK sur GitLab, et comment maintenir son fork à jour."
---

Git est l'outil de versioning utilisé par PSDK. Il permet de suivre l'historique des modifications, de travailler sur plusieurs fonctionnalités en parallèle, et de synchroniser son travail avec le dépôt officiel. Ce guide couvre les bases de Git, comment forker le dépôt PSDK sur GitLab, et comment maintenir son fork à jour.

## Les bases de Git

### Le dépôt (repository)

Un dépôt Git est un dossier dont l'historique de modifications est suivi. Un projet PSDK créé avec Studio ne contient pas de dépôt Git par défaut — le code du moteur est embarqué en interne par Studio. Le dossier `pokemonsdk/` n'apparaît que lorsqu'on fork et clone le dépôt officiel (voir la section "Forker le dépôt PSDK" plus bas). Ce dossier devient alors la source de vérité pour le code du moteur, et les mises à jour ne sont plus automatiques.

### Le commit

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

### La branche

Une branche est une ligne de développement indépendante. Par défaut, la branche principale de PSDK s'appelle `development`.

```bash
git branch                         # liste les branches locales
git checkout development           # se placer sur development
git checkout -b feature/my-change  # créer une nouvelle branche depuis la position actuelle
```

- On ne travaille **jamais** directement sur `development`. On crée une branche pour chaque fonctionnalité ou correctif.
- Une fois le travail terminé, on fait une Merge Request (MR) pour intégrer la branche dans `development`.

### Le remote

Un remote est un dépôt distant hébergé sur un serveur (GitLab dans le cas de PSDK). Un dépôt local peut être connecté à plusieurs remotes :

```bash
git remote -v   # liste les remotes et leurs URLs
```

Par défaut, le remote principal s'appelle `origin`. On verra plus loin comment en ajouter un second.

### Les commandes essentielles

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

## Forker le dépôt PSDK

Un fork est une copie personnelle du dépôt officiel sur GitLab. On travaille sur son fork, puis on propose ses modifications au dépôt officiel via une Merge Request.

### Configurer SSH pour GitLab

Git utilise SSH pour communiquer avec GitLab sans avoir à entrer un mot de passe à chaque push. Il faut générer une clé SSH et l'ajouter à son compte GitLab.

**Générer la clé SSH** :

```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
```

- Appuyer sur Entrée pour accepter l'emplacement par défaut (`C:\Users\votre-pseudo\.ssh\id_ed25519`).
- Choisir une passphrase (optionnel mais recommandé) ou appuyer sur Entrée pour ne pas en mettre.
- Deux fichiers sont créés : `id_ed25519` (clé privée, ne jamais la partager) et `id_ed25519.pub` (clé publique).

**Copier la clé publique** :

```bash
cat ~/.ssh/id_ed25519.pub
```

Copier l'intégralité de la ligne affichée (commence par `ssh-ed25519`).

**Ajouter la clé sur GitLab** :

1. Se connecter à GitLab, aller dans **Preferences** (icône de profil en haut à gauche) > **SSH Keys**.
2. Coller la clé publique dans le champ **Key**.
3. Donner un titre (ex: "Mon PC") et cliquer sur **Add key**.

**Vérifier la connexion** :

```bash
ssh -T git@gitlab.com
```

Si la configuration est correcte, GitLab répond `Welcome to GitLab, @votre-pseudo!`.

### Créer le fork

1. Se rendre sur le [dépôt officiel PSDK](https://gitlab.com/pokemonsdk/pokemonsdk).
2. Cliquer sur le bouton **Créer une bifurcation**.
3. GitLab crée une copie du dépôt sous votre compte (ex: `gitlab.com/votre-pseudo/pokemonsdk`).

### Cloner le fork dans le projet

Depuis la racine du projet PSDK, cloner son fork. Cela crée le dossier `pokemonsdk/` :

```bash
git clone git@gitlab.com:votre-pseudo/pokemonsdk.git
```

- L'URL SSH (commence par `git@gitlab.com:`) utilise la clé configurée plus haut. Pas besoin de mot de passe à chaque push.
- Le dossier `pokemonsdk/` apparaît à la racine du projet. Il contient tout le code source de PSDK et devient la source de vérité (voir le guide 003 pour configurer Solargraph avec ce dossier).
- `origin` pointe automatiquement vers votre fork. Quand on fait `git push`, les commits vont sur votre fork, pas sur le dépôt officiel.

## Maintenir son fork à jour

Le dépôt officiel PSDK évolue en permanence. Contrairement à un projet Studio classique où les mises à jour sont automatiques, avec un fork c'est à nous de synchroniser. Pour cela, il faut ajouter le dépôt officiel comme remote afin de pouvoir récupérer ses nouveaux commits et rebase notre branche `development` dessus.

### Ajouter le remote officiel

Par défaut, `origin` pointe vers notre fork. On ajoute le dépôt officiel comme second remote, qu'on appelle `upstream` :

```bash
cd pokemonsdk
git remote add upstream git@gitlab.com:pokemonsdk/pokemonsdk.git
```

On a maintenant deux remotes :

| Remote     | Pointe vers    | Usage                                            |
| ---------- | -------------- | ------------------------------------------------ |
| `origin`   | votre fork     | push de vos branches                             |
| `upstream` | dépôt officiel | fetch les nouveaux commits pour se mettre à jour |

On peut vérifier avec `git remote -v`.

### Synchroniser development

La procédure de synchronisation est simple : on récupère les nouveaux commits du dépôt officiel, puis on rebase sa branche `development` dessus.

```bash
git checkout development
git fetch upstream
git rebase upstream/development
git push
```

- `git checkout development` : se placer sur la branche `development` locale.
- `git fetch upstream` : télécharger les nouveaux commits du dépôt officiel sans modifier aucun fichier local. C'est une opération sûre.
- `git rebase upstream/development` : replacer sa branche `development` sur la pointe de `upstream/development`. Puisqu'on ne commit jamais directement sur `development`, c'est un simple fast-forward : Git avance le pointeur de branche sans créer de commit supplémentaire.
- `git push` : pousser la branche mise à jour sur son fork (`origin`).

Si `git push` refuse avec un message `non-fast-forward`, cela signifie qu'un commit a été fait directement sur `development` par erreur. Dans ce cas, voir la section suivante.

### Réparer un development divergent

Si des commits accidentels ont été faits sur `development`, la branche diverge du dépôt officiel et le rebase échouera. Pour réparer :

```bash
git checkout development
git fetch upstream
git reset --hard upstream/development
git push --force-with-lease
```

- `git reset --hard upstream/development` : remplace la branche `development` locale par celle du dépôt officiel. Les commits accidentels sont perdus (les copier sur une branche avant si nécessaire).
- `git push --force-with-lease` : force le push sur le fork. `--force-with-lease` est plus sûr que `--force` car il vérifie que personne d'autre n'a push entre-temps.

## Travailler sur une fonctionnalité

Une fois `development` à jour, on crée une branche de travail :

```bash
git checkout development
git checkout -b feature/my-new-feature
```

On travaille, on commit, et quand c'est prêt on push la branche sur son fork :

```bash
git push -u origin feature/my-new-feature
```

- `-u origin` associe la branche locale au remote `origin`. Les `git push` suivants sur cette branche n'auront plus besoin de préciser le remote.

Avant de créer la Merge Request, s'assurer que la branche est à jour avec `development` :

```bash
git fetch upstream
git rebase upstream/development
```

S'il y a des conflits, Git s'arrête et demande de les résoudre fichier par fichier. Après résolution :

```bash
git add fichier_resolu.rb
git rebase --continue
```

Une fois le rebase terminé sans conflit, push la branche :

```bash
git push --force-with-lease
```

Le `--force-with-lease` est nécessaire après un rebase car l'historique de la branche a été réécrit.

## Conclusion

- Git suit l'historique des modifications. Un commit est un instantané, une branche est une ligne de travail indépendante, un remote est un dépôt distant.
- Forker le dépôt officiel PSDK crée une copie personnelle. On travaille sur son fork et on propose ses modifications via Merge Request.
- Deux remotes : `origin` (votre fork) pour push, `upstream` (dépôt officiel) pour fetch.
- Synchroniser `development` régulièrement avec `git fetch upstream` puis `git rebase upstream/development`. Puisqu'on ne commit jamais sur `development`, c'est un simple fast-forward.
- Toujours créer une branche de travail depuis `development` à jour. Ne jamais commit directement sur `development`.
