---
title: "How to create a Composition in PSDK?"
slug: create-a-composition
sidebar_position: 2
description: "This guide explains how to create a Composition, the central UI class that groups all visual components of a scene."
---

This guide explains how to create a Composition, the central UI class that groups all visual components of a scene. It builds on guide 001: the reader already has a minimal working Mystery Gift scene.

## Principle

The Composition is the class that orchestrates **all** visual rendering of a scene. It follows precise rules:

- It extends `SpriteStack` and is named `UI::X::Composition`.
- It is the **only point of contact** between the GamePlay scene and the UI layer.
- The scene delegates all UI creation and updates to the Composition.
- It must always expose `update()` and `done?()` methods so the scene framework can drive it.

## Constants module

Before creating the Composition, define the UI module constants. They centralize text identifiers, dimensions, and positions used by all UI files.

```ruby
module UI
  # UI module for the Mystery Gift scene
  module MysteryGift
    # CSV file ID for i18n text
    TEXT_FILE_ID = 311_125
    # Text IDs
    TEXT_ENTER_CODE = 0
    TEXT_QUIT = 1
    TEXT_TITLE = 2

    # Layout constants (320x240 resolution)
    HEADER_Y = 0
    FRAME_X = 8
    FRAME_Y = 22
    FRAME_WIDTH = 304
    FRAME_HEIGHT = 188
  end
end
```

- `TEXT_FILE_ID` is the identifier of the CSV file containing the scene's translated texts, used with `ext_text`.
- `TEXT_ENTER_CODE`, `TEXT_QUIT`, `TEXT_TITLE` are the row indexes in that CSV. Naming indexes instead of using raw numbers makes the code readable and maintainable.
- The layout constants (`HEADER_Y`, `FRAME_X`, etc.) centralize positions and dimensions. If the resolution changes, you modify a single place.
- These constants are placed in the `UI::MysteryGift` module. The Composition, declared inside this module, accesses them directly. The GamePlay scene accesses them via `include UI::MysteryGift`.

## Basic Composition

The Composition extends `SpriteStack` and receives the viewport as a parameter. It creates visual elements in its constructor and exposes the methods required by the framework.

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      def initialize(viewport)
        super(viewport, 0, 0, default_cache: :interface)
        create_header
        create_frame
      end

      # Update the composition each frame
      def update; end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return true
      end

      private

      # Create the header bar and title
      def create_header
        @header = add_sprite(0, HEADER_Y, 'mystery_gift/header')
        @header.set_z(2)
        @title = add_text(0, 0, 320, 14, ext_text(TEXT_FILE_ID, TEXT_TITLE), 1, nil, color: 10)
        @title.z = 3
      end

      # Create the main content frame
      def create_frame
        @frame = add_sprite(FRAME_X, FRAME_Y, 'mystery_gift/frame')
      end
    end
  end
end
```

- `super(viewport, 0, 0, default_cache: :interface)` initializes the SpriteStack at position (0, 0) with the interface cache as default. The `default_cache: :interface` parameter means all sprites added afterwards load their images from the interface cache.
- `add_sprite` creates a sprite positioned relative to the stack's origin. The third argument is the image name in the cache.
- `set_z(2)` and `@title.z = 3` control depth ordering: the title displays above the header.
- `add_text` creates a text with `ext_text(TEXT_FILE_ID, TEXT_TITLE)` which loads the translated text from the CSV. The `1` parameter is the alignment (center), `nil` is the optional font, and `color: 10` sets the text color.
- `done?` returns `true` unconditionally because there are no animations yet. This will be changed in later guides.
- `update` is empty but **mandatory**: the framework calls it every frame.
- The constants `HEADER_Y`, `FRAME_X`, `TEXT_FILE_ID`, `TEXT_TITLE` are directly accessible because the Composition is declared inside the `UI::MysteryGift` module.

## Plugging into the scene

The scene creates the Composition in `create_graphics` and updates it in `update_graphics`. Adding `include UI::MysteryGift` provides direct access to constants and the Composition class without a prefix.

```ruby
module GamePlay
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    def update_graphics
      @base_ui.update_background_animation
      @composition.update
    end

    private

    def create_graphics
      create_viewport
      create_base_ui
      create_composition
      Graphics.sort_z
    end

    def create_composition
      @composition = Composition.new(@viewport)
    end
  end
end
```

- `include UI::MysteryGift` gives direct access to constants (`TEXT_FILE_ID` instead of `UI::MysteryGift::TEXT_FILE_ID`) and to the `Composition` class without a prefix. This also works in Input.rb and Mouse.rb since they reopen the same class.
- `create_composition` instantiates the Composition and stores it in `@composition`. The viewport is passed as a parameter so all sprites belong to the same viewport.
- `@composition.update` in `update_graphics` advances animations each frame.
- `done?` will be used in `update_inputs` (next guide) to block input during animations.

## Class reopening

Numbered UI files can reopen the Composition class to add methods. This is NOT inheritance, NOT an include -- the file literally reopens the same class.

```ruby
module UI
  module MysteryGift
    # Add code input methods to Composition
    class Composition < SpriteStack
      # Update the display after the player enters a character
      # @param code [String] the current code string
      def update_code_display(code)
        # update visuals based on current code
      end
    end
  end
end
```

- This is the PSDK convention for splitting large Compositions across multiple files.
- Each file adds methods to the same class, without creating a subclass or using a module.
- Load order is determined by the numeric prefixes of the files.

## Conclusion

- Composition extends `SpriteStack` and lives in the `UI::X` module.
- It must expose `update()` and `done?()` for the scene framework.
- The scene creates it in `create_graphics` and updates it in `update_graphics`.
- `include UI::X` in the scene class gives direct access to constants and the Composition class.
- Split large Compositions across numbered files via class reopening, not modules or inheritance.
