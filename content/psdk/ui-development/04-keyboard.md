---
title: "How to handle keyboard input in PSDK?"
slug: handle-keyboard-input
sidebar_position: 4
description: "This guide explains how to handle keyboard input in a UI scene."
---

This guide explains how to handle keyboard input in a UI scene. It builds on guides 001 to 003: the reader already has a Mystery Gift scene with a Composition and visual components. Here, we add the Input.rb file to the plugin to map buttons and navigation.

## Principle

Keyboard input handling is split into two distinct mechanisms:

- **Button keys** (A/B/X/Y): handled by `automatic_input_update(AIU_KEY2METHOD)` which calls `Input.trigger?` -- the button fires only once per press.
- **Directional keys** (UP/DOWN): handled with `Input.repeat?` -- the button fires continuously while held, with an initial delay before repetition.

Input logic goes in a separate file (Input.rb) that reopens the scene class. The same action methods (`action_a`, `action_b`) are called by both keyboard **and** mouse.

Important point: `update_inputs`, `AIU_KEY2METHOD`, and `MOUSE_BUTTON_ACTIONS` must remain **public** (above the `private` keyword). The framework calls `update_inputs` from outside the class. Only action methods and navigation go under `private`.

## Complete Input file

The Input.rb file reopens the scene class to add input handling methods. This is not a new class file: it reopens the same class defined in Main.rb.

```ruby
module GamePlay
  # Input handling for the Mystery Gift scene
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

    # Action triggered by the A button -- open code input
    def action_a
      play_decision_se
      open_code_input
    end

    # Action triggered by the B button -- quit
    def action_b
      play_cancel_se
      @running = false
    end
  end
end
```

- `AIU_KEY2METHOD` and `update_inputs` are declared **above** the `private` keyword. This is mandatory: the framework calls `update_inputs` from outside the class. If these elements are under `private`, the framework will not be able to access them.
- `@composition.done?` blocks input during animations. Without this check, the player could interact during a visual transition.
- `automatic_input_update` checks `Input.trigger?` for each key in the `AIU_KEY2METHOD` hash and calls the corresponding method if the key is pressed. If it finds a pressed key, it returns `false` to consume the input.
- `update_navigation` handles directional keys separately with `Input.repeat?`. It returns `false` to consume the input, `true` to let other processing continue.
- `Input.repeat?` vs `Input.trigger?`: `repeat?` fires continuously while the key is held (with an initial delay before repetition), `trigger?` fires only once per press.
- `play_cursor_se`, `play_decision_se`, and `play_cancel_se` are the standard sound effects for navigation, confirmation, and cancellation.
- `action_a` calls `open_code_input`, a business logic method that will be defined in Logic.rb (next guide).
- `action_b` sets `@running` to `false` to exit the scene.

## Navigation wrapping vs clamping

The Mystery Gift plugin uses `.clamp` to bound the index: the cursor stops at the edges of the list. This is the behavior of `@composition.move_selection` which handles clamping internally. For circular navigation (the cursor wraps back to the beginning after the last element), use modulo:

```ruby
# Update the selected index with wrapping (loops around)
# @param new_index [Integer]
def update_index(new_index)
  max = @items.size
  @index = new_index % max
  @composition.select_row(@index)
end
```

- `% max` wraps the index around: going past the last element returns to the first, going before the first returns to the last.
- Use `.clamp(0, max - 1)` if you prefer the cursor to stop at the boundaries without looping.
- The choice between wrapping and clamping depends on the scene: a main menu often uses wrapping, a gift list uses clamping.

## Conclusion

- `update_inputs` and `AIU_KEY2METHOD` must be public (above `private`). The framework calls `update_inputs` from outside.
- Button keys (A/B) use `Input.trigger?` via `automatic_input_update`.
- Directional keys (UP/DOWN) use `Input.repeat?` in a separate `update_navigation` method.
- The same action methods are shared between keyboard and mouse.
- Always check `@composition.done?` before accepting input.
- Use modulo for circular navigation, `.clamp` for bounded navigation.
