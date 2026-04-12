---
title: "Comment apprendre les bases de RPG Maker XP ?"
slug: bases-de-rpg-maker-xp
sidebar_position: 1
description: "PSDK utilise RPG Maker XP (RMXP) uniquement pour la gestion des events. Les maps sont créées avec Tiled et la base de données est gérée par Pokémon Studio. Cependant, tant que la v3 de Pokémon Studio n'est pas sortie, RMXP reste nécessaire pour les events. Ce guide oriente vers la ressource de référence et précise ce qu'il faut apprendre."
---

PSDK utilise **RPG Maker XP** (RMXP) uniquement pour la gestion des **events**. Les maps sont créées avec **Tiled** et la base de données est gérée par **Pokémon Studio**. Cependant, tant que la v3 de Pokémon Studio n'est pas sortie, RMXP reste nécessaire pour les événements. Ce guide oriente vers la ressource de référence et précise ce qu'il faut apprendre.

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

- Lire le **chapitre 1** du tutoriel RPG Maker XP du Site du Zéro pour maîtriser les events.
- Ignorer le **chapitre 2** (base de données) — Pokémon Studio remplace cette partie dans PSDK.
- Une fois les bases acquises, le guide **002 Comment utiliser l'Interpreter dans un event** explique comment aller plus loin avec les commandes Script de PSDK.
