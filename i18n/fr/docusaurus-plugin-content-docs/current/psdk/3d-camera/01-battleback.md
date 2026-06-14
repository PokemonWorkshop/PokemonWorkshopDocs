---
title: "Comment créer un fond de combat pour la caméra 3D ?"
slug: creer-un-fond-de-combat-3d
sidebar_position: 1
description: "Ce guide explique comment construire un fond de combat pour la caméra de combat 3D dynamique de PSDK : une classe Ruby qui assemble ses sprites, les anime, et est sélectionnée par le nom de fond du combat."
---

Ce guide explique comment construire un fond de combat pour la caméra de combat 3D dynamique de PSDK : une classe Ruby qui assemble ses sprites, les anime, et est sélectionnée par le nom de fond du combat.

## Activer la caméra 3D

La caméra de combat 3D dynamique est un réglage de projet, désactivé par défaut. Elle est exposée dans le code par `Battle::BATTLE_CAMERA_3D`, qui lit `Configs.settings.is_use_battle_camera_3d` (la clé `isUseBattleCamera3d` dans `Data/configs/settings_config.json`). On l'active dans les réglages de son projet.

Une fois activée, le combat utilise `Battle::Visual3D` à la place du `Battle::Visual` classique, et les fonds de combat ne sont plus de simples images : chacun devient une classe Ruby que l'on construit comme décrit dans ce guide.

## Comment fonctionne un fond de combat 3D

Avec la caméra 3D, un fond de combat est une sous-classe de `BattleUI::Battleback3D`. Il fait trois choses :

- déclarer où vivent ses images, via `resource_path`,
- assembler ses sprites, dans `create_graphics` avec `add_battleback_element`,
- et, en option, les animer dans `create_animations`.

Le moteur fournit un exemple à étudier, `BattleUI::BattleBackGrass`, dans `5 Battle/01 Scene/0 BattleUI/700 BattleBackForest3D.rb`. Ce guide suit la même structure.

## Placer les ressources

On place ses images dans le dossier `graphics/battlebacks/` de son projet. L'exemple fourni garde un sous-dossier par fond de combat, ici `graphics/battlebacks/animated_camera/BattleBack Forest/`. Un sous-dossier par fond garde le tout gérable une fois qu'un projet en compte des dizaines.

## Créer la classe du fond de combat

On sous-classe `BattleUI::Battleback3D` et on pointe `resource_path` vers son sous-dossier (relatif à `graphics/battlebacks/`) :

```ruby
module BattleUI
  class BattleBackForest < Battleback3D
    def resource_path
      'animated_camera/BattleBack Forest/'
    end
  end
end
```

Le `initialize(viewport, scene)` de base appelle déjà `create_graphics`, donc on ne surcharge `initialize` que si on a besoin d'une mise en place supplémentaire. À noter : la classe de base ne conserve pas la `scene` : si le fond en a besoin, on la stocke soi-même avec `@scene = scene` dans son propre `initialize` (en appelant `super`).

## Assembler les sprites

On construit les couches dans `create_graphics` avec `add_battleback_element`, et on stocke chaque sprite retourné dans une variable d'instance pour pouvoir l'animer plus tard. Les éléments s'empilent dans l'ordre où on les ajoute, chacun devant le précédent :

```ruby
def create_graphics
  @field = add_battleback_element(@path, 'field')
  @ground = add_battleback_element(@path, 'ground')
  @sky = add_battleback_element(@path, 'sky')
  @cloud1 = add_battleback_element(@path, 'cloud1')
  @cloud2 = add_battleback_element(@path, 'cloud2')
  @trees1 = add_battleback_element(@path, 'trees1')
  @trees2 = add_battleback_element(@path, 'trees2')
end
```

`add_battleback_element(path, name, x, y, z, zoom)` prend :

- `path` : le dossier, normalement `@path` (son `resource_path`).
- `name` : le nom de fichier de l'image, sans extension.
- `x`, `y` : la position, mesurée depuis le **centre du viewport**. Par défaut, ils placent le coin supérieur gauche d'une couche plein écran centrée, ce que veut la plupart des couches.
- `z` : la profondeur. `1` est à l'échelle, une valeur plus grande recule la couche (plus petite), et `0` est interdit.
- `zoom` : l'échelle, utilisée pour compenser le `z`.

## Animer le fond de combat

