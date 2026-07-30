---
title: "Create a battleback for the 3D camera"
slug: how-to-create-a-3d-battleback
sidebar_position: 1
description: "This guide explains how to build a battleback for PSDK's dynamic 3D battle camera: a Ruby class that stacks sprite layers, animates them, and is selected by the battle's background name."
---

This guide explains how to build a battleback for PSDK's dynamic 3D battle camera: a Ruby class that stacks sprite layers, animates them, and is selected by the battle's background name.

:::note
This is an advanced guide. You should already be comfortable adding a custom script to your project and writing a small Ruby class. It builds on the idea of a regular 2D battleback, which is just an image.
:::

## Enabling the 3D camera

The dynamic 3D battle camera is a project setting, off by default. It is exposed in code as `Battle::BATTLE_CAMERA_3D`, which reads `Configs.settings.is_use_battle_camera_3d` (the `isUseBattleCamera3d` key in `Data/configs/settings_config.json`). Turn it on in your project settings.

With it on, the battle uses `Battle::Visual3D` instead of the flat `Battle::Visual`.

## How a 3D battleback works

Without the 3D camera, a battleback is a single flat image. With it on, the battle is a 3D scene the camera pans and tilts through, so one flat image no longer works: the background is rebuilt as a **stack of sprite layers**, the sky far back, the ground in the middle, the trees up front, and the camera moves through them to create depth.

Each battleback is therefore a small Ruby class, a subclass of `BattleUI::Battleback3D`, that does up to three things:

- declares where its images live, through `resource_path`,
- stacks its sprite layers, in `create_graphics` with `add_battleback_element`,
- and, optionally, animates them in `create_animations`.

The engine ships one example to study, `BattleUI::BattleBackGrass`, in `5 Battle/01 Scene/0 BattleUI/700 BattleBackForest3D.rb`. This guide builds up to the same shape, one step at a time.

## Placing the resources

Put your images under your project's `graphics/battlebacks/` folder. Keep one subfolder per battleback, here `graphics/battlebacks/animated_camera/BattleBack Forest/`. That stays manageable once a project has dozens of them.

## A minimal battleback

Start with the smallest possible battleback: a single full-screen layer. Subclass `Battleback3D`, point `resource_path` at your subfolder (relative to `graphics/battlebacks/`), and add one element in `create_graphics`:

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

`add_battleback_element(@path, 'field')` loads `field.png` from your folder as a full-screen layer. You never call `create_graphics` yourself: the base class runs it when the battleback is created. (If your battleback needs the battle scene, store it with `@scene = scene` in your own `initialize` that calls `super`; the base class does not keep it.)

This class exists but no battle uses it yet. The next step wires it in.

## Showing it in a battle

A 3D battleback is chosen by `Battle::Visual3D#create_background`, from the battle's `background_name`. By default the 3D camera uses the built-in grass background for every battle, so to show yours, prepend `create_background` and return your class for the name you want, falling back to the default with `super`:

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

Start a battle on grass and your single-layer battleback appears. From here, you add depth and motion to the same class.

## Adding layers

A convincing battleback stacks several layers. Add them in `create_graphics`, back to front: each new element sits in front of the previous one. Store each sprite in an instance variable so you can animate it later:

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
- `x`, `y`: the position, measured from the center of the visible area. They default to a centered full-screen layer, which is what most layers want.
- `z`: how far back the layer sits. `1` is full scale, a higher value pushes it further away and smaller, and `0` is not allowed.
- `zoom`: the scale, used to compensate for `z`.

Only `path` and `name` are required; the rest have sensible defaults.

## Animating the layers

To make a layer move, such as drifting clouds, override `create_animations`. Call `super` first, push `Yuki::Animation` players into `@animations`, and start them. The battleback updates `@animations` on its own every frame, so you do not wire the update loop yourself:

```ruby
def create_animations
  super
  start_x = -(Graphics.width / 2 + MARGIN_X)
  @animations << create_animation_cloud(@cloud1, start_x, Graphics.width / 2 + MARGIN_X, 60)
  @animations << create_animation_cloud(@cloud2, start_x, 2 * start_x, 60)
  @animations.each(&:start)
end
```

`create_animation_cloud` here is a small helper that builds a looping move animation for one sprite; the shipped `BattleBackGrass` contains its full code. Building the animations themselves belongs to PSDK's animation system, a topic of its own. What matters for the battleback is the contract above: create and start the animations in `create_animations`, keep them in `@animations`, and the class drives them.

## Choosing a background name

`background_name` is resolved from the battle: the explicit battleback set on the map (the RPG Maker XP "Change Battle Back" command, or a `BattleInfo`), otherwise the map's zone type. The names PSDK knows by default are listed in `Battle::Logic::BattleInfo::BACKGROUND_NAMES`:

- `back_building` (the default when nothing else matches)
- `back_grass`, `back_tall_grass`, `back_taller_grass`
- `back_cave`, `back_mount`, `back_sand`
- `back_pond`, `back_sea`, `back_under_water`
- `back_ice`, `back_snow`

For a one-off battleback, such as a specific trainer or a legendary encounter, set a custom battleback image with the "Change Battle Back" command before the battle, then match its name in `create_background`. The name is the image filename without its extension: choosing `battleback legendary arceus.png` makes `background_name` equal to `'battleback legendary arceus'`.

## Day and night, and limitations

- `add_battleback_element` swaps an image for a time-of-day variant when one exists. With the day and night system active, it looks for a `_morning`, `_day`, `_sunset` or `_night` suffix on the image name and uses that file if it is present, otherwise the plain image. So shipping `field_night.png` next to `field.png` is enough to get a night version.
- `.gif` battlebacks are not handled under the 3D camera. Animated gifs only work with the flat 2D visual; under the 3D camera, animate sprites through `create_animations` instead.

## Conclusion

- Enable the 3D camera with the `is_use_battle_camera_3d` project setting; battlebacks then become Ruby classes.
- Start minimal: subclass `BattleUI::Battleback3D`, set `resource_path`, add one layer in `create_graphics`, and register it by prepending `Battle::Visual3D#create_background`.
- Add depth by stacking more layers with `add_battleback_element`, back to front.
- Add motion in `create_animations` (call `super`, fill `@animations`, start them); the class updates them each frame.
- Study the shipped `BattleBackGrass` (`700 BattleBackForest3D.rb`) as the reference implementation.
