---
title: "Battle with an ally"
slug: battle-with-an-ally
sidebar_position: 13
description: "PSDK can put a second trainer on the player's side, fighting alongside them with its own team, its own bag and its own AI. This guide covers how to declare an ally for a trainer battle and for a wild battle, how an ally forces the battle into a double or a triple, and what it changes for the player."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK can put a second trainer on the player's side, fighting alongside them with its own team, its own bag and its own AI. This guide covers how to declare an **ally** for a trainer battle and for a wild battle, how an ally forces the battle into a double or a triple, and what it changes for the player.

An ally is not a special kind of data. It is an ordinary trainer from the Pokémon Studio database, placed on the player's side of the field instead of the opposing side. The player never gives it orders: the ally plays its own turns.

## Prepare the ally in Studio

Create the ally like any other trainer in the **Trainers** database. Three fields do the work:

- **Party** — the team the ally brings. It fights with these Pokémon and nothing else; the player's team is untouched.
- **Battle sprite** — the sprite shown on the player's side of the field. Without it the ally has nothing to display.
- **AI Level** — how well the ally plays. This is the only lever you have on its behaviour, so a "rival helping out" and a "clueless kid tagging along" are the same feature with a different number here.

The level matters more for an ally than for an opponent, because an ally the player cannot command is only as useful as its AI. Three thresholds are worth knowing:

| AI Level                        | What it unlocks                                                         |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Basic** to **Medium**         | picks moves only, never switches, never uses an item                    |
| **Hard** and **Lieutenant**     | starts switching its Pokémon and using stat-boosting items from its bag |
| **Gym Leader** and **Champion** | also uses healing items, so it keeps itself alive                       |

Below **Hard**, filling the ally's bag changes nothing, and below **Gym Leader** it will never heal. An ally meant to carry a fight should sit at **Gym Leader** or above.

The ally's **name** and **Trainer class** are used in the message announcing that it sends its Pokémon out.

Three other fields are simply ignored for an ally:

- **Battle type** — the format is decided by the ally's presence, not by this field. See the sections below.
- **Base money** — prize money only ever comes from the opposing side, so an ally never pays the player.
- The **victory** and **defeat** dialogues, which only opposing trainers speak.

