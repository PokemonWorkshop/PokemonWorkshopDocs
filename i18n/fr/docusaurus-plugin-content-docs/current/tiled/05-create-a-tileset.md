---
title: "Créer un tileset Tiled"
slug: creer-un-tileset
sidebar_position: 5
description: "Un tileset se crée dans Tiled à partir d'un PNG placé dans le dossier Assets du projet, puis s'enregistre en fichier .tsx à côté des autres tilesets. Deux réglages décident si la carte se convertira : une taille de tuile de 32 sur 32 pixels, et un tileset externe plutôt qu'embarqué. Cette page détaille la création et la façon de vérifier qu'une planche est bien en 32 sur 32."
---

Un tileset se crée dans Tiled à partir d'un PNG placé dans le dossier `Assets` du projet, puis s'enregistre en fichier `.tsx` à côté des autres tilesets. Deux réglages décident si la carte se convertira : une taille de tuile de 32 sur 32 pixels, et un tileset externe plutôt qu'embarqué. Cette page détaille la création et la façon de vérifier qu'une planche est bien en 32 sur 32.

## Ajouter l'image source

On copie le `.png` dans `Data/Tiled/Assets`. Le fichier de tileset le référencera depuis cet endroit par chemin relatif, donc une image laissée ailleurs casse dès que le projet est déplacé ou cloné. Voir [Le dossier Data/Tiled](/tiled/structure-du-projet-tiled).

## Créer le tileset

Dans Tiled, **Fichier**, puis **Nouveau**, puis **Nouveau Jeu de Tuiles…** :

1. On choisit le `.png` dans `Data/Tiled/Assets`.
2. On garde le type **Basé sur l'Image du Jeu de Tuiles**, et non **Collection d'Images**.
3. On règle la largeur et la hauteur de tuile sur **32** et **32**.
4. Si la planche utilise une couleur unie au lieu d'un canal alpha, on coche **Utiliser la couleur transparente :** et on la règle.
5. On enregistre le fichier dans `Data/Tiled/Tilesets`.

Le `.tsx` obtenu est court et lisible, ce qui rend la vérification facile :

```markdown
<tileset version="1.10" tiledversion="1.11.0" name="HGSS Nature" tilewidth="32" tileheight="32" tilecount="3451" columns="48">
 <image source="../Assets/TECH-Nature.png" trans="f05ba1" width="1536" height="2080"/>
</tileset>
```

`version` est la version du format TMX, et `tiledversion` enregistre la version de Tiled qui a écrit le fichier. Aucune des deux n'a besoin d'être uniforme dans un projet : les fichiers de la démo ont été écrits par des Tiled 1.2 à 1.12 et se convertissent tous. Le `name` interne du tileset est indépendant de son nom de fichier, et rien n'impose qu'ils correspondent.

:::danger[Un tileset ne doit jamais être embarqué dans une carte]

Un tileset embarqué vit à l'intérieur du `.tmx` au lieu d'avoir son propre fichier `.tsx`, et la conversion refuse la carte avec le message « Embedded tilesets are not supported. »

Créer le tileset depuis **Fichier → Nouveau**, sans carte ouverte, ne peut pas produire ce cas : Tiled grise son option **Embarquer dans la carte** quand il n'y a aucune carte où l'embarquer. Le risque vient de l'autre voie, la création d'un tileset depuis une carte ouverte, où l'option est disponible. On enregistre ses tilesets dans leur propre fichier `.tsx`, toujours.

:::

## Vérifier la taille des tuiles

Un tileset dessiné sur une grille autre que 32 sur 32 ne déclenche aucune erreur. La conversion suppose des tuiles de 32 pixels partout, elle découpe donc l'image sur cette grille quoi qu'il arrive, et la carte s'affiche décalée et illisible, sans le moindre message pour l'expliquer.

La vérification prend quelques secondes : on ouvre le `.png` dans un éditeur d'image, on sélectionne une seule tuile, de préférence carrée et aux bords nets, et on lit la taille de la sélection. Elle doit être de 32 sur 32.

Beaucoup de planches qui circulent dans la communauté sont en 16 sur 16, la taille des anciens jeux Pokémon. Elles restent utilisables : on met l'image à l'échelle 200 % en interpolation **au plus proche voisin**, qui double chaque pixel sans le flouter. Toute autre interpolation transforme le pixel art en bouillie.

## La transparence

Deux façons de gérer la transparence fonctionnent :

- Un **PNG avec canal alpha**, rien de plus à faire.
- Une **couleur unie** déclarée comme transparente dans le tileset, enregistrée dans l'attribut `trans`. La plupart des tilesets de la démo utilisent le magenta `f05ba1`, une couleur choisie parce qu'elle n'apparaît nulle part dans les graphismes.

La couleur transparente est appliquée au moment où l'image du tileset devient un graphisme du moteur : elle doit donc être réglée sur le tileset, pas seulement évitée pendant le mapping.

## Conclusion

- Le `.png` source va dans `Data/Tiled/Assets`, le `.tsx` dans `Data/Tiled/Tilesets`.
- Les tuiles doivent faire 32 sur 32 ; une planche en 16 sur 16 se met à l'échelle 200 % en interpolation au plus proche voisin.
- Un tileset doit avoir son propre fichier `.tsx` ; un tileset embarqué ne se convertit pas du tout.
- La transparence vient soit d'un canal alpha, soit d'une couleur déclarée sur le tileset.
- Le `.tsx` est du XML simple : on l'ouvre pour vérifier la taille des tuiles, le chemin de l'image et la couleur transparente.
