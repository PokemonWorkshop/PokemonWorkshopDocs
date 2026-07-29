---
title: "Comprendre les System Tags"
slug: les-system-tags
sidebar_position: 2
description: "Les System Tags sont des marqueurs posés sur chaque tuile qui indiquent au moteur de carte de PSDK comment elle se comporte : quelles tuiles lancent un combat sauvage, permettent de surfer, font glisser sur la glace, sauter un rebord ou monter un escalier. Ce guide explique comment le moteur les stocke et les lit, l'API pour interroger la tuile sous ou devant un personnage, et le catalogue complet des tags groupés par rôle."
---

Les **System Tags** sont des marqueurs posés sur chaque tuile qui indiquent au moteur de carte de PSDK comment elle se comporte : quelles tuiles lancent un combat sauvage, permettent de surfer, font glisser sur la glace, sauter un rebord ou monter un escalier. Ce guide explique comment le moteur les stocke et les lit, l'API pour interroger la tuile sous ou devant un personnage, et le catalogue complet des tags groupés par rôle.

## Le problème : faire réagir le terrain

Quand le joueur entre dans les hautes herbes, un combat sauvage peut se déclencher. Quand il arrive sur un rebord, le personnage saute en contrebas et ne peut plus remonter. Quand il atteint une plaque de glace, il continue de glisser jusqu'à ce qu'un mur l'arrête. Le surf ne fonctionne que sur l'eau, le vélo refuse certains rebords, et les compteurs comptent les pas différemment dans un marais.

Rien de tout cela n'est codé en dur carte par carte. Chacun de ces comportements vient du moteur qui lit **un seul marqueur sur la tuile** et agit en conséquence. Ce marqueur, c'est un System Tag : un entier attaché à une tuile du tileset, consulté par le moteur de carte à chaque déplacement. Comprendre les System Tags, c'est comprendre comment PSDK transforme une carte peinte en un terrain qui réagit.

Les System Tags sont distincts du `terrain_tag` historique de RPG Maker XP. L'ancien terrain tag existe toujours (`Game_Character#terrain_tag`), mais la logique de carte propre à PSDK s'appuie sur les System Tags, plus riches et liés à des symboles de gameplay.

## Où vivent les tags

Un System Tag est stocké **par tileset, pas par carte**. Le moteur tient une table globale `$data_system_tags` indexée par identifiant de tileset, et chaque carte charge la ligne de son propre tileset à son initialisation :

```ruby
# Game_Map#load_systemtags, appelé depuis Game_Map#setup
$data_system_tags[@map.tileset_id] ||= Array.new($data_tilesets[@map.tileset_id].priorities.xsize, 0)
@system_tags = $data_system_tags[@map.tileset_id]
```

Ainsi `@system_tags[tile_id]` donne le tag d'une tuile donnée du tileset. La valeur `0` signifie « aucun tag ». Comme une case de carte empile jusqu'à trois couches de tuiles, le moteur les lit **de la couche du haut vers le bas** et renvoie le premier tag non nul trouvé.

On ne définit pas les System Tags dans le code : ils se peignent dans **Tiled**, l'éditeur avec lequel les cartes PSDK sont construites. Chaque carte est un fichier `.tmx` sous `Data/Tiled/Maps`, et les System Tags vivent sur des calques dédiés : `systemtags` pour les tags de terrain, plus `systemtags_bridge1` et `systemtags_bridge2` pour les ponts, comme détaillé dans [Calques et priorités de superposition](/tiled/calques-et-priorites). Peindre un tag revient à poser une tuile du tileset des System Tags, dont les tuiles correspondent aux constantes listées plus bas. Pokémon Studio est le hub de projet qui ouvre la carte dans Tiled ; il ne peint pas les tags lui-même.

Chaque constante de tag est générée par un utilitaire :

```ruby
# GameData::SystemTags
def gen(x, y)
  return 384 + x + (y * 8)
end

TGrass = gen 5, 0
TIce   = gen 1, 0
```

