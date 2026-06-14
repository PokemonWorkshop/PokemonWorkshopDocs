---
title: "Comment créer un fond de combat pour la caméra 3D ?"
slug: creer-un-fond-de-combat-3d
sidebar_position: 1
description: "Ce guide explique comment construire un fond de combat pour la caméra de combat 3D dynamique de PSDK : une classe Ruby qui empile des couches de sprites, les anime, et est sélectionnée par le nom de fond du combat."
---

Ce guide explique comment construire un fond de combat pour la caméra de combat 3D dynamique de PSDK : une classe Ruby qui empile des couches de sprites, les anime, et est sélectionnée par le nom de fond du combat.

:::note
Ceci est un guide avancé. On suppose qu'on sait déjà ajouter un script personnalisé à son projet et écrire une petite classe Ruby. Il s'appuie sur la notion de fond de combat 2D classique, qui n'est qu'une image.
:::

## Activer la caméra 3D

La caméra de combat 3D dynamique est un réglage de projet, désactivé par défaut. Elle est exposée dans le code par `Battle::BATTLE_CAMERA_3D`, qui lit `Configs.settings.is_use_battle_camera_3d` (la clé `isUseBattleCamera3d` dans `Data/configs/settings_config.json`). On l'active dans les réglages de son projet.

Une fois activée, le combat utilise `Battle::Visual3D` à la place du `Battle::Visual` classique.

## Comment fonctionne un fond de combat 3D

Sans la caméra 3D, un fond de combat est une simple image plate. Une fois activée, le combat est une scène 3D que la caméra parcourt en se déplaçant et en s'inclinant : une image plate ne suffit donc plus, le fond est reconstruit en une **pile de couches de sprites**, le ciel loin derrière, le sol au milieu, les arbres devant, et la caméra se déplace à travers elles pour créer de la profondeur.

Chaque fond de combat est donc une petite classe Ruby, une sous-classe de `BattleUI::Battleback3D`, qui fait jusqu'à trois choses :

- déclarer où vivent ses images, via `resource_path`,
- empiler ses couches de sprites, dans `create_graphics` avec `add_battleback_element`,
- et, en option, les animer dans `create_animations`.

Le moteur fournit un exemple à étudier, `BattleUI::BattleBackGrass`, dans `5 Battle/01 Scene/0 BattleUI/700 BattleBackForest3D.rb`. Ce guide construit la même structure, étape par étape.

## Placer les ressources

On place ses images dans le dossier `graphics/battlebacks/` de son projet. On garde un sous-dossier par fond de combat, ici `graphics/battlebacks/animated_camera/BattleBack Forest/`. Cela reste gérable une fois qu'un projet en compte des dizaines.

## Un fond de combat minimal

On commence par le plus petit fond possible : une seule couche plein écran. On sous-classe `Battleback3D`, on pointe `resource_path` vers son sous-dossier (relatif à `graphics/battlebacks/`), et on ajoute un élément dans `create_graphics` :

```ruby
module BattleUI
  class BattleBackForest < Battleback3D
    def resource_path
      'animated_camera/BattleBack Forest/'
    end

    def create_graphics
      @field = add_battleback_element(@path, 'field')
    end
  end
end
```

`add_battleback_element(@path, 'field')` charge `field.png` depuis son dossier comme une couche plein écran. On n'appelle jamais `create_graphics` soi-même : la classe de base l'exécute à la création du fond. (Si le fond a besoin de la scène de combat, on la stocke avec `@scene = scene` dans son propre `initialize` qui appelle `super` ; la classe de base ne la conserve pas.)

Cette classe existe mais aucun combat ne l'utilise encore. L'étape suivante la branche.

## L'afficher dans un combat

Un fond de combat 3D est choisi par `Battle::Visual3D#create_background`, à partir du `background_name` du combat. Par défaut, la caméra 3D utilise le fond d'herbe intégré pour tous les combats ; donc pour afficher le sien, on préfixe `create_background` par prepend et on retourne sa classe pour le nom voulu, avec un repli sur le défaut via `super` :

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

On lance un combat sur de l'herbe et son fond à une couche apparaît. À partir de là, on ajoute profondeur et mouvement à la même classe.

## Ajouter des couches

