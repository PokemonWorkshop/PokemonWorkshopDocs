---
title: "FollowMe and Let's Go mode"
slug: followme
sidebar_position: 4
description: "FollowMe is the PSDK system that makes characters trail the player on the map: party Pokémon, NPCs, or a single lead Pokémon in Let's Go mode. This guide explains the follower stack, the switches and variables that drive it from events or script, the Let's Go follower, and how to control followers and following events."
---

**FollowMe** is the PSDK system that makes characters trail the player on the map: party Pokémon, NPCs, or a single lead Pokémon in Let's Go mode. This guide explains the follower stack, the switches and variables that drive it from events or script, the Let's Go follower, and how to control followers and following events.

## The problem: a living party

Modern Pokémon games rarely leave the player walking alone. The lead Pokémon strolls behind the player like in Pokémon Let's Go, a rival escorts the player down a route, a captured Pokémon trots along until it is dropped off. Each of these is a character that copies the player's path with a one-tile delay, turning when the player turns, stopping when the player stops.

Scripting that by hand on every map is hopeless: you would have to record the player's movements and replay them onto each character, frame by frame, on every tile. **FollowMe** does it for you. It maintains a **stack of followers** behind the player and updates their position every frame, so all you decide is *who* follows and *when*, never *how* they move.

## How FollowMe works

FollowMe is the `Yuki::FollowMe` module. On every frame, while the player is on the map, it rebuilds the follower stack from scratch out of three sources, always in the same order:

1. **Humans** (NPCs / heroes), taken from the game's actors. Actor 1 (`$game_actors[1]`) is the player, so the human followers start at the second actor (`$game_actors[2]`, `$game_actors[3]`...).
2. **Party Pokémon**, taken from the player's team (`$actors`), or a **single lead Pokémon** when Let's Go mode is on.
3. **Friend's Pokémon**, taken from a secondary party (`$storage.other_party`), used for escort or co-op scenarios.

Each source has a **count**: how many entities from it currently follow. A count of `0` means that source contributes nobody. The whole stack is the concatenation of the three, so a single tail of characters trails the player in that order. **Fainted Pokémon are skipped automatically**, so you never recompute counts after a battle.

The key thing to understand is that FollowMe stores its whole configuration in **one switch and a handful of variables**. The `Yuki::FollowMe` methods are thin wrappers around them. That means you can drive the system either from RMXP event commands (Control Switches / Control Variables) or from script calls, whichever fits the event you are building.

## Switches and variables

These are the system switch and variables FollowMe reads. You can set them directly with the **Control Switches** and **Control Variables** event commands, or through the matching `Yuki::FollowMe` accessor.

| ID | Kind | Role | Script accessor |
| --- | --- | --- | --- |
| Switch **19** | Switch | Whole system on/off (`Sw::FM_Enabled`) | `Yuki::FollowMe.enabled` |
| Switch **29** | Switch | Let's Go mode on/off (`Sw::FollowMe_LetsGoMode`) | `Yuki::FollowMe.in_lets_go_mode?` / `lets_go_mode=` |
| Variable **18** | Variable | Number of human followers (`Var::FM_N_Human`) | `Yuki::FollowMe.human_count` |
| Variable **19** | Variable | Number of party Pokémon followers (`Var::FM_N_Pokem`) | `Yuki::FollowMe.pokemon_count` |
| Variable **20** | Variable | Number of friend's Pokémon followers (`Var::FM_N_Friend`) | `Yuki::FollowMe.other_pokemon_count` |
| Variable **21** | Variable | Selected follower for movement (`Var::FM_Sel_Foll`) | `Yuki::FollowMe.selected_follower` |

Note that switch 19 and variable 19 are unrelated: one is the on/off switch, the other is the party Pokémon count. They live in separate switch and variable spaces.

All of these are saved with the player's game, so a follower configuration survives saving and loading without extra work.

## Enabling followers and choosing who follows

