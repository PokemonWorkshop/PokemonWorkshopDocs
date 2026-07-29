---
title: "Set up Safari battles"
slug: safari-battles
sidebar_position: 4
description: "PSDK ships a Safari battle mode for building a Safari Zone: the player throws Safari Balls, bait or mud instead of fighting, and each wild Pokémon can flee on its own. This guide covers turning the mode on and off, the four in-battle actions, and the catch and flee rates behind them."
---

PSDK ships a **Safari battle** mode for building a Safari Zone: the player throws Safari Balls, bait or mud instead of fighting, and each wild Pokémon can flee on its own. This guide covers turning the mode on and off, the four in-battle actions, and the catch and flee rates behind them.

## How Safari battles differ

In a Safari Zone the player walks into tall grass with a fixed stock of **Safari Balls** and no team to fight with. Every encounter is the same tense gamble: soften the Pokémon up with bait or mud, throw a ball, and hope it neither breaks free nor bolts before the next throw. There is no attacking, no fainting, and no second chance once the Pokémon flees.

PSDK models this as a wild-battle **mode** rather than a separate kind of encounter. When the mode is on, any wild battle that would normally start runs through `Battle::Safari` instead of the usual battle scene: the move menu is replaced by the Safari actions, the player's Pokémon never attacks, and both sides have their abilities and held items neutralised for the duration so nothing skews the catch.

The mode itself is a single game variable. Everything else, giving out the balls, the encounters, the zone itself, is ordinary PSDK content that you already know how to build.

## Turning Safari mode on

Safari mode is driven by game variable **50**, exposed as `Yuki::Var::BT_Mode`. Setting it to `5` switches every wild battle to the Safari scene:

```ruby
$game_variables[Yuki::Var::BT_Mode] = 5
```

This is a **zone** switch, not a per-battle one. The engine reads it again and again while the battle plays out (for the action menu, the intro animation, the sprites), so it has to stay `5` for the whole fight, and it stays `5` afterwards too. The natural place to set it is the moment the player enters the Safari Zone, for example in the map's autorun event or a transfer event.

Once the mode is on, the player still needs something to throw. Hand them a stock of **Safari Balls** (the `:safari_ball` item) the same way you give any item, see [Give an item to the player](/rpg-maker-xp/give-an-item):

```ruby
$bag.add_item(:safari_ball, 30)
```

From there, encounters in the zone's grass become Safari battles on their own, with nothing else to wire up. To trigger a specific Safari encounter from an event, start a wild battle as usual while the mode is on, see [Start a wild battle](/rpg-maker-xp/start-a-wild-battle):

```ruby
call_battle_wild(:tauros, 25)
```

The same `call_battle_wild` that produces a normal wild battle produces a Safari one here, purely because `BT_Mode` is `5`.

## Turning it back off

The engine never resets `BT_Mode` on its own. If you leave it at `5`, **every** later wild encounter anywhere in the game stays a Safari battle. Clear it when the player leaves the zone:

```ruby
$game_variables[Yuki::Var::BT_Mode] = 0
```

A Safari Zone usually does a bit of cleanup on exit, alongside resetting the mode: take back any unused Safari Balls and hand over whatever the player caught. Removing the leftover balls keeps them from carrying over to the next visit:

```ruby
$game_variables[Yuki::Var::BT_Mode] = 0
$bag.remove_item(:safari_ball, $bag.item_quantity(:safari_ball))
```

PSDK has no built-in step counter, timer or ball budget for the Safari Zone. The classic "500 steps then you are escorted out" rule is game logic you build yourself with events and variables; the engine only provides the battle mode.

## Inside a Safari battle

Each turn the player picks one of four actions instead of a move:

| Action          | What it does                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **Safari Ball** | Throws a Safari Ball at the Pokémon, consuming one from the bag, then rolls the normal catch formula.  |
| **Bait**        | Raises the catch rate by one stage. 90% of the time it also makes the Pokémon **more** likely to flee. |
| **Mud**         | Lowers the flee rate by one stage. 90% of the time it also makes the Pokémon **harder** to catch.      |
| **Flee**        | Leaves the battle. In a Safari battle this always succeeds.                                            |

