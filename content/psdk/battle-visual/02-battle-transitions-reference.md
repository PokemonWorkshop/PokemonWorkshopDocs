---
title: "Battle transitions reference"
slug: battle-transitions-reference
sidebar_position: 2
description: "PSDK ships thirteen wild battle transitions and twelve trainer ones, all picked by the same game variable. This page lists them side by side, with the value to set, what plays on screen, and which graphics each one uses."
---

PSDK ships thirteen wild battle transitions and twelve trainer ones, all picked by the same game variable. This page lists them side by side, with the value to set, what plays on screen, and which graphics each one uses.

## How the transition is chosen

When a battle starts, a short animation plays before the battlers appear. That animation is the **transition**, and it is chosen by **game variable 31**, which PSDK also exposes under the name `Yuki::Var::TrainerTransitionType`.

That single variable feeds **two separate lists**. When the battle is against a trainer, PSDK reads the value in the trainer list. When it is a wild encounter, it reads the *same* value in the wild list. The two lists have nothing in common, so one value means two different animations:

- `3` is the **Diamond/Pearl/Platinum gym leader** intro in a trainer battle, and the **Ruby/Sapphire** wipe in a wild encounter.
- `0` is the **X/Y** trainer intro in a trainer battle, and the **Red/Blue/Yellow** wipe in a wild encounter.

:::warning[Set the variable back after a special battle]
Variable 31 keeps its value until something changes it. Set it to `3` for a gym leader and forget to reset it, and every wild encounter that follows plays the Ruby/Sapphire wipe instead of your usual one. Always add a second **Control Variables** command after the battle, putting it back to the value your project uses normally, `0` by default.
:::

