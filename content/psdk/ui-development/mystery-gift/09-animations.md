---
title: "Create animations"
slug: create-animations
sidebar_position: 9
description: "This guide adds UI animations with Yuki::Animation: a fade-in banner component, an animation handler in the Composition, and using them when a gift is claimed."
---

This guide builds on the [dialogs guide](./08-dialogs.md). Claiming a gift currently shows a plain message; here we replace it with an animated banner using `Yuki::Animation`, and we wire an animation handler into the Composition so input is blocked while it plays.

## Principle

PSDK uses `Yuki::Animation` for all UI animations, covered in full on the [Animation foundations](/psdk/animation/yuki-animation) page; here we apply it. The standard idiom is `ya = Yuki::Animation` to shorten calls. Two composition modes exist:

- `ya.player(...)` runs steps one after another (sequential).
- `ya.parallel(...)` runs steps at the same time (simultaneous).

The building blocks:

- `ya.scalar(duration, obj, :setter=, from, to)` interpolates a numeric value.
- `ya.move(duration, sprite, x1, y1, x2, y2)` moves a sprite.
- `ya.send_command_to(obj, :method, *args)` calls a method at a point in the sequence.
- `ya.wait(duration)` pauses.

Animations are tracked by an `Animation::Handler` that exposes `done?`. The Composition's `done?` checks the handler, so the scene blocks input while an animation plays -- exactly the guard we wired into the keyboard and mouse.

## The banner component

Each component creates its own animations: it owns its sprites and knows how to animate them, and returns the animation without starting it so the Composition can chain it. Create `scripts/20 MysteryGift/002 UI/001 ReceivedBanner.rb`:

```ruby
module UI
  module MysteryGift
    # Banner displayed when a gift is received (background + text with fade animation)
    class ReceivedBanner < SpriteStack
      # Banner dimensions
      BANNER_WIDTH = 280
      BANNER_HEIGHT = 28

      # Create a new ReceivedBanner centered on screen
      # @param viewport [Viewport]
      def initialize(viewport)
        banner_x = (320 - BANNER_WIDTH) / 2
        banner_y = FRAME_Y + FRAME_HEIGHT / 2 - BANNER_HEIGHT / 2
        super(viewport, banner_x, banner_y, default_cache: :interface)
        create_background
        create_text
        self.visible = false
      end

      # Return the animation for showing the banner with a gift name
      # @param gift_name [String] the text to display
      # @return [Yuki::Animation::TimedAnimation]
      def create_show_animation(gift_name)
        ya = Yuki::Animation
        return ya.player(
          ya.send_command_to(@text, :text=, gift_name),
          ya.send_command_to(self, :visible=, true),
          ya.parallel(
            ya.scalar(0.3, @background, :opacity=, 0, 255),
            ya.scalar(0.3, @text, :opacity=, 0, 255)
          ),
          ya.wait(1.0),
          ya.parallel(
            ya.scalar(0.3, @background, :opacity=, 255, 0),
            ya.scalar(0.3, @text, :opacity=, 255, 0)
          ),
          ya.send_command_to(self, :visible=, false)
        )
      end

      private

      # Create the banner background
      def create_background
        @background = add_background('mystery_gift/received_banner')
        @background.z = 10
      end

      # Create the banner text
      def create_text
        @text = add_text(0, 6, BANNER_WIDTH, 16, '', 1, nil, color: 10)
        @text.z = 11
      end
    end
  end
end
```

- The component is created invisible (`self.visible = false`); the animation controls its visibility.
- `create_show_animation` **returns** the animation without starting it -- the key pattern. `ya.player` chains: set the text, show the banner, fade in (background and text in `parallel`), wait one second, fade out, hide.
- It uses the `FRAME_Y`/`FRAME_HEIGHT` constants to center itself inside the frame.

## Animation handler in the Composition

The handler lives in the Composition, is updated each frame, and drives `done?`. Update `scripts/20 MysteryGift/002 UI/999 Composition.rb`.

Add the handler and the banner in the constructor (and keep everything else):

