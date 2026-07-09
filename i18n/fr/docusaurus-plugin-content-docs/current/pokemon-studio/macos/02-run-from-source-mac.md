---
title: "Exécuter Pokémon Studio depuis les sources sur macOS"
slug: executer-pokemon-studio-depuis-les-sources-macos
sidebar_position: 2
description: "Exécuter Pokémon Studio depuis son code source fournit un build de développement qui se met à jour à chaque fois que l'on récupère les dernières modifications avec Git. Ce guide détaille l'installation complète sur macOS : Homebrew, Node.js via nvm, le clonage du dépôt avec ses sous-modules, l'installation des binaires PSDK et le lancement de l'application."
---

Exécuter Pokémon Studio depuis son code source fournit un build de développement qui se met à jour à chaque fois que l'on récupère les dernières modifications avec Git. Ce guide détaille l'installation complète sur macOS : Homebrew, Node.js via nvm, le clonage du dépôt avec ses sous-modules, l'installation des binaires PSDK et le lancement de l'application.

La version packagée pour macOS ne se met pas à jour automatiquement : compiler depuis les sources est donc la façon la plus pratique de rester sur la dernière version. Si l'on préfère continuer à utiliser une version packagée, voir [Mettre à jour Pokémon Studio et corriger l'erreur « endommagé » sur macOS](/pokemon-studio/macos/mettre-a-jour-pokemon-studio-macos).

## Installer Homebrew et Git

**Homebrew** est le gestionnaire de paquets de référence sur macOS. C'est la façon la plus simple d'installer les outils en ligne de commande dont le build a besoin. Si on ne l'a pas encore, ouvrir l'application **Terminal** et lancer :

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Puis installer **Git**, utilisé pour cloner le dépôt et récupérer les mises à jour par la suite :

```bash
brew install git
```

## Installer Node.js avec nvm

Pokémon Studio repose sur Electron et requiert une version précise de Node.js : **Node.js 22.17.0**. Utiliser une autre version majeure fera échouer l'installation ou le build, il faut donc la fixer précisément. La manière la plus propre de gérer les versions de Node sur macOS est **nvm** (Node Version Manager).

Installer nvm :

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

Fermer puis rouvrir le terminal (ou recharger le profil du shell) pour que la commande `nvm` devienne disponible, puis installer et sélectionner la version requise :

```bash
nvm install 22.17.0
nvm use 22.17.0
```

`npm` est livré avec Node.js, il n'y a donc pas d'étape d'installation séparée pour npm. Installer npm de son côté (par exemple via Homebrew) entrerait en conflit avec la version gérée par nvm, à éviter donc.

## Cloner le dépôt

Se placer dans le dossier où l'on souhaite installer le projet (n'importe quel dossier convient, le **Bureau** est un choix courant), puis cloner le dépôt et y entrer :

```bash
cd ~/Desktop
git clone https://github.com/PokemonWorkshop/PokemonStudio.git
cd PokemonStudio
```

Pokémon Studio intègre les sources du moteur PSDK sous forme de **sous-module** Git. Un simple clone laisse ce sous-module vide, il faut donc le récupérer explicitement :

```bash
git submodule update --init --recursive
```

## Installer les binaires PSDK

Les **binaires PSDK** sont ce qui permet à Studio de démarrer les projets PSDK et d'effectuer des opérations dessus. Ils ne sont pas inclus dans le dépôt et doivent être ajoutés à la main :

1. Télécharger la dernière **archive des binaires PSDK** depuis la [page des releases PokemonSDKBinaries](https://github.com/PokemonWorkshop/PokemonSDKBinaries/releases). L'archive couvre Windows, Linux et macOS (Apple Silicon, M1 et plus récent).
2. Extraire **tout le contenu** de l'archive dans le dossier `psdk-binaries` à la racine du dépôt cloné.

Extraire l'archive entière, et pas seulement une partie : Studio attend l'ensemble complet des fichiers dans ce dossier, y compris la distribution Ruby fournie.

## Installer les dépendances et lancer l'application

Installer les dépendances du projet, puis démarrer l'application :

```bash
npm i
npm start
```

La fenêtre de Pokémon Studio s'ouvre. Si on peut ouvrir, créer et éditer un projet, l'environnement est correctement configuré.

Pour la relancer plus tard, ouvrir le dossier `PokemonStudio` dans un terminal et lancer de nouveau `npm start`. Comme il s'agit d'un build de développement, exécuter `git pull` dans ce dossier avant de le démarrer récupère les dernières modifications : l'application se met ainsi à jour d'elle-même.

## Conclusion

- Compiler depuis les sources produit un build de développement de Pokémon Studio qui reste à jour via `git pull`, contrairement à la version packagée pour macOS.
- Installer **Homebrew** et **Git**, puis utiliser **nvm** pour installer la version requise **Node.js 22.17.0**. Ne pas installer npm séparément.
- Cloner le dépôt, puis lancer `git submodule update --init --recursive` pour récupérer les sources du moteur PSDK intégrées.
- Télécharger les **binaires PSDK** depuis la page des releases et extraire l'intégralité de leur contenu dans le dossier `psdk-binaries`.
- Lancer `npm i` puis `npm start`. Relancer `npm start` depuis le dossier du projet pour rouvrir l'application plus tard.
