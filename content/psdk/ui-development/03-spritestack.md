---
title: "How to create a SpriteStack component in PSDK?"
slug: create-a-spritestack-component
sidebar_position: 3
description: "This guide explains how to create a visual sub-component by extending SpriteStack, using the Mystery Gift plugin as a concrete example."
---

This guide explains how to create a visual sub-component by extending SpriteStack, using the Mystery Gift plugin as a concrete example. We build GiftRow, the row that displays a claimed gift (name on the left, code on the right). It assumes guides 001 and 002 have been read (the reader has a scene with a Composition).

## Principle

A sub-component is a class that extends SpriteStack and groups related sprites together: a background, one or more texts, an icon together form a single reusable visual building block.

All positions inside a SpriteStack are relative to the stack's origin, defined by `super(viewport, x, y)`. The component does not know its absolute position on screen -- it only reasons in local coordinates.

Composition creates and orchestrates sub-components. It can push them into its own stack via `push_sprite` for lifecycle management (automatic dispose), but each sub-component remains an independent SpriteStack with its own internal state.

## SpriteStack API

The key methods for building a SpriteStack's content:

### add_background

```ruby
@background = add_background('mystery_gift/gift_row')
```

- `add_background` loads a sprite from the interface cache and adds it at position (0, 0) of the stack.

### add_sprite

```ruby
@icon = add_sprite(120, 6, 'mystery_gift/icon')
```

- `add_sprite(x, y, filename)` adds a sprite at position (stack.x + x, stack.y + y).
- Coordinates are relative to the stack's origin.

### add_text

```ruby
@label = add_text(8, 4, 80, 16, 'Hello', color: 10)
```

- `add_text(x, y, w, h, text, color: N)` adds text with a palette color.
- The `align` parameter (3rd positional argument after the text) controls alignment: 0 = left (default), 1 = center, 2 = right.
- Warning: this method applies the FOY offset (see next section).

### push_sprite

```ruby
custom_sprite = Sprite.new(@viewport)
push_sprite(custom_sprite)
```

- `push_sprite(sprite)` adds an externally created sprite to the stack.
- The sprite is added to the children list without position modification.
- Useful for integrating a sub-component SpriteStack into a parent's lifecycle.

### set_rect_div

```ruby
@background.set_rect_div(0, 0, 2, 1)
```

- `set_rect_div(col, row, ncols, nrows)` slices the bitmap into a grid and displays a single cell.
- The arguments are: column, row, total number of columns, total number of rows.
- Used for spritesheets: one image contains multiple visual states, only one is displayed at a time.

## The FOY trap

`add_text` subtracts 2 pixels from the Y position passed as parameter. FOY stands for Font Offset Y. In practice:

```ruby
# Place the text at y = 18, NOT y = 20
@label = add_text(10, 20, 80, 16, 'text')
```

- The call `add_text(10, 20, ...)` places text at y = 18, not y = 20.
- This 2-pixel offset is systematic and invisible in the code.
- For pixel-perfect placement, always account for it: if text should be at y = 20, pass y = 22.

## The visible= trap

Setting `visible = true` on a SpriteStack propagates to ALL children, including ones you intentionally hid. If some children should stay hidden, override `visible=`:

```ruby
# Set visibility of the component
# @param value [Boolean]
def visible=(value)
  super(value)
  @hidden_sprite.visible = false
end
```

- `super(value)` propagates visibility to all children of the stack.
- Then `@hidden_sprite.visible = false` is forced to keep the sprite hidden.
- Without this override, enabling the component's visibility would reveal sprites that should remain hidden.

## Example: GiftRow component

Here is the complete GiftRow component from the Mystery Gift plugin. It displays a row with the gift name on the left and the code on the right:

