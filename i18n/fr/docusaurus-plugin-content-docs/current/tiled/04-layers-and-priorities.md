---
title: "Calques et priorités de superposition"
slug: calques-et-priorites
sidebar_position: 4
description: "La conversion lit une carte Tiled à travers les noms de ses calques : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et tous les autres calques déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne un calque ignoré, mal lu, ou qui casse la conversion. Cette page liste les calques réservés, le tileset exigé par chacun, et la façon de déclarer une priorité."
---

La conversion lit une carte Tiled à travers les noms de ses calques : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et tous les autres calques déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne un calque ignoré, mal lu, ou qui casse la conversion. Cette page liste les calques réservés, le tileset exigé par chacun, et la façon de déclarer une priorité.

## Les calques réservés

Cinq noms de calques sont réservés. Chacun est lu comme des **propriétés** de tuiles et non comme des graphismes, et chacun n'accepte que les tuiles d'un tileset précis :

| Nom de calque        | Rôle                                                                                                      | Tileset exigé     |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------- |
| `passages`           | les directions par lesquelles une tuile peut être traversée                                               | `passages.tsx`    |
| `systemtags`         | le comportement de tuile lu par le moteur de carte                                                        | `systemtags.tsx`  |
| `systemtags_bridge1` | le comportement du premier niveau de pont                                                                 | `systemtags.tsx`  |
| `systemtags_bridge2` | le comportement du second niveau de pont                                                                  | `systemtags.tsx`  |
| `terrain_tag`        | les variantes d'une même tuile, par exemple des groupes de rencontre différents entre deux carrés d'herbe | `terrain_tag.tsx` |

Les noms sont comparés à l'identique et sensibles à la casse. `SystemTags` ou `Passages` sont des calques ordinaires du point de vue de la conversion, et leur contenu finit dessiné sur la carte comme un graphisme.

Pour la signification des System Tags eux-mêmes et leur catalogue complet, voir [Comprendre les System Tags](/psdk/core-systems/les-system-tags). Cette page ne traite que de l'endroit où on les peint.

:::danger[Un calque réservé n'accepte que son propre tileset]

Peindre une tuile issue d'un autre tileset sur l'un de ces cinq calques produit des valeurs que la conversion ne sait pas interpréter. La colonne des tilesets ci-dessus n'est pas une recommandation.

:::

## On n'ajoute un calque réservé que si on s'en sert

Un calque réservé exige la présence de son tileset dans la carte. Ajouter un calque `systemtags` sans charger aussi `systemtags.tsx` fait échouer la conversion avec le message « Failed to find tileset: systemtags.tsx », et un calque vide ajouté par habitude est précisément le cas où le tileset n'a jamais été chargé.

Les calques réservés sont aussi l'exception aux règles de visibilité de Tiled : en masquer un dans l'éditeur ne change rien, il reste lu. Un calque ordinaire masqué dans Tiled, en revanche, est purement et simplement écarté de la conversion. Ce dernier point mérite d'être retenu, car un calque masqué le temps de travailler sur autre chose disparaît du jeu si on oublie de le réafficher.

L'exception porte sur le calque lui-même, pas sur ce qui le contient. Un calque réservé rangé dans un dossier masqué disparaît avec le dossier, sauf si le nom de ce dossier commence par `system`.

## La priorité de superposition

Tout calque non réservé doit indiquer à la conversion sa place dans la pile. La règle est simple : **le nom se termine par un chiffre de 1 à 6**.

```markdown
Grass_1
Tree_trunk_3
Roof_6
```

Seul le chiffre final est lu. L'underscore est une convention de lisibilité, `Roof6` est compris de la même façon. Un calque dont le nom se termine autrement, comme le `▬_Bld_input` du template, retombe sur la priorité du dossier qui le contient, soit 1 à la racine de la liste des calques.

Les six niveaux correspondent à trois comportements distincts :

| Chiffre final | Comportement                                       |
| ------------- | -------------------------------------------------- |
| `1`           | sol, dessiné sous le joueur                        |
| `2`           | dessiné au-dessus du joueur                        |
| `3` à `6`     | dessiné au-dessus du joueur, à priorité croissante |

Six niveaux de création se replient sur les trois calques de tuiles que fournit RPG Maker XP. C'est cette compression que traite la règle des 3, sur la page des [tuiles animées](/tiled/tuiles-animees).

### La priorité portée par un dossier

Un dossier peut porter la priorité de tout ce qu'il contient. On le nomme `z=` suivi d'un chiffre, en **minuscules**, et chaque calque qu'il contient qui ne se termine pas déjà par son propre chiffre prend cette priorité. L'échelle est la même que pour les noms de calques : `z=1` correspond au sol.

:::warning[Les dossiers `Z=` du template sont inertes, et c'est un piège]

En ouvrant le Blank Template, on voit dans la liste des calques des dossiers vides nommés `Z=0` à `Z=4`. Ils ne déclarent rien, pour deux raisons : ils ne contiennent aucun calque, et la comparaison est sensible à la casse, si bien qu'un `Z=` majuscule n'est jamais lu comme une priorité. Chaque calque réel du template porte sa priorité sous forme de chiffre final à la place.

On peut les garder ou les supprimer, cela ne change rien au template tel qu'il est livré. En revanche, on ne reprend pas ce nommage pour un dossier à soi : un dossier dans lequel on range vraiment des calques n'est lu que s'il est nommé `z=` en minuscules. Nommé `Z=`, il ne déclare rien silencieusement, et ses calques retombent sur la priorité de ce qui les contient.

:::

## Cartes de référence

Trois cartes de la démo technique méritent d'être ouvertes plutôt que lues :

- `008 Marsh.tmx` est la seule carte de la démo à porter un calque `terrain_tag`, aux côtés de `systemtags` et `passages`.
- `005 River.tmx` et `011 RocketHQ.tmx` utilisent `systemtags_bridge1`, le calque qui rend un pont praticable par-dessus et par-dessous.
- `000 Blank_Template.tmx` montre une pile de calques complète, avec ses priorités déjà inscrites dans les noms.

## Une contrainte de plus

Les cartes infinies ne sont pas supportées. À la création d'une carte, la boîte **Nouvelle Carte** de Tiled propose, sous la taille de la carte, un choix entre **Fixé** et **Infini**. On laisse **Fixé**, qui est la valeur par défaut, et on donne à la carte une largeur et une hauteur en tuiles. Une carte enregistrée en infini est refusée avec le message « Infinite maps are not supported. »

## Conclusion

- Cinq noms de calques sont réservés : `passages`, `systemtags`, `systemtags_bridge1`, `systemtags_bridge2` et `terrain_tag`, chacun lié à un tileset.
- Les noms réservés sont sensibles à la casse, et un calque réservé est lu même masqué, sauf s'il est rangé dans un dossier masqué.
- Ajouter un calque réservé sans charger son tileset fait échouer la conversion.
- Tout autre calque déclare sa priorité par un chiffre final de 1 à 6 : 1 pour le sol, 2 et au-delà pour le dessus du joueur.
- Un dossier nommé `z=` en minuscules porte la priorité des calques qu'il contient ; les dossiers `Z=` majuscules du template ne déclarent rien.
- Les cartes doivent avoir une taille fixe ; les cartes infinies sont rejetées.