:::warning[An ally can hijack the battle's music]

In a **trainer** battle, PSDK adds the ally after the opponents, and each trainer added contributes its own battle music and its own **Scenarized battle** identifier if it has one. Since the ally comes last, its battle music wins over the opponent's, and its **Scenarized battle** replaces the one the fight was supposed to run. Leave both empty on a trainer you intend to use as an ally, unless you want exactly that.

:::

## The two variables

Everything on this page comes down to two game variables holding the Studio ID of the allied trainers:

| Variable | ID  | Meaning                    |
| -------- | --- | -------------------------- |
| Ally     | 36  | the allied trainer         |
| Ally 2   | 38  | the second allied trainer  |

A value of `0` means "no ally". Any positive value is read as a trainer ID, and the trainer with that ID joins the player's side.

The commands below are [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): you call them from an event's **Script** command, without any prefix.

## A double trainer battle with an ally

For the standard case, two opponents facing the player and their ally, one command declares the whole fight:

```ruby
start_double_trainer_battle_with_friend(286, 287, 289)
```

`286` and `287` are the two opposing trainers, `289` is the ally. The command fills the variables for you, so there is nothing else to set up.

The field then holds four Pokémon: the player's lead, the ally's lead, and one Pokémon from each opponent. This is the part that surprises most makers: **the player only sends out one Pokémon**. The ally occupies the second slot on their side, which also means a battle like this one can start with a single able Pokémon in the player's team.

### A lone opponent facing the pair

You can also send the player and their ally against a single trainer. Declare the ally by hand, on the line after the usual trainer battle command:

```ruby
start_trainer_battle(286)
$game_variables[36] = 289
```

The ally alone is enough to make the fight a double, so the lone opponent has to fill both of its slots and sends out two of its own Pokémon. That is the easiest way to write an "outnumbered boss" fight without creating a second trainer for it.

## A triple battle with two allies

Two allies make a triple battle, three Pokémon per side:

```ruby
start_triple_trainer_battle_with_friend(286, 287, 288, 289, 290)
```

The first three IDs are the opponents, the last two are the allies. Positions are handed out one party at a time, starting with the player, so the player's side reads: player, first ally, second ally. The player again sends out **one** Pokémon and the allies fill the two remaining slots.

With a single ally in a triple battle, the player takes the slots the allies do not: the side reads player, ally, player, and the player needs two able Pokémon.

Late in a triple battle, when only one Pokémon is left standing on each side and they sit two slots apart, PSDK slides them both towards the centre so they can reach each other. Nothing to configure, it happens on its own, and it applies with allies exactly as it does without.

## A wild battle with an ally

An ally works in a wild battle too, but the two ways of starting one behave differently, and mixing them up is the usual reason an ally seems to be missing.

### A random encounter

For encounters in the grass, declare the ally and let the player walk into a wild group as usual:

```ruby
$game_variables[36] = 289
```

The ally now **overrides the wild group's format**: the group draws two wild Pokémon even when its **Battle type** is set to Simple, and three if you also set the second ally in variable `38`. This is the only place where declaring an ally changes how many wild Pokémon appear.

### A battle started by an event

When you start the wild battle yourself with [`call_battle_wild`](/rpg-maker-xp/start-a-wild-battle), the format is decided by the number of wild Pokémon you pass, and by nothing else. Declaring an ally does not add a second wild Pokémon here, so you have to pass one:

```ruby
$game_variables[36] = 289
call_battle_wild(:zigzagoon, 7, :wurmple, 6)
```

With a single wild Pokémon, the battle stays a one-versus-one and the ally never reaches the field, even though it was declared. Set the variable **before** the call: the battle is built the moment `call_battle_wild` runs.

### Clear the variables afterwards

A trainer battle resets both ally variables on its own when it ends, in victory or in defeat. **A wild battle does not.** Nothing in the engine puts variable `36` or `38` back to `0` on that path, so an ally declared for one wild encounter stays in every battle that follows, including the next trainer battle.

Clear them yourself once the encounter is over, with a **Control Variables** command or from a script:

```ruby
$game_variables[36] = 0
$game_variables[38] = 0
```

The safe pattern is to declare the ally when the escort sequence begins and clear it when the sequence ends, rather than around each individual battle.

## What the ally does, and does not do

The ally is a teammate, not a second controller. What that means concretely:

- **The player gives it no orders.** The action menu only ever asks for the player's own Pokémon; the ally chooses its moves through its AI.
- **The player cannot manage its Pokémon.** The switch menu and the item menu both filter down to the player's own team, so its Pokémon cannot be swapped out or healed by the player.
- **The ally uses its own bag,** the one configured on the trainer in Studio, from **Hard** upwards.
- **Its Pokémon earn no experience and no EV,** and they do not eat into the player's share either: experience is split among the player's Pokémon exactly as it would be without an ally.
- **Its Pokémon take no lasting damage.** They are rebuilt from the Studio data at the start of every battle, so an ally used twice in a row starts the second fight at full health.
- **The battle is lost as soon as the player's own Pokémon are all knocked out,** even with the ally still standing. An ally buys the player help, not a safety net.

## Going further

Switch `48` lifts that last rule. With it on, the battle no longer ends when the player runs out of Pokémon: the ally keeps playing and can finish the fight on its own. It is what you need for a scripted battle the player is meant to watch, or to lose without being knocked out of the story. Turn it back off afterwards, as it applies to every battle while it is on.

## Conclusion

- An ally is an ordinary Studio trainer placed on the player's side; variables `36` and `38` hold the allied trainer IDs.
- `start_double_trainer_battle_with_friend(a, b, ally)` and `start_triple_trainer_battle_with_friend(a, b, c, ally1, ally2)` declare a trainer battle with one or two allies.
- An ally forces the battle into a double, two allies into a triple, and the player then sends out fewer Pokémon of their own: one in a double, one in a triple with two allies.
- In a random wild encounter, an ally also forces the wild group to draw two Pokémon (three with a second ally). With `call_battle_wild`, pass the extra wild Pokémon yourself.
- A trainer battle clears the ally variables on its own; a wild battle does not, so reset them to `0` when the sequence is over.
- The ally plays on its own AI with its own bag, gains no experience and earns no prize money, and the battle is still lost when the player's own team falls, unless switch `48` is on.
