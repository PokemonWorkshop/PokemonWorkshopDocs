---
title: "Créer un tileset Tiled"
slug: creer-un-tileset
sidebar_position: 6
description: "Un tileset se crée dans Tiled à partir d'un PNG placé dans le dossier Assets du projet, puis s'enregistre en fichier .tsx à côté des autres tilesets. Deux réglages décident si la carte se convertira : une taille de tuile de 32 sur 32 pixels, et un tileset externe plutôt qu'embarqué. Cette page détaille la création et la façon de vérifier qu'une planche est bien en 32 sur 32."
---

Un tileset se crée dans Tiled à partir d'un PNG placé dans le dossier `Assets` du projet, puis s'enregistre en fichier `.tsx` à côté des autres tilesets. Deux réglages décident si la carte se convertira : une taille de tuile de 32 sur 32 pixels, et un tileset externe plutôt qu'embarqué. Cette page détaille la création et la façon de vérifier qu'une planche est bien en 32 sur 32.

## Ajouter l'image source

On copie le `.png` dans `Data/Tiled/Assets`. Le fichier de tileset le référencera depuis cet endroit par chemin relatif, donc une image laissée ailleurs casse dès que le projet est déplacé ou cloné. Voir [Le dossier Data/Tiled](/tiled/structure-du-projet-tiled).

## Créer le tileset

Dans Tiled, **Fichier**, puis **Nouveau**, puis **Nouveau tileset** :

1. On choisit le `.png` dans `Data/Tiled/Assets`.
2. On garde le type **Basé sur une image de tileset**.
3. On règle la largeur et la hauteur de tuile sur **32** et **32**.
4. On laisse **Intégrer dans la carte** décoché.
5. On applique une couleur de transparence si la planche en utilise une au lieu d'un canal alpha.
6. On enregistre le fichier dans `Data/Tiled/Tilesets`.

Le `.tsx` obtenu est court et lisible, ce qui rend la vérification facile :

```markdown
<tileset version="1.10" name="HGSS Nature" tilewidth="32" tileheight="32" tilecount="3451" columns="48">
 <image source="../Assets/TECH-Nature.png" trans="f05ba1" width="1536" height="2080"/>
</tileset>
```

Le `name` interne du tileset est indépendant de son nom de fichier, et rien n'impose qu'ils correspondent.

:::danger[On n'embarque jamais un tileset dans la carte]

Un tileset embarqué vit à l'intérieur du `.tmx` au lieu d'avoir son propre fichier `.tsx`. Studio rejette la carte sans détour, avec le message « Embedded tilesets are not supported » affiché à côté du nom du fichier. On laisse **Intégrer dans la carte** décoché, toujours.

:::

## Vérifier la taille des tuiles

Un tileset dessiné sur une grille autre que 32 sur 32 ne déclenche aucune erreur. La conversion suppose des tuiles de 32 pixels partout, elle découpe donc l'image sur cette grille quoi qu'il arrive, et la carte s'affiche en bouillie décalée sans le moindre message pour l'expliquer.

La vérification prend quelques secondes : on ouvre le `.png` dans un éditeur d'image, on sélectionne une seule tuile, de préférence carrée et aux bords nets, et on lit la taille de la sélection. Elle doit valoir 32 sur 32. Si elle indique 16 sur 16 ou 48 sur 48, la planche doit être redimensionnée ou redessinée avant usage.

## La transparence

Deux façons de gérer la transparence fonctionnent :

- Un **PNG avec canal alpha**, rien de plus à faire.
- Une **couleur unie** déclarée comme transparente dans le tileset, enregistrée dans l'attribut `trans`. Les tilesets de la démo utilisent un magenta, `f05ba1`, une couleur choisie parce qu'elle n'apparaît nulle part dans les graphismes.

La couleur transparente est appliquée au moment où l'image du tileset devient un graphisme du moteur : elle doit donc être réglée sur le tileset, pas seulement évitée pendant le mapping.

## Conclusion

- Le `.png` source va dans `Data/Tiled/Assets`, le `.tsx` dans `Data/Tiled/Tilesets`.
- Les tuiles doivent faire 32 sur 32 ; toute autre grille produit silencieusement une carte cassée.
- **Intégrer dans la carte** doit rester décoché, sans quoi la carte ne se convertit pas du tout.
- La transparence vient soit d'un canal alpha, soit d'une couleur déclarée sur le tileset.
- Le `.tsx` est du XML simple : on l'ouvre pour vérifier la taille des tuiles, le chemin de l'image et la couleur transparente.
