---
title: "Calques et priorités de superposition"
slug: calques-et-priorites
sidebar_position: 7
description: "La conversion lit une carte Tiled à travers les noms de ses calques : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et tous les autres calques déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne un calque ignoré, mal lu, ou qui casse la conversion. Cette page liste les calques réservés, le tileset exigé par chacun, et la façon de déclarer une priorité."
---

La conversion lit une carte Tiled à travers les noms de ses calques : cinq noms réservés portent les propriétés de tuiles dont le moteur a besoin, et tous les autres calques déclarent leur priorité de superposition par le chiffre qui termine leur nom. Un nom erroné donne un calque ignoré, mal lu, ou qui casse la conversion. Cette page liste les calques réservés, le tileset exigé par chacun, et la façon de déclarer une priorité.

## Les calques réservés

Cinq noms de calques sont réservés. Chacun est lu comme des **propriétés** de tuiles et non comme des graphismes, et chacun n'accepte que les tuiles d'un tileset précis :

| Nom de calque | Rôle | Tileset exigé |
| --- | --- | --- |
| `passages` | les directions par lesquelles une tuile peut être traversée | `passages.tsx` |
| `systemtags` | le comportement de tuile lu par le moteur de carte | `systemtags.tsx` |
| `systemtags_bridge1` | le comportement du premier niveau de pont | `systemtags.tsx` |
| `systemtags_bridge2` | le comportement du second niveau de pont | `systemtags.tsx` |
| `terrain_tag` | les variantes d'une même tuile, par exemple des groupes de rencontre différents entre deux carrés d'herbe | `terrain_tag.tsx` |

Les noms sont comparés à l'identique et sensibles à la casse. `SystemTags` ou `Passages` sont des calques ordinaires du point de vue de la conversion, et leur contenu finit dessiné sur la carte comme un graphisme.

Pour la signification des System Tags eux-mêmes et leur catalogue complet, voir [Comprendre les System Tags](/psdk/core-systems/les-system-tags). Cette page ne traite que de l'endroit où on les peint.

:::danger[Un calque réservé n'accepte que son propre tileset]

Peindre une tuile issue d'un autre tileset sur l'un de ces cinq calques produit des valeurs que la conversion ne sait pas interpréter. La colonne des tilesets ci-dessus n'est pas une recommandation.

:::

## On n'ajoute un calque réservé que si on s'en sert

Un calque réservé exige la présence de son tileset dans la carte. Ajouter un calque `systemtags` sans charger aussi `systemtags.tsx` fait échouer la conversion, et un calque vide ajouté par habitude est précisément le cas où le tileset n'a jamais été chargé. Studio affiche alors, à côté du nom du fichier concerné, le message « Failed to find tileset: systemtags.tsx ».

Les calques réservés sont aussi l'exception aux règles de visibilité de Tiled : en masquer un dans l'éditeur ne change rien, il reste lu. Un calque ordinaire masqué dans Tiled, en revanche, est purement et simplement écarté de la conversion. Ce dernier point mérite d'être retenu, car un calque masqué le temps de travailler sur autre chose disparaît du jeu si on oublie de le réafficher.

## La priorité de superposition

Tout calque non réservé doit indiquer à la conversion sa place dans la pile. La règle est simple : **le nom se termine par un chiffre de 1 à 6**.

```markdown
Grass_1
Tree_trunk_3
Roof_6
```

Seul le chiffre final est lu. L'underscore est une convention de lisibilité, `Roof6` est compris de la même façon. Un calque dont le nom se termine autrement, comme `Bld_input`, retombe sur la priorité 1.

Les six niveaux correspondent à trois comportements distincts :

| Chiffre final | Comportement |
| --- | --- |
| `1` | sol, dessiné sous le joueur |
| `2` | dessiné au-dessus du joueur |
| `3` à `6` | dessiné au-dessus du joueur, à priorité croissante |

Six niveaux de création se replient sur les trois calques de tuiles que fournit RPG Maker XP. C'est cette compression que traite la règle des 3, sur la page des [tuiles animées](/tiled/tuiles-animees).

:::note[Les dossiers `Z=` du template ne définissent aucune priorité]

En ouvrant le Blank Template, on voit dans la liste des calques des dossiers vides nommés `Z=0` à `Z=4`. Ce sont des **repères visuels** qui séparent les groupes de priorité, rien de plus : ils ne contiennent aucun calque et la conversion ne les lit pas. Chaque calque réel du template porte déjà sa priorité sous forme de chiffre final. On peut les garder, les supprimer ou en ajouter sans que cela change quoi que ce soit au rendu.

:::

## Cartes de référence

Trois cartes de la démo technique méritent d'être ouvertes plutôt que lues :

- `008 Marsh.tmx` est la seule carte de la démo à porter un calque `terrain_tag`, aux côtés de `systemtags` et `passages`.
- `005 River.tmx` et `011 RocketHQ.tmx` utilisent `systemtags_bridge1`, le calque qui rend un pont praticable par-dessus et par-dessous.
- `000 Blank_Template.tmx` montre une pile de calques complète, avec ses priorités déjà inscrites dans les noms.

## Une contrainte de plus

Les cartes infinies ne sont pas supportées. Tiled propose l'option à la création d'une carte, et Studio refuse le fichier avec le message « Infinite maps are not supported ». On décoche l'option à la création et on donne à la carte une largeur et une hauteur fixes.

## Conclusion

- Cinq noms de calques sont réservés : `passages`, `systemtags`, `systemtags_bridge1`, `systemtags_bridge2` et `terrain_tag`, chacun lié à un tileset.
- Les noms réservés sont sensibles à la casse, et un calque réservé est lu même masqué.
- Ajouter un calque réservé sans charger son tileset fait échouer la conversion.
- Tout autre calque déclare sa priorité par un chiffre final de 1 à 6 : 1 pour le sol, 2 et au-delà pour le dessus du joueur.
- Les dossiers `Z=` du template sont des repères visuels, pas des déclarations de priorité.
- Les cartes doivent avoir une taille fixe ; les cartes infinies sont rejetées.
