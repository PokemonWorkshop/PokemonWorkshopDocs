---
title: "Créer sa première carte"
slug: creer-sa-premiere-carte
sidebar_position: 3
description: "Le moyen le plus rapide d'obtenir une carte jouable est de partir du template vierge livré avec le projet de base, plutôt que d'un fichier Tiled vide. Cette page parcourt la boucle complète une fois, du duplicata du template jusqu'à la marche sur la carte en jeu, pour que les pages de référence qui suivent aient quelque chose de concret auquel se rattacher."
---

Le moyen le plus rapide d'obtenir une carte jouable est de partir du template vierge livré avec le projet de base, plutôt que d'un fichier Tiled vide. Cette page parcourt la boucle complète une fois, du duplicata du template jusqu'à la marche sur la carte en jeu, pour que les pages de référence qui suivent aient quelque chose de concret auquel se rattacher.

Rien ici ne doit être compris en profondeur du premier coup. On suit les étapes, on obtient une carte sur laquelle marcher, puis on revient aux pages qui expliquent chaque morceau.

## Avant de commencer

Tiled doit être installé et son chemin déclaré dans Pokémon Studio. Si **Ouvrir avec Tiled** ne fait encore rien, on commence par [Installer et configurer Tiled](/tiled/installer-et-configurer-tiled).

## 1. Dupliquer le template

Dans son projet, on ouvre le dossier `Data/Tiled/Maps`. On copie-colle `000 Blank_Template.tmx`, et on renomme la copie d'après sa carte, par exemple `Ma_premiere_ville.tmx`.

Partir du template plutôt que d'un nouveau fichier Tiled épargne toute la mise en place des calques : ils sont déjà nommés, déjà ordonnés, et les deux calques spéciaux dont le moteur a besoin sont déjà présents.

Comme le fichier se trouve déjà dans `Data/Tiled/Maps`, Studio l'utilisera sur place au lieu de le copier une seconde fois.

## 2. Créer la carte dans Pokémon Studio

Dans Studio, on va dans la liste des cartes et on clique sur **Nouvelle carte** :

1. On lui donne un nom.
2. On laisse le nombre moyen de pas à 30 pour l'instant. Il commande la fréquence des rencontres sauvages.
3. Dans le champ **Carte réalisée avec Tiled**, on sélectionne le `.tmx` que l'on vient de créer.
4. On valide.

La carte existe désormais dans le jeu, vide mais bien réelle.

## 3. Peindre quelque chose

Toujours dans Studio, on utilise **Ouvrir avec Tiled** sur sa carte. Tiled s'ouvre sur le bon fichier.

À gauche se trouve la liste des calques, à droite les tilesets chargés par le template. Pour peindre :

1. On choisit un calque dont le nom se termine par `1`, par exemple `Grass_1`. Ce sont les calques de sol, ceux dessinés sous le joueur.
2. On choisit un tileset et une tuile dedans.
3. On dessine sur la carte.

On ne renomme pas les calques et on ne les supprime pas. Leurs noms sont ce qui indique à la conversion où placer chacun d'eux, et les raisons se trouvent sur [Calques et priorités de superposition](/tiled/calques-et-priorites).

## 4. Bloquer ce qui ne doit pas être traversé

Une carte où le joueur traverse les murs n'est pas terminée. On sélectionne le calque `passages`, on choisit le tileset `passages`, et on peint la tuile bloquante sur chaque case que le joueur ne doit pas franchir.

Ce calque n'est pas de la décoration : il est lu comme une propriété de chaque tuile, pas dessiné à l'écran. C'est pour cela qu'il ne doit jamais recevoir que des tuiles de son propre tileset.

## 5. Enregistrer, puis mettre à jour dans Studio

On enregistre dans Tiled, puis on revient dans Studio. Studio remarque que le fichier a changé et propose **Mettre à jour les cartes modifiées**. On lance l'opération.

Cette étape n'est pas facultative. Studio relit le `.tmx` et reconstruit les données que le moteur charge. La sauter revient à laisser le jeu afficher la version précédente de la carte, ce qui est de loin la première cause des modifications qui n'apparaissent pas.

## 6. Tester en jeu

On lance son jeu et on se rend sur la carte. Si on peut marcher dessus et que les murs bloquent, la boucle est complète : **modifier dans Tiled, enregistrer, mettre à jour dans Studio, tester**. Toutes les cartes suivantes se construisent avec cette même boucle.

## Ce qu'il faut lire ensuite

Maintenant que la boucle a du sens, le reste de la section la complète :

| Ce que l'on veut | À lire |
| --- | --- |
| Comprendre où vivent les fichiers et pourquoi | [Le dossier Data/Tiled](/tiled/structure-du-projet-tiled) |
| Ajouter des cartes par lot, ou associer un fichier à une carte existante | [Créer une carte et la lier à Studio](/tiled/creer-et-lier-une-carte) |
| Utiliser ses propres planches de tuiles | [Créer un tileset Tiled](/tiled/creer-un-tileset) |
| Dessiner au-dessus du joueur, ou ajouter des comportements de tuiles | [Calques et priorités de superposition](/tiled/calques-et-priorites) |
| Animer l'eau, les fleurs ou l'herbe | [Les tuiles animées](/tiled/tuiles-animees) |

## Conclusion

- Dupliquer `000 Blank_Template.tmx` donne une pile de calques prête à l'emploi au lieu d'un fichier vide.
- La carte se crée dans Pokémon Studio, et le `.tmx` se sélectionne dans le champ **Carte réalisée avec Tiled**.
- Les calques dont le nom finit par `1` forment le sol ; le calque `passages` décide de ce qui bloque le joueur.
- Les noms de calques ne se changent pas : ce sont eux que la conversion lit.
- La boucle est toujours modifier dans Tiled, enregistrer, **Mettre à jour les cartes modifiées** dans Studio, tester en jeu.
