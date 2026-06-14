---
title: "How to create a custom battle transition?"
slug: how-to-create-a-battle-transition
sidebar_position: 2
description: "This guide explains how battle transitions work with the 3D camera: you write a 2D transition class and PSDK imports it into the 3D camera automatically. It also covers customizing the 3D behavior and migrating from the old standalone 3D transition classes."
---

This guide explains how battle transitions work with the 3D camera: you write a 2D transition class and PSDK imports it into the 3D camera automatically. It also covers customizing the 3D behavior and migrating from the old standalone 3D transition classes.

## You write a 2D transition, the 3D camera is automatic

The important shift to know: under the 3D camera you do **not** write separate 3D transition classes. Every 2D transition registered in `Battle::Visual::WILD_TRANSITIONS` or `TRAINER_TRANSITIONS` is automatically wrapped into a 3D version when the engine loads, by `Transition3D.from_2d`, which mixes in the `CameraHandling` module:

```ruby
Visual::WILD_TRANSITIONS.each do |id, klass|
  next if WILD_TRANSITIONS_3D.key?(id)

  WILD_TRANSITIONS_3D[id] = Transition3D.from_2d(klass)
end
```

`CameraHandling` supplies the 3D extras for free: camera positioning at battle start, sprite shader animations, camera movement during the sprite reveal, the ball-throw sequences (1v1, 2v2, 3v3 and multi), follower handling, and the enemy-send and battle-end animations. So a single 2D transition plays correctly in both the flat and the 3D visual, and most projects never write any 3D-specific code.

## Writing the transition

A transition is a subclass of `Battle::Visual::Transition::Base`. Override the hooks you need (call `super` in `create_all_sprites` to keep the battle screenshot), then register it under a free id:

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

- The built-in ids run `0` to `12` for wild battles and `0` to `11` for trainer battles, so pick a free id above those.
- For a trainer transition, register it in `TRAINER_TRANSITIONS` instead.
- `register_transition_resource(id, type)` sets which resource the transition uses: `:sprite` (the default), `:artwork_full`, or `:artwork_small`.
- The base class offers more override points (`create_pre_transition_animation`, `create_fade_out_animation`, the enemy-send and player-send animations, and others). The built-in transitions in `5 Battle/02 Visual/2 Transition/` are the reference for what each does.

That is the whole job: the transition now plays in both 2D and 3D.

### Using your transition

A battle plays the transition whose id is stored in the `Yuki::Var::TrainerTransitionType` game variable. Set it before the battle, with the RPG Maker XP "Control Variables" command or in a script, to use yours:

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 100
```

## Customizing the 3D behavior

If `CameraHandling`'s defaults do not fit your transition, register your own 3D class. The auto-import skips any id already present in the 3D hash (`next if WILD_TRANSITIONS_3D.key?(id)`), so your file must load **before** `501 Transition3D.rb`, the script that runs the import. Inherit your 2D transition, include `CameraHandling`, and override only the 3D methods you need:

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

This mirrors what `from_2d` builds automatically, but gives you a named class whose methods you can override.

## Patching an imported transition

The auto-imported classes are anonymous (built by `from_2d`), so you cannot reference them by name. To tweak one after it has been imported, reach it through the hash and `prepend` a module. This runs **after** the import, the opposite of the previous section, so the hash is already populated:

```ruby
module MyCameraTweak
  def create_sprite_move_animation
    super
    # extra camera work
  end
end

Battle::Visual3D::WILD_TRANSITIONS_3D[0].prepend(MyCameraTweak)
```

Here `0` is the built-in RBY wild transition.

## Migrating from the old 3D classes

Before the 3D visual refactor, 3D transitions were standalone classes you inherited. They **no longer exist**, and any inheritance or `prepend` that targets them raises `NameError`:

- `Battle::Visual3D::Transition3D::Trainer3D`
- `Battle::Visual3D::Transition3D::WildTransition`
- `Battle::Visual3D::Transition3D::RBYTrainer`

Replace them with one of the two approaches above: write a plain 2D transition that is imported automatically, or, for genuine 3D-specific behavior, pre-register a `CameraHandling` class in the 3D hash.

## Conclusion

- Under the 3D camera you write a normal **2D transition**; the engine wraps it into 3D automatically through `Transition3D.from_2d` and `CameraHandling`.
- Subclass `Battle::Visual::Transition::Base`, override the hooks, and register it in `WILD_TRANSITIONS` or `TRAINER_TRANSITIONS` under a free id, then select it with the `TrainerTransitionType` game variable.
- For custom 3D behavior, pre-register a `CameraHandling` class in `WILD_TRANSITIONS_3D` **before** `501 Transition3D.rb` loads.
- To tweak an already-imported transition, `prepend` a module onto its class through the hash, **after** the import.
- The old standalone 3D transition classes are gone; use the 2D-plus-import model instead.
