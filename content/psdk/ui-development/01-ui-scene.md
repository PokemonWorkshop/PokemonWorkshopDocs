---
title: "How to create a UI scene in PSDK?"
slug: create-a-ui-scene
sidebar_position: 1
description: "This guide is the first in a series of 10 where we build a complete Mystery Gift plugin step by step. This system will allow players to enter codes to claim rewards."
---

This guide is the first in a series of 10 where we build a complete Mystery Gift plugin step by step. This system will allow players to enter codes to claim rewards. In this guide, we create the plugin structure and a minimal scene that displays and closes with B.

## Principle

A UI in PSDK is organized in distinct layers, each with a specific role:

- **PFM** (optional): the data model. Only used if the scene requires persistence. In our Mystery Gift plugin, this layer will store the codes already used by the player.
- **UI**: the visual components. Contains constants, graphical sub-components (based on SpriteStack), and the Composition that orchestrates everything.
- **GamePlay**: the scene logic. Manages the lifecycle, keyboard and mouse inputs, and transitions.

The name must be **identical** across all three layers: `PFM::MysteryGift`, `UI::MysteryGift`, `GamePlay::MysteryGift`. This convention is mandatory in PSDK.

## Plugin structure

Here is the complete structure of the Mystery Gift plugin that we will build across the 9 guides:

```
scripts/20 MysteryGift/
  000 Entry.rb              -> GamePlay accessor
  001 Constants.rb          -> UI::MysteryGift module constants
  001 PFM/
    000 MysteryGift.rb      -> PFM::MysteryGift (persistence)
  002 UI/
    000 GiftRow.rb          -> Gift row component
    001 ReceivedBanner.rb   -> Gift received animation banner
    999 Composition.rb      -> Visual orchestrator
  003 GamePlay/
    000 Base.rb             -> GenericBase subclass
    001 Main.rb             -> Scene class
    002 Logic.rb            -> Business logic
    003 Input.rb            -> Keyboard input
    004 Mouse.rb            -> Mouse input
```

- Files and folders are prefixed with numbers that define the loading order.
- A file with the same prefix as a folder is loaded **before** the folder contents. For example, `001 Constants.rb` is loaded before anything inside the `001 PFM/` folder.
- The `001 PFM/` folder contains the persistence layer (optional), the `002 UI/` folder contains the visual components, the `003 GamePlay/` folder contains the scene logic.
- In this first guide, we only create three files: `000 Entry.rb`, `003 GamePlay/000 Base.rb`, and `003 GamePlay/001 Main.rb`.

## Entry point

The Entry.rb file exposes an accessor and an opening method on the `GamePlay` module. This is the entry point for launching the Mystery Gift scene from anywhere in the game.

```ruby
module GamePlay
  class << self
    # @return [Class] the Mystery Gift scene class
    attr_accessor :mystery_gift_class

    # Open the Mystery Gift scene
    def open_mystery_gift
      return current_scene.call_scene(mystery_gift_class)
    end
  end
end
```

- `attr_accessor :mystery_gift_class` creates a class attribute that stores the reference to the scene class. This allows other plugins to replace the scene with a custom version via monkey-patching.
- `open_mystery_gift` is the public method that the game calls to open the scene. It uses `current_scene.call_scene` which pushes the new scene on top of the current one.
- The scene class is registered in this accessor at the bottom of Main.rb, which we will see later in this guide.

## Custom GenericBase

The `GenericBase` class provides the common base visual elements shared by all scenes: background image, button bar, ctrl buttons (A/X/Y/B), and the `win_text` (reusable text object). You should never rebuild these elements manually: inherit from `GenericBase` and override private methods to customize the rendering.

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

    # Disable the background scroll animation
    def create_background_animation; end
  end
