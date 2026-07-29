---
title: "Create a Composition"
slug: create-a-composition
sidebar_position: 2
description: "This guide explains how to create a Composition, the central UI class that groups all visual components of a scene."
---

This guide builds on the [scene guide](/psdk/ui-development/mystery-gift/create-a-ui-scene): you already have a minimal Mystery Gift scene that displays and closes with B. Here we add the **Composition**, the central UI class that groups all visual components of a scene.

## Principle

The Composition orchestrates **all** visual rendering of a scene. It follows precise rules:

- It extends `SpriteStack` and is named `UI::X::Composition`.
- It is the **only point of contact** between the GamePlay scene and the UI layer.
- The scene delegates all UI creation and updates to the Composition.
- It must always expose `update()` and `done?()` methods so the scene framework can drive it.

## Constants file

The Composition (and every other UI file) reads shared values from a constants module: text IDs, dimensions and positions. We centralize them in one file now, and each constant is used as we build the matching piece -- the [i18n guide](/psdk/ui-development/mystery-gift/add-i18n-text) explains the text IDs in detail.

Create `scripts/20 MysteryGift/001 Constants.rb`:

```ruby
module UI
  # UI module for the Mystery Gift scene
  module MysteryGift
    # CSV file ID for i18n text
    TEXT_FILE_ID = 311_125

    # Text row IDs (match Data/Text/Dialogs/311125.csv row order)
    TEXT_ENTER_CODE = 0
    TEXT_QUIT = 1
    TEXT_TITLE = 2
    TEXT_PROMPT = 3
    TEXT_INVALID = 4
    TEXT_ALREADY_CLAIMED = 5
    TEXT_RECEIVED = 6
    TEXT_NO_GIFTS = 7
    TEXT_CONFIRM = 8
    TEXT_GIFT_RECEIVED = 9
    TEXT_YES = 10
    TEXT_NO = 11

    # Layout constants (320x240 resolution)
    HEADER_Y = 0
    FRAME_X = 8
    FRAME_Y = 22
    FRAME_WIDTH = 304
    FRAME_HEIGHT = 188

    # Gift row layout (centered inside the frame with margins)
    GIFT_ROW_MARGIN = 8
    GIFT_ROW_X = FRAME_X + GIFT_ROW_MARGIN
    GIFT_ROW_Y = FRAME_Y + GIFT_ROW_MARGIN + 4
    GIFT_ROW_WIDTH = FRAME_WIDTH - GIFT_ROW_MARGIN * 2
    GIFT_ROW_PITCH = 28
    VISIBLE_ROWS = 6

    # Maximum code length for NameInput
    CODE_MAX_LENGTH = 20
  end
end
```

- `TEXT_FILE_ID` identifies the CSV file (`Data/Text/Dialogs/311125.csv`, installed in the setup guide). The `TEXT_*` constants are row indexes in that file -- naming them avoids magic numbers in the code.
- The layout constants centralize positions and dimensions. If the resolution changes, you edit a single place.
- `001 Constants.rb` loads before the `001 PFM/` folder and everything after it, so these constants are available to all the files we create next.
- Some constants (`GIFT_ROW_*`, `CODE_MAX_LENGTH`, several `TEXT_*`) are not used yet -- we use them as we build the gift rows, the input and the dialogs in later guides.

## Basic Composition

The Composition extends `SpriteStack` and receives the viewport. It creates its visual elements in the constructor and exposes the two methods the framework requires. For now it draws the header and the frame; we add the gift list, the data and the animations in later guides.

Create `scripts/20 MysteryGift/002 UI/999 Composition.rb`:

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

- `super(viewport, 0, 0, default_cache: :interface)` initializes the SpriteStack at position (0, 0). `default_cache: :interface` means every sprite added afterwards loads its image from `graphics/interface/`.
- `add_sprite(x, y, filename)` creates a sprite at the given position; the filename is the image name in the cache (`mystery_gift/header` → `graphics/interface/mystery_gift/header.png`).
- `set_z(2)` and `@title.z = 3` control depth ordering: the title displays above the header.
- `add_text` loads the translated title via `ext_text(TEXT_FILE_ID, TEXT_TITLE)`. The `1` is the alignment (center), `nil` is the optional font, and `color: 10` is white.
- `done?` returns `true` unconditionally because there are no animations yet. We change this in the [animations guide](/psdk/ui-development/mystery-gift/create-animations).
- `update` is empty but **mandatory**: the framework calls it every frame.
- The constants (`HEADER_Y`, `FRAME_X`, `TEXT_FILE_ID`, `TEXT_TITLE`) are accessible directly because the Composition is declared inside the `UI::MysteryGift` module.

## Plugging into the scene

The scene creates the Composition in `create_graphics` and updates it in `update_graphics`. Adding `include UI::MysteryGift` gives the scene direct access to the constants and to the `Composition` class without a prefix.

Update `scripts/20 MysteryGift/003 GamePlay/001 Main.rb`:

```ruby
module GamePlay
  # Mystery Gift scene -- displays the header, title and frame
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
    end

    # Handle keyboard input each frame
    # @return [Boolean]
    def update_inputs
      return automatic_input_update
    end

    # Update graphics each frame
    def update_graphics
      @base_ui.update_background_animation
      @composition.update
    end

    private

    # Create all the graphics for the scene
    def create_graphics
      create_viewport
      create_base_ui
      create_composition
      Graphics.sort_z
    end

    # Create the base UI with button texts
    def create_base_ui
      @base_ui = UI::MysteryGiftBase.new(@viewport, button_texts)
    end

    # Create the composition
    def create_composition
      @composition = Composition.new(@viewport)
    end

    # Return the button texts for the ctrl buttons [A, X, Y, B]
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end

    # Action triggered by the B button -- quit the scene
    def action_b
      @running = false
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

- `include UI::MysteryGift` gives direct access to constants (`TEXT_FILE_ID` instead of `UI::MysteryGift::TEXT_FILE_ID`) and to the `Composition` class without a prefix.
- `create_composition` instantiates the Composition and stores it in `@composition`. The viewport is passed so all sprites belong to the same viewport.
- `@composition.update` in `update_graphics` advances the composition each frame.

## Splitting a class across files

PSDK loads numbered files in order, and several files can **reopen** the same class to add methods to it. This is not inheritance and not a module include -- the file literally reopens the class.

We use this for the scene itself: `001 Main.rb`, `002 Logic.rb`, `003 Input.rb` and `004 Mouse.rb` all reopen `GamePlay::MysteryGift`, each adding one part of its behavior (creation, business logic, keyboard, mouse). The Composition, by contrast, stays in a single file. Load order is determined by the numeric prefixes.

## Try it

Reopen the scene:

```ruby
GamePlay.open_mystery_gift
```

You should now see the header bar with the "Mystery Gift" title and the content frame, on top of the background. B still closes the scene.

## Conclusion

- Composition extends `SpriteStack` and lives in the `UI::X` module.
- It must expose `update()` and `done?()` for the scene framework.
- The scene creates it in `create_graphics` and updates it in `update_graphics`.
- `include UI::MysteryGift` in the scene class gives direct access to the constants and the Composition class.
- Centralize constants in `001 Constants.rb`; the file loads before everything that uses them.
- The scene class is split across numbered files via class reopening, not modules or inheritance.
