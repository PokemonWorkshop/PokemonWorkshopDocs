---
title: "Déplacer un personnage avec le pathfinding"
slug: pathfinding
sidebar_position: 10
description: "PSDK peut faire marcher un event ou le joueur jusqu'à une destination tout seul, en trouvant un chemin autour des murs et des obstacles au lieu de suivre un déplacement figé. Ce guide couvre la commande find_path, les types de cible qu'elle accepte (coordonnées, un autre personnage à poursuivre ou à fuir, un bord de la carte), et comment faire courir un personnage, l'arrêter, ou déplacer le joueur de la même manière."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut faire marcher un event ou le joueur jusqu'à une destination tout seul, en trouvant un chemin autour des murs et des obstacles au lieu de suivre un déplacement figé. Ce guide couvre la commande `find_path`, les types de cible qu'elle accepte (coordonnées, un autre personnage à poursuivre ou à fuir, un bord de la carte), et comment faire courir un personnage, l'arrêter, ou déplacer le joueur de la même manière.

## Pourquoi le pathfinding plutôt qu'un déplacement figé

La façon native de RPG Maker XP pour déplacer un event quelque part est la commande **Définir un itinéraire** : on détaille chaque pas à la main, ou on choisit **Avancer vers le héros**, qui ne fait jamais qu'un pas en direction du joueur et fonce droit dans le premier mur rencontré. Aucune des deux ne connaît la forme de la carte. PSDK ajoute le **pathfinding** : on désigne une destination, et le moteur calcule un chemin complet jusqu'à elle, en contournant les murs, l'eau et les autres obstacles, et en le recalculant tout seul quand quelque chose vient bloquer le passage.

Tout passe ici par une commande **Script**, il n'existe pas de commande d'event native pour ça. Les commandes sont des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : appelées depuis la commande Script d'un event, sans aucun préfixe, elles agissent sur **cet event**. Les mêmes méthodes fonctionnent sur le joueur et sur n'importe quel autre personnage, comme montré à la fin.

En coulisse, le chemin vient d'une recherche pondérée : chaque case a un coût, donc le chemin n'est pas seulement court mais naturel, il préfère les routes et évite les terrains comme les hautes herbes ou les marais. Ces préférences et une vue de débogage sont couvertes dans la dernière section.

## Envoyer un personnage à des coordonnées

La commande centrale est `find_path`. Son seul argument obligatoire est `to:`, la destination. On lui passe un tableau `[x, y]` de coordonnées de cases et l'event s'y rend :

```ruby
find_path(to: [10, 15])
```

Appelée depuis la commande Script d'un event, elle envoie cet event sur la case x = 10, y = 15, en contournant tout ce qui se trouve sur le chemin. Les coordonnées sont des cases de la carte, les mêmes nombres que RPG Maker XP affiche dans la barre d'état quand on survole une case dans l'éditeur de carte.

Une troisième valeur fixe le niveau z, pour les ponts et les cartes à plusieurs niveaux :

```ruby
find_path(to: [10, 15, 0])
```

## S'arrêter avant la cible : l'argument radius

Par défaut, le personnage marche jusqu'à se tenir exactement sur la case cible. L'argument `radius` assouplit cela : c'est la distance, en cases, à laquelle la cible est considérée comme atteinte. La distance se mesure en **distance de Manhattan**, la somme des écarts horizontal et vertical (`|dx| + |dy|`), et non en ligne droite.

```ruby
find_path(to: [10, 15], radius: 3)
```

Ici, l'event s'arrête dès qu'il arrive à 3 cases de (10, 15). Un rayon est utile quand la case exacte peut être occupée, ou quand « assez proche » suffit, pour un PNJ qui doit marcher jusqu'à un endroit sans se tenir précisément dessus.

## Poursuivre ou fuir un personnage