Turning the system on is a single switch. From an event, use **Control Switches** to set switch 19 to ON. From script:

```ruby
Yuki::FollowMe.enabled = true
```

With the switch off, the stack is cleared and nobody follows; with it on, the counts take effect. Then set how many entities follow, per source. From an event, use **Control Variables** on variables 18, 19 and 20; from script:

```ruby
# The first 3 Pokémon of the player's party follow
Yuki::FollowMe.pokemon_count = 3

# One NPC (the actor with id 2) follows the player
Yuki::FollowMe.human_count = 1

# Two Pokémon from the friend's party follow
Yuki::FollowMe.other_pokemon_count = 2
```

Each setter maps to one source:

- `pokemon_count` (variable 19) takes the **first N Pokémon of the player's party**, in party order, skipping any that have fainted.
- `human_count` (variable 18) takes **N actors starting at id 2**. Actor 1 is the player, so `human_count = 1` adds actor 2, `human_count = 2` adds actors 2 and 3, and so on. Configure those actors' appearance like any RMXP hero.
- `other_pokemon_count` (variable 20) takes the **first N Pokémon of the secondary party** (`$storage.other_party`), the team used for escorts.

All three are also getters, so you can read the current configuration before changing it. A common setup is two lines in an event: enable the system and make the lead Pokémon follow.

```ruby
Yuki::FollowMe.enabled = true
Yuki::FollowMe.pokemon_count = 1
```

To stop everyone from following, set the counts back to `0`, or turn switch 19 off (`Yuki::FollowMe.enabled = false`).

## Let's Go mode

The setup above shows the **first N** Pokémon of the party. But the Let's Go games do something different: a **single** Pokémon follows, and it is not necessarily the first in the party. The player opens the team menu and chooses which Pokémon walks with them. That is **Let's Go mode**, toggled by switch 29.

```ruby
Yuki::FollowMe.lets_go_mode = true
```

When this switch is on, the party source is read differently: instead of the first `pokemon_count` Pokémon, the stack shows **exactly one** Pokémon, the one stored as the Let's Go follower. In this mode `pokemon_count` (variable 19) is ignored for the party source; the human and friend sources still work as before.

The chosen Pokémon is held in `$storage.lets_go_follower`. The player normally sets it from the **team menu**: when Let's Go mode is on, each Pokémon gains a **Follow** / **Unfollow** choice (these choices appear only in Let's Go mode). You can also set it from a script, for example to force a starter to follow right after it is received:

```ruby
# Make the first party Pokémon the Let's Go follower
$storage.lets_go_follower = $actors[0]

# Clear the follower (nobody walks behind the player)
$storage.lets_go_follower = nil
```

The follower must be **alive** and **still in the party** to be shown: if the chosen Pokémon faints or is withdrawn, FollowMe simply shows nobody until a valid follower is set again.

## Pausing followers temporarily

Sometimes you need to hide the followers for a moment, a cutscene, a scripted sequence, without forgetting the configuration. Toggling switch 19 off and on again works, but you would have to remember the previous state yourself. FollowMe offers a dedicated pair for this:

```ruby
# Hide the followers but remember they were enabled
Yuki::FollowMe.smart_disable

# Later, restore them to their previous state
Yuki::FollowMe.smart_enable
```

`smart_disable` records that the system was on and turns it off; `smart_enable` puts it back to whatever it was. The one subtlety is that followers are hidden while the player is on a bike, so a system that re-enables them should skip the restore when the player is currently biking:

```ruby
Yuki::FollowMe.smart_enable unless $game_switches[Yuki::Sw::EV_Bicycle] || $game_switches[Yuki::Sw::EV_AccroBike]
```

## Moving a single follower from an event

Followers normally mirror the player automatically, but a cutscene sometimes needs one follower to act on its own, for instance to walk up to an NPC while the player stays put. FollowMe lets you **redirect player move commands onto a chosen follower**.

Set the **selected follower** (variable 21) to its position in the stack (1 for the first follower, 2 for the second, and so on):

