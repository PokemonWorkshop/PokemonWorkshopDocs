---
title: "How to customize GenericBase in PSDK?"
slug: customize-genericbase
sidebar_position: 9
description: "This guide explains how to customize the appearance of scenes that inherit from GenericBase: background, button bar and ctrl buttons."
---

This guide explains how to customize the appearance of scenes that inherit from GenericBase: background, button bar and ctrl buttons. It uses the Mystery Gift plugin as a concrete example. It assumes guides 001 to 003 have been read (the reader has a working scene with GenericBase).

## Principle

GenericBase is the foundation of every UI scene -- it provides the background, button bar, ctrl buttons and win_text. Never rebuild these elements from scratch: always subclass GenericBase and override its private methods.

GenericBase uses the Template Method pattern: hardcoded values are extracted into private methods you can override. For ControlButton customization, use inheritance (subclass) rather than `prepend` -- prepend is global and affects all scenes in the game.

## Overridable methods

| Need                                 | Class                  | Method to override            | Default value               |
| ------------------------------------ | ---------------------- | ----------------------------- | --------------------------- |
| Different background                 | GenericBase subclass   | `background_filename`         | `'team/Fond'`               |
| Different button bar                 | GenericBase subclass   | `button_background_filename`  | `'tcard/button_background'` |
| No background animation              | GenericBase subclass   | `create_background_animation` | Scrolling animation         |
| Custom ctrl button class             | GenericBase subclass   | `control_button_class`        | `ControlButton`             |
| Different hidden buttons on win_text | GenericBase subclass   | `hidden_button_indexes`       | 0..2                        |
| Different button texture             | ControlButton subclass | `button_texture`              | `'buttons'`                 |
| Different button text layout         | ControlButton subclass | `text_rect`                   | `[17, 3, 51, 13]`           |
| Different key icon position          | ControlButton subclass | `key_button_position`         | `[0, 1]`                    |
| Different text color                 | ControlButton subclass | `text_color(index)`           | 20 or 21                    |
| Different font                       | ControlButton subclass | `text_font`                   | 20                          |

## Full example: Mystery Gift

The Mystery Gift plugin customizes the background, button bar and ctrl button texture. Everything is grouped into a single GenericBase subclass.

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

- `MysteryGiftBase` inherits from `GenericBase` -- all base behavior (bar, ctrl buttons, win_text) is preserved.
- `background_filename` and `button_background_filename` return the plugin-specific image names.
- `create_background_animation` is overridden as an empty method (no-op) to disable the background scrolling effect.
- `control_button_class` returns the nested `ControlButton` subclass -- `create_control_button` (inherited) uses it automatically to instantiate buttons. No need to rewrite `create_control_button`.
- The `ControlButton` class is defined as a subclass of `GenericBase::ControlButton` -- it inherits all behavior (pressed state, key display, text) and only overrides `button_texture`.
- `control_button_default_cache` returns `:interface` to load textures from `graphics/interface/` instead of `graphics/pokedex/`. This keeps all plugin assets in the same location. No need to override `initialize` on ControlButton.
- The texture must follow the same spritesheet format: 2x2 grid (col 0 = A/X/Y, col 1 = B, row 0 = normal, row 1 = pressed), separated by 1px transparent.

## Why inheritance and not prepend for ControlButton

`prepend` inserts a module into the lookup chain of the original class -- it affects ALL ControlButtons in the game, across every scene. If a plugin uses `prepend` to change button texture, the team, PC and every other scene's buttons change too.

Inheritance (nested subclass) only affects the scene that instantiates that subclass. The Mystery Gift plugin instantiates `ControlButton` (its local subclass) in `create_control_button` -- other scenes continue using `GenericBase::ControlButton` unaffected.

## GenericBaseMultiMode

```ruby
# Create base UI with multiple button configurations
texts = [
  [scene_text(0), nil, nil, scene_text(1)],       # mode 0: Confirm + Back
  [scene_text(2), scene_text(3), nil, scene_text(1)]  # mode 1: Edit + Delete + Back
]
keys = [
  %i[A X Y B],
  %i[A X Y B]
]
@base_ui = UI::GenericBaseMultiMode.new(@viewport, texts, keys)

# Switch mode later
@base_ui.mode = 1  # changes to Edit + Delete + Back
```

- Use GenericBaseMultiMode when different scene states need different button labels.
- All button configurations are passed at construction via the `texts` and `keys` arrays.
- Switch mode with `mode=` -- the ctrl button labels update automatically.
- The `keys` array defines which key icons are displayed in each mode.

## Conclusion

- Always subclass GenericBase for custom backgrounds and button bars -- override `background_filename`, `button_background_filename` and `create_background_animation`.
- Use inheritance (nested subclass of `GenericBase::ControlButton`) to customize button textures -- never `prepend`, which is global and affects all scenes.
- Override `control_button_class` to return the local ControlButton subclass -- no need to rewrite `create_control_button`.
- Custom button textures must follow the 2x2 spritesheet format (A/X/Y column, B column, normal row, pressed row).
- Use GenericBaseMultiMode when the scene needs different button labels for different states.