Ici `(x, y)` est la position du tag dans l'image du tileset des System Tags (8 colonnes de large). On n'a jamais besoin du nombre brut dans son propre code : un tag se désigne toujours par son **nom de constante**, comme `GameData::SystemTags::TGrass`.

## Lire un tag depuis un script

Toutes les méthodes de lecture vivent sur `Game_Character` (donc tout événement, PNJ et le joueur les partagent) et sur `Game_Map`. C'est la partie qu'on appelle réellement depuis la commande script d'un événement.

Les deux requêtes les plus courantes sont la tuile sur laquelle se tient le personnage et la tuile juste devant lui :

```ruby
# Le tag sous le joueur
$game_player.system_tag                 # => id entier, 0 si aucun

# Le tag de la tuile que le joueur regarde (selon la direction du personnage)
$game_player.front_system_tag           # => id entier, 0 si aucun
```

Comparer un id brut fonctionne, mais le moteur expose aussi un **symbole lisible** pour les tags pertinents en gameplay, plus pratique pour brancher :

```ruby
$game_player.system_tag_db_symbol       # => :grass, :cave, :sea, :ice, :headbutt...
$game_player.front_system_tag_db_symbol # => idem, pour la tuile devant
```

Le symbole vient de `GameData::SystemTags.system_tag_db_symbol`, qui associe les tags de rencontre et de particule à un symbole et renvoie `:regular_ground` pour tout le reste.

Pour comparer à un tag précis, on utilise la constante plutôt qu'un nombre littéral :

```ruby
if $game_player.front_system_tag == GameData::SystemTags::HeadButt
  # le joueur fait face à une tuile Coup d'Boule
end
```

Quand on a besoin d'inspecter une case quelconque plutôt que la position du personnage, on interroge la carte directement :

```ruby
# Tag à une coordonnée de tuile absolue
$game_map.system_tag(x, y)              # => id entier, 0 si aucun

# Ce tag exact est-il présent sur cette case ?
$game_map.system_tag_here?(x, y, GameData::SystemTags::TGrass)  # => true / false
```

`Game_Map#system_tag` accepte un mot-clé `skip_bridge:`. Avec `skip_bridge: true`, il ignore les tags de pont (`BridgeRL`, `BridgeUD`) et continue d'examiner les couches en dessous, ce qui permet au moteur de vérifier le sol *sous* un pont plutôt que le pont lui-même.

| Méthode                                     | Reçoit                   | Renvoie                                         |
| ------------------------------------------- | ------------------------ | ----------------------------------------------- |
| `Game_Character#system_tag`                 | rien                     | id du tag de la tuile sous le personnage        |
| `Game_Character#front_system_tag`           | rien                     | id du tag de la tuile que le personnage regarde |
| `Game_Character#system_tag_db_symbol`       | rien                     | symbole de la tuile courante                    |
| `Game_Character#front_system_tag_db_symbol` | rien                     | symbole de la tuile regardée                    |
| `Game_Map#system_tag`                       | `x`, `y`, `skip_bridge:` | id du tag sur cette case, `0` si aucun          |
| `Game_Map#system_tag_here?`                 | `x`, `y`, `tag`          | `true` si ce tag exact est sur la case          |
| `GameData::SystemTags.system_tag_db_symbol` | un id de tag             | le symbole correspondant, ou `:regular_ground`  |

## Les familles de tags

Chaque tag est une constante du module `GameData::SystemTags`. Le moteur regroupe plusieurs d'entre eux dans des tableaux qu'il réutilise dans la logique de déplacement (`SurfTag`, `SlideTags`, `BRIDGE_TILES`, `ZTag`...). Les tableaux ci-dessous listent chaque tag par rôle ; la colonne effet reflète ce que le moteur fait réellement de chacun.

### Terrain et rencontres

Ces tags pilotent les combats sauvages, le type de lieu et les particules au sol.

