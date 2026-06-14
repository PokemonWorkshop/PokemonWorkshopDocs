---
title: "How to create a battleback for the 3D camera?"
slug: how-to-create-a-3d-battleback
sidebar_position: 1
description: "This guide explains how to build a battleback for PSDK's dynamic 3D battle camera: a Ruby class that assembles its sprites, animates them, and is selected by the battle's background name."
---

This guide explains how to build a battleback for PSDK's dynamic 3D battle camera: a Ruby class that assembles its sprites, animates them, and is selected by the battle's background name.

## Enabling the 3D camera

The dynamic 3D battle camera is a project setting, off by default. It is exposed in code as `Battle::BATTLE_CAMERA_3D`, which reads `Configs.settings.is_use_battle_camera_3d` (the `isUseBattleCamera3d` key in `Data/configs/settings_config.json`). Turn it on in your project settings.

With it on, the battle uses `Battle::Visual3D` instead of the flat `Battle::Visual`, and battlebacks are no longer plain images: each one becomes a Ruby class you build the way this guide describes.

## How a 3D battleback works

Under the 3D camera, a battleback is a subclass of `BattleUI::Battleback3D`. It does three things:

- declares where its images live, through `resource_path`,
- assembles its sprites, in `create_graphics` with `add_battleback_element`,
- and, optionally, animates them in `create_animations`.

The engine ships one example to study, `BattleUI::BattleBackGrass`, in `5 Battle/01 Scene/0 BattleUI/700 BattleBackForest3D.rb`. This guide follows the same shape.

## Placing the resources

Put your images under your project's `graphics/battlebacks/` folder. The shipped example keeps one subfolder per battleback, here `graphics/battlebacks/animated_camera/BattleBack Forest/`. One subfolder per battleback keeps things manageable once a project has dozens of them.

## Creating the battleback class

Subclass `BattleUI::Battleback3D` and point `resource_path` at your subfolder (relative to `graphics/battlebacks/`):

```ruby
module BattleUI
  class BattleBackForest < Battleback3D
    def resource_path
      'animated_camera/BattleBack Forest/'
    end
  end
end
```

The base `initialize(viewport, scene)` already calls `create_graphics` for you, so you only override `initialize` if you need extra setup. Note that the base class does not keep the `scene`: if your battleback needs it, store it yourself with `@scene = scene` in your own `initialize` (calling `super`).

## Assembling the sprites

Build the layers in `create_graphics` with `add_battleback_element`, and store each returned sprite in an instance variable so you can animate it later. Elements stack in the order you add them, each in front of the previous one:

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

`add_battleback_element(path, name, x, y, z, zoom)` takes:

- `path`: the folder, normally `@path` (your `resource_path`).
- `name`: the image filename, without extension.
- `x`, `y`: the position, measured from the **viewport center**. They default to the top-left corner of a centered, full-screen layer, which is what most layers want.
- `z`: the depth. `1` is full scale, a higher value pushes the layer back (smaller), and `0` is not allowed.
- `zoom`: the scale, used to compensate for `z`.

## Animating the battleback

Override `create_animations`, call `super` first, then push `Yuki::Animation` players into `@animations` and start them. The battleback updates `@animations` on its own every frame, so you do not wire the update loop yourself:

```ruby
def create_animations
  super
  start_x = -(Graphics.width / 2 + MARGIN_X)
  @animations << create_animation_cloud(@cloud1, start_x, Graphics.width / 2 + MARGIN_X, 60)
  @animations << create_animation_cloud(@cloud2, start_x, 2 * start_x, 60)
  @animations.each(&:start)
end
```

Here `create_animation_cloud` is a small helper that builds a looping move animation for a sprite; the shipped `BattleBackGrass` contains its full code. Building the animations themselves belongs to PSDK's animation system, which is a topic of its own; what matters for the battleback is the contract above: create and start them in `create_animations`, store them in `@animations`, and the class drives them.

## Registering your battleback

A 3D battleback is chosen by `Battle::Visual3D#create_background`, which matches the battle's `background_name`. In the current engine this method is a stub: every background resolves to `BattleBackGrass`. To use your own class for a given name, prepend `create_background` and fall back to the default with `super`:

```ruby
module Battle
  class Visual3D
    module ForestBackground
      def create_background
        if background_name == 'back_grass' # the name your battleback answers to
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

`viewport` and `@scene` are both available on the visual, so the constructor call matches `Battleback3D#initialize(viewport, scene)`.

## Choosing a background name

`background_name` is resolved from the battle: the explicit battleback set on the map (the RMXP "Change Battle Back" command, or a `BattleInfo`), otherwise the map's zone type. The names PSDK knows by default are listed in `Battle::Logic::BattleInfo::BACKGROUND_NAMES`:

- `back_building` (the default when nothing else matches)
- `back_grass`, `back_tall_grass`, `back_taller_grass`
- `back_cave`, `back_mount`, `back_sand`
- `back_pond`, `back_sea`, `back_under_water`
- `back_ice`, `back_snow`

For a one-off battleback, such as a specific trainer or a legendary encounter, set a custom battleback image with the RMXP "Change Battle Back" command before the battle, then match its name in `create_background`. The name is the image filename without its extension: choosing `battleback legendary arceus.png` makes `background_name` equal to `'battleback legendary arceus'`.

## Day and night, and limitations

- `add_battleback_element` swaps an image for a time-of-day variant when one exists. With the day and night system active, it looks for a `_morning`, `_day`, `_sunset` or `_night` suffix on the image name and uses that file if it is present, falling back to the plain image otherwise. So shipping `field_night.png` next to `field.png` is enough to get a night version.
- `.gif` battlebacks are not handled under the 3D camera. Animated gifs only work with the flat 2D visual; under the 3D camera, animate sprites through `create_animations` instead.

## Conclusion

- Enable the 3D camera with the `is_use_battle_camera_3d` project setting; battlebacks then become Ruby classes.
- Subclass `BattleUI::Battleback3D`, set `resource_path`, and build the layers in `create_graphics` with `add_battleback_element`.
- Animate the layers in `create_animations` (call `super`, fill `@animations`, start them); the class updates them each frame.
- Register the class by prepending `Battle::Visual3D#create_background` and matching the battle's `background_name`, falling back to `super`.
- Study the shipped `BattleBackGrass` (`700 BattleBackForest3D.rb`) as the reference implementation.