On surcharge `create_animations`, on appelle d'abord `super`, puis on ajoute des lecteurs `Yuki::Animation` dans `@animations` et on les démarre. Le fond met à jour `@animations` tout seul à chaque frame, donc on ne câble pas la boucle de mise à jour soi-même :

```ruby
def create_animations
  super
  start_x = -(Graphics.width / 2 + MARGIN_X)
  @animations << create_animation_cloud(@cloud1, start_x, Graphics.width / 2 + MARGIN_X, 60)
  @animations << create_animation_cloud(@cloud2, start_x, 2 * start_x, 60)
  @animations.each(&:start)
end
```

Ici, `create_animation_cloud` est un petit helper qui construit une animation de déplacement en boucle pour un sprite ; le `BattleBackGrass` fourni en contient le code complet. Construire les animations elles-mêmes relève du système d'animation de PSDK, qui est un sujet à part entière ; ce qui compte pour le fond de combat, c'est le contrat ci-dessus : on les crée et on les démarre dans `create_animations`, on les stocke dans `@animations`, et la classe les pilote.

## Enregistrer son fond de combat

Un fond de combat 3D est choisi par `Battle::Visual3D#create_background`, qui se base sur le `background_name` du combat. Dans le moteur actuel, cette méthode est un stub : tous les fonds aboutissent à `BattleBackGrass`. Pour utiliser sa propre classe pour un nom donné, on préfixe `create_background` par prepend et on retombe sur le défaut avec `super` :

```ruby
module Battle
  class Visual3D
    module ForestBackground
      def create_background
        if background_name == 'back_grass' # le nom auquel répond votre fond de combat
          @background = BattleUI::BattleBackForest.new(viewport, @scene)
        else
          super
        end
      end
    end
    prepend ForestBackground
  end
end
```

`viewport` et `@scene` sont tous deux disponibles sur le visual, donc l'appel au constructeur correspond à `Battleback3D#initialize(viewport, scene)`.

## Choisir un nom de fond

`background_name` est résolu à partir du combat : le fond de combat explicite défini sur la carte (la commande RPG Maker XP « Changer le fond de combat », ou un `BattleInfo`), sinon le type de zone de la carte. Les noms que PSDK connaît par défaut sont listés dans `Battle::Logic::BattleInfo::BACKGROUND_NAMES` :

- `back_building` (le défaut quand rien d'autre ne correspond)
- `back_grass`, `back_tall_grass`, `back_taller_grass`
- `back_cave`, `back_mount`, `back_sand`
- `back_pond`, `back_sea`, `back_under_water`
- `back_ice`, `back_snow`

Pour un fond ponctuel, comme un dresseur précis ou une rencontre légendaire, on définit une image de fond personnalisée avec la commande RPG Maker XP « Changer le fond de combat » avant le combat, puis on fait correspondre son nom dans `create_background`. Le nom est le nom de fichier de l'image sans son extension : choisir `battleback legendary arceus.png` fait que `background_name` vaut `'battleback legendary arceus'`.

## Jour, nuit, et limitations

- `add_battleback_element` remplace une image par une variante selon le moment de la journée quand elle existe. Avec le système jour/nuit actif, il cherche un suffixe `_morning`, `_day`, `_sunset` ou `_night` sur le nom de l'image et utilise ce fichier s'il est présent, sinon il retombe sur l'image simple. Livrer `field_night.png` à côté de `field.png` suffit donc à avoir une version de nuit.
- Les fonds `.gif` ne sont pas gérés avec la caméra 3D. Les gifs animés ne fonctionnent qu'avec le visual 2D classique ; avec la caméra 3D, on anime les sprites via `create_animations`.

## Conclusion

- On active la caméra 3D avec le réglage de projet `is_use_battle_camera_3d` ; les fonds deviennent alors des classes Ruby.
- On sous-classe `BattleUI::Battleback3D`, on définit `resource_path`, et on construit les couches dans `create_graphics` avec `add_battleback_element`.
- On anime les couches dans `create_animations` (appeler `super`, remplir `@animations`, les démarrer) ; la classe les met à jour à chaque frame.
- On enregistre la classe en préfixant `Battle::Visual3D#create_background` par prepend et en faisant correspondre le `background_name` du combat, avec un repli sur `super`.
- On étudie le `BattleBackGrass` fourni (`700 BattleBackForest3D.rb`) comme implémentation de référence.