| Tag           | Effet                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `Empty`       | Tuile neutre ; annule l'effet des tags d'eau comme `TSea` ou `TPond`.                            |
| `TGrass`      | Herbe ; affiche des particules d'herbe et lance les combats sauvages d'herbe.                    |
| `TTallGrass`  | Herbe plus haute ; même rôle que `TGrass` avec une animation distincte.                          |
| `TCave`       | Grotte ; lance les combats sauvages de grotte.                                                   |
| `TMount`      | Montagne ; lance les combats sauvages de montagne.                                               |
| `TSand`       | Sable ; lance les combats sauvages de sable.                                                     |
| `TWetSand`    | Sable mouillé ; affiche une particule à la marche, se comporte sinon comme le sable.             |
| `TPond`       | Étang ou rivière ; lance les combats sauvages d'étang (surfable).                                |
| `TSea`        | Mer ou océan ; lance les combats sauvages de mer (surfable).                                     |
| `TUnderWater` | Terrain sous-marin ; lance les combats sauvages sous-marins.                                     |
| `TSnow`       | Neige ; lance les combats sauvages de neige.                                                     |
| `Puddle`      | Flaque ; affiche une particule d'eau à la marche.                                                |
| `HeadButt`    | Tuile sur laquelle on peut utiliser Coup d'Boule ; compte comme de l'herbe pour le type de lieu. |

### Eau et surf

