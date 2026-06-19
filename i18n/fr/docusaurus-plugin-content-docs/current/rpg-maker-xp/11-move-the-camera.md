---
title: "Déplacer la caméra vers un event ou une case"
slug: deplacer-la-camera
sidebar_position: 11
description: "PSDK peut faire glisser doucement la caméra de la carte loin du joueur, vers un event ou une case, puis la ramener, le tout depuis la commande Script d'un event. Ce guide couvre move_camera_to_event et move_camera_to_tiles, comment ramener la caméra au joueur, si l'event attend la fin du panoramique ou continue, et la courbe que suit le mouvement."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut faire glisser doucement la caméra de la carte loin du joueur, vers un event ou une case, puis la ramener, le tout depuis la commande Script d'un event. Ce guide couvre `move_camera_to_event` et `move_camera_to_tiles`, comment ramener la caméra au joueur, si l'event attend la fin du panoramique ou continue, et la courbe que suit le mouvement.

## Pourquoi déplacer la caméra

La caméra de la carte reste normalement fixée sur le joueur : où qu'il marche, la vue le suit. C'est ce qu'on veut presque tout le temps, mais pas pendant une cinématique. Quand une porte s'ouvre à l'autre bout de la ville, qu'un rival arrive depuis le bord de l'écran, ou qu'un interrupteur révèle un escalier caché, le joueur doit regarder *ça*, pas son propre personnage immobile. Faire glisser la caméra jusqu'à l'action, l'y maintenir, puis la ramener, c'est ce qui donne tout son sens au moment.

RPG Maker XP possède bien une commande native **Faire défiler la carte**, mais elle ne décale la vue que d'un nombre de cases fixe dans une direction : il faut connaître la distance à l'avance, elle ne vise jamais rien, et le mouvement est plat. PSDK la remplace par deux commandes qui prennent une **cible**, un event ou une case, calculent le défilement à votre place, adoucissent le mouvement, et gardent la vue à l'intérieur de la carte.

Les deux sont des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : appelées depuis la commande Script d'un event, sans aucun préfixe. Elles agissent sur la carte, pas sur l'event qui les exécute, donc peu importe depuis quel event on les appelle.

## Faire un panoramique vers un event

`move_camera_to_event` centre la vue sur un event sur une durée donnée. Elle prend l'ID de l'event et une durée en secondes :

```ruby
move_camera_to_event(8, 1.5)
```

Cela fait glisser la caméra sur l'event 8 en 1,5 seconde. L'ID est le nombre que RPG Maker XP affiche à côté de l'event dans l'éditeur de carte, et l'event doit se trouver sur la carte courante. Si aucun event ne porte cet ID, la commande ne fait rien plutôt que de lever une erreur.

Une durée de `0` saute directement à la cible sans animation, utile quand on veut une coupure nette plutôt qu'un glissement :

```ruby
move_camera_to_event(8, 0)
```

## Faire un panoramique vers une case

Quand l'endroit qu'on veut montrer n'est pas un event, on pointe la caméra sur des coordonnées de cases avec `move_camera_to_tiles`. Elle prend un x, un y et une durée :

```ruby
move_camera_to_tiles(20, 12, 1.5)
```

Cela centre la vue sur la case x = 20, y = 12 en 1,5 seconde. Les coordonnées sont des cases de la carte, les mêmes nombres que RPG Maker XP affiche dans la barre d'état quand on survole une case dans l'éditeur de carte. On s'en sert pour cadrer une partie de la carte sans event dessus, un pont, une grille, un bout de terrain sur le point de changer.

## Ramener la caméra au joueur

Après un panoramique, la vue reste là où on l'a laissée, elle ne revient **pas** toute seule. On termine chaque cinématique en ramenant la caméra au joueur, sinon le contrôle paraîtra cassé dès que le joueur essaiera de marcher.

Le joueur compte comme l'event `-1`, donc la même commande ramène la vue à la maison :

```ruby
move_camera_to_event(-1, 1.5)
```

Il existe aussi un raccourci nommé pour exactement cela, appelé sur la carte :

```ruby
$game_map.reset_camera_to_player(1.5)
```

Les deux ramènent la caméra sur le joueur en 1,5 seconde. À partir de là, la caméra reprend son suivi normal du joueur.

## Faire attendre l'event, ou le laisser continuer : l'argument block_interpreter

Par défaut, l'event **attend** la fin du panoramique avant d'exécuter sa commande suivante. C'est le troisième argument, `block_interpreter`, et il vaut `true` par défaut :

