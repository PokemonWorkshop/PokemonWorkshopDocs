---
title: "Add a data layer with PFM"
slug: add-the-data-layer
sidebar_position: 4
description: "This guide adds the PFM persistence layer that stores which gift codes the player has claimed, and wires it into the Composition so the gift rows show real data."
---

This guide builds on the [SpriteStack guide](/psdk/ui-development/mystery-gift/create-a-spritestack-component): you have a Composition that draws six empty rows. Here we add the **PFM** layer -- the data model that knows which codes are valid and which the player has already claimed -- and wire it in so the rows show real gifts.

## Principle

The **PFM** layer is the data model of a scene: it holds the state that must be remembered, while the UI and GamePlay layers stay free of persistent state.

- The UI layer (Composition, GiftRow) only *displays* data; it never stores persistent state.
- The GamePlay layer (the scene) reads and mutates the PFM object, then asks the Composition to refresh.

**Where the data lives is a deliberate choice.** For Mystery Gift, the claimed codes are a small set of flags that must persist with the player's save and that no existing system already tracks, so we keep them in `$user_data` -- PSDK's plug-and-play hash for exactly this kind of per-save state. When the player saves, the whole game state is serialized with `Marshal`, so any **Marshal-able** data in `$user_data` is saved and restored with it (plain values, arrays, hashes, simple objects like our `PFM::MysteryGift`; never sprites, viewports or procs -- they would break saving).

`$user_data` is not a universal answer, though. It lives **inside** the save file, so it is per-save, not shared across all saves. Transient UI state (a cursor position you do not want to keep) stays in the scene and is never persisted. Data that already has a home goes there instead -- party in the party, items in the bag, story flags in game switches and variables. Pick the store that matches what your data is and how long it must live.

For Mystery Gift, the PFM layer answers three questions: is a code valid? has it been claimed already? and "give me the list of claimed gifts to display".

## The PFM class

Create `scripts/20 MysteryGift/001 PFM/000 MysteryGift.rb`:

```ruby
module PFM
  # Persistence layer for the Mystery Gift scene.
  # Stored in $user_data[:mystery_gift] so claimed codes survive across save files.
  class MysteryGift
    # Gift database -- makers add their codes here.
    # @example
    #   'CODE' => { type: :item, item: :potion, quantity: 5, name: 'Potions x5' }
    #   'CODE' => { type: :pokemon, species: :pikachu, level: 25, name: 'Pikachu' }
    GIFT_DATABASE = {
      'PIKACHU2024' => { type: :pokemon, species: :pikachu, level: 25, name: 'Pikachu Lv.25' },
      'POTION50' => { type: :item, item: :potion, quantity: 50, name: 'Potion x50' },
      'MASTERBALL' => { type: :item, item: :master_ball, quantity: 1, name: 'Master Ball' }
    }

    # @return [Hash{String => Boolean}] claimed gift codes
    attr_reader :claimed

    # Create a new MysteryGift tracker
    def initialize
      @claimed = {}
    end

    # Check if a code is valid and not yet claimed
    # @param code [String] the gift code to validate
    # @return [Symbol] :valid, :invalid, or :already_claimed
    def validate(code)
      normalized = code.upcase
      return :invalid unless GIFT_DATABASE[normalized]
      return :already_claimed if @claimed[normalized]

      return :valid
    end

    # Mark a code as claimed and give the reward to the player
    # @param code [String] the gift code to claim
    # @return [String, nil] the gift name if claimed, nil if invalid
    def claim(code)
      normalized = code.upcase
      gift = GIFT_DATABASE[normalized]
      return nil unless gift

      @claimed[normalized] = true
      give_reward(gift)
      return gift[:name]
    end

    # Return the list of claimed gift entries for display
    # @return [Array<Hash>] each entry has :code, :name, :type (and other gift data)
    def claimed_gifts
      return @claimed.keys.filter_map do |code|
        gift = GIFT_DATABASE[code]
        next unless gift

        gift.merge(code: code)
      end
    end

    # Return the number of claimed gifts
    # @return [Integer]
    def claimed_count
      return @claimed.size
    end

    private

    # Give the reward to the player
    # @param gift [Hash] the gift data from GIFT_DATABASE
    def give_reward(gift)
      case gift[:type]
      when :item
        $bag.add_item(gift[:item], gift[:quantity] || 1)
      when :pokemon
        pokemon = PFM::Pokemon.new(gift[:species], gift[:level])
        PFM.game_state.add_pokemon(pokemon)
      end
    end
  end
end
```