Le moteur tient deux tableaux ici : `SurfTag` (les tuiles d'eau où l'on ne peut entrer qu'en surfant) et `SurfLTag` (toutes les tuiles sur lesquelles on est autorisé à se tenir en surfant, ce qui ajoute les ponts, les sauts et les ponts de vélo).

| Tag                                        | Effet                                                         |
| ------------------------------------------ | ------------------------------------------------------------- |
| `TSea`, `TPond`                            | Eau surfable ; font partie de `SurfTag`.                      |
| `RapidsL`, `RapidsD`, `RapidsU`, `RapidsR` | Courant forçant le personnage à gauche / bas / haut / droite. |
| `WaterFall`                                | Tuile de cascade ; une aide pour les événements de cascade.   |
| `Whirlpool`                                | Tuile de tourbillon.                                          |

### Glissade

Ces tags prennent le contrôle du personnage et le déplacent automatiquement. Ils sont rassemblés dans `SlideTags`.

| Tag                                            | Effet                                                        |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `TIce`                                         | Glace ; le personnage continue de glisser tout droit.        |
| `RapidsL`, `RapidsD`, `RapidsU`, `RapidsR`     | Forcent le personnage à glisser dans cette direction.        |
| `RocketL`, `RocketD`, `RocketU`, `RocketR`     | Forcent le personnage à avancer dans ce sens jusqu'à un mur. |
| `RocketRL`, `RocketRD`, `RocketRU`, `RocketRR` | Comme les tags `Rocket*` mais le personnage pivote aussi.    |
| `StopSlide`                                    | Arrête un personnage en train de glisser.                    |

### Rebords et sauts

| Tag                                | Effet                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `JumpR`, `JumpL`, `JumpD`, `JumpU` | Rebord ; le personnage le franchit d'un saut vers la droite / gauche / bas / haut. |

### Escaliers et pentes

| Tag                                        | Effet                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `StairsL`, `StairsD`, `StairsU`, `StairsR` | Escaliers ; ajustent l'élévation du personnage pendant le déplacement.                       |
| `SlopesL`, `SlopesR`                       | Pentes gauche et droite ; décalent la position à l'écran du personnage qui monte ou descend. |

### Ponts et élévation

Les ponts sont regroupés dans `BRIDGE_TILES` ; `ZTag` est un tableau de tuiles qui changent le z (la couche de priorité) du personnage.

| Tag        | Effet                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `BridgeUD` | Pont traversé de haut en bas (la couche en dessous reste accessible).                                  |
| `BridgeRL` | Pont traversé de droite à gauche.                                                                      |
| `ZTag`     | Sept tuiles qui fixent la couche z du personnage, pour passer au-dessus ou en dessous d'autres tuiles. |

### Vélos

| Tag           | Effet                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| `AcroBike`    | Rebord franchissable uniquement par le bunny hop du vélo Cross.                            |
| `AcroBikeRL`  | Pont de vélo n'autorisant que les déplacements droite et gauche (plus les sauts haut/bas). |
| `AcroBikeUD`  | Pont de vélo n'autorisant que les déplacements haut et bas (plus les sauts gauche/droite). |
| `MachBike`    | Exige une vitesse élevée ; sinon le personnage tombe.                                      |
| `CrackedSoil` | Exige une vitesse élevée ; sinon le personnage tombe dans un trou.                         |
| `Hole`        | Tuile de trou.                                                                             |

### Marais et recherche de chemin

| Tag           | Effet                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| `SwampBorder` | Marais peu profond ; ralentit le personnage.                                     |
| `DeepSwamp`   | Marais profond ; le personnage peut s'y retrouver bloqué.                        |
| `Road`        | Marque une route, utilisée comme trajet préférentiel par la recherche de chemin. |
| `RClimb`      | Tuile d'Escalade.                                                                |

La liste de référence, toujours à jour, est le fichier du moteur qui les déclare. Si une future version de PSDK ajoute un tag, il y apparaît en premier.

## Exemples d'utilisation

L'API de lecture n'est que du Ruby ordinaire : on peut donc brancher sur un System Tag partout où du code de jeu s'exécute, qu'il s'agisse de la commande script d'un événement, d'un déplacement personnalisé, d'une tâche planifiée ou d'un gestionnaire de capacité hors combat. Voici les motifs les plus utiles, chacun calqué sur la façon dont le moteur lui-même utilise les tags.

### Conditionner un événement à la tuile devant

Le cas le plus simple : ne déclencher une interaction que sur le bon type de tuile. On glisse une garde directement dans la commande script d'un événement, en lisant la tuile que le joueur regarde :

```ruby
# Dans la commande script d'un événement
if $game_player.front_system_tag_db_symbol == :grass
  # le joueur fait face à de l'herbe : on lance l'interaction
  $game_temp.common_event_id = MY_GRASS_EVENT_ID
end
```

Pour brancher sur un tag sans symbole dédié, on compare la constante à la place :

```ruby
# Ne réagir que si le joueur se tient sur un pont traversé droite et gauche
if $game_player.system_tag == GameData::SystemTags::BridgeRL
  # ...
end
```

Ces mêmes lectures fonctionnent depuis une commande script dans l'[interpréteur](/rpg-maker-xp/utiliser-linterpreter-dans-un-event).

### Lire un tag depuis un déplacement personnalisé

La commande **Script** d'un déplacement personnalisé (Move Route) est évaluée dans le contexte du personnage qui se déplace : toutes les méthodes de `Game_Character` sont donc accessibles sans récepteur. Le moteur fournit d'ailleurs un helper de move route bâti exactement là-dessus : `move_random_within_systemtag` fait errer un personnage au hasard mais uniquement sur les tuiles portant un tag donné, de sorte qu'un PNJ ou un Pokémon vagabond reste confiné, par exemple, à l'herbe ou à l'eau :

```ruby
# Commande Script dans le déplacement personnalisé de l'événement
move_random_within_systemtag(GameData::SystemTags::TGrass)
```

À chaque exécution du déplacement, il tente un pas aléatoire et ne le franchit que si la tuile voisine partage le tag, si bien que le personnage ne quitte jamais la zone.

### Réagir à un pas avec le Scheduler

Pour exécuter du code *au moment où* un personnage arrive sur une tuile plutôt que de l'interroger, on enregistre une tâche d'événement de carte. `Scheduler::EventTasks` se déclenche sur `:begin_step` / `:end_step`, `:begin_jump` / `:end_jump` et `:begin_slide` / `:end_slide` ; la tâche reçoit le `Game_Character` qui s'est déplacé, et l'identifiant d'événement `-1` vise le joueur. Le moteur s'en sert lui-même pour choisir la particule à l'atterrissage d'un saut :

```ruby
# Comment PSDK choisit la poussière d'eau ou normale après un saut
Scheduler::EventTasks.on(:end_jump, 'Dust after jumping') do |event|
  next if event.particles_disabled

  particle = Game_Character::SurfTag.include?(event.system_tag) ? :water_dust : :dust
  Yuki::Particles.add_particle(event, particle)
end
```

Une tâche personnelle suit la même forme, ici en ne réagissant que lorsque le joueur arrive sur de la glace :

```ruby
Scheduler::EventTasks.on(:end_step, 'React to ice', -1) do |event|
  next unless event.system_tag == GameData::SystemTags::TIce
  # le joueur vient de poser le pied sur une tuile de glace
end
```

C'est la manière la plus propre d'ajouter un comportement déclenché au pas ; voir le guide [Scheduler](/psdk/core-systems/scheduler) pour le modèle de tâches complet.

### Ajouter une capacité hors combat qui teste le terrain

Les capacités hors combat (Surf, Vol, Doux Parfum...) sont enregistrées dans le hash `PFM::SKILL_PROCESS`, indexé par le `db_symbol` de la capacité. Chaque entrée est un proc qui reçoit le Pokémon, la capacité et un drapeau `test` (l'essai à blanc que le menu utilise pour savoir si la capacité est utilisable). C'est exactement là que Surf lit un System Tag pour décider qu'il peut être employé : il regarde la tuile devant le joueur et refuse tant que ce n'est pas de l'eau.

```ruby
# PFM::SKILL_PROCESS[:surf], abrégé
surf: proc do |_pkmn, _skill, test = false|
  new_x, new_y = $game_player.front_tile
  sys_tag = $game_map.system_tag(new_x, new_y)
  # refuser tant que la tuile regardée n'est pas de l'eau surfable
  next :block unless $game_player.z <= 1 && !$game_player.surfing? &&
                     Game_Character::SurfTag.include?(sys_tag)
  next false if test

  $game_temp.common_event_id = Game_CommonEvent::SURF_ENTER
  next true
end
```

On enregistre sa propre capacité hors combat de la même façon : on ajoute une entrée indexée par le `db_symbol` de la capacité, on renvoie `:block` pour refuser avec le message par défaut, et on agit quand le terrain s'y prête.

```ruby
# Une capacité hors combat utilisable uniquement face à une tuile d'Escalade
PFM::SKILL_PROCESS[:my_move] = proc do |_pkmn, _skill, test = false|
  next :block unless $game_player.front_system_tag == GameData::SystemTags::RClimb
  next false if test

  # effet de la capacité sur la carte ici
end
```

Quand il s'agit plutôt de changer ce que fait une méthode existante du moteur autour d'un tag, on la patche avec un module `prepend` appelant `super` plutôt que de modifier le moteur, comme décrit dans [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk).

Pour aller plus loin et enregistrer un tag entièrement nouveau, avec ses propres rencontres sauvages, son arrière-plan de combat et ses particules, voir [Créer un System Tag personnalisé](/psdk/core-systems/creer-un-system-tag-personnalise).

## Conclusion

- Un **System Tag** est un marqueur par tuile, stocké par tileset, qui indique au moteur de carte comment une tuile se comporte ; `0` signifie aucun tag.
- Le moteur lit les trois couches d'une case du haut vers le bas et renvoie le premier tag non nul.
- On lit la tuile sous un personnage avec `system_tag`, la tuile devant avec `front_system_tag`, et on obtient un symbole lisible avec `system_tag_db_symbol` ; on interroge n'importe quelle case avec `Game_Map#system_tag` et `system_tag_here?`.
- On compare toujours à un **nom de constante** (`GameData::SystemTags::TGrass`), jamais à un nombre brut.
- Les tags se rangent en familles claires : terrain et rencontres, eau et surf, glissade, rebords, escaliers et pentes, ponts et élévation, vélos, marais et recherche de chemin.
- Les tags se peignent dans Tiled sur un calque `systemtags` dédié ; le fichier du moteur qui déclare les constantes fait foi pour la liste complète.