Un fond convaincant empile plusieurs couches. On les ajoute dans `create_graphics`, de l'arrière vers l'avant : chaque nouvel élément se place devant le précédent. On stocke chaque sprite dans une variable d'instance pour pouvoir l'animer plus tard :

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
- `x`, `y` : la position, mesurée depuis le centre de la zone visible. Par défaut, ils placent une couche plein écran centrée, ce que veut la plupart des couches.
- `z` : à quelle distance la couche se situe en arrière. `1` est à l'échelle, une valeur plus grande la recule et la rapetisse, et `0` est interdit.
- `zoom` : l'échelle, utilisée pour compenser le `z`.

Seuls `path` et `name` sont obligatoires ; le reste a des valeurs par défaut raisonnables.

## Animer les couches

Pour faire bouger une couche, comme des nuages qui défilent, on surcharge `create_animations`. On appelle d'abord `super`, on ajoute des lecteurs `Yuki::Animation` dans `@animations`, et on les démarre. Le fond met à jour `@animations` tout seul à chaque frame, donc on ne câble pas la boucle de mise à jour soi-même :

```ruby
def create_animations
  super
  start_x = -(Graphics.width / 2 + MARGIN_X)
  @animations << create_animation_cloud(@cloud1, start_x, Graphics.width / 2 + MARGIN_X, 60)
  @animations << create_animation_cloud(@cloud2, start_x, 2 * start_x, 60)
  @animations.each(&:start)
end
```

Ici, `create_animation_cloud` est un petit helper qui construit une animation de déplacement en boucle pour un sprite ; le `BattleBackGrass` fourni en contient le code complet. Construire les animations elles-mêmes relève du système d'animation de PSDK, un sujet à part entière. Ce qui compte pour le fond de combat, c'est le contrat ci-dessus : on crée et on démarre les animations dans `create_animations`, on les garde dans `@animations`, et la classe les pilote.

## Choisir un nom de fond

`background_name` est résolu à partir du combat : le fond de combat explicite défini sur la carte (la commande RPG Maker XP « Changer le fond de combat », ou un `BattleInfo`), sinon le type de zone de la carte. Les noms que PSDK connaît par défaut sont listés dans `Battle::Logic::BattleInfo::BACKGROUND_NAMES` :

- `back_building` (le défaut quand rien d'autre ne correspond)
- `back_grass`, `back_tall_grass`, `back_taller_grass`
- `back_cave`, `back_mount`, `back_sand`
- `back_pond`, `back_sea`, `back_under_water`
- `back_ice`, `back_snow`

Pour un fond ponctuel, comme un dresseur précis ou une rencontre légendaire, on définit une image de fond personnalisée avec la commande « Changer le fond de combat » avant le combat, puis on fait correspondre son nom dans `create_background`. Le nom est le nom de fichier de l'image sans son extension : choisir `battleback legendary arceus.png` fait que `background_name` vaut `'battleback legendary arceus'`.

## Jour, nuit, et limitations

- `add_battleback_element` remplace une image par une variante selon le moment de la journée quand elle existe. Avec le système jour/nuit actif, il cherche un suffixe `_morning`, `_day`, `_sunset` ou `_night` sur le nom de l'image et utilise ce fichier s'il est présent, sinon l'image simple. Livrer `field_night.png` à côté de `field.png` suffit donc à avoir une version de nuit.
- Les fonds `.gif` ne sont pas gérés avec la caméra 3D. Les gifs animés ne fonctionnent qu'avec le visual 2D classique ; avec la caméra 3D, on anime les sprites via `create_animations`.

## Conclusion

- On active la caméra 3D avec le réglage de projet `is_use_battle_camera_3d` ; les fonds deviennent alors des classes Ruby.
- On commence minimal : sous-classer `BattleUI::Battleback3D`, définir `resource_path`, ajouter une couche dans `create_graphics`, et l'enregistrer en préfixant `Battle::Visual3D#create_background` par prepend.
- On ajoute de la profondeur en empilant d'autres couches avec `add_battleback_element`, de l'arrière vers l'avant.
- On ajoute du mouvement dans `create_animations` (appeler `super`, remplir `@animations`, les démarrer) ; la classe les met à jour à chaque frame.
- On étudie le `BattleBackGrass` fourni (`700 BattleBackForest3D.rb`) comme implémentation de référence.
