---
title: "Couches et priorités de superposition"
slug: couches-et-priorites
sidebar_position: 6
description: "La conversion lit une carte Tiled à travers les noms de ses couches : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et toutes les autres couches déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne une couche ignorée, mal lue, ou qui casse la conversion. Cette page liste les couches réservées, le tileset exigé par chacune, et la façon de déclarer une priorité."
---

La conversion lit une carte Tiled à travers les noms de ses couches : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et toutes les autres couches déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne une couche ignorée, mal lue, ou qui casse la conversion. Cette page liste les couches réservées, le tileset exigé par chacune, et la façon de déclarer une priorité.

## Les couches réservées

Cinq noms de couches sont réservés. Chacun est lu comme des **propriétés** de tuiles et non comme des graphismes, et chacun n'accepte que les tuiles d'un tileset précis :

| Nom de couche | Rôle | Tileset exigé |
| --- | --- | --- |
| `passages` | les directions par lesquelles une tuile peut être traversée | `passages.tsx` |
| `systemtags` | le comportement de tuile lu par le moteur de carte | `systemtags.tsx` |
| `systemtags_bridge1` | le comportement du premier niveau de pont | `systemtags.tsx` |
| `systemtags_bridge2` | le comportement du second niveau de pont | `systemtags.tsx` |
| `terrain_tag` | les variantes d'une même tuile, par exemple des groupes de rencontre différents entre deux carrés d'herbe | `terrain_tag.tsx` |

Les noms sont comparés à l'identique et sensibles à la casse. `SystemTags` ou `Passages` sont des couches ordinaires du point de vue de la conversion, et leur contenu finit dessiné sur la carte comme un graphisme.

Pour la signification des System Tags eux-mêmes et leur catalogue complet, voir [Comprendre les System Tags](/psdk/core-systems/les-system-tags). Cette page ne traite que de l'endroit où on les peint.

:::danger[Une couche réservée n'accepte que son propre tileset]

Peindre une tuile issue d'un autre tileset sur l'une de ces cinq couches produit des valeurs que la conversion ne sait pas interpréter. La colonne des tilesets ci-dessus n'est pas une recommandation.

:::

## On n'ajoute une couche réservée que si on s'en sert

Une couche réservée exige la présence de son tileset dans la carte. Ajouter une couche `systemtags` sans charger aussi `systemtags.tsx` fait échouer la conversion avec le message « Failed to find tileset: systemtags.tsx », et une couche vide ajoutée par habitude est précisément le cas où le tileset n'a jamais été chargé.

Les couches réservées sont aussi l'exception aux règles de visibilité de Tiled : en masquer une dans l'éditeur ne change rien, elle reste lue. Une couche ordinaire masquée dans Tiled, en revanche, est purement et simplement écartée de la conversion. Ce dernier point mérite d'être retenu, car une couche masquée le temps de travailler sur autre chose disparaît du jeu si on oublie de la réafficher.

## La priorité de superposition

Toute couche non réservée doit indiquer à la conversion sa place dans la pile. La règle est simple : **le nom se termine par un chiffre de 1 à 6**.

```markdown
Grass_1
Tree_trunk_3
Roof_6
```

Seul le chiffre final est lu. L'underscore est une convention de lisibilité, `Roof6` est compris de la même façon. Une couche dont le nom se termine autrement, comme `Bld_input`, retombe sur la priorité 1.

Les six niveaux correspondent à trois comportements distincts :

| Chiffre final | Comportement |
| --- | --- |
| `1` | sol, dessiné sous le joueur |
| `2` | dessiné au-dessus du joueur |
| `3` à `6` | dessiné au-dessus du joueur, à priorité croissante |

Six niveaux de création se replient sur les trois couches de tuiles que fournit RPG Maker XP. C'est cette compression que traite la règle des 3, sur la page des [tuiles animées](/tiled/tuiles-animees).

:::warning[Un dossier de couches nommé `Z=` ne définit aucune priorité]

Tiled permet de regrouper les couches dans des dossiers, et les cartes de la démo contiennent des dossiers vides nommés `Z=0` à `Z=4`. Ce sont des **séparateurs visuels** dans la liste des calques, pas des déclarations de priorité : ils ne contiennent aucune couche, et la conversion ne reconnaît qu'un dossier dont le nom commence par un `z=` en minuscules. Dans ces cartes, chaque couche réelle porte sa priorité sous forme de chiffre final. On déclare donc les priorités sur les noms de couches, et on considère les dossiers `Z=` comme des annotations.

:::

## Cartes de référence

Trois cartes de la démo technique méritent d'être ouvertes plutôt que lues :

- `008 Marsh.tmx` est la seule carte de la démo à porter une couche `terrain_tag`, aux côtés de `systemtags` et `passages`.
- `005 River.tmx` et `011 RocketHQ.tmx` utilisent `systemtags_bridge1`, la couche qui rend un pont praticable par-dessus et par-dessous.
- `000 Blank_Template.tmx` montre une pile de couches complète, avec ses priorités déjà inscrites dans les noms.

## Une contrainte de plus

Les cartes infinies ne sont pas supportées. Tiled propose l'option à la création d'une carte, et la conversion rejette le résultat avec le message « Infinite maps are not supported ». On décoche l'option à la création et on donne à la carte une largeur et une hauteur fixes.

## Conclusion

- Cinq noms de couches sont réservés : `passages`, `systemtags`, `systemtags_bridge1`, `systemtags_bridge2` et `terrain_tag`, chacun lié à un tileset.
- Les noms réservés sont sensibles à la casse, et une couche réservée est lue même masquée.
- Ajouter une couche réservée sans charger son tileset fait échouer la conversion.
- Toute autre couche déclare sa priorité par un chiffre final de 1 à 6 : 1 pour le sol, 2 et au-delà pour le dessus du joueur.
- Les dossiers `Z=` des cartes de la démo sont des séparateurs visuels, pas des déclarations de priorité.
- Les cartes doivent avoir une taille fixe ; les cartes infinies sont rejetées.