```ruby
# Subsequent "player" move commands now drive the first follower
Yuki::FollowMe.selected_follower = 1
```

While this is set, the automatic mirroring is suspended for that follower, and a move route aimed at the player moves the follower instead, so you can reuse the ordinary move-command tools on it. Reset it to `0` to give control back to the player:

```ruby
Yuki::FollowMe.selected_follower = 0
```

The index is **1-based** and clamped to the number of followers, with `0` meaning "no follower selected" (the default). From a script you can also reach a follower directly: `Yuki::FollowMe.get_follower(0)` returns the first follower (0-based here), falling back to the player if the index is invalid. To act on all of them at once, iterate:

```ruby
# Turn every follower to face down
Yuki::FollowMe.each_follower { |character| character.turn_down }
```

## Making events follow a character

The follower stack above is the party-and-NPC system. There is a second, lower-level mechanism: making **any map event** trail the player or another event, like a Pokémon you escort across a single map. This is done with `set_follower`, directly on the character that should be followed.

```ruby
# Make event 5 follow the player (queued behind any existing followers)
$game_player.set_follower(get_character(5))

# Make event 1 follow event 2
get_character(2).set_follower(get_character(1))
```

`get_character(id)` is the interpreter helper for reaching a map event by its id (and the player via `-1`). When you attach an event to the player, it is placed at the **tail** of the following queue, after the Pokémon and NPCs already there, so it never displaces them.

To detach everything following the player, reset the queue:

```ruby
$game_player.reset_follower
```

This is the clean way to end an escort: the event stops trailing the player and the regular follower stack carries on.

## Keeping followers above bridges

When the player walks over a bridge, the engine raises their Z layer so they draw above the tiles below. Their followers must move with them, or they would render under the bridge. Move the whole line at once:

```ruby
# Raise the player and every follower onto the bridge layer
$game_player.change_z_with_follower(4)

# Back to ground level
$game_player.change_z_with_follower(0)
```

`change_z_with_follower` sets the player's Z and propagates it to every follower in the queue, so the trailing characters stay on the same layer as the player.

## What the engine handles for you

The rest of FollowMe runs without your involvement, and it is worth knowing what *not* to script:

- **Warps.** When the player changes map, the engine repositions the followers around the player, or resets them onto the player for an indoor entrance. The line is reassembled on the new map for free.
- **Battles.** Before a battle the engine saves the followers' positions and restores them afterwards. A Pokémon set as the Let's Go follower even gets a dedicated send-out animation when it enters battle.

In day-to-day work you set the switch, the counts and the mode; the warp, battle and particle plumbing takes care of itself.

## Going further

- The [Scheduler](/psdk/core-systems/scheduler) is what drives FollowMe's per-frame update and its warp hooks. Read it to understand *when* the engine recomputes the stack.
- [System Tags](/psdk/core-systems/system-tags) govern how the terrain reacts under each character, including the followers walking behind the player.

## Conclusion

- **FollowMe** (`Yuki::FollowMe`) maintains a stack of characters trailing the player, rebuilt every frame from three sources: humans, party Pokémon, and friend's Pokémon, in that order.
- The system is driven by **switch 19** (on/off) and **variables 18, 19, 20** (the counts), settable from event commands or through the `enabled=`, `human_count=`, `pokemon_count=` and `other_pokemon_count=` accessors. Fainted Pokémon are skipped, and the configuration is saved with the game.
- **Let's Go mode** (switch 29) replaces the party source with a single Pokémon, `$storage.lets_go_follower`, that the player picks from the team menu's Follow / Unfollow choice.
- Pause followers with `smart_disable` / `smart_enable` (guarding the restore against the bike switches), and move a single follower from an event with `selected_follower` (variable 21, 1-based, `0` to release).
- Make any event follow with `set_follower` and detach with `reset_follower`; keep a line together across bridges with `change_z_with_follower`.
- Warps, battles and particles are handled automatically.
