---
title: "Handle mouse input"
slug: handle-mouse-input
sidebar_position: 6
description: "This guide explains how to handle mouse interactions in a UI scene: wheel, hover, click and ctrl buttons."
---

This guide builds on the [keyboard guide](./05-keyboard.md): the scene has a navigable gift list. Here we add mouse handling -- scrolling, hovering, clicking rows, and the bottom ctrl buttons -- in its own file that reopens the scene class.

## Principle

Mouse handling follows precise conventions in PSDK:

- It lives in a separate file (`004 Mouse.rb`) that reopens the scene class.
- `update_mouse(moved)` and the `MOUSE_BUTTON_ACTIONS` constant must be **public** -- the framework calls them from outside the class.
- Processing is decomposed into four ordered steps: wheel, hover, click, ctrl buttons.
- Sub-components own their collision detection via `simple_mouse_in?`; the scene routes events, it never checks sprite collisions directly.

## The Mouse file

`update_mouse` orchestrates the four interaction types in order. Each sub-method returns `true` if it consumed the event, which stops further processing. Create `scripts/20 MysteryGift/003 GamePlay/004 Mouse.rb`:

```ruby
module GamePlay
  # Mouse input handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Mouse button action mapping for ctrl buttons [A, X, Y, B]
    MOUSE_BUTTON_ACTIONS = [:action_a, nil, nil, :action_b]

    # Handle mouse input each frame
    # @param moved [Boolean] whether the mouse moved this frame
    def update_mouse(moved)
      return false unless @composition.done?
      return false if update_mouse_wheel
      return false if moved && update_mouse_hover
      return false if update_mouse_click

      return update_ctrl_button_mouse
    end

    # Handle mouse wheel scrolling
    # @return [Boolean] true if the wheel was used
    def update_mouse_wheel
      delta = Mouse.wheel
      return false if delta == 0

      Mouse.wheel = 0
      play_cursor_se if @composition.move_selection(delta > 0 ? -1 : 1)
      return true
    end

    # Handle mouse hover over gift rows
    # @return [Boolean] true if hover changed the selection
    def update_mouse_hover
      hovered_index = @composition.find_hovered_row_index
      return false if hovered_index.nil?
      return false if hovered_index == @composition.selected_index

      play_cursor_se
      @composition.select_row(hovered_index)
      return true
    end

    # Handle mouse clicks on gift rows
    # @return [Boolean] true if a click was handled
    def update_mouse_click
      return false unless Mouse.trigger?(:LEFT)

      hovered_index = @composition.find_hovered_row_index
      return false if hovered_index.nil?

      play_cursor_se
      @composition.select_row(hovered_index)
      return true
    end

    # Handle ctrl button mouse interaction
    # @return [Boolean]
    def update_ctrl_button_mouse
      update_mouse_ctrl_buttons(@base_ui.ctrl, MOUSE_BUTTON_ACTIONS)
      return false
    end
  end
end
```

- `update_mouse` and `MOUSE_BUTTON_ACTIONS` are public -- the framework calls `update_mouse(Mouse.moved)` every frame.
- `@composition.done?` blocks mouse input during animations, exactly like the keyboard.
- Order matters: wheel first, then hover (only if the cursor moved), then click, and finally the ctrl buttons as a fallback.
- `Mouse.wheel = 0` resets the value after reading. This reset is mandatory: without it, the value persists and the wheel keeps scrolling every frame.
- `update_mouse_hover` and `update_mouse_click` reuse `@composition.find_hovered_row_index` and `@composition.select_row` -- the same selection methods the keyboard uses. Hover compares against `@composition.selected_index` so it only fires when the selection actually changes.
- `update_ctrl_button_mouse` delegates to `update_mouse_ctrl_buttons`, a helper inherited from `GamePlay::Base`. It handles hover highlight, press animation and triggers the mapped action on click. `MOUSE_BUTTON_ACTIONS` maps positions `[A, X, Y, B]` to action methods; `nil` skips a position. The A entry (`:action_a`) becomes active once we show the A button and add `action_a` in the [i18n](./07-i18n.md) and [dialogs](./08-dialogs.md) guides.

## Hit testing in the Composition

The scene asks the Composition "which row is hovered?"; the Composition asks each row. Add this method to `scripts/20 MysteryGift/002 UI/999 Composition.rb`:

```ruby
# Find which row the mouse hovers
# @return [Integer, nil] the row index or nil
def find_hovered_row_index
  return @rows.index { |row| row.visible && row.hovered? }
end
```

The scene reads the current selection through the Composition too, so expose it -- add `attr_reader :selected_index` near the top of the class:

```ruby
class Composition < SpriteStack
  # @return [Integer] current selected row index
  attr_reader :selected_index
  # ...
```

- `find_hovered_row_index` returns the index of the first visible row whose `hovered?` is true, or `nil`. Each GiftRow owns its hit-testing via `simple_mouse_in?` (added in the SpriteStack guide).
- This three-layer delegation -- row owns `hovered?`, Composition owns `find_hovered_row_index`, scene routes the event -- keeps each layer focused on its responsibility. The scene never touches a sprite's bounding box directly.

## Try it

Claim a couple of codes, then open the scene:

```ruby
$user_data[:mystery_gift].claim('POTION50')
$user_data[:mystery_gift].claim('MASTERBALL')
GamePlay.open_mystery_gift
```

Moving the mouse over a row highlights it, the wheel scrolls the selection, a left click selects a row, and clicking the bottom "Quit" button closes the scene.

## Conclusion

- `update_mouse` and `MOUSE_BUTTON_ACTIONS` must be public -- the framework calls them from outside.
- Decompose `update_mouse` into wheel, hover, click, ctrl buttons; each step returns `true` to stop the chain.
- Always reset `Mouse.wheel` to 0 after reading, or the wheel scrolls forever.
- Mouse and keyboard share the same Composition methods (`select_row`, `move_selection`, `find_hovered_row_index`).
- Sub-components own their collision detection via `simple_mouse_in?`; the scene queries the Composition, never sprites directly.
- `MOUSE_BUTTON_ACTIONS` maps `[A, X, Y, B]` ctrl buttons to action methods, with `nil` to skip a position.
