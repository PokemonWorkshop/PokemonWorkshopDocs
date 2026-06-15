---
title: "Create a UI scene"
slug: create-a-ui-scene
sidebar_position: 1
description: "This is the first code guide in a series where we build a complete Mystery Gift UI step by step. This system lets players enter codes to claim rewards. Here we create the file structure and a minimal scene that displays and closes with B."
---

This is the first code guide in a series where we build a complete Mystery Gift UI step by step. This system lets players enter codes to claim rewards. The [setup guide](./00-setup.md) already put the graphics and text in place; here we create the file structure and a minimal scene that displays and closes with B.

## Principle

A UI in PSDK is organized in distinct layers, each with a specific role:

- **PFM** (optional): the data model. Only used if the scene requires persistence. In our Mystery Gift UI, this layer will store the codes already used by the player.
- **UI**: the visual components. Contains constants, graphical sub-components (based on SpriteStack), and the Composition that orchestrates everything.
- **GamePlay**: the scene logic. Manages the lifecycle, keyboard and mouse inputs, and transitions.

The name must be **identical** across all three layers: `PFM::MysteryGift`, `UI::MysteryGift`, `GamePlay::MysteryGift`. This convention is mandatory in PSDK.

## File structure

Here is the complete file structure of the Mystery Gift UI that we will build across the following guides:

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
- In this first guide, we only create three files: `000 Entry.rb`, `003 GamePlay/000 Base.rb`, and `003 GamePlay/001 Main.rb`. The other files are added in the following guides.

## Entry point

The entry point exposes an accessor and an opening method on the `GamePlay` module. This is how the Mystery Gift scene is launched from anywhere in the game.

Create `scripts/20 MysteryGift/000 Entry.rb`:

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

- `attr_accessor :mystery_gift_class` creates a class attribute that stores the reference to the scene class. This allows other scripts to replace the scene with a custom version via monkey-patching.
- `open_mystery_gift` is the public method that the game calls to open the scene. It uses `current_scene.call_scene` which pushes the new scene on top of the current one.
- The scene class is registered in this accessor at the bottom of `001 Main.rb`, which we will see later in this guide.

## Custom GenericBase

The `GenericBase` class provides the common base visual elements shared by all scenes: background image, button bar, ctrl buttons (A/X/Y/B), and the `win_text` (reusable text object). You should never rebuild these elements manually: inherit from `GenericBase` and override private methods to customize the rendering.

Create `scripts/20 MysteryGift/003 GamePlay/000 Base.rb`:

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
- `background_filename`: override of the private method that returns the background image path (`graphics/interface/mystery_gift/background.png`, installed in the setup guide). The framework loads this image automatically.
- `create_background_animation`: by defining an empty method, you disable the background scroll animation. If you want the animation, simply do not redefine this method.
- This is a minimal version. We customize the button bar and ctrl buttons in the [GenericBase guide](./10-genericbase.md).

## Minimal scene

The scene class itself inherits from `BaseCleanUpdate::FrameBalanced`, which provides the standard lifecycle and frame balancing. For this first guide, we create a simplified version without composition or list navigation -- those are added in the following guides. It already handles the B button so you can close the scene.

Create `scripts/20 MysteryGift/003 GamePlay/001 Main.rb`:

```ruby
module GamePlay
  # Mystery Gift scene -- a minimal scene that displays and closes with B
  class MysteryGift < BaseCleanUpdate::FrameBalanced
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

- `super` calls `GamePlay::Base#initialize` which creates the message window and the internal clock of the scene.
- `@running = true` indicates that the scene is active. Setting it to `false` exits the scene.
- `create_graphics` is automatically called by the framework after `initialize`. It creates the viewport, instantiates the base UI, then calls `Graphics.sort_z` to sort all visual elements by depth.
- `create_viewport` is inherited from `GamePlay::Base`. It creates the main viewport `@viewport` at z=10_000, which ensures the scene displays above game elements.
- `create_base_ui` instantiates the GenericBase subclass defined earlier. The second argument `button_texts` defines the ctrl button texts.
- `button_texts` returns an array of 4 elements corresponding to the ctrl buttons in order [A, X, Y, B]. Setting `nil` hides the corresponding button. Here, only the B button is visible with the text "Quit". (We move this text to the CSV in the [i18n guide](./07-i18n.md).)
- `update_inputs` is called every frame by the framework. `automatic_input_update` checks each key and calls the matching `action_*` method if it is pressed and defined. Here only `action_b` exists, so pressing B exits.
- `action_b` sets `@running` to `false` to exit the scene. In the [keyboard guide](./05-keyboard.md) we extract `update_inputs` and the actions into their own file, `003 Input.rb`, and add navigation.
- `update_graphics` is called every frame to update animations. `update_background_animation` animates the background scrolling (a no-op here since we disabled it).
- The last line `GamePlay.mystery_gift_class = GamePlay::MysteryGift` registers the class in the accessor defined in `000 Entry.rb`, which makes `GamePlay.open_mystery_gift` work.

## Lifecycle

The framework executes the scene following a precise cycle:

1. **`initialize`**: the constructor is called. You initialize state variables but do not create any graphics.
2. **`create_graphics`**: the framework calls this method once, right after `initialize`. This is where you create viewports, the base UI, and (later) the composition.
3. **Update loop**: every frame, the framework calls in order:
   - `update_inputs`: keyboard input handling
   - `update_mouse(moved)`: mouse input handling (added in the mouse guide)
   - `update_graphics`: animation updates
4. The loop repeats until `@running` is set to `false`.

This cycle is the same for all PSDK scenes. The framework automatically handles frame balancing through the `BaseCleanUpdate::FrameBalanced` class. In our minimal scene, we have not defined `update_mouse` yet -- we add it in the [mouse guide](./06-mouse.md).

## Try it

With the three files in place, open the scene from a map event ("Script call") or the PSDK console:

```ruby
GamePlay.open_mystery_gift
```

You should see the custom background with a "Quit" button at the bottom, and pressing B closes the scene.

## Conclusion

- A UI scene needs at minimum three files: `000 Entry.rb` (entry point), `003 GamePlay/000 Base.rb` (GenericBase subclass), and `003 GamePlay/001 Main.rb` (scene class).
- Always use GenericBase for the base UI layer. Never manually rebuild the background, button bar, or ctrl buttons.
- The inherited `create_viewport` creates the viewport at z=10_000.
- The `button_texts` array controls ctrl button visibility: `nil` hides the button, a string displays it with the given text.
- The framework calls `update_inputs` only if you define it; `automatic_input_update` routes a key press to its `action_*` method. Set `@running` to `false` to exit the scene.
- Register the class at the bottom of `001 Main.rb` with `GamePlay.mystery_gift_class = GamePlay::MysteryGift`.
