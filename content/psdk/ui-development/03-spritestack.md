---
title: "How to create a SpriteStack component in PSDK?"
slug: create-a-spritestack-component
sidebar_position: 3
description: "This guide explains how to create a visual sub-component by extending SpriteStack, using the Mystery Gift gift row as a concrete example."
---

This guide explains how to create a visual sub-component by extending SpriteStack. We build **GiftRow**, the row that displays a claimed gift (name on the left, code on the right). It builds on the [composition guide](./02-composition.md): you already have a scene with a Composition that draws the header and frame.

## Principle

A sub-component is a class that extends SpriteStack and groups related sprites together: a background, one or more texts, an icon -- together they form a single reusable visual building block.

All positions inside a SpriteStack are relative to the stack's origin, defined by `super(viewport, x, y)`. The component does not know its absolute position on screen; it only reasons in local coordinates.

The Composition creates and orchestrates sub-components. It pushes them into its own stack via `push_sprite` for lifecycle management (automatic dispose), but each sub-component remains an independent SpriteStack with its own internal state.

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
- Warning: this method applies the FOY offset (see below).

### push_sprite

```ruby
custom_sprite = Sprite.new(@viewport)
push_sprite(custom_sprite)
```

- `push_sprite(sprite)` adds an externally created sprite to the stack, without modifying its position.
- Useful for integrating a sub-component SpriteStack into a parent's lifecycle.

### set_rect_div

```ruby
@background.set_rect_div(0, 0, 2, 1)
```

- `set_rect_div(col, row, ncols, nrows)` slices the bitmap into a grid and displays a single cell.
- The arguments are: column, row, total number of columns, total number of rows.
- Used for spritesheets: one image contains multiple visual states, only one is displayed at a time.

## The FOY trap

`add_text` subtracts 2 pixels from the Y position passed as parameter. FOY stands for Font Offset Y. In practice, a call like `add_text(10, 20, ...)` places the text at y = 18, not y = 20. This 2-pixel offset is systematic and invisible in the code. For pixel-perfect placement, account for it: if text should sit at y = 20, pass y = 22.

## The visible= trap

Setting `visible = true` on a SpriteStack propagates to **all** children, including ones you intentionally hid. If some children must stay hidden, override `visible=`:

```ruby
# Set visibility of the component
# @param value [Boolean]
def visible=(value)
  super(value)
  @hidden_sprite.visible = false
end
```

- `super(value)` propagates visibility to all children of the stack.
- Then `@hidden_sprite.visible = false` forces the sprite to stay hidden.
- Our GiftRow does not need this override, but it is a common pitfall worth knowing.

## The GiftRow component

Here is the complete GiftRow component. It displays a row with the gift name on the left and the code on the right.

Create `scripts/20 MysteryGift/002 UI/000 GiftRow.rb`:

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
      # @param value [Boolean]
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

- The constructor receives a viewport and a position; `super(viewport, x, y, default_cache: :interface)` sets the stack's origin and the default sprite cache.
- `create_background` uses `add_sprite(0, 0, ...)` instead of `add_background` so that `set_rect_div` can be called afterward. The sprite is the `gift_row` 2×1 spritesheet (column 0 = normal, column 1 = selected), set up in the setup guide.
- `selected=` toggles the background appearance between the two spritesheet columns. The constructor calls `self.selected = false` to initialize the visual state.
- `hovered?` delegates hit-testing to the background sprite via `simple_mouse_in?` -- the component owns its own hover detection (used by the mouse guide).
- `data=` is the public API for updating the displayed content. It receives either a hash with `:name` and `:code`, or `nil` to hide the row. The scene never touches the texts directly; it goes through this method (used from the PFM guide on).
- `create_name_text` creates left-aligned text (default alignment) with color 10 (white); `create_code_text` creates right-aligned text (alignment `2`) with color 9 (grey). The `nil` between alignment and `color:` is the font_id (default font).

## Integration in the Composition

The Composition creates a fixed number of GiftRow slots and pushes them into its own stack. Update `scripts/20 MysteryGift/002 UI/999 Composition.rb`:

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
        create_gift_rows
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

      # Create the gift row slots
      def create_gift_rows
        @rows = Array.new(VISIBLE_ROWS) do |index|
          row = GiftRow.new(@viewport, GIFT_ROW_X, GIFT_ROW_Y + index * GIFT_ROW_PITCH)
          push_sprite(row)
        end
      end
    end
  end
end
```

- `Array.new(VISIBLE_ROWS)` creates a fixed number of rows, positioned vertically with regular spacing (`GIFT_ROW_PITCH`). Each row is created with computed coordinates -- the sub-component does not know its position in the list.
- `push_sprite(row)` adds each GiftRow to the Composition's stack for lifecycle management: when the Composition is disposed, the GiftRows are disposed too.
- For now the rows show their placeholder text (`---`). In the [next guide](./04-mystery-gift-data.md) we add the data layer and fill the rows with the player's claimed gifts; the [keyboard](./05-keyboard.md) and [mouse](./06-mouse.md) guides then add selection and hover, which is why GiftRow already exposes `selected=` and `hovered?`.

## Try it

Reopen the scene:

```ruby
GamePlay.open_mystery_gift
```

You should now see six empty rows (showing `---`) inside the frame, under the title.

## Conclusion

- A sub-component extends SpriteStack and groups related sprites together (background, texts, icons).
- All internal positions are relative to the stack's origin set in `super(viewport, x, y)`.
- Use `set_rect_div(col, row, ncols, nrows)` for spritesheets: one image holds multiple visual states.
- `add_text` applies a FOY offset of 2 pixels -- account for it in pixel-perfect layouts.
- `visible=` propagates to all children -- override it if some must stay hidden.
- The sub-component owns its hit-testing (`simple_mouse_in?`) and exposes a public API (`data=`, `selected=`) so the Composition can drive it.
- The Composition orchestrates sub-components: it creates them, stores them, and (later) exposes finder methods for the scene.
