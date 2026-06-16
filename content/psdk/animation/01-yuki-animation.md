---
title: "Animation foundations"
slug: yuki-animation
sidebar_position: 1
description: "PSDK animates everything through Yuki::Animation, a time-based system where you build small animation blocks and combine them in sequence or in parallel. This page explains that core logic; specific uses are covered in their own guides."
---

PSDK animates everything through **Yuki::Animation**, a time-based system where you build small animation blocks and combine them in sequence or in parallel. This page explains that core logic; specific uses are covered in their own guides.

## How an animation works

A Yuki animation is **time-based, not frame-based**. It has a `duration` in seconds and progresses from `0` (start) to `1` (end) over that time, reading the elapsed time from the current scene's clock so it stays consistent at any frame rate.

Whatever it animates, it answers the same four messages: `start`, `update`, `done?` and `duration`. Driving one is always the same loop: start it, then update it every frame until it reports it is done.

```ruby
animation.start
until animation.done?
  animation.update
  Graphics.update
end
```

Inside a scene you do not write that loop yourself: the scene updates the animation for you each frame. You write it in standalone scripts, or to picture what the system does.

Every helper lives in the `Yuki::Animation` module, usually aliased to a short local variable:

```ruby
ya = Yuki::Animation
```

## The building blocks

A building block animates one thing, and they all share the same shape: the **duration** first, then the **object** to animate, then the start and end values. The most general is `scalar`, which interpolates a single numeric property through its setter method:

```ruby
# Fade a sprite out over 0.5s (opacity 255 -> 0)
ya.scalar(0.5, sprite, :opacity=, 255, 0)
```

`move` is the same idea for a position vector `(x, y)`:

```ruby
# Move a sprite from (0, 5) to (100, 32) in 3s
ya.move(3, sprite, 0, 5, 100, 32)
```

And `wait` simply does nothing for a duration, to hold a pause inside a sequence:

```ruby
ya.wait(1.0)
```

That is the whole pattern. Dedicated helpers exist for the other common cases (opacity, rotation, origin shift, sprite-sheet cells); they all follow the same `duration, object, from, to` shape.

## Sequencing and parallelism

The real power is composition. Two combinators assemble blocks, and both behave like a single animation, so you can nest them freely:

- `ya.player(a, b, c)` runs its animations one after another (**sequential**).
- `ya.parallel(a, b, c)` runs them at the same time (**simultaneous**).

```ruby
ya = Yuki::Animation

# Fade in while sliding down, hold one second, then fade out
animation = ya.player(
  ya.parallel(
    ya.scalar(0.3, sprite, :opacity=, 0, 255),
    ya.move(0.3, sprite, sprite.x, sprite.y - 20, sprite.x, sprite.y)
  ),
  ya.wait(1.0),
  ya.scalar(0.3, sprite, :opacity=, 255, 0)
)

animation.start
until animation.done?
  animation.update
  Graphics.update
end
```

`player` waits for each step (including any parallel group inside it) to finish before moving to the next. That sequential and parallel nesting is enough to describe most animations.

## Conclusion

- A Yuki animation is **time-based**: a `duration`, progress from `0` to `1`, driven by `start` / `update` / `done?`.
- Build with blocks that share one shape: `ya.scalar` for a numeric property, `ya.move` for a position, `ya.wait` for a pause; the other helpers follow the same shape.
- Compose with `ya.player` (sequential) and `ya.parallel` (simultaneous), nested as needed.
- In a scene the scene drives `update`; standalone, loop until `done?`.
- Everything else (UI integration, distortions, saving, commands) lives in dedicated guides.
