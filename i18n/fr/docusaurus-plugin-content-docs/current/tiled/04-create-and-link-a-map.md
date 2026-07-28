---
title: "Créer une carte et la lier à Studio"
slug: creer-et-lier-une-carte
sidebar_position: 4
description: "Un fichier Tiled ne devient une carte jouable qu'une fois que Pokémon Studio le connaît. Studio propose une voie pour une carte unique et une autre pour un lot, et dans les deux cas il copie lui-même le .tmx dans le projet. Cette page couvre la création d'une carte, l'association d'un fichier Tiled à une carte existante, et la reconversion d'une carte après modification."
---

Un fichier Tiled ne devient une carte jouable qu'une fois que Pokémon Studio le connaît. Studio propose une voie pour une carte unique et une autre pour un lot, et dans les deux cas il copie lui-même le `.tmx` dans le projet. Cette page couvre la création d'une carte, l'association d'un fichier Tiled à une carte existante, et la reconversion d'une carte après modification.

## Ce que la liaison fait vraiment

Une carte Studio est une entrée de base de données : un nom, une description, un nombre moyen de pas pour les rencontres sauvages, une musique de fond, et le nom du fichier Tiled qui la dessine. Lier une carte écrit ce nom de fichier dans l'entrée, puis Studio lit le `.tmx`, en extrait les métadonnées de tuiles et les enregistre pour que le convertisseur côté moteur puisse produire les données RPG Maker XP.

C'est pourquoi on ne dépose jamais un `.tmx` à la main dans `Data/Tiled/Maps` en espérant le voir apparaître : ce dossier est l'endroit où le fichier doit **arriver**, pas la façon dont Studio apprend son existence. Chacune des voies ci-dessous s'occupe de la copie.

## Créer une carte unique

Depuis la liste des cartes, **Nouvelle carte** ouvre l'éditeur de création :

1. On donne un **nom** et une description à la carte.
2. On règle le **nombre moyen de pas** entre deux rencontres sauvages, de 1 à 999. La valeur par défaut est 30.
3. Dans le champ **Carte réalisée avec Tiled**, on dépose le fichier `.tmx`. Studio le copie dans le projet, ainsi que les tilesets et les images qu'il référence.
4. On peut définir une musique et une ambiance sonore de fond.

Le champ Tiled est facultatif. Créer la carte d'abord et la dessiner ensuite est un flux de travail normal, et la section suivante couvre l'association du fichier après coup.

## Importer ou assigner plusieurs cartes

La boîte de dialogue par lot traite un ensemble de fichiers `.tmx` existants, ce qui est le cas courant quand on part d'un projet Tiled construit hors de Studio, ou lors d'une migration.

On sélectionne les fichiers, puis on décide **fichier par fichier** de ce qu'il devient :

- **Nouvelle carte** lui crée une entrée Studio neuve.
- Une **carte existante** de la liste lui associe le fichier à la place, en remplaçant ce à quoi elle était liée.

La même boîte de dialogue couvre donc à la fois **Importer des cartes Tiled**, pour les fichiers qui doivent devenir de nouvelles cartes, et **Assigner des cartes Tiled**, pour les fichiers qui appartiennent à des cartes déjà créées.

## Reconvertir une carte après l'avoir modifiée

Modifier une carte dans Tiled ne met pas le jeu à jour tout seul. Studio suit la date de modification et l'empreinte de chaque `.tmx` lié, et lorsqu'il détecte un changement il propose **Mettre à jour les cartes modifiées**. Cette action relit les fichiers et rafraîchit les métadonnées de tuiles.

Une carte modifiée mais jamais mise à jour continue de jouer sa version précédente, ce qui explique la plupart des changements qui refusent obstinément d'apparaître en jeu.

:::info[Ouvrir une carte depuis Studio]

**Ouvrir avec Tiled** lance l'éditeur directement sur le bon fichier. Passer par Studio plutôt que d'ouvrir `Data/Tiled/Maps` à la main garantit qu'on modifie bien le fichier auquel la carte est liée, et maintient le principe d'une fenêtre Tiled par projet.

:::

## Conclusion

- Une entrée de carte Studio mémorise le nom du fichier Tiled qui la dessine ; c'est la liaison qui rend un `.tmx` jouable.
- **Nouvelle carte** crée une carte et reçoit son `.tmx` dans le champ **Carte réalisée avec Tiled**.
- La boîte de dialogue par lot permet de choisir, fichier par fichier, entre créer une nouvelle carte et l'assigner à une carte existante.
- Studio copie lui-même le `.tmx` et ses dépendances dans `Data/Tiled` ; on ne les dépose pas à la main.
- Après avoir modifié une carte dans Tiled, on lance **Mettre à jour les cartes modifiées**, sinon le changement n'atteint jamais le jeu.
