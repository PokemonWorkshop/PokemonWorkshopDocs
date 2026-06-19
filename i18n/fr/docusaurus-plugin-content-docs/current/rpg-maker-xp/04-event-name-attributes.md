---
title: "Modifier les attributs d'un event via son nom"
slug: attributs-dun-event-via-son-nom
sidebar_position: 4
description: "Dans PSDK, le nom d'un event est plus qu'une étiquette : il porte des tags qui modifient son comportement et la façon dont il est affiché sur la carte. Cette page liste tous les attributs configurables via le nom et explique à quoi chacun sert."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

Dans PSDK, le nom d'un event est plus qu'une étiquette : il porte des **tags** qui modifient son comportement et la façon dont il est affiché sur la carte. Cette page liste tous les attributs configurables via le nom et explique à quoi chacun sert.

## Comment le nom est analysé

Au chargement d'une carte, PSDK lit le nom de chaque event une seule fois et en extrait les attributs. Deux conséquences en découlent :

- Le nom est lu **uniquement à la création de l'event**. Renommer un event pendant que le jeu tourne n'a aucun effet tant que la carte n'est pas rechargée.
- On peut cumuler plusieurs attributs dans un même nom, tant qu'ils n'entrent pas en conflit (voir [Combiner les attributs](#combiner-les-attributs)).

Les attributs se présentent sous trois formes :

- Des **caractères de tête**, qui ne fonctionnent qu'au tout début du nom (`§`, `¤`).
- Des **tags entre crochets**, que le moteur trouve n'importe où dans le nom (`[particle=off]`, `[offset_y=-8]`, ...).
- Des **sous-chaînes**, que le moteur cherche également n'importe où (`surf_`, `invisible_`, `$`).

La partie lisible du nom n'a aucune importance pour le joueur, qui ne la voit jamais. Ainsi `surf_Lapras` ou `[sprite=off]Cinématique intro` sont des noms parfaitement valides.

### Aide-mémoire

| Attribut | Forme | Effet |
| --- | --- | --- |
| `§` | caractère de tête | Supprime l'ombre de l'event |
| `¤` | caractère de tête | Affiche l'event au-dessus du héros en cas de superposition |
| `$` | n'importe où | Réutilise l'apparence de la page 1 sur toutes les pages |
| `[particle=off]` | n'importe où | Désactive les particules de déplacement |
| `[sprite=off]` | n'importe où | Ne crée aucun sprite (event purement logique) |
| `[reflection=on]` | n'importe où | Ajoute un reflet dans l'eau |
| `[offset_x=N]` | n'importe où | Décale l'event horizontalement |
| `[offset_y=N]` | n'importe où | Décale l'event verticalement |
| `[z=N]` | n'importe où | Définit la couche d'altitude de l'event |
| `[noslide=on]` | n'importe où | Ignore les cases glissantes (glace, rapides) |
| `[alias=nom]` | n'importe où | Donne à l'event un nom stable pour les scripts |
| `surf_` | n'importe où | Fait se déplacer l'event sur l'eau uniquement |
| `invisible_` | n'importe où | Objet caché, trouvé en lui faisant face ou au Cherch'Objet |

## Affichage et profondeur

### Supprimer l'ombre — `§`

Par défaut, PSDK dessine une petite ombre translucide sous chaque personnage. Pour une statue, un panneau, ou tout objet censé reposer à plat sur le sol, cette ombre est gênante. On place `§` comme **premier caractère** du nom (`§Statue`) pour la retirer. Cela ne fonctionne qu'en tête : un `§` placé plus loin dans le nom est ignoré.

### Afficher l'event au-dessus du héros — `¤`

Quand un event et le héros se retrouvent sur la même case, le moteur décide qui passe devant à partir de leurs positions, et c'est généralement le héros qui l'emporte. On commence le nom par `¤` pour augmenter la priorité d'affichage de l'event, qui passe alors **au-dessus** du héros en cas de superposition. Comme `§`, cela ne fonctionne qu'en premier caractère.

Comme `§` et `¤` doivent tous deux être le premier caractère, **on ne peut pas utiliser les deux sur un même event**.

### Désactiver les particules de déplacement — `[particle=off]`

Quand un personnage se déplace sur certaines cases (hautes herbes, sable, flaques), PSDK fait apparaître de petites particules sous lui. On ajoute `[particle=off]` n'importe où dans le nom pour les supprimer pour cet event.

### Ajouter un reflet dans l'eau — `[reflection=on]`

On ajoute `[reflection=on]` pour que le moteur dessine un reflet de l'event sur les cases d'eau réfléchissantes, de la même façon que le héros est reflété. Sans effet si les reflets dans l'eau sont désactivés globalement.

### Définir la couche d'altitude — `[z=N]`

`[z=N]` place l'event sur la couche d'altitude `N` (un entier). La couche influe à la fois sur l'ordre d'affichage et sur le niveau auquel le héros interagit avec l'event. C'est ainsi que des structures à plusieurs niveaux, comme les ponts, gardent leurs events du dessus et du dessous séparés. On le laisse non défini sauf en cas de terrain à étages.

## Décaler l'event à l'écran

`[offset_x=N]` et `[offset_y=N]` décalent l'event de sa case **visuellement**, sans le déplacer logiquement : sa position pour les collisions et les déclencheurs reste sur la case. La valeur s'exprime dans les unités d'écran internes du moteur, où une case fait 32 unités, donc `[offset_y=-8]` élève l'event d'un quart de case.

- `[offset_y=N]` — vertical. Une valeur positive descend l'event **vers le bas**, une valeur négative le monte **vers le haut**. On utilise une valeur négative pour faire flotter un event au-dessus du sol (une créature volante, une plateforme flottante).
- `[offset_x=N]` — horizontal. Le même décalage est aussi appliqué à l'ombre de l'event, qui reste donc alignée sous le sprite.

## Visibilité

### Masquer entièrement le sprite — `[sprite=off]`

Certains events n'existent que pour exécuter de la logique : un event en exécution automatique qui déroule une cinématique, un event en processus parallèle qui surveille une condition. Ils n'ont aucune raison d'être dessinés. `[sprite=off]` indique à PSDK de ne créer aucun sprite pour l'event, ce qui est plus léger que de lui donner un graphisme vide ou une opacité nulle. L'event s'exécute toujours selon son déclencheur.

### Créer un objet invisible — `invisible_` (ou `OBJ_INVISIBLE`)

Un objet caché au sol n'a aucun graphisme visible, et pourtant le joueur peut le ramasser en faisant face à l'endroit et en appuyant sur la touche action, et le Cherch'Objet peut le localiser. On met `invisible_` n'importe où dans le nom (ou on nomme l'event exactement `OBJ_INVISIBLE`) pour obtenir ce comportement : l'event devient déclenchable en lui faisant face même sans graphisme, et la recherche du Cherch'Objet l'inclut (dans un rayon d'environ 10 cases en horizontal et 7 en vertical).

## Comportement de déplacement

### Marcher sur l'eau — `surf_`

Un nageur ou un Pokémon aquatique doit se déplacer sur l'eau et être bloqué sur la terre, l'inverse d'un personnage normal. On place `surf_` n'importe où dans le nom (`surf_Nageur`) : l'event ne peut alors marcher que sur les cases d'eau surfables, et il est bloqué sur la terre, les cascades et les tourbillons.

### Ignorer les cases glissantes — `[noslide=on]`

Les cases de glace et de courant forcent normalement un personnage à continuer de glisser dans une direction. On ajoute `[noslide=on]` pour que l'event les ignore et se déplace case par case comme d'habitude.

## Aides à la création

### Réutiliser l'apparence de la page 1 — `$`

Un event à plusieurs pages répète généralement le même graphisme sur chaque page, ce qui est fastidieux à configurer et facile à rater. On inclut `$` n'importe où dans le nom et PSDK utilise toujours **l'apparence de la page 1**, quelle que soit la page active. On règle le graphisme une seule fois sur la page 1 et on l'ignore sur les autres.

### Référencer un event depuis un script — `[alias=nom]`

Référencer un event par son identifiant numérique est fragile : il suffit d'insérer ou de supprimer un event pour que les identifiants se décalent. `[alias=nom]` enregistre un symbole stable pour l'event afin qu'une [commande Script](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) puisse le récupérer par son nom plutôt que par son identifiant. L'alias peut contenir des lettres minuscules, des chiffres, des tirets et des tirets bas, et il doit être unique sur la carte (PSDK journalise une erreur si le même alias apparaît deux fois).

## Combiner les attributs

Les tags se cumulent librement tant qu'aucun d'eux n'a besoin d'être le premier caractère, ce qui explique que `§` et `¤` soient exclusifs l'un de l'autre. La partie lisible peut se mettre n'importe où. Par exemple :

`$[offset_y=-24][reflection=on][particle=off] Goélise`

réutilise l'apparence de la page 1 (`$`), fait flotter l'event aux trois quarts d'une case au-dessus du sol (`[offset_y=-24]`), projette un reflet sur l'eau en contrebas (`[reflection=on]`) et supprime les particules (`[particle=off]`). Le joueur ne voit jamais que la créature, jamais son nom.

## Conclusion

- Le nom d'un event porte des attributs sous trois formes : caractères de tête (`§`, `¤`), tags entre crochets (`[...]`) et sous-chaînes (`surf_`, `invisible_`, `$`).
- Le nom est analysé une seule fois, au chargement de la carte. On renomme puis on recharge pour appliquer un changement.
- `§` et `¤` doivent être le premier caractère et ne peuvent pas être combinés. Tous les autres tags peuvent apparaître n'importe où et se cumuler.
- On utilise les tags pour contrôler l'affichage (`§`, `¤`, `[particle=off]`, `[reflection=on]`, `[z=N]`), la position (`[offset_x=N]`, `[offset_y=N]`), la visibilité (`[sprite=off]`, `invisible_`), le déplacement (`surf_`, `[noslide=on]`) et la création (`$`, `[alias=nom]`).
