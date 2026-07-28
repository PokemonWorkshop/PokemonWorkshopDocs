---
title: "Le dossier Data/Tiled"
slug: structure-du-projet-tiled
sidebar_position: 4
description: "Tout ce qui touche à Tiled dans un projet PSDK vit sous Data/Tiled, réparti entre Maps, Tilesets, Assets et Overviews. Trois de ces dossiers appartiennent au maker et un est écrit par Pokémon Studio. Cette page décrit ce qui va où, pourquoi une carte enregistre ses tilesets en chemins relatifs, et à quoi servent les cartes de la démo."
---

Tout ce qui touche à Tiled dans un projet PSDK vit sous `Data/Tiled`, réparti entre `Maps`, `Tilesets`, `Assets` et `Overviews`. Trois de ces dossiers appartiennent au maker et un est écrit par Pokémon Studio. Cette page décrit ce qui va où, pourquoi une carte enregistre ses tilesets en chemins relatifs, et à quoi servent les cartes de la démo.

## Les quatre dossiers

| Dossier | Contenu | Écrit par |
| --- | --- | --- |
| `Maps` | les cartes du projet, uniquement des fichiers `.tmx` | vous |
| `Tilesets` | les tilesets du projet, uniquement des fichiers `.tsx` | vous |
| `Assets` | les images `.png` dans lesquelles les tilesets sont découpés | vous |
| `Overviews` | un aperçu `.png` par carte | Pokémon Studio |

On ne modifie jamais `Overviews` à la main : Studio le remplit lors de l'import et de la mise à jour des cartes, et à la demande depuis l'onglet **Carte** d'une carte. Les calques réservés sont masqués dans ces images, ce qui explique qu'un aperçu montre la carte telle que le joueur la voit et non telle qu'on l'a peinte.

## Pourquoi cette répartition compte

Un `.tmx` n'embarque pas ses tilesets. Il les référence par **chemin relatif**, depuis le fichier de carte vers le fichier de tileset :

```markdown
<tileset firstgid="1" source="../Tilesets/TECH-borders.tsx"/>
```

Un `.tsx` référence à son tour son `.png` de la même façon. Cette chaîne ne se résout que si chaque type de fichier se trouve dans le dossier où les autres l'attendent. Un tileset enregistré à côté de la carte, ou un `.png` laissé sur le bureau, produit une carte qui s'ouvre parfaitement sur votre machine, qui ne se convertit pas, et que personne d'autre ne peut ouvrir après avoir cloné le projet.

L'avantage des chemins relatifs, c'est que toute l'arborescence `Data/Tiled` est portable : elle se déplace, s'archive et se versionne dans Git telle quelle.

## Un projet par fenêtre Tiled

Tiled rend les tilesets de chaque carte ouverte disponibles pour toutes les autres cartes ouvertes dans la même fenêtre. Avec deux projets ouverts côte à côte, rien n'empêche de peindre une tuile du projet A sur une carte du projet B. La carte enregistre alors ce tileset en chemin relatif pointant hors de son propre projet, et la conversion échoue.

Ouvrir plusieurs cartes d'un **même** projet en même temps ne pose aucun problème et rend même service. Travailler sur deux projets à la fois impose de lancer **deux instances distinctes de Tiled**, une par projet.

:::warning[Une fenêtre Tiled par projet]

On n'ouvre jamais des cartes de deux projets différents dans la même fenêtre Tiled. Leurs tilesets deviennent mutuellement disponibles, et une carte qui en emprunte un n'est plus convertible.

:::

## Les cartes de la démo technique

Le projet de base est livré avec les cartes de la démo technique, numérotées de `001` à `021` dans `Maps`. Ce sont de vraies cartes converties et fonctionnelles, et c'est la référence la plus rapide dont on dispose : un tileset animé, une carte portant tous les calques réservés, un pont, une grotte, un intérieur.

On les garde. Les supprimer coûte cette référence et ne rapporte pas grand-chose, puisqu'elles ne sont pas accessibles depuis votre propre jeu tant que vous ne les liez pas. Si on préfère livrer un projet propre, l'approche habituelle consiste à en garder deux : le sien, et un second conservé uniquement pour ouvrir la démo et y chercher des réponses.

Jouer la démo avant de la disséquer vaut les trois à quatre heures que cela prend. Ses events sont écrits pour être lus, et savoir ce qu'une carte fait en jeu rend sa structure évidente dans l'éditeur.

## Le Blank Template

`000 Blank_Template.tmx` est une carte de départ dont la pile de calques est déjà en place : des calques nommés d'après leur rôle et leur priorité de superposition, et les calques réservés déjà en place. Elle a été construite autour des tilesets HGSS de SirMalo et des règles d'automapping livrées à côté d'elle dans `Maps`, sous la forme de `rules.txt` et des fichiers `rules_TECH_*.tmx`.

Si on utilise ces tilesets, on part d'une copie du template. Sinon, ses noms de calques ne correspondront pas à vos propres règles d'automapping, et mieux vaut construire son propre template une bonne fois et le copier pour chaque nouvelle carte.

## Conclusion

- `Data/Tiled` contient `Maps` pour les `.tmx`, `Tilesets` pour les `.tsx`, `Assets` pour les sources `.png`, et `Overviews` pour les aperçus générés par Studio.
- Les cartes référencent leurs tilesets par chemin relatif, donc un fichier enregistré dans le mauvais dossier casse la carte pour tout le monde sauf vous.
- Deux projets ouverts dans une même fenêtre Tiled peuvent s'emprunter leurs tilesets : une instance par projet.
- Les cartes de la démo technique sont la référence à conserver, et la démo mérite d'être jouée avant d'être lue.
- `000 Blank_Template.tmx` est une pile de calques prête à l'emploi, liée aux tilesets HGSS et à leurs règles d'automapping.