Au lieu de coordonnées fixes, `to:` accepte un autre personnage, et le chemin le suit alors : si la cible bouge, PSDK recalcule l'itinéraire automatiquement. On désigne un personnage avec `get_character` :

| Argument de `get_character` | Ce qu'il renvoie                              |
| --------------------------- | --------------------------------------------- |
| `0`                         | l'event courant (celui qui exécute le script) |
| `-1`                        | le joueur                                     |
| un nombre positif           | l'event portant cet ID sur la carte           |

Ainsi, un event qui poursuit le joueur et s'arrête à une case de lui :

```ruby
find_path(to: get_character(-1), radius: 1)
```

`get_character(-1)` et le global `$game_player` sont interchangeables ici :

```ruby
find_path(to: $game_player, radius: 1)
```

Pour poursuivre un autre event, on passe son ID, ici l'event 8 :

```ruby
find_path(to: get_character(8))
```

### Fuir au lieu de poursuivre

La même cible personnage, avec `type: :Character_Reject`, inverse le but : le personnage s'**éloigne** jusqu'à se trouver à plus de `radius` cases de la cible. C'est la commande pour un PNJ ou un Pokémon sauvage qui fuit le joueur :

```ruby
find_path(to: $game_player, type: :Character_Reject, radius: 5, tries: :infinity)
```

L'event continue de fuir jusqu'à être à plus de 5 cases, en réessayant indéfiniment (`tries: :infinity`, expliqué plus bas) pour ne jamais abandonner tant que le joueur continue de se rapprocher.

## Marcher jusqu'à un bord de la carte

La cible `:Border` envoie le personnage vers un côté de la carte, désigné par un symbole de direction : `:north`, `:south`, `:east` ou `:west`.

```ruby
find_path(to: :north, type: :Border)
```

Cela fait marcher l'event jusqu'au bord supérieur de la carte. C'est pratique pour un PNJ qui doit sortir de l'écran, en partant par le bord le plus proche avant qu'on le supprime ou le masque.

## Comportement de réessai : l'argument tries

Quand aucun chemin n'existe encore, le personnage est enfermé, ou la case cible est inatteignable, la recherche n'abandonne pas tout de suite. Elle attend et réessaie, jusqu'à `tries` fois (par défaut **5**). Chaque recherche ratée fait une pause d'environ une seconde avant la tentative suivante.

```ruby
find_path(to: [10, 15], tries: 10)
```

On passe le symbole `:infinity` pour réessayer indéfiniment, pour une poursuite ou un garde qui doit continuer à chercher quoi qu'il arrive :

```ruby
find_path(to: $game_player, tries: :infinity)
```

Cela compte parce que le monde peut changer entre deux tentatives : une porte que le joueur ouvre, un event qui s'écarte, un pont qui s'abaisse. Chaque réessai parcourt la carte de zéro, donc un chemin qui n'existait pas une seconde plus tôt peut être trouvé à la tentative suivante.

## Courir au lieu de marcher

Par défaut, le personnage se déplace à sa vitesse de marche normale. On met `running: true` pour le faire aller plus vite pendant la durée du chemin, avant de revenir à sa vitesse précédente une fois arrivé :

```ruby
find_path(to: [10, 15], running: true)
```

Sur le joueur, cela déclenche le véritable état de course ; sur un event, cela augmente la vitesse de déplacement le temps du chemin.

## Arrêter un chemin en cours

Un chemin se termine normalement tout seul : quand le personnage atteint la cible, la requête se nettoie et le personnage s'immobilise. Pour l'interrompre avant, on appelle `stop_path` :

```ruby
stop_path
```

Appelée depuis la commande Script d'un event, elle annule le chemin courant de cet event et le laisse là où il se trouve. On s'en sert pour stopper une poursuite quand un interrupteur bascule, ou pour arrêter un PNJ en plein trajet quand le joueur déclenche quelque chose. Lancer un nouveau `find_path` sur le même personnage remplace aussi tout chemin déjà en cours, donc `stop_path` n'est utile que lorsqu'on veut simplement que le personnage s'arrête.