```ruby
module UI
  module MysteryGift
    # A single row displaying a claimed gift (name left, code right)
    class GiftRow < SpriteStack
      # Padding inside the row
      ROW_PADDING = 8

      # Create a new GiftRow
      # @param viewport [Viewport]
      # @param x [Integer] x position
      # @param y [Integer] y position
      def initialize(viewport, x, y)
        super(viewport, x, y, default_cache: :interface)
        create_background
        create_name_text
        create_code_text
        self.selected = false
      end

      # Tell if the mouse is hovering this row
      # @return [Boolean]
      def hovered?
        return @background.simple_mouse_in?
      end

      # Set the selected state of the row
      # @param value [Boolean] true to select, false to deselect
      def selected=(value)
        @selected = value
        @background.set_rect_div(value ? 1 : 0, 0, 2, 1)
      end

      # Update the displayed gift data
      # @param gift [Hash, nil] the gift data (with :name and :code) or nil to hide
      def data=(gift)
        if gift
          @name_text.text = gift[:name] || '???'
          @code_text.text = gift[:code] || ''
          self.visible = true
        else
          self.visible = false
        end
      end

      private

      # Create the row background sprite
      def create_background
        @background = add_sprite(0, 0, 'mystery_gift/gift_row')
        @background.set_rect_div(0, 0, 2, 1)
      end

      # Create the gift name text (left-aligned)
      def create_name_text
        text_width = (GIFT_ROW_WIDTH - ROW_PADDING * 2) / 2
        @name_text = add_text(ROW_PADDING, 4, text_width, 16, '---', color: 10)
      end

      # Create the gift code text (right-aligned)
      def create_code_text
        text_width = (GIFT_ROW_WIDTH - ROW_PADDING * 2) / 2
        right_x = GIFT_ROW_WIDTH - ROW_PADDING - text_width
        @code_text = add_text(right_x, 4, text_width, 16, '', 2, nil, color: 9)
      end
    end
  end
end
```

- The constructor receives a viewport and a position (x, y) -- `super(viewport, x, y, default_cache: :interface)` sets the stack's origin and the default sprite cache.
- `create_background` uses `add_sprite(0, 0, ...)` instead of `add_background` so that `set_rect_div` can be called afterward. The sprite is a 2x1 spritesheet: two columns (normal and selected), one row.
- `set_rect_div(0, 0, 2, 1)` displays column 0 (normal state). `set_rect_div(1, 0, 2, 1)` displays column 1 (selected state).
- `hovered?` delegates hit-testing to the background sprite via `simple_mouse_in?` -- the component owns its own hover detection logic.
- `selected=` toggles the background appearance between the two spritesheet columns. The constructor calls `self.selected = false` to initialize the visual state.
- `data=` is the public API for updating the displayed content. It receives either a hash with `:name` and `:code`, or nil to hide the row.
- `create_name_text` creates left-aligned text (default alignment) with color 10 (white).
- `create_code_text` creates right-aligned text by passing `2` as the alignment argument, with color 9 (grey).
- The `nil` parameter between alignment and `color:` corresponds to the font_id -- nil uses the default font.

## Integration in Composition

Composition creates GiftRow instances and integrates them into its lifecycle:

```ruby
# Create the gift rows
def create_gift_rows
  @rows = Array.new(VISIBLE_ROWS) do |index|
    row = GiftRow.new(@viewport, GIFT_ROW_X, GIFT_ROW_Y + index * GIFT_ROW_PITCH)
    push_sprite(row)
  end
end
```

- `Array.new(VISIBLE_ROWS)` creates a fixed number of rows, positioned vertically with regular spacing (`GIFT_ROW_PITCH`).
- Each GiftRow is created with `@viewport` and computed coordinates -- the sub-component does not know its position in the list.
- `push_sprite(row)` adds the sub-component to Composition's stack for lifecycle management: when Composition is disposed, the GiftRows are automatically disposed too.
- Composition then exposes finder methods like `find_hovered_row_index` so the scene can query sub-component state without manipulating them directly.

## Conclusion

- A sub-component extends SpriteStack and groups related sprites together (background, texts, icons).
- All internal positions are relative to the stack's origin set in `super(viewport, x, y)`.
- Use `set_rect_div(col, row, ncols, nrows)` for spritesheets: one image contains multiple visual states.
- `add_text` applies a FOY offset of 2 pixels -- account for it in pixel-perfect layouts.
- `visible=` propagates to all children -- override if some must stay hidden.
- The sub-component owns its hit-testing via `simple_mouse_in?` and exposes a public API (`data=`, `selected=`) so Composition can drive it.
- Composition orchestrates sub-components: it creates them, stores them, and exposes finder methods for the scene.
