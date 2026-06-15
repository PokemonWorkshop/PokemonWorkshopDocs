---
title: "Customize GenericBase"
slug: customize-genericbase
sidebar_position: 10
description: "This guide finishes the base UI: customizing the background, button bar and ctrl buttons by subclassing GenericBase."
---

This guide builds on the whole series: you have a fully working Mystery Gift scene. Back in the [scene guide](./01-ui-scene.md) we wrote a minimal `MysteryGiftBase` that only changed the background. Here we finish it -- a themed button bar and ctrl buttons -- which is the last change to the scene.

## Principle

`GenericBase` is the foundation of every UI scene: background, button bar, ctrl buttons and `win_text`. Never rebuild these from scratch -- subclass `GenericBase` and override its private methods. It uses the Template Method pattern: hardcoded values are extracted into private methods you can override.

For the ctrl buttons, use **inheritance** (a nested subclass), never `prepend`: `prepend` is global and would change the buttons of every scene in the game.

## Overridable methods

| Need                                 | Class                  | Method to override            | Default value               |
| ------------------------------------ | ---------------------- | ----------------------------- | --------------------------- |
| Different background                 | GenericBase subclass   | `background_filename`         | `'team/Fond'`               |
| Different button bar                 | GenericBase subclass   | `button_background_filename`  | `'tcard/button_background'` |
| No background animation              | GenericBase subclass   | `create_background_animation` | Scrolling animation         |
| Custom ctrl button class             | GenericBase subclass   | `control_button_class`        | `ControlButton`             |
| Different button texture             | ControlButton subclass | `button_texture`              | `'buttons'`                 |

## Finishing MysteryGiftBase

Update `scripts/20 MysteryGift/003 GamePlay/000 Base.rb` to its full version:

```ruby
module UI
  # Custom base UI for the Mystery Gift scene
  class MysteryGiftBase < GenericBase
    private

    # Return the background filename
    # @return [String]
    def background_filename
      return 'mystery_gift/background'
    end

    # Return the button background filename
    # @return [String]
    def button_background_filename
      return 'mystery_gift/button_background'
    end

    # Return the class used to create control buttons
    # @return [Class]
    def control_button_class
      return ControlButton
    end

    # Disable the background scroll animation
    def create_background_animation; end

    # Return the default cache used by control buttons
    # @return [Symbol]
    def control_button_default_cache
      return :interface
    end

    # Custom control button with mystery gift theme
    class ControlButton < GenericBase::ControlButton
      private

      # Use the mystery gift button texture
      # @return [String]
      def button_texture
        return 'mystery_gift/buttons'
      end
    end
  end
end
```

- `background_filename` and `create_background_animation` were there from the scene guide; we add the rest now.
- `button_background_filename` returns the themed bottom bar (`graphics/interface/mystery_gift/button_background.png`).
- `control_button_class` returns the nested `ControlButton` subclass; the inherited `create_control_button` uses it automatically -- no need to rewrite button creation.
- The nested `ControlButton` subclasses `GenericBase::ControlButton` and only overrides `button_texture` to use `mystery_gift/buttons`. It inherits everything else (pressed state, key icon, label).
- `control_button_default_cache` returns `:interface` so the button texture loads from `graphics/interface/` like the rest of our assets, instead of the default `pokedex` cache. No need to override `initialize`.
- The `buttons` texture follows the 2×2 spritesheet format described in the setup guide (A/X/Y column, B column; normal row, pressed row; 1px transparent separators).

## Why inheritance, not prepend

`prepend` inserts a module into the lookup chain of the original class -- it affects **all** ControlButtons in the game, in every scene. A nested subclass only affects the scene that instantiates it: Mystery Gift creates its local `ControlButton`, while the team, the PC and every other scene keep `GenericBase::ControlButton` untouched.

## GenericBaseMultiMode

When different scene states need different button labels, use `GenericBaseMultiMode` instead of `GenericBase`:

```ruby
texts = [
  [scene_text(0), nil, nil, scene_text(1)],          # mode 0: Confirm + Back
  [scene_text(2), scene_text(3), nil, scene_text(1)] # mode 1: Edit + Delete + Back
]
keys = [%i[A X Y B], %i[A X Y B]]
@base_ui = UI::GenericBaseMultiMode.new(@viewport, texts, keys)

@base_ui.mode = 1  # switch to Edit + Delete + Back
```

- All button configurations are passed at construction; switch with `mode=` and the labels update. Mystery Gift does not need it (its buttons never change), but it is the tool to reach for when they do.

## Try it

Open the scene one last time:

```ruby
GamePlay.open_mystery_gift
```

The bottom bar and the A/B buttons now use the Mystery Gift theme. The scene is complete: browse claimed gifts with the keyboard or mouse, enter a code with A, and watch the banner on a successful claim.

## Conclusion

- Always subclass `GenericBase` for a custom background and button bar -- override `background_filename`, `button_background_filename`, `create_background_animation`.
- Customize button textures with a **nested subclass** of `GenericBase::ControlButton` -- never `prepend`, which is global.
- Override `control_button_class` to return your subclass; no need to rewrite `create_control_button`.
- Custom button textures follow the 2×2 spritesheet format.
- Use `GenericBaseMultiMode` when a scene needs different button labels per state.
