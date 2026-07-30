---
title: "Set up a VS bar trainer transition"
slug: vs-bar-trainer-transitions
sidebar_position: 1
description: "PSDK ships three trainer transitions built on the vs_bar graphics: the Diamond/Pearl/Platinum gym leader intro, the HeartGold/SoulSilver one, and the Team Rocket one. This guide explains how to trigger them and which images each one expects."
---

PSDK ships three trainer transitions built on the `vs_bar` graphics: the **Diamond/Pearl/Platinum** gym leader intro, the **HeartGold/SoulSilver** one, and the **Team Rocket** one. This guide explains how to trigger them and which images each one expects.

## What a transition is

When a battle starts, the map does not cut straight to the battle screen. A short animation plays first: the screen flashes, an effect sweeps over it, and only then the battlers appear. That animation is the **transition**.

PSDK ships a dozen of them, reproducing the ones from the official games. Three of them are the "VS bar" family, the dramatic intros reserved for important opponents: a bar scrolls across the screen, a **VS** logo flashes, and the trainer's portrait slides in with their name. They are the ones that need extra images from you, because they show the opponent's face.

## Choosing the transition

The transition is chosen by **game variable 31**, which PSDK also exposes under the name `Yuki::Var::TrainerTransitionType`. Whatever value that variable holds when the battle starts decides which animation plays.

In RPG Maker XP, open the event that starts the battle and add a **Control Variables** command *before* the command that launches it. Set variable 31 to the value of the transition you want:

- `3` for the Diamond/Pearl/Platinum gym leader transition
- `10` for the HeartGold/SoulSilver gym leader transition
- `11` for the Team Rocket transition

:::warning[Set the variable back afterwards]
Variable 31 keeps its value until something changes it, and the **same** variable also picks the transition for wild battles. Leave it on `3` and every wild encounter that follows plays a different animation than usual. Add a second **Control Variables** command after the battle to put it back to the value your project uses normally, `0` by default.
:::

If you prefer to do it from a script, the line is:

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 3
```

## The three transitions

| Value | On screen                                                                              | Images you must provide                                  | Size             |
| ----- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------- |
| `3`   | A blue-and-white bar scrolls behind a white **VS**, then the portrait slides in        | `bar_dpp_<battle sprite>` and `mugshot_<battle sprite>`  | 576x60 and 96x60 |
| `10`  | Same choreography, faster bar, a red crossed **VS** that vibrates                      | `bar_hgss_<battle sprite>` and `mugshot_<battle sprite>` | 576x65 and 96x60 |
| `11`  | The screenshot splits in two, searchlights sweep past, the portrait crosses the screen | `mugshot_<battle sprite>` only                           | 96x60            |

All of these files go in `graphics/battlebacks/vs_bar/`.

The bars are 576 pixels wide for a 320-pixel screen because they scroll in a loop: the extra width is what keeps the pattern moving without a visible seam.

The **VS** logos and the Team Rocket backgrounds ship with PSDK and are shared by every trainer, so you never have to provide them. The Team Rocket transition takes its backgrounds from `graphics/transitions/assets/team_rocket/` and only borrows the portrait from the `vs_bar` folder.

## Naming your files

The end of each filename is the opponent's **battle sprite**, the image used for the trainer on the battle screen. Open the trainer in Pokémon Studio, go to the **Resources** tab, and read the name under **Battle sprite**. A trainer whose battle sprite is `dp_13` needs:

- `bar_dpp_dp_13.png` for the Diamond/Pearl/Platinum transition
- `bar_hgss_dp_13.png` for the HeartGold/SoulSilver one
- `mugshot_dp_13.png` for the portrait, shared by all three

Two trainers sharing the same battle sprite therefore share the same VS bar and portrait, which is usually what you want for a recurring trainer class.

You can also drop a file named after the prefix alone, with no trainer name: `bar_dpp.png`, `bar_hgss.png` or `mugshot.png`. PSDK looks for the trainer-specific file first, and falls back to that one when it does not find it. It is the practical way to give every opponent a decent default without drawing one bar per trainer.

If neither exists, nothing crashes: the image is simply missing from the animation. Running the game in debug mode shows a `Defaulting to file` line in the console telling you which name PSDK ended up looking for. A blank bar or a missing portrait almost always means a typo in the filename.

## Adding your own trainer

1. In Pokémon Studio, open the trainer, go to **Resources** and note the name under **Battle sprite**.
2. Draw the portrait on a 96x60 canvas and save it as `mugshot_<battle sprite>.png`.
3. If you use transition `3` or `10`, draw the bar too, 576x60 for the first, 576x65 for the second, and save it as `bar_dpp_<battle sprite>.png` or `bar_hgss_<battle sprite>.png`.
4. Copy the files into `graphics/battlebacks/vs_bar/` of your project.
5. In the event that starts the battle, set variable 31 to `3`, `10` or `11` before launching the battle, and back to its usual value afterwards.
6. Start the game and trigger the battle.

In the two gym leader transitions the portrait starts out darkened and only lights up when the screen flashes, so a silhouette that reads well in black is worth more than fine detail.

## What ships in the pack

The `vs_bar` folder comes with sample bars and portraits you can use as reference, or as a starting canvas. A few things in it are worth knowing before you build on top of it:

- `bar_hgss_001` to `bar_hgss_005` are 320x128, not the 576x65 the transition expects. They belong to a different set and will not scroll correctly. Use `bar_hgss_006` and the ones after it as your reference.
- `vs_green.png`, `vs_transparent.png` and `hgss_border.png` are not used by PSDK at all. They are leftovers of the pack and you can ignore them.
- The graphics were collected by **SirLinfey**. Keep that credit in your game if you ship them as they are, and prefer your own artwork when you can.

## Conclusion

- The transition is chosen by **game variable 31**: `3` for the Diamond/Pearl/Platinum gym leader intro, `10` for the HeartGold/SoulSilver one, `11` for Team Rocket.
- The same variable also drives wild battle transitions, so set it back to its usual value once the battle is over.
- Every file lives in `graphics/battlebacks/vs_bar/` and ends with the opponent's **Battle sprite** name, read from the **Resources** tab in Pokémon Studio.
- Bars are 576x60 for the DPP transition and 576x65 for the HGSS one; portraits are 96x60 and shared by the three transitions.
- A file named after the prefix alone, such as `mugshot.png`, serves as a default for every trainer without one.
- To build a transition of your own instead of using the shipped ones, see [Create a custom battle transition](/psdk/battle-visual/3d-camera/how-to-create-a-battle-transition).