- `GIFT_DATABASE` is where makers declare codes and their rewards. Each entry has a `:type` (`:item` or `:pokemon`), the reward details, and a display `:name`. Edit this hash to define your own gifts.
- `@claimed` is a hash of `code => true`. Because the whole `PFM::MysteryGift` object is stored in `$user_data`, this hash is saved with the game.
- `validate` returns a symbol the scene can branch on: `:invalid` (unknown code), `:already_claimed`, or `:valid`.
- `claim` marks the code as claimed and calls `give_reward`. It returns the gift name so the scene can show "You received ...".
- `claimed_gifts` builds the display list: each claimed code merged with `code:` so a row can show both the name and the code. `filter_map` skips codes that no longer exist in the database.
- `give_reward` uses standard PSDK APIs (`$bag.add_item`, `PFM.game_state.add_pokemon`). Adapt it to whatever your gifts grant.

## Wiring it into the scene

The scene creates the PFM object once (or reuses the saved one) and passes it to the Composition. Update `scripts/20 MysteryGift/003 GamePlay/001 Main.rb`:

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
      @composition = Composition.new(@viewport, $user_data[:mystery_gift])
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

- `$user_data[:mystery_gift] ||= PFM::MysteryGift.new` creates the data object the first time and reuses the saved one afterwards. `||=` is what makes the claimed codes persist between visits and across save files.
- `create_composition` now passes the data object as a second argument.

## Showing the data in the Composition

The Composition receives the data object, stores it, and exposes a `refresh` method that reads the claimed gifts and updates the rows. Update `scripts/20 MysteryGift/002 UI/999 Composition.rb`:

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      # @param mystery_data [PFM::MysteryGift] the data object
      def initialize(viewport, mystery_data)
        super(viewport, 0, 0, default_cache: :interface)
        @mystery_data = mystery_data
        @selected_index = 0
        create_header
        create_frame
        create_no_gifts_text
        create_gift_rows
        refresh
      end

      # Update the composition each frame
      def update; end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return true
      end

      # Refresh the display with current gift data
      def refresh
        gifts = @mystery_data.claimed_gifts
        if gifts.empty?
          show_no_gifts
        else
          show_gift_list(gifts)
        end
      end

      private

      # Show the "no gifts" message
      def show_no_gifts
        @no_gifts_text.visible = true
        @rows.each { |row| row.visible = false }
      end

      # Show the gift list
      # @param gifts [Array<Hash>]
      def show_gift_list(gifts)
        @no_gifts_text.visible = false
        @rows.each_with_index do |row, index|
          gift = gifts[index]
          row.data = gift
          row.selected = (index == @selected_index) if gift
        end
      end

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

      # Create the "no gifts claimed yet" text
      def create_no_gifts_text
        @no_gifts_text = add_text(
          FRAME_X, FRAME_Y + FRAME_HEIGHT / 2 - 8,
          FRAME_WIDTH, 16,
          ext_text(TEXT_FILE_ID, TEXT_NO_GIFTS), 1, nil, color: 9
        )
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

- `@mystery_data` stores the PFM object; `@selected_index` tracks which row is highlighted (used by navigation in the keyboard and mouse guides).
- `refresh` is the single entry point for redrawing the list. It is called once at the end of `initialize`, and again whenever the data changes (after a claim, in the dialogs guide).
- `show_no_gifts` shows the centered "No gifts claimed yet" text and hides every row; `show_gift_list` fills each row via `row.data = gift` and hides the extra rows by passing `nil`.
- `create_no_gifts_text` must be created before `refresh` runs, which is why the call order in `initialize` matters.

## Try it

Reopen the scene:

```ruby
GamePlay.open_mystery_gift
```

Since nothing is claimed yet, you see the "No gifts claimed yet" message. To preview the list before we build the claim flow, claim a code from the console, then reopen:

```ruby
$user_data[:mystery_gift].claim('POTION50')
GamePlay.open_mystery_gift
```

You should now see one row with "Potion x50" on the left and "POTION50" on the right.

## Conclusion

- The PFM layer is the data model. `$user_data` is a good home for small per-save state like ours, but it is not always the right one -- choose the store that fits your data (party, bag, switches/variables, or nothing if it should not persist).
- Keep persistent state in PFM only -- the UI displays it, the scene mutates it.
- `validate`/`claim`/`claimed_gifts`/`claimed_count` form the public API the scene and Composition use.
- The Composition takes the data object as a constructor argument and exposes a `refresh` method as the single redraw entry point.
- Create the "no gifts" text and the rows before the first `refresh`.
