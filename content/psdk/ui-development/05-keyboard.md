---
title: "How to handle keyboard input in PSDK?"
slug: handle-keyboard-input
sidebar_position: 5
description: "This guide explains how to handle keyboard input in a UI scene: button keys, list navigation, and moving the input handling into its own file."
---

This guide builds on the [data layer guide](./04-mystery-gift-data.md): the scene now shows the player's claimed gifts. Here we add keyboard handling -- navigating the list with the arrows and quitting with B -- and we move the input code out of `001 Main.rb` into its own file.

## Principle

Keyboard input is split into two mechanisms:

- **Button keys** (A/B/X/Y): handled by `automatic_input_update`, which calls `Input.trigger?` -- the button fires once per press.
- **Directional keys** (UP/DOWN): handled with `Input.repeat?` -- the key fires continuously while held, after an initial delay.

Two rules matter:

- `update_inputs` and the `AIU_KEY2METHOD` constant must stay **public** (above `private`). The framework calls `update_inputs` from outside the class; if it were private, the framework could not reach it.
- Input handling lives in its own file that **reopens** the scene class (`003 Input.rb`). In the [scene guide](./01-ui-scene.md) we put a temporary `update_inputs`/`action_b` directly in `001 Main.rb`; now we move them here and expand them. The same action methods are shared by keyboard **and** mouse.

## The Input file

Create `scripts/20 MysteryGift/003 GamePlay/003 Input.rb`:

```ruby
module GamePlay
  # Keyboard input handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Key-to-action mapping
    AIU_KEY2METHOD = { A: :action_a, B: :action_b }

    # Handle keyboard input each frame
    # @return [Boolean]
    def update_inputs
      return false unless @composition.done?
      return false unless automatic_input_update(AIU_KEY2METHOD)

      return update_navigation
    end

    private

    # Handle directional key navigation in the gift list
    # @return [Boolean]
    def update_navigation
      if Input.repeat?(:UP)
        play_cursor_se if @composition.move_selection(-1)
        return false
      elsif Input.repeat?(:DOWN)
        play_cursor_se if @composition.move_selection(1)
        return false
      end

      return true
    end

    # Action triggered by the B button -- quit
    def action_b
      play_cancel_se
      @running = false
    end
  end
end
```

- `AIU_KEY2METHOD` maps a key to a method name. We already list `A: :action_a` here, but we only define `action_b` for now -- `automatic_input_update` checks `respond_to?` before calling, so pressing A simply does nothing until we add `action_a` in the [dialogs guide](./08-dialogs.md).
- `@composition.done?` blocks input while an animation plays. It always returns `true` today (no animations yet), but wiring the guard now means input is automatically blocked once we add animations.
- `automatic_input_update(AIU_KEY2METHOD)` checks `Input.trigger?` for each mapped key and calls the matching method. It returns `false` when it consumed a press, which we forward to stop further processing.
- `update_navigation` handles the arrows separately with `Input.repeat?`. It returns `false` to consume the input, `true` to let processing continue.
- `play_cursor_se` and `play_cancel_se` are the standard navigation and cancel sound effects, inherited from `GamePlay::Base`.
- `action_b` sets `@running` to `false` to exit the scene.

Because this file reopens `GamePlay::MysteryGift`, **remove** the temporary `update_inputs` and `action_b` from `001 Main.rb` -- they now live here. `001 Main.rb` becomes:

```ruby
module GamePlay
  # Mystery Gift scene -- displays the player's claimed gifts
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
      $user_data[:mystery_gift] ||= PFM::MysteryGift.new
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
      @composition = Composition.new(@viewport, $user_data[:mystery_gift])
    end

    # Return the button texts for the ctrl buttons [A, X, Y, B]
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

## Selection in the Composition

Navigation asks the Composition to move the selected row. Add these two public methods to `scripts/20 MysteryGift/002 UI/999 Composition.rb` (next to `refresh`):

```ruby
# Select a row by index
# @param index [Integer]
def select_row(index)
  @rows.each_with_index { |row, row_index| row.selected = (row_index == index) }
  @selected_index = index
end

# Move selection by delta, clamped to the valid range
# @param delta [Integer] -1 for up, +1 for down
# @return [Boolean] true if the selection changed
def move_selection(delta)
  gift_count = @mystery_data.claimed_count
  return false if gift_count == 0

  new_index = (@selected_index + delta).clamp(0, [gift_count - 1, VISIBLE_ROWS - 1].min)
  return false if new_index == @selected_index

  select_row(new_index)
  return true
end
```

- `select_row` highlights one row and stores its index in `@selected_index`. It is also reused by mouse handling in the next guide.
- `move_selection` computes the new index, **clamped** so the cursor stops at the edges of the list. It returns `true` only if the selection actually changed -- the scene uses that to play the cursor sound only when something moved.
- The clamp upper bound is `[gift_count - 1, VISIBLE_ROWS - 1].min`: you cannot select beyond the number of claimed gifts, nor beyond the number of visible rows.

## Wrapping vs clamping

Mystery Gift uses `.clamp`: the cursor stops at the first and last entries. For a menu where the cursor should loop back to the start after the last item, use modulo instead:

```ruby
# Wrap the index around (loops back to the start)
new_index = (@selected_index + delta) % gift_count
```

- `% gift_count` wraps: going past the last entry returns to the first, and vice versa.
- Use `.clamp(0, max)` for a bounded list, `% size` for a looping menu. The choice depends on the scene.

## Try it

Claim a few codes from the console so there is something to navigate, then open the scene:

```ruby
$user_data[:mystery_gift].claim('POTION50')
$user_data[:mystery_gift].claim('MASTERBALL')
GamePlay.open_mystery_gift
```

UP and DOWN move the highlight between the two rows (with the cursor sound), and B closes the scene.

## Conclusion

- `update_inputs` and `AIU_KEY2METHOD` must be public -- the framework calls `update_inputs` from outside.
- Button keys (A/B) use `Input.trigger?` via `automatic_input_update`; directional keys (UP/DOWN) use `Input.repeat?`.
- `automatic_input_update` skips keys whose action method is not defined yet, so you can map a key before implementing its action.
- Input handling reopens the scene class in its own file (`003 Input.rb`); the action methods are shared with the mouse.
- Always check `@composition.done?` before accepting input.
- Use `.clamp` for a bounded list, modulo for a looping menu.
