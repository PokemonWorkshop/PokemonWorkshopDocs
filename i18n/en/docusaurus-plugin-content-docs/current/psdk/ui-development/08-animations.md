---
title: "How to create animations in PSDK?"
slug: create-animations
sidebar_position: 8
description: "This guide explains how to create UI animations with Yuki::Animation, using the Mystery Gift plugin as a concrete example."
---

This guide explains how to create UI animations with `Yuki::Animation`, using the Mystery Gift plugin as a concrete example. The plugin uses a `ReceivedBanner` component that encapsulates its own sprites and animations, then the Composition orchestrates everything. It assumes guides 001 to 003 have been read (the reader has a working scene with a Composition).

## Principle

PSDK uses `Yuki::Animation` for all UI animations. The standard idiom throughout the codebase is `ya = Yuki::Animation` to shorten calls.

Two composition modes exist:

- `ya.player(...)` runs animations one after another (sequential).
- `ya.parallel(...)` runs animations at the same time (simultaneous).

The building blocks are:

- `ya.scalar(duration, obj, :setter=, from, to)` smoothly interpolates a numeric value.
- `ya.move(duration, sprite, x1, y1, x2, y2)` moves a sprite between two positions.
- `ya.send_command_to(obj, :method, args)` calls a method at a specific point in the sequence.
- `ya.wait(duration)` pauses the sequence.

Animations are tracked via an `Animation::Handler` that provides `done?` to the scene. The Composition's `done?` method should check the handler so the scene blocks input during animations.

## Component with built-in animation: ReceivedBanner

The recommended approach is to let each component create its own animations. The component owns its sprites and knows how to animate them. It returns the animation without starting it, which lets the Composition chain it with other steps.

Here is the `ReceivedBanner` component from the Mystery Gift plugin:

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
      # @return [Yuki::AnimationMixin]
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

- The component inherits from `SpriteStack` and manages its own sprites (background and text).
- `create_show_animation` returns the animation without starting it. This is the key pattern: the component describes the animation, the caller decides when to play it.
- `ya.player(...)` chains steps in order: text assignment, visibility, fade in, pause, fade out, hide.
- `ya.parallel(...)` fades in the background and text at the same time.
- `ya.send_command_to(self, :visible=, true)` makes the component visible at the right moment in the sequence.
- `ya.wait(1.0)` lets the player read the message for one second.
- The component is created invisible (`self.visible = false`) and the animation controls its visibility.

## Animation Handler in the Composition

The handler is created in the constructor, updated each frame, and exposes `done?` so the scene knows whether an animation is playing:

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      # @param mystery_data [Hash] the mystery gift data
      def initialize(viewport, mystery_data)
        super(viewport, 0, 0, default_cache: :interface)
        @mystery_data = mystery_data
        @animation_handler = Yuki::Animation::Handler.new
        create_header
        create_frame
        @received_banner = ReceivedBanner.new(viewport)
      end

      # Update the composition each frame
      def update
        @animation_handler.update
      end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return @animation_handler.done?
      end
    end
  end
end
```

- `@animation_handler = Yuki::Animation::Handler.new` creates the handler in the constructor.
- `@animation_handler.update` advances animations each frame -- call it in the Composition's `update`.
- `done?` delegates to the handler: returns `true` when no animation is playing, `false` while an animation runs.
- `@received_banner = ReceivedBanner.new(viewport)` creates the banner component. The Composition owns the component but does not manage its sprites directly.

## Orchestration in the Composition

The Composition uses the `ReceivedBanner` component to start the animation. It chains the component's animation with a refresh callback, then stores it in the handler:

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

- `return unless done?` prevents starting an animation if one is already playing.
- `@received_banner.create_show_animation(gift_name)` asks the component to create its animation. The component returns it without starting it.
- `Yuki::Animation.player(animation, ...)` chains the component's animation with a callback. Here, `refresh` is called after the banner animation.
- `full_animation.start` triggers the complete animation.
- `@animation_handler[:gift_received] = full_animation` stores the animation with a named key in the handler. While it plays, `done?` returns `false`, which blocks input in the scene.

## Scalar values

`ya.scalar` interpolates any numeric value via a setter. It is the most versatile building block:

```ruby
ya = Yuki::Animation

# Animate opacity from 255 to 0 over 0.5 seconds
fade_out = ya.scalar(0.5, @sprite, :opacity=, 255, 0)

# Animate a src_rect width for a progress bar
bar_fill = ya.scalar(0.3, @bar.src_rect, :width=, old_width, new_width)

# Animate the zoom of a sprite
zoom_in = ya.scalar(0.2, @icon, :zoom_x=, 1.0, 1.2)
```

- `ya.scalar(duration, target, :setter=, start_value, end_value)` works with any setter: `opacity=`, `x=`, `y=`, `zoom_x=`, `width=`, etc.
- The target can be any Ruby object that has the specified setter (sprite, src_rect, etc.).
- Duration is in seconds.

## Looped animation

For idle animations that run indefinitely (bouncing arrows, pulsing icons), use `ya.timed_loop_animation`:

```ruby
# Create a bouncing arrow animation for the gift list
# @param arrow [Sprite] the arrow sprite
# @return [Yuki::Animation::TimedLoopAnimation]
def create_arrow_loop(arrow)
  ya = Yuki::Animation
  duration = 0.5
  loop_animation = ya.timed_loop_animation(duration, [
    ya.shift(duration, arrow, 2, 0, -2, 0)
  ])
  loop_animation.start
  return loop_animation
end
```

- `ya.timed_loop_animation(duration, [animations])` creates an animation that loops forever.
- `ya.shift(duration, sprite, dx1, dy1, dx2, dy2)` moves a sprite by relative offsets and back.
- Must be started manually with `.start` and updated each frame via the handler.
- Looped animations do not block `done?` -- they are managed separately from the main flow.

## Conclusion

- Components can create their own animations and return them without starting them. The Composition chains and orchestrates animations via `Animation::Handler`.
- Use `ya = Yuki::Animation` as the standard idiom to shorten calls.
- `ya.player(...)` for sequential animations, `ya.parallel(...)` for simultaneous -- both can be nested.
- `ya.scalar` for any numeric value, `ya.move` for movement, `ya.wait` for pauses, `ya.send_command_to` for callbacks.
- `@animation_handler[:key] = animation` stores animations with named keys. While an animation plays, `done?` returns `false` and blocks input in the scene.
- Always check `done?` before starting a new animation to prevent overlapping.
- Use `timed_loop_animation` for repeating idle animations (arrows, pulsing effects).