```ruby
def initialize(viewport, mystery_data)
  super(viewport, 0, 0, default_cache: :interface)
  @mystery_data = mystery_data
  @animation_handler = Yuki::Animation::Handler.new
  @selected_index = 0
  create_header
  create_frame
  create_no_gifts_text
  create_gift_rows
  create_received_banner
  refresh
end
```

Change `update` and `done?` to use the handler (they were a no-op and `true`):

```ruby
# Update the composition each frame
def update
  @animation_handler.update
end

# Tell if all animations are done
# @return [Boolean]
def done?
  return @animation_handler.done?
end
```

Add the banner creation (private) and the public method that plays the animation:

```ruby
# Start the gift received animation
# @param gift_name [String] the text to display
def start_gift_animation(gift_name)
  return unless done?

  animation = @received_banner.create_show_animation(gift_name)
  full_animation = Yuki::Animation.player(animation, Yuki::Animation.send_command_to(self, :refresh))
  full_animation.start
  @animation_handler[:gift_received] = full_animation
end
```

```ruby
# Create the received banner component
def create_received_banner
  @received_banner = ReceivedBanner.new(@viewport)
  push_sprite(@received_banner)
end
```

- `@animation_handler.update` advances animations each frame; `done?` returns `false` while one plays, which now blocks input through the guards we added earlier.
- `start_gift_animation` asks the banner for its animation, then chains a `refresh` after it via `Yuki::Animation.player(animation, ...send_command_to(self, :refresh))`, starts it, and stores it under a named key in the handler.
- `return unless done?` prevents overlapping animations.

## Playing it on claim

Replace the plain message and refresh in `claim_gift` with the banner. Update `scripts/20 MysteryGift/003 GamePlay/002 Logic.rb`:

```ruby
# Claim a valid gift after confirmation
# @param code [String] the valid code
# @param mystery_data [PFM::MysteryGift] the data object
def claim_gift(code, mystery_data)
  choice = display_message_and_wait(gift_text(TEXT_CONFIRM), 1, gift_text(TEXT_YES), gift_text(TEXT_NO))
  return unless choice == 0

  gift_name = mystery_data.claim(code)
  @composition.start_gift_animation(format(gift_text(TEXT_RECEIVED), gift_name))
end
```

- The confirmation dialog stays. After claiming, instead of a blocking message + manual `refresh`, we play the banner; the chained `refresh` updates the list once the banner finishes.

## Other building blocks

`ya.scalar` interpolates any numeric value via a setter -- the most versatile block:

```ruby
ya = Yuki::Animation
fade_out = ya.scalar(0.5, @sprite, :opacity=, 255, 0)
bar_fill = ya.scalar(0.3, @bar.src_rect, :width=, old_width, new_width)
zoom_in  = ya.scalar(0.2, @icon, :zoom_x=, 1.0, 1.2)
```

For an idle animation that runs forever (a bouncing arrow, a pulsing icon), use `ya.timed_loop_animation`:

```ruby
ya = Yuki::Animation
loop_animation = ya.timed_loop_animation(0.5, [ya.shift(0.5, arrow, 2, 0, -2, 0)])
loop_animation.start
```

- A looped animation must be started manually and updated through the handler; it does not block `done?`.

## Try it

Open the scene, press A, type `MASTERBALL`, confirm with Yes:

```ruby
GamePlay.open_mystery_gift
```

The "You received Master Ball!" banner fades in over the frame, holds for a second, fades out, and the list refreshes with the new row. Input is ignored while the banner plays.

## Conclusion

- Components create and return their own animations without starting them; the Composition chains and runs them through an `Animation::Handler`.
- Use `ya = Yuki::Animation`; `ya.player` for sequential, `ya.parallel` for simultaneous.
- `ya.scalar` for numbers, `ya.move` for movement, `ya.wait` for pauses, `ya.send_command_to` for callbacks.
- Store animations with `@animation_handler[:key] = animation`; while one plays, `done?` is `false` and input is blocked.
- Always check `done?` before starting a new animation; use `timed_loop_animation` for repeating idle effects.