To set it from an event, add a **Control Variables** command before the one that starts the battle. From a script, the line is:

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 3
```

In the two tables below, the paths in the **Graphics** column are relative to `graphics/transitions/` unless stated otherwise. Every one of those files ships with PSDK, so you only have to touch them if you want to reskin a transition.

:::tip[See them before you choose]
A written description only goes so far for an animation. This slideshow shows each transition in motion: [Battle transitions preview](https://docs.google.com/presentation/d/17xe4j_5-2eBovWIwJ88T-4r0c4DO_X259twZba9frEU/edit). Look there first to pick the one you want, then come back here for the value to set.
:::

## Wild transitions

These play when the battle is not against a trainer.

| Value | On screen                                                                                                                 | Graphics                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `0`   | **Red/Blue/Yellow.** The screen flashes, a full-screen wipe plays, then the battlers slide in from opposite sides         | `spritesheets/rby_wild`                                                                              |
| `1`   | **Gold.** Same choreography as `0`, different wipe                                                                        | `spritesheets/gold_wild`                                                                             |
| `2`   | **Crystal.** Same choreography as `0`, different wipe                                                                     | `spritesheets/crystal_wild`                                                                          |
| `3`   | **Ruby/Sapphire.** The screen splits into two interlaced halves that slide off left and right, uncovering black           | `black_screen`                                                                                       |
| `4`   | **Diamond/Pearl/Platinum.** The same split as `3` with a different interlacing pattern                                    | `black_screen`                                                                                       |
| `5`   | **HeartGold/SoulSilver.** Same choreography as `0`, slower wipe: 1.5 second instead of 0.5                                | `spritesheets/heartgold_soulsilver_wild`                                                             |
| `6`   | **HeartGold/SoulSilver, cave.** Same as `5` with the cave wipe                                                            | `spritesheets/heartgold_soulsilver_cave_wild`                                                        |
| `7`   | **HeartGold/SoulSilver, sea.** The screen ripples, a bubble rises and oscillates, then a wave and a black panel scroll up | `assets/heartgold_soulsilver_sea_wild_01`, `assets/heartgold_soulsilver_sea_wild_02`, `black_screen` |
| `8`   | **Black/White.** The screen distorts in an expanding ring while zooming in to three times its size                        | None, the effect is computed                                                                         |
| `9`   | **Diamond/Pearl/Platinum, cave.** A mask dissolves the screen while it zooms in to three times its size around its centre | `shaders/diamant_perle_wild`                                                                         |
| `10`  | **Ruby/Sapphire, cave.** A mask dissolves the screen over one second, without any zoom                                    | `shaders/ruby_saphir_wild`                                                                           |
| `11`  | **Black/White, sea.** The screen warps for 1.5 second                                                                     | None, the effect is computed                                                                         |
| `12`  | **Diamond/Pearl/Platinum, sea.** The screen ripples, then a mask dissolves it half a second in                            | `shaders/shader_003`, see the note below                                                             |

The mask of transition `12` is the one exception to the naming: PSDK asks for it under the name `shaders/diamant_perle_sea_wild`, while the file that ships is `shaders/shader_003.png`. The transition works as it is, but if you replace that graphic, name your file `shader_003.png` rather than the name the engine announces.

## Trainer transitions

These play when the battle is against a trainer.

| Value | On screen                                                                                                                                                                                                   | Graphics                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `0`   | **X/Y.** The screen blacks out through six masks, then a background with a gradient and three scrolling halos appears and the opponent's artwork rises into frame, the small copy first, then the large one | `battle_bg`, `battle_deg`, `battle_halo1`, `battle_halo2`, `black_out00` to `black_out05`, plus the trainer artwork you provide, see below |
| `1`   | **Diamond/Pearl/Platinum.** An image spins a full turn while zooming from a fifth of the screen to the whole of it, then two animations play in sequence                                                    | `spritesheets/diamant_perle_trainer_01`, `spritesheets/diamant_perle_trainer_02`                                                           |
| `2`   | **Red/Blue/Yellow.** A mask sweeps over the screen for 2.75 seconds, then the battlers slide in from opposite sides                                                                                         | `shaders/rby_trainer`                                                                                                                      |
| `3`   | **Diamond/Pearl/Platinum gym leader.** VS bar transition, see [Set up a VS bar trainer transition](/psdk/battle-visual/vs-bar-trainer-transitions)                                                          | The bar and the portrait are yours to draw                                                                                                 |
| `4`   | **HeartGold/SoulSilver.** Same choreography as `1` with the HeartGold/SoulSilver images                                                                                                                     | `spritesheets/heartgold_soulsilver_trainer_01`, `spritesheets/heartgold_soulsilver_trainer_02`                                             |
| `5`   | **Ruby/Sapphire.** The screen flashes six times over 1.5 second, then a mask dissolves it                                                                                                                   | `shaders/ruby_saphir_trainer`                                                                                                              |
| `6`   | **Battle Frontier, vertical.** Same as `5` with a vertical mask pattern                                                                                                                                     | `shaders/battle_frontier_vertical`                                                                                                         |
| `7`   | **Battle Frontier, horizontal.** Same as `5` with a horizontal mask pattern                                                                                                                                 | `shaders/battle_frontier_horizontal`                                                                                                       |
| `8`   | **Red.** A gold Poké Ball sits in the centre of the screen while it flashes six times, then a wipe plays over it                                                                                            | `pokeball_gold`, `spritesheets/crystal_wild`                                                                                               |
| `9`   | **Black/White.** The screen zooms in slightly, then distorts for 1.4 second                                                                                                                                 | None, the effect is computed                                                                                                               |
| `10`  | **HeartGold/SoulSilver gym leader.** VS bar transition, see [Set up a VS bar trainer transition](/psdk/battle-visual/vs-bar-trainer-transitions)                                                            | The bar and the portrait are yours to draw                                                                                                 |
| `11`  | **Team Rocket.** VS bar transition, see [Set up a VS bar trainer transition](/psdk/battle-visual/vs-bar-trainer-transitions)                                                                                | `assets/team_rocket/hgss_bg_1`, `assets/team_rocket/hgss_bg_2`, `assets/team_rocket/hgss_strobes`, plus the portrait you provide           |

The three VS bar transitions are the only shipped ones that expect images from you, because they show the opponent's face. Their filenames, canvas sizes and naming rules are covered in [Set up a VS bar trainer transition](/psdk/battle-visual/vs-bar-trainer-transitions).

## What happens on a value that is not in the list

Nothing crashes. Both lists have a fallback entry, and both point at the Red/Blue/Yellow transition. A wild encounter started with variable 31 on `13` therefore plays the Red/Blue/Yellow wipe, and a trainer battle started on `12` plays the Red/Blue/Yellow trainer transition.

This is worth knowing when you debug: an unexpected Red/Blue/Yellow animation usually means variable 31 holds a value that does not exist in the list being read, and quite often that the battle you thought was a trainer battle is being read as a wild one.

## Which trainer image the transition shows

A trainer transition has to display the opponent somewhere, and PSDK lets each transition pick which of the trainer's images it wants. Three are available, and they are the three fields of the **Resources** tab of a trainer in Pokémon Studio: **Battle sprite**, **Artwork - Full** and **Artwork - Small**.

Every shipped transition uses the **Battle sprite**, except one: the X/Y transition, value `0`, which asks for **Artwork - Full**. It expects two files in `graphics/battlers/`, derived from that name: one ending in `_sma` for the small copy that appears first, and one ending in `_big` for the large one that rises into frame. Set variable 31 to `0` for a trainer whose **Artwork - Full** field is empty and the transition has nothing to show.

If you write a transition of your own and want it to read a different image, that choice is declared alongside the transition class. See [Create a custom battle transition](/psdk/battle-visual/3d-camera/how-to-create-a-battle-transition).

The 3D camera reuses both lists: every transition here has a 3D counterpart, generated automatically from the 2D one, so the values in these tables stay valid with the camera enabled.

## Conclusion

- **Game variable 31** picks the transition, and the same value points at two different animations: one in the trainer list, one in the wild list.
- Always reset variable 31 after a special battle, otherwise the wild encounters that follow inherit its value.
- PSDK ships thirteen wild transitions, values `0` to `12`, and twelve trainer ones, values `0` to `11`. All of their graphics ship with the engine.
- A value outside the list does not crash: it falls back to the Red/Blue/Yellow transition.
- The three VS bar transitions, values `3`, `10` and `11`, are the only ones asking for images of your own, and the X/Y transition, value `0`, is the only one reading the trainer's full artwork instead of the battle sprite.
