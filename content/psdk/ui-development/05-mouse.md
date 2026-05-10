---
title: "How to handle mouse input in PSDK?"
slug: handle-mouse-input
sidebar_position: 5
description: "This guide explains how to handle mouse interactions in a UI scene."
---

This guide explains how to handle mouse interactions in a UI scene. It builds on guides 001 through 004: the reader already has a scene with keyboard input handling and a working Composition. The example uses the Mystery Gift scene.

## Principle

Mouse handling follows precise conventions in PSDK:

- It is placed in a separate file (003 Mouse.rb) that reopens the scene class.
- The method `update_mouse(moved)` and the constant `MOUSE_BUTTON_ACTIONS` must be **public** -- the framework calls them from outside the class.
- Processing is decomposed into four ordered steps: wheel, hover, click, ctrl buttons.
- Sub-components own their collision detection via `simple_mouse_in?`.
- The scene routes mouse events, it does not check collisions directly.

## Structure of update_mouse

The `update_mouse` method orchestrates all four types of mouse interactions in a precise order. Each sub-method returns `true` if it consumed the event, which stops further processing.

```ruby
module GamePlay
  # Mouse handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Mouse button action mapping for ctrl buttons
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
  end
end
```

- `update_mouse` and `MOUSE_BUTTON_ACTIONS` are declared without `private` -- they must remain public because the framework calls them from outside the class.
- `@composition.done?` blocks mouse input during animations, exactly like keyboard input.
- Each sub-method returns `true` if it consumed the event, which stops the chain via `return false`.
- Order matters: wheel has priority, then hover (only if the cursor moved), then click, and finally ctrl buttons as a fallback.
- `MOUSE_BUTTON_ACTIONS` maps positions `[A, X, Y, B]` of the bottom bar to action methods. `nil` means no action is associated with that position -- Mystery Gift only uses A and B.

## Scroll with the wheel

The wheel allows scrolling through the gift list without using keyboard arrows.

```ruby
# Handle mouse wheel scrolling
# @return [Boolean] true if the wheel was used
def update_mouse_wheel
  delta = Mouse.wheel
  return false if delta == 0

  Mouse.wheel = 0
  play_cursor_se if @composition.move_selection(delta > 0 ? -1 : 1)
  return true
end
```

- `Mouse.wheel` returns the scroll delta: positive for up, negative for down.
- `Mouse.wheel = 0` resets the value to zero after reading. This reset is mandatory: without it, the value persists and the wheel loops infinitely every frame.
- `@composition.move_selection` moves the selection by one step in the given direction and returns `true` if the selection changed.
- `play_cursor_se` is only played if the selection actually moved.

## Hover

Hovering updates the selection when the cursor passes over a gift row.

```ruby
# Handle mouse hover over gift rows
# @return [Boolean] true if hover changed selection
def update_mouse_hover
  hovered_index = @composition.find_hovered_row_index
  return false if hovered_index.nil?
  return false if hovered_index == @composition.selected_index

  play_cursor_se
  @composition.select_row(hovered_index)
  return true
end
```

- The Composition exposes `find_hovered_row_index` which queries its sub-components via `simple_mouse_in?`. The scene simply asks "which row is hovered?", it does not check sprites directly.
- If no item is hovered (`nil`) or the hovered item is already selected, we return `false` to let the chain continue.
- `@composition.selected_index` allows comparing with the current index without maintaining a duplicate `@index` in the scene.
- This pattern respects the Composition principle: each layer handles its own responsibility.

## Click

A left click selects the item under the cursor.

```ruby
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
```

- `Mouse.trigger?(:LEFT)` returns `true` only once per click (not every frame the button is held).
- The method reuses `find_hovered_row_index` from the Composition to determine which item is under the cursor.
- Clicking any row selects that row and plays the cursor sound.

## Ctrl buttons

Ctrl buttons are the bottom bar buttons. Their handling is delegated to a helper inherited from `GamePlay::Base`.

```ruby
# Handle ctrl button mouse interaction
# @return [Boolean]
def update_ctrl_button_mouse
  update_mouse_ctrl_buttons(@base_ui.ctrl, MOUSE_BUTTON_ACTIONS)
  return false
end
```

- `update_mouse_ctrl_buttons` is a built-in helper from `GamePlay::Base`. It handles hover highlighting, press animation, and triggers the action method on click.
- `MOUSE_BUTTON_ACTIONS` maps positions `[A, X, Y, B]` to method names. Positions set to `nil` are skipped.
- This is the last link in the `update_mouse` chain: it only executes if no other handler consumed the event.

## Hit testing in components

Each visual component is responsible for its own collision detection. The Composition queries its components, and the scene queries the Composition.

```ruby
# Tell if the mouse is hovering this component
# @return [Boolean]
def hovered?
  return @background.simple_mouse_in?
end
```

- `simple_mouse_in?` checks if the mouse cursor is within the sprite's bounding box.
- The component owns this check, Composition queries it via `find_hovered_row_index`, and the scene queries Composition. This three-layer delegation keeps each layer focused on its responsibility.

## Conclusion

- `update_mouse` and `MOUSE_BUTTON_ACTIONS` must remain public -- the framework calls them from outside.
- Decompose `update_mouse` into wheel, hover, click, ctrl buttons, each step returning `true` to stop processing.
- Always reset `Mouse.wheel` to 0 after reading, otherwise the wheel loops infinitely.
- Sub-components own their collision detection via `simple_mouse_in?`, the scene queries the Composition (never sprites directly).
- Use `Mouse.trigger?(:LEFT)` for clicks and `Mouse.wheel` for scrolling.
- `MOUSE_BUTTON_ACTIONS` maps positions `[A, X, Y, B]` of ctrl buttons to action methods, with `nil` to skip a position.
