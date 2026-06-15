---
title: "Créer une transition de combat personnalisée"
slug: creer-une-transition-de-combat
sidebar_position: 2
description: "Ce guide explique comment les transitions de combat fonctionnent avec la caméra 3D : on écrit une classe de transition 2D et PSDK l'importe automatiquement dans la caméra 3D. Il couvre aussi la personnalisation du comportement 3D et la migration depuis les anciennes classes de transition 3D autonomes."
---

Ce guide explique comment les transitions de combat fonctionnent avec la caméra 3D : on écrit une classe de transition 2D et PSDK l'importe automatiquement dans la caméra 3D. Il couvre aussi la personnalisation du comportement 3D et la migration depuis les anciennes classes de transition 3D autonomes.

## On écrit une transition 2D, la caméra 3D est automatique

Le changement important à connaître : avec la caméra 3D, on n'écrit **pas** de classes de transition 3D séparées. Toute transition 2D enregistrée dans `Battle::Visual::WILD_TRANSITIONS` ou `TRAINER_TRANSITIONS` est automatiquement enveloppée en version 3D au chargement du moteur, par `Transition3D.from_2d`, qui y mélange le module `CameraHandling` :

```ruby
Visual::WILD_TRANSITIONS.each do |id, klass|
  next if WILD_TRANSITIONS_3D.key?(id)

  WILD_TRANSITIONS_3D[id] = Transition3D.from_2d(klass)
end
```

`CameraHandling` fournit gratuitement les extras 3D : positionnement de la caméra au début du combat, animations de shader des sprites, déplacement de la caméra pendant l'apparition des sprites, les séquences de lancer de Ball (1v1, 2v2, 3v3 et multi), la gestion des followers, et les animations d'envoi de l'ennemi et de fin de combat. Une seule transition 2D se joue donc correctement avec le visual classique comme avec la 3D, et la plupart des projets n'écrivent jamais de code spécifique à la 3D.

## Écrire la transition

Une transition est une sous-classe de `Battle::Visual::Transition::Base`. On surcharge les hooks dont on a besoin (on appelle `super` dans `create_all_sprites` pour conserver la capture d'écran du combat), puis on l'enregistre sous un id libre :

```ruby
module Battle
  class Visual
    module Transition
      class MyWild < Base
        private

        def create_all_sprites
          super # keep the screenshot sprite
          # build your transition sprites here
        end

        def create_sprite_move_animation
          # animate them into place
        end
      end
    end

    WILD_TRANSITIONS[100] = Transition::MyWild
    Visual.register_transition_resource(100, :artwork_full) # optional, defaults to :sprite
  end
end
```

- Les ids intégrés vont de `0` à `12` pour les combats sauvages et de `0` à `11` pour les combats de dresseur, donc on choisit un id libre au-dessus.
- Pour une transition de dresseur, on l'enregistre dans `TRAINER_TRANSITIONS`.
- `register_transition_resource(id, type)` définit la ressource utilisée par la transition : `:sprite` (le défaut), `:artwork_full` ou `:artwork_small`.
- La classe de base offre d'autres points de surcharge (`create_pre_transition_animation`, `create_fade_out_animation`, les animations d'envoi de l'ennemi et du joueur, et d'autres). Les transitions intégrées dans `5 Battle/02 Visual/2 Transition/` servent de référence pour ce que fait chacune.

C'est tout le travail : la transition se joue désormais en 2D comme en 3D.

### Utiliser sa transition

Un combat joue la transition dont l'id est stocké dans la variable de jeu `Yuki::Var::TrainerTransitionType`. On la définit avant le combat, avec la commande RPG Maker XP « Gestion des variables » ou dans un script, pour utiliser la sienne :

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 100
```

## Personnaliser le comportement 3D

Si les valeurs par défaut de `CameraHandling` ne conviennent pas à sa transition, on enregistre sa propre classe 3D. L'auto-import saute tout id déjà présent dans le hash 3D (`next if WILD_TRANSITIONS_3D.key?(id)`), donc son fichier doit se charger **avant** `501 Transition3D.rb`, le script qui lance l'import. On hérite de sa transition 2D, on inclut `CameraHandling`, et on ne surcharge que les méthodes 3D nécessaires :

```ruby
module Battle
  class Visual3D
    module Transition3D
      class MyWild3D < Battle::Visual::Transition::MyWild
        include CameraHandling

        def initialize(scene, screenshot, camera, camera_positionner)
          super(scene, screenshot)
          @camera = camera
          @camera_positionner = camera_positionner
          setup_camera_position
        end

        def create_sprite_move_animation
          # your custom camera work
        end
      end
    end

    WILD_TRANSITIONS_3D[100] = Transition3D::MyWild3D
  end
end
```

Cela reproduit ce que `from_2d` construit automatiquement, mais donne une classe nommée dont on peut surcharger les méthodes.

## Patcher une transition importée

Les classes auto-importées sont anonymes (construites par `from_2d`), donc on ne peut pas les référencer par leur nom. Pour en ajuster une après son import, on l'atteint via le hash et on `prepend` un module. Cela s'exécute **après** l'import, à l'inverse de la section précédente, donc le hash est déjà rempli :

```ruby
module MyCameraTweak
  def create_sprite_move_animation
    super
    # extra camera work
  end
end

Battle::Visual3D::WILD_TRANSITIONS_3D[0].prepend(MyCameraTweak)
```

Ici, `0` est la transition sauvage RBY intégrée.

## Migrer depuis les anciennes classes 3D

Avant le refactor du visual 3D, les transitions 3D étaient des classes autonomes dont on héritait. Elles **n'existent plus**, et tout héritage ou `prepend` qui les vise lève une `NameError` :

- `Battle::Visual3D::Transition3D::Trainer3D`
- `Battle::Visual3D::Transition3D::WildTransition`
- `Battle::Visual3D::Transition3D::RBYTrainer`

On les remplace par l'une des deux approches ci-dessus : écrire une simple transition 2D importée automatiquement, ou, pour un vrai comportement spécifique à la 3D, pré-enregistrer une classe `CameraHandling` dans le hash 3D.

## Conclusion

- Avec la caméra 3D, on écrit une **transition 2D** normale ; le moteur l'enveloppe en 3D automatiquement via `Transition3D.from_2d` et `CameraHandling`.
- On sous-classe `Battle::Visual::Transition::Base`, on surcharge les hooks, et on l'enregistre dans `WILD_TRANSITIONS` ou `TRAINER_TRANSITIONS` sous un id libre, puis on la sélectionne avec la variable de jeu `TrainerTransitionType`.
- Pour un comportement 3D personnalisé, on pré-enregistre une classe `CameraHandling` dans `WILD_TRANSITIONS_3D` **avant** le chargement de `501 Transition3D.rb`.
- Pour ajuster une transition déjà importée, on `prepend` un module sur sa classe via le hash, **après** l'import.
- Les anciennes classes de transition 3D autonomes ont disparu ; on utilise le modèle 2D-puis-import à la place.
