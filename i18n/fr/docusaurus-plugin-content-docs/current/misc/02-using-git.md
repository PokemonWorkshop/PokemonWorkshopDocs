---
title: "Contribuer à PSDK"
slug: utiliser-git-avec-psdk
sidebar_position: 2
description: "Contribuer au moteur PSDK, c'est travailler avec Git sur le dépôt officiel GitLab : le forker, proposer ses modifications via une Merge Request, et synchroniser son fork avec le dépôt officiel. Ce guide couvre comment forker le dépôt PSDK sur GitLab, maintenir son fork à jour, et le workflow de branche pour une contribution."
---

Contribuer au moteur PSDK, c'est travailler avec Git sur le dépôt officiel GitLab : le forker, proposer ses modifications via une Merge Request, et synchroniser son fork avec le dépôt officiel. Ce guide couvre comment forker le dépôt PSDK sur GitLab, maintenir son fork à jour, et le workflow de branche pour une contribution.

Ce guide concerne la contribution au **moteur lui-même**. Si on souhaite plutôt collaborer avec d'autres makers sur son propre jeu, voir [Travailler à plusieurs sur un projet PSDK](/getting-started/travailler-a-plusieurs-sur-un-projet-psdk). Il suppose aussi qu'on est à l'aise avec les bases de Git (dépôt, commit, branche, remote) et qu'on a une clé SSH configurée ; si ce n'est pas le cas, commencer par [Découvrir Git](/misc/decouvrir-git). Les actions courantes (cloner, brancher, committer, pousser) se font graphiquement dans VS Code, comme dans ce guide. Les étapes qui synchronisent le fork avec le dépôt officiel (fetch, rebase, reset) n'ont pas d'équivalent graphique fiable, donc elles sont montrées dans un terminal (cmd, ou le terminal intégré de VS Code).

## Forker le dépôt PSDK

Un projet PSDK créé avec Pokémon Studio ne contient pas de dépôt Git par défaut, le code du moteur est embarqué en interne par Pokémon Studio. Le dossier `pokemonsdk/` n'apparaît que lorsqu'on fork et clone le dépôt officiel, et il devient alors la source de vérité pour le code du moteur (les mises à jour ne sont plus automatiques).

