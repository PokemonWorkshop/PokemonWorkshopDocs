---
title: "Les bases de RPG Maker XP"
slug: bases-de-rpg-maker-xp
sidebar_position: 1
description: "PSDK utilise RPG Maker XP (RMXP) uniquement pour la gestion des events : les maps sont créées avec Tiled et la base de données est gérée par Pokémon Studio. RMXP s'obtient à petit prix et n'est nécessaire que jusqu'à la sortie de Pokémon Studio v3. Ce guide explique si on en a besoin, pourquoi PSDK s'appuie dessus, et ce qu'il faut apprendre."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK utilise **RPG Maker XP** (RMXP) uniquement pour la gestion des **events** : les maps sont créées avec **Tiled** et la base de données est gérée par **Pokémon Studio**. RMXP s'obtient à petit prix et n'est nécessaire que jusqu'à la sortie de Pokémon Studio v3. Ce guide explique si on en a besoin, pourquoi PSDK s'appuie dessus, et ce qu'il faut apprendre.

## Faut-il RPG Maker XP ?

Oui, pour l'instant. PSDK s'appuie spécifiquement sur **RPG Maker XP** (ni VX, ni MV, ni MZ). Depuis Pokémon Studio 2.0, les maps se créent avec [**Tiled**](/tiled/introduction-a-tiled) et la base de données vit dans **Pokémon Studio** : RMXP ne sert donc plus qu'à créer et modifier les **events**. Il reste indispensable tant que Pokémon Studio v3 n'est pas sorti.

RPG Maker XP s'achète sur Steam, à petit prix et souvent en promotion : [RPG Maker XP sur Steam](https://store.steampowered.com/app/235900/RPG_Maker_XP/).

## Pourquoi PSDK utilise RPG Maker XP ?

PSDK descend d'un ancien Starter Kit, le **Pokémon Script Project**, bâti sur RPG Maker XP (la seule option viable en 2007). Pour offrir une transition en douceur depuis ce Starter Kit, les développeurs ont conservé la compatibilité RMXP tout en modernisant les performances et les technologies du moteur. C'est aussi pourquoi la plupart des scripts RMXP classiques ne sont pas compatibles avec PSDK.

## Pourquoi apprendre RPG Maker XP ?

Dans un projet PSDK, c'est dans RMXP qu'on crée et modifie les events. C'est là qu'on :

- Place les PNJ et définit leurs dialogues
- Crée les interactions (ramasser un objet, déclencher un combat, ouvrir une porte)
- Gère la logique du jeu (interrupteurs, variables, conditions)

Sans ces bases, on ne peut pas construire les interactions d'un projet PSDK.

## La ressource de référence

Le tutoriel **RPG Maker XP** du Site du Zéro couvre tout ce qu'il faut savoir. Il est disponible ici :

<https://www.yumpu.com/fr/document/read/16933960/rpg-maker-xp-le-site-du-zero>

Seul le **chapitre 1** est à lire (jusqu'à la page 45 environ). Il couvre :

- **L'interface de RMXP** : les différentes fenêtres, la barre d'outils, la navigation
- **Les maps** : création, tilesets, calques, connexions entre maps (dans PSDK les maps sont créées avec Tiled, mais comprendre les concepts reste utile)
- **Les events** : création, déclenchement, déplacement, pages d'event
- **Les interrupteurs et variables** : le système de logique de RMXP (activer/désactiver des éléments, stocker des valeurs)
- **Les branches conditionnelles** : exécuter des commandes selon des conditions
- **Les interrupteurs locaux** : des interrupteurs propres à un event (utiles pour les objets ramassables, les PNJ à usage unique)

## Ce qu'on n'utilise pas

Le **chapitre 2** du tutoriel porte sur la **base de données** de RMXP (héros, monstres, objets, compétences, etc.). Dans PSDK, toute cette partie est remplacée par **Pokémon Studio** — c'est là qu'on définit les Pokémon, les attaques, les dresseurs, les objets et le reste. Le chapitre 2 peut donc être ignoré.

## Conclusion

- RPG Maker XP (uniquement cette version) est nécessaire pour éditer les events, à petit prix sur Steam. Les maps et les données passent par Tiled et Pokémon Studio.
- Lire le **chapitre 1** du tutoriel RPG Maker XP du Site du Zéro pour maîtriser les events.
- Ignorer le **chapitre 2** (base de données) — Pokémon Studio remplace cette partie dans PSDK.
- Une fois les bases acquises, le guide **002 Comment utiliser l'Interpreter dans un event** explique comment aller plus loin avec les commandes Script de PSDK.
