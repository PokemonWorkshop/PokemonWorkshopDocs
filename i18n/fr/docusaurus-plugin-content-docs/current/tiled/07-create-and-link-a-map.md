---
title: "Créer une carte et la lier à Studio"
slug: creer-et-lier-une-carte
sidebar_position: 7
description: "Un fichier Tiled ne devient une carte jouable qu'une fois que Pokémon Studio le connaît. Studio propose une voie pour une carte unique et une autre pour un lot, et dans les deux cas il copie lui-même le .tmx dans le projet. Cette page couvre la création d'une carte, l'association d'un fichier Tiled à une carte existante, et la reconversion d'une carte après modification."
---

Un fichier Tiled ne devient une carte jouable qu'une fois que Pokémon Studio le connaît. Studio propose une voie pour une carte unique et une autre pour un lot, et dans les deux cas il copie lui-même le `.tmx` dans le projet. Cette page couvre la création d'une carte, l'association d'un fichier Tiled à une carte existante, et la reconversion d'une carte après modification.

## Ce que la liaison fait vraiment

Une carte Studio est une entrée de base de données : un nom, une description, un nombre de pas pour les rencontres sauvages, une musique de fond, et le nom du fichier Tiled qui la dessine. C'est la liaison qui écrit ce nom de fichier dans l'entrée et qui pousse Studio à lire le fichier.

C'est pourquoi on ne dépose jamais un `.tmx` à la main dans `Data/Tiled/Maps` en espérant le voir apparaître : ce dossier est l'endroit où le fichier doit **arriver**, pas la façon dont Studio apprend son existence. Chacune des voies ci-dessous s'occupe de la copie.

## Créer une carte unique

Depuis la liste des cartes, **Nouvelle carte** ouvre l'éditeur de création :

1. On donne un **nom** et une description à la carte.
2. On règle **Pas moyens requis**, le nombre de pas entre deux rencontres sauvages, de 1 à 999. La valeur par défaut est 30.
3. Dans le champ **Carte réalisée avec Tiled**, on dépose le fichier `.tmx`. Studio le copie dans le projet, ainsi que les tilesets et les images qu'il référence.
4. On peut définir une musique et une ambiance sonore de fond.
5. On clique sur **Ajouter la carte**.

Le champ Tiled est facultatif. Créer la carte d'abord et la dessiner ensuite est un flux de travail normal.

Si le fichier est refusé, le message s'affiche en rouge dans la section **Musiques** de l'éditeur, préfixé du nom du fichier. On déplie cette section quand on a déposé un fichier et que rien ne semble s'être passé.

## Associer un fichier à une carte existante

On clique sur le bloc d'information de la carte pour ouvrir son éditeur **Information**. Il porte le même champ **Carte réalisée avec Tiled** : on y dépose le `.tmx`.

Vider ce champ détache le fichier et jette les métadonnées de tuiles que Studio en avait tirées, si bien que la carte n'est plus jouable tant qu'aucun fichier n'y est réassocié.

## Importer plusieurs cartes d'un coup

Pour un ensemble de fichiers `.tmx` existants, cas courant quand on part d'un projet Tiled construit hors de Studio ou lors d'une migration, Studio propose une voie par lot. On ouvre **Nouvelle carte**, puis on clique sur **Assigner** dans le panneau **Assigner des cartes Tiled**. Sur un projet encore dépourvu de carte, le même dialogue s'atteint depuis le bouton **Importer** de la liste vide.

On sélectionne le dossier puis les fichiers, et on se sert de la colonne **Carte dans Pokémon Studio** pour décider **fichier par fichier** de ce que chacun devient :

- **Nouvelle carte** lui crée une entrée Studio neuve.
- Une **carte existante** de la liste lui associe le fichier à la place, en remplaçant ce à quoi elle était liée.

Ce choix fichier par fichier est toute la raison d'être de la boîte de dialogue : importer un projet et associer un fichier à une carte déjà créée sont la même opération, que seule cette colonne distingue.

## Reconvertir une carte après l'avoir modifiée

Modifier une carte dans Tiled ne met pas le jeu à jour tout seul. Chaque fois que la fenêtre de Studio reprend le focus, il revérifie chaque `.tmx` lié en comparant sa date de modification à celle qu'il a mémorisée, et propose **Mettre à jour les cartes modifiées** si quelque chose a changé. L'action relit les fichiers et reconstruit ce que le moteur charge.

Une carte modifiée mais jamais mise à jour continue de jouer sa version précédente, ce qui explique la plupart des changements qui refusent obstinément d'apparaître en jeu.

:::info[Ouvrir une carte depuis Studio]

**Ouvrir avec Tiled** lance l'éditeur directement sur le bon fichier. Passer par Studio plutôt que d'ouvrir `Data/Tiled/Maps` à la main garantit qu'on modifie bien le fichier auquel la carte est liée, et maintient le principe d'une fenêtre Tiled par projet.

:::

## Conclusion

- Une entrée de carte Studio mémorise le nom du fichier Tiled qui la dessine ; c'est la liaison qui rend un `.tmx` jouable.
- **Nouvelle carte** crée une carte et reçoit son `.tmx` dans le champ **Carte réalisée avec Tiled**.
- **Assigner**, dans l'éditeur **Nouvelle carte**, ouvre la boîte de dialogue **Assigner des cartes Tiled**, où chaque fichier devient soit une nouvelle carte, soit une association à une carte existante.
- Studio copie lui-même le `.tmx` et ses dépendances dans `Data/Tiled` ; on ne les dépose pas à la main.
- Après avoir modifié une carte dans Tiled, on lance **Mettre à jour les cartes modifiées**, sinon le changement n'atteint jamais le jeu.