Bait and mud are deliberate opposites, and each carries a downside the other does not:

- **Bait** makes the catch easier but usually makes the Pokémon jumpier, so you are racing your own throws.
- **Mud** keeps the Pokémon around longer but usually makes it harder to pocket, so it costs you balls.

The 90% rolls are what keep this from being a free lunch: one bait in ten raises the catch rate without raising the flee rate, and one mud in ten lowers the flee rate without hurting the catch rate, each announced by its own message.

When the player runs out of Safari Balls, throwing one is impossible: the Pokémon flees and the battle ends. Always make sure the player starts the zone with a stock.

### Catch and flee rates

Bait and mud do not edit a percentage directly. They move a **stage**, an integer that starts at `0` and is bounded to the `-6`…`+6` range, exactly like an in-battle stat change. A stage is turned into a multiplier on the underlying rate:

| Stage | Multiplier |
| ----- | ---------- |
| +6    | ×4.0       |
| +2    | ×2.0       |
| +1    | ×1.5       |
| 0     | ×1.0       |
| −1    | ×0.67      |
| −2    | ×0.5       |
| −6    | ×0.25      |

Two separate stages run in parallel: a **catch** stage and a **flee** stage.

The catch stage scales the Pokémon's catch rate (`rareness`) just before a ball is thrown:

```ruby
catch_rate = (rareness * multiplier(catch_stage)).clamp(1, 255)
```

That modified rate then feeds the normal capture formula, the same one a Poké Ball uses outside the Safari Zone.

The flee stage scales a base flee rate computed from how rare and how fast the Pokémon is:

```ruby
base_flee_rate = ((255 - rareness + base_spd) / 2).clamp(1, 255)
flee_rate = (base_flee_rate * multiplier(flee_stage)).clamp(1, 255)
```

A rarer Pokémon (lower `rareness`) and a faster one (higher `base_spd`) flee more readily. After every bait, mud or failed ball, the Pokémon takes its turn and rolls against this rate: if the roll lands at or below `flee_rate`, it escapes and the battle ends. A successful capture is the only outcome that ends the battle in the player's favour.

## Reading the outcome

A Safari battle reports through the same switches as a normal wild encounter, so an event after the battle can branch on what happened. The catch is that the Safari scene only ever ends two ways: a capture, or `battle_result = 1` for everything else, whether the player chose Flee, the Pokémon fled, or the bag ran empty. That single result maps to one switch:

| Switch           | ID  | Meaning                                                                                   |
| ---------------- | --- | ----------------------------------------------------------------------------------------- |
| `BT_Catch`       | 38  | the player caught the Pokémon                                                             |
| `BT_Player_Flee` | 35  | the battle ended any other way (the player fled, the Pokémon fled, or no balls were left) |

`BT_Wild_Flee` (switch `34`) is **not** set by a Safari battle: it requires the result code `3`, which the Safari scene never produces, so a fleeing wild Pokémon still reports as `BT_Player_Flee`. The only distinction worth reading is therefore `BT_Catch`: test it (switch `38`) right after the battle to react to a successful catch, and treat every other ending as the player walking away empty-handed.

## Conclusion

- Safari mode is game variable **50** (`Yuki::Var::BT_Mode`): set it to `5` to turn every wild battle into a Safari battle, back to `0` to stop.
- It is a **zone** switch, enable it on entry and clear it on exit; the engine never resets it for you, and it must stay on for the whole battle.
- Give the player `:safari_ball` items to throw; running out ends the battle with the Pokémon fleeing.
- In battle the player throws a ball, bait (easier catch, jumpier Pokémon) or mud (calmer Pokémon, harder catch), or flees, which always works.
- Bait and mud move a catch stage and a flee stage in the `-6`…`+6` range; those stages scale the catch rate and the base flee rate, and the Pokémon rolls to flee after each action.
- Read the result through `BT_Catch` (switch 38) for a capture; every other ending reports as `BT_Player_Flee` (35), and there is no win or loss switch.