end
```

- `MysteryGiftBase < GenericBase`: inherit from GenericBase to get the entire visual foundation without rewriting anything.
- `background_filename`: override of the private method that returns the background image path. The framework automatically loads this image.
- `create_background_animation`: by defining an empty method, you disable the background scroll animation. If you want the animation, simply do not redefine this method.

## Minimal scene

The Main.rb file contains the scene class itself. It inherits from `BaseCleanUpdate::FrameBalanced` which provides the standard lifecycle and frame balancing management. For this first guide, we create a simplified version without composition or inputs -- these elements will be added in the following guides.

```ruby
module GamePlay
  # Mystery Gift scene -- allows players to enter codes and claim rewards
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
    end

    # Update graphics each frame
    def update_graphics
      @base_ui.update_background_animation
    end

    private

    # Create all the graphics for the scene
    def create_graphics
      create_viewport
      create_base_ui
      Graphics.sort_z
    end

    # Create the base UI with button texts
    def create_base_ui
      @base_ui = UI::MysteryGiftBase.new(@viewport, button_texts)
    end

    # Return the button texts for the ctrl buttons
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end

    # Shortcut to access Mystery Gift text
    # @param id [Integer] the text row index
    # @return [String]
    def gift_text(id)
      return ext_text(TEXT_FILE_ID, id)
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

- `super` calls `GamePlay::Base#initialize` which creates the message window and the internal clock of the scene.
- `@running = true` indicates that the scene is active. We will set this variable to `false` to exit the scene (in an upcoming guide).
- `include UI::MysteryGift` gives access to constants defined in the `UI::MysteryGift` module, such as `TEXT_FILE_ID` which we will create in the constants guide.
- `create_graphics` is automatically called by the framework after `initialize`. It creates the viewport, instantiates the base UI, then calls `Graphics.sort_z` to sort all visual elements by depth.
- `create_viewport` is inherited from `GamePlay::Base`. It creates the main viewport `@viewport` at z=10_000, which ensures the scene displays above game elements.
- `create_base_ui` instantiates the GenericBase subclass defined earlier. The second argument `button_texts` defines the ctrl button texts.
- `button_texts` returns an array of 4 elements corresponding to the ctrl buttons in order [A, X, Y, B]. Setting `nil` hides the corresponding button. Here, only the B button is visible with the text "Quit".
- `update_graphics` is called every frame to update animations. `update_background_animation` animates the background scrolling (if active).
- `gift_text` is a shortcut to access the Mystery Gift plugin texts via `ext_text`. We will use it in the following guides.
- The last line `GamePlay.mystery_gift_class = GamePlay::MysteryGift` registers the class in the accessor defined in Entry.rb, which makes `GamePlay.open_mystery_gift` work.

## Lifecycle

The framework executes the scene following a precise cycle:

1. **`initialize`**: the constructor is called. You initialize state variables but do not create any graphics.
2. **`create_graphics`**: the framework calls this method once, right after `initialize`. This is where you create viewports, the base UI, and the composition.
3. **Update loop**: every frame, the framework calls in order:
   - `update_inputs`: keyboard input handling
   - `update_mouse(moved)`: mouse input handling
   - `update_graphics`: animation updates
4. The loop repeats until `@running` is set to `false`.

This cycle is the same for all PSDK scenes. The framework automatically handles frame balancing through the `BaseCleanUpdate::FrameBalanced` class. In our minimal scene, we have not yet defined `update_inputs` or `update_mouse` -- we will add them in the following guides.

## Conclusion

- A UI plugin requires at minimum three files: Entry.rb (entry point), Base.rb (GenericBase subclass), and Main.rb (scene class).
- Always use GenericBase for the base UI layer. Never manually rebuild the background, button bar, or ctrl buttons.
- The inherited `create_viewport` creates the viewport at z=10_000.
- The `button_texts` array controls ctrl button visibility: `nil` hides the button, a string displays it with the given text.
- Set `@running` to `false` to exit the scene.
- Register the class at the bottom of Main.rb with `GamePlay.mystery_gift_class = GamePlay::MysteryGift`.