```ruby
move_camera_to_event(8, 1.5)            # l'event s'arrête ici jusqu'à la fin du panoramique
show_message("Le voilà !")              # ne s'exécute qu'une fois la caméra arrivée
```

C'est ce qu'on veut pour une séquence scriptée : panoramique, puis dialogue, puis retour, chaque étape attendant la précédente. On passe `false` pour laisser l'event continuer pendant que la caméra bouge en arrière-plan :

```ruby
move_camera_to_event(8, 1.5, false)     # le panoramique démarre, l'event continue aussitôt
```

Avec `false`, le panoramique se déroule quand même sur toute sa durée, mais les commandes suivantes se déclenchent immédiatement. On s'en sert quand le glissement de caméra est une toile de fond à autre chose qui se passe en même temps, pas une étape que le reste de l'event doit attendre.

## Choisir la courbe du mouvement : l'argument distortion

Le quatrième argument, `distortion`, règle la façon dont la vitesse du panoramique est répartie sur sa durée. Il vaut `:UNICITY_DISTORTION` par défaut, un glissement linéaire à vitesse constante. On passe un autre symbole pour en changer le ressenti :

| Distortion | Ce que fait le panoramique |
| --- | --- |
| `:UNICITY_DISTORTION` | Vitesse constante du début à la fin (la valeur par défaut). |
| `:SMOOTH_DISTORTION` | Un rythme adouci, non linéaire, au lieu d'une vitesse plate, pour un glissement plus doux. |
| `:SQUARE010_DISTORTION` | Va jusqu'à la cible à mi-parcours, puis revient au point de départ à la fin, un seul « coup d'œil » dans la durée. |

```ruby
move_camera_to_event(8, 1.5, true, distortion: :SMOOTH_DISTORTION)
```

Ces symboles viennent du système d'animation de PSDK, qui définit plusieurs autres courbes (oscillantes et rebondissantes) destinées aux effets de sprites plutôt qu'à une caméra. Pour la plupart des cinématiques, `:UNICITY_DISTORTION` ou `:SMOOTH_DISTORTION` suffit.

## Une courte cinématique

Les commandes se composent en une séquence complète dans une seule commande Script. On fait un panoramique vers un event, on attend, on dit une réplique, puis on revient au joueur, chaque étape étant bloquante par défaut pour qu'elles s'enchaînent dans l'ordre :

```ruby
move_camera_to_event(8, 1.0)            # glisse vers l'event 8, attend la fin
show_message("La grille s'ouvre en grinçant...")
move_camera_to_event(-1, 1.0)           # glisse de retour vers le joueur, attend la fin
```

Comme `block_interpreter` vaut `true` par défaut, on n'a besoin d'ajouter aucune commande d'attente entre les étapes : chacune retient l'event jusqu'à la fin de son panoramique.

## Rester à l'intérieur des bords de la carte

Sur une carte autonome, PSDK contraint la cible pour que la caméra ne défile jamais au-delà des bords de la carte : on vise un event dans un coin et la vue s'arrête à la bordure au lieu de montrer le vide au-delà. Sur des cartes reliées avec le map linker, cette contrainte est levée pour que la caméra puisse glisser sans accroc par-dessus la jointure jusque dans la carte voisine. On ne configure pas ce comportement, il découle de la façon dont la carte est montée, mais il explique pourquoi un panoramique vers un bord s'arrête parfois avant de centrer parfaitement sa cible.

## Conclusion

- `move_camera_to_event(event_id, duration)` centre doucement la caméra sur un event en `duration` secondes ; l'event doit être sur la carte courante.
- `move_camera_to_tiles(x, y, duration)` fait de même pour des coordonnées de cases, pour les endroits sans event dessus.
- La caméra ne revient pas toute seule : on termine une cinématique avec `move_camera_to_event(-1, duration)` ou `$game_map.reset_camera_to_player(duration)` pour rendre le contrôle au joueur.
- Une `duration` de `0` coupe instantanément au lieu de glisser.
- `block_interpreter` (troisième argument, `true` par défaut) fait attendre l'event jusqu'à la fin du panoramique ; on passe `false` pour continuer pendant que la caméra bouge.
- `distortion` (`:UNICITY_DISTORTION` par défaut) règle la courbe du mouvement ; `:SMOOTH_DISTORTION` l'adoucit, `:SQUARE010_DISTORTION` jette un coup d'œil et revient.
- Sur une carte unique, la caméra reste dans les bords ; les cartes reliées la laissent glisser par-dessus la jointure.