## Déplacer le joueur aussi

Tout ce qui précède fonctionne sur le joueur autant que sur les events. La façon la plus courte d'envoyer le joueur quelque part est `fast_travel`, un raccourci qui lance le pathfinding sur `$game_player` :

```ruby
fast_travel(x, y = nil, ms = 5)
```

- `x`, `y` — la case de destination.
- `ms` — la vitesse de déplacement pour le trajet. Optionnel, vaut `5` par défaut.

```ruby
fast_travel(15, 20)
```

Cela règle la vitesse du joueur et le fait marcher jusqu'à (15, 20). Pour envoyer le joueur vers un bord de la carte à la place, on passe un seul symbole de direction et pas de `y` :

```ruby
fast_travel(:south)
```

Pour l'ensemble des options sur le joueur, on appelle `find_path` directement sur le global `$game_player`, exactement comme sur un event :

```ruby
$game_player.find_path(to: [15, 20], running: true)
```

On l'annule avec `$game_player.stop_path`.

## Réglages et dépannage

### Visualiser le chemin

Quand un personnage ne va pas là où on l'attend, on active la couche de débogage pour voir l'itinéraire calculé dessiné sur la carte :

```ruby
Pathfinding.debug = true
```

Chaque nœud du chemin est marqué à l'écran, la destination étant mise en évidence. On la désactive avec `Pathfinding.debug = false`. C'est le moyen le plus rapide de savoir si la recherche a trouvé un chemin, ou si elle a abandonné parce que la cible est murée.

### Le terrain que le chemin préfère

La recherche pondère les cases selon leur system tag, donc l'itinéraire n'est pas seulement le plus court mais le plus naturel. Les routes et le sable sont peu coûteux et privilégiés ; les hautes herbes et les marais coûtent bien plus cher et sont évités dès qu'un détour existe. Ces poids vivent dans `Pathfinding::TAGS_WEIGHT` et peuvent être ajustés dans un script si vos cartes ont besoin d'autres priorités, mais les valeurs par défaut conviennent à la plupart des jeux.

### Désactiver le pathfinding globalement

Le pathfinding tourne à chaque frame pour chaque requête active, et il est activé par défaut. Pour couper tout le système, le temps d'un test de performance ou pour un projet minimal, on règle la constante dans un script :

```ruby
Game_Map::PATH_FINDING_ENABLED = false
```

Si beaucoup de personnages cherchent un chemin en même temps et que le framerate baisse, on peut plutôt réduire le nombre d'étapes de recherche par frame :

```ruby
Pathfinding.operation_per_frame = 50
```

La valeur par défaut est `150` ; un nombre plus bas étale le travail sur davantage de frames, au prix d'une découverte de chemin plus lente.

## Conclusion

- `find_path(to: ...)` envoie un personnage vers une destination en contournant les obstacles ; appelée nue dans une commande Script, elle déplace l'event courant.
- La cible `to:` peut être des coordonnées (`[x, y]`), un autre personnage (`get_character(id)` ou `$game_player`) à poursuivre, ou un bord de la carte (`type: :Border`).
- `radius` arrête le personnage avant la cible (distance de Manhattan) ; `type: :Character_Reject` le fait fuir au lieu de poursuivre.
- `tries` fixe combien de fois une recherche bloquée réessaie (`:infinity` pour ne jamais abandonner) ; `running: true` fait avancer le personnage plus vite le temps du trajet.
- `stop_path` annule un chemin, et lancer un nouveau `find_path` remplace celui en cours.
- Le joueur a les mêmes capacités : `fast_travel(x, y)` (ou un symbole de direction) est le raccourci, ou on appelle `$game_player.find_path` directement.
- On utilise `Pathfinding.debug = true` pour voir l'itinéraire ; le chemin préfère les routes et évite les hautes herbes et les marais.
