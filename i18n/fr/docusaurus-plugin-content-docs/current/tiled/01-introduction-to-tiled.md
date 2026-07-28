---
title: "Introduction à Tiled"
slug: introduction-a-tiled
sidebar_position: 1
description: "Depuis Pokémon Studio 2.0, les cartes d'un projet PSDK se construisent dans Tiled et non plus dans RPG Maker XP. Tiled est un éditeur de cartes libre et généraliste, dont les fichiers sont lus par Pokémon Studio puis convertis vers les données attendues par le moteur. Cette page explique ce que Tiled apporte à un projet, ce dont il ne s'occupe pas, et où apprendre l'éditeur lui-même."
---

Depuis Pokémon Studio 2.0, les cartes d'un projet PSDK se construisent dans **Tiled** et non plus dans RPG Maker XP. Tiled est un éditeur de cartes libre et généraliste, dont les fichiers sont lus par Pokémon Studio puis convertis vers les données attendues par le moteur. Cette page explique ce que Tiled apporte à un projet, ce dont il ne s'occupe pas, et où apprendre l'éditeur lui-même.

## Ce qu'est Tiled

Tiled est un éditeur de cartes autonome, libre et open source, sans aucun lien avec PSDK. Il est utilisé par de nombreux jeux hors du monde des fangames Pokémon, ce qui explique que sa documentation et sa communauté soient bien plus fournies que celles d'un outil spécifique aux fangames.

Il manipule deux formats de fichiers, tous deux en XML lisible :

- `.tmx` pour une **carte**, c'est-à-dire la grille elle-même et ses couches.
- `.tsx` pour un **tileset**, c'est-à-dire la description d'une planche de tuiles : taille des tuiles, transparence, animations.

Les deux formats sont du texte lisible, ce qui compte pour un projet sous gestion de versions : deux makers peuvent travailler sur des cartes différentes sans produire de fichier binaire impossible à fusionner.

## Pourquoi PSDK utilise Tiled

Le tilemap de RPG Maker XP se limite à trois couches de tuiles superposées, à un système d'autotiles figé et à des tilesets d'une seule colonne. Tiled fait sauter ces contraintes au moment de la création : couches illimitées, dossiers de couches, animations par tuile, retournement et rotation des tuiles, et règles d'automapping qui placent les tuiles de transition à votre place.

La chaîne qui transforme une carte Tiled en quelque chose que le moteur sait exécuter compte deux étapes :

1. **Pokémon Studio** lit le `.tmx` et ses fichiers `.tsx`, puis écrit les métadonnées de la carte dans les données Studio du projet.
2. Un convertisseur livré avec le moteur lit ces métadonnées et produit les fichiers de données RPG Maker XP que le moteur de carte charge à l'exécution.

Cette deuxième étape explique pourquoi certaines règles documentées dans cette section paraissent arbitraires. Ce ne sont pas des limites de Tiled : elles viennent du format de données RPG Maker XP visé par la conversion. L'exemple le plus net est celui des **trois couches de tuiles** dans lesquelles une carte est compressée, qui commande à la fois le système de priorités des couches et le budget de tuiles animées.

## Ce dont Tiled ne s'occupe pas

Tiled ne produit que la carte. Tout le reste vit ailleurs :

- La **base de données du jeu**, créatures, capacités, objets, groupes de rencontre, se gère dans Pokémon Studio.
- Les **events**, PNJ, dialogues, portes, cinématiques, se créent toujours dans RPG Maker XP. Voir [Les bases de RPG Maker XP](/rpg-maker-xp/bases-de-rpg-maker-xp).

Une carte existe donc à deux endroits à la fois : sa description visuelle et physique dans le fichier `.tmx`, et ses events dans la carte RPG Maker XP que Pokémon Studio maintient synchronisée avec elle.

## Apprendre Tiled

Cette section documente ce qui est **spécifique à un projet PSDK** : organisation des dossiers, noms de couches réservés, contraintes de conversion. Elle n'enseigne pas l'éditeur lui-même. Pour cela, on commence ici :

| Ressource | Langue | Lien |
| --- | --- | --- |
| Manuel officiel de Tiled | Anglais | [doc.mapeditor.org](https://doc.mapeditor.org/en/stable/) |
| Manuel officiel de Tiled | Français | [doc.mapeditor.org](https://doc.mapeditor.org/fr/stable/) |
| Tutoriel vidéo d'Invatorzen | Anglais | [YouTube](https://www.youtube.com/watch?v=5A8gjBRGAAI) |
| Tutoriel vidéo de SirLinfey | Français | [YouTube](https://www.youtube.com/watch?v=0WnjTuulYMY) |

La démo technique livrée avec le projet de base est l'autre référence à utiliser. Ses cartes sont de vraies cartes converties et fonctionnelles, et en ouvrir une dans Tiled répond à la plupart des questions plus vite que n'importe quel guide.

## Conclusion

- Tiled est un éditeur de cartes libre et généraliste, et c'est l'outil de cartographie des projets PSDK depuis Pokémon Studio 2.0.
- Il enregistre les cartes en `.tmx` et les tilesets en `.tsx`, deux formats XML lisibles, ce qui les garde fusionnables sous gestion de versions.
- Pokémon Studio lit ces fichiers et un convertisseur côté moteur les transforme en données RPG Maker XP.
- La plupart des contraintes documentées dans cette section viennent de ce format cible RPG Maker XP, pas de Tiled.
- La base de données reste dans Pokémon Studio et les events restent dans RPG Maker XP.