Un fork est une copie personnelle du dépôt officiel sur GitLab. On travaille sur son fork, puis on propose ses modifications au dépôt officiel via une Merge Request. Pousser vers GitLab nécessite une clé SSH (voir [Configurer SSH](/misc/decouvrir-git#configurer-ssh)).

### Créer le fork

1. Se rendre sur le [dépôt officiel PSDK](https://gitlab.com/pokemonsdk/pokemonsdk).
2. Cliquer sur le bouton **Créer une bifurcation**.
3. GitLab crée une copie du dépôt sous son compte (ex: `gitlab.com/votre-pseudo/pokemonsdk`).

### Cloner le fork dans le projet

Dans VS Code, ouvrir la **palette de commandes** (`Ctrl+Shift+P`), lancer **`Git: Clone`**, coller l'URL de son fork (l'URL SSH si on a configuré une clé SSH, sinon l'URL HTTPS), et choisir la **racine du projet PSDK** comme destination. Cela crée le dossier `pokemonsdk/`.

- L'URL SSH (commence par `git@gitlab.com:`) utilise la clé SSH configurée (voir [Configurer SSH](/misc/decouvrir-git#configurer-ssh)). Pas besoin de mot de passe à chaque push.
- Le dossier `pokemonsdk/` apparaît à la racine du projet. Il contient tout le code source de PSDK et devient la source de vérité (voir [Préparer son environnement de développement](/getting-started/customize-psdk/preparer-son-environnement) pour configurer Solargraph avec ce dossier).
- `origin` pointe automatiquement vers son fork. Quand on push, les commits vont sur son fork, pas sur le dépôt officiel.

Si on préfère le terminal, la commande équivalente depuis la racine du projet est `git clone git@gitlab.com:votre-pseudo/pokemonsdk.git`.

## Maintenir son fork à jour

Le dépôt officiel PSDK évolue en permanence. Contrairement à un projet Pokémon Studio classique où les mises à jour sont automatiques, avec un fork c'est à nous de synchroniser. Pour cela, il faut ajouter le dépôt officiel comme remote afin de pouvoir récupérer ses nouveaux commits et rebase notre branche `development` dessus. Ces étapes de synchronisation (ajout de remote, fetch, rebase, reset) n'ont pas d'équivalent graphique fiable, donc on les fait dans un terminal (cmd) depuis le dossier `pokemonsdk`.

### Ajouter le remote officiel

Par défaut, `origin` pointe vers notre fork. On ajoute le dépôt officiel comme second remote, qu'on appelle `upstream` :

```bash
cd pokemonsdk
git remote add upstream git@gitlab.com:pokemonsdk/pokemonsdk.git
```

On a maintenant deux remotes :

| Remote     | Pointe vers    | Usage                                            |
| ---------- | -------------- | ------------------------------------------------ |
| `origin`   | son fork       | push de ses branches                             |
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

- `git checkout development` : se placer sur la branche `development` (la première fois, cela crée une branche locale qui suit `origin/development`).
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

- `git reset --hard upstream/development` : remplace la branche `development` locale par celle du dépôt officiel. **Les commits accidentels sur `development` sont perdus** — pour les garder, lancer `git branch backup-development` avant cette commande afin de les sauvegarder sur une autre branche.
- `git push --force-with-lease` : force le push sur le fork. `--force-with-lease` est plus sûr que `--force` car il vérifie que personne d'autre n'a push entre-temps.

## Travailler sur une fonctionnalité

Une fois `development` à jour, on crée une branche de travail dans VS Code : on s'assure d'être sur `development` (lancer **`Git: Checkout to`** et choisir `development`), puis on lance **`Git: Create Branch`** et on la nomme `feature/my-new-feature`.

On fait le travail et on le committe depuis la vue **Source Control** (indexer avec le **+**, taper un message, lancer **`Git: Commit`**). Quand c'est prêt, on publie la branche sur son fork avec **`Git: Push`** (la première fois, la commande est **`Git: Publish Branch`**).

Avant de créer la Merge Request, on met la branche à jour sur la pointe de `development`. Cela repose sur un rebase sur le dépôt officiel, qui n'a pas d'équivalent graphique fiable, donc on le fait dans un terminal (cmd, ou le terminal intégré de VS Code) depuis le dossier `pokemonsdk` :

```bash
git fetch upstream
git rebase upstream/development
```

S'il y a des conflits, Git s'arrête et demande de les résoudre fichier par fichier. On les corrige dans l'éditeur de fusion de VS Code (voir la section conflit de [Travailler à plusieurs sur un projet PSDK](/getting-started/travailler-a-plusieurs-sur-un-projet-psdk)). Après avoir cliqué sur **Complete Merge**, on revient au terminal pour terminer le rebase :

```bash
git add fichier_resolu.rb
git rebase --continue
```

Une fois le rebase terminé sans conflit, on push la branche réécrite, toujours dans le terminal :

```bash
git push --force-with-lease
```

Le `--force-with-lease` est nécessaire après un rebase car l'historique de la branche a été réécrit. Il est plus sûr que `--force` car il vérifie que personne d'autre n'a push entre-temps.

## Conclusion

- Forker le dépôt officiel PSDK crée une copie personnelle. On travaille sur son fork et on propose ses modifications via Merge Request.
- Deux remotes : `origin` (son fork) pour push, `upstream` (dépôt officiel) pour fetch.
- Synchroniser `development` régulièrement avec `git fetch upstream` puis `git rebase upstream/development`. Puisqu'on ne commit jamais sur `development`, c'est un simple fast-forward.
- Toujours créer une branche de travail depuis `development` à jour. Ne jamais commit directement sur `development`.
