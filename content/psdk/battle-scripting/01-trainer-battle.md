---
title: "How to script a trainer battle?"
slug: how-to-script-a-trainer-battle
sidebar_position: 1
description: "This guide explains how to start a fully custom trainer battle from a script by building a Battle::Logic::BattleInfo object, feeding it the player and trainer parties, and launching the battle scene."
---

This guide explains how to start a fully custom trainer battle from a script by building a Battle::Logic::BattleInfo object, feeding it the player and trainer parties, and launching the battle scene.

## Why script a battle

The usual way to start a trainer battle is to create the trainer in Pokémon Studio, then call one of the built-in event commands: `start_trainer_battle`, `start_double_trainer_battle`, or `start_double_trainer_battle_with_friend`. This is enough for most fights, but the team is **fixed at design time**: the same call always produces (almost) the same battle.

That becomes a wall the moment the opponent needs to depend on the game state:

- A **Battle Tower** or **Battle Frontier** where the enemy team scales to the player's level or party, instead of pre-building a thousand trainers by hand in the editor.
- A **rival** whose team, nicknames, or gender stay coherent across the game without manually locking every attribute.
- Any fight where the trainer's **name, class, or roster** is decided at runtime.

For all of these, you build the battle yourself through `Battle::Logic::BattleInfo`, the same object the event commands feed under the hood.

## What `Battle::Logic::BattleInfo` is

`Battle::Logic::BattleInfo` is the data object that describes everything the battle scene needs to start: who is fighting, on how many banks, with which music, and under which rules. Starting a battle is, in the end, handing a `BattleInfo` to the battle scene.

It lets you configure, among other things:

- The **trainers** taking part (a battle can even run without the player).
- The **battle** and **victory** music.
- A **level cap** (Pokémon above it are scaled down, and the battle then grants no experience).
- The **battle id** that ties the fight to its events.

The full attribute list is documented in the [BattleInfo YARD reference](https://psdk.pokemonworkshop.fr/yard/Battle/Logic/BattleInfo.html).

## Building the battle

### Step 1: create the BattleInfo object

`BattleInfo.new` accepts a hash that presets its attributes. The most common ones are:

- `battle_bgm`: music played when the battle starts.
- `victory_bgm`: music played on victory.
- `vs_type`: number of Pokémon sent out on each side (1 for a single battle, 2 for a double).
- `max_level`: level cap. Pokémon above it are brought down to this level.
- `fishing`: whether the battle was triggered by a fishing rod.

Every attribute has a default, so none of them are mandatory. Audio attributes accept either a plain filename (volume and pitch default to 100) or an `[filename, volume, pitch]` array. When you leave `battle_bgm` or `victory_bgm` out, RMXP uses whatever the event commands configured.

```ruby
# 1v1 battle, audio filenames only (volume and pitch default to 100)
bi = Battle::Logic::BattleInfo.new(
  battle_bgm: 'audio/bgm/rosa_wild_battle',
  victory_bgm: 'audio/bgm/xy_trainer_battle_victory'
)

# 2v2 battle capped at level 70, with full battle BGM info, victory BGM left to RMXP
bi = Battle::Logic::BattleInfo.new(
  vs_type: 2,
  max_level: 70,
  battle_bgm: ['audio/bgm/rosa_wild_battle', 80, 100]
)

# 1v1 battle, everything left to defaults
bi = Battle::Logic::BattleInfo.new
```

### Step 2: feed the player's data

Most trainer battles involve the player. Rather than gathering the player's sprite, party, name, and bag by hand, `BattleInfo` exposes `player_basic_info`, which returns all of it ready to use. The player always fights on **bank 0**:

```ruby
bi.add_party(0, *bi.player_basic_info)
```

`player_basic_info` returns the player's party, name, trainer class, battler sprite, and bag, splatted straight into `add_party`. The player's trainer class defaults to class 0, which is fine since it is never shown on the player's side.

### Step 3: feed the trainer's data

`add_party` is how you add a party to a bank. It takes up to ten arguments; only the first two are mandatory:

- `bank`: the bank the party fights on, `0` (player) or `1` (enemy).
- `party`: an array of `PFM::Pokemon`, the party itself.
- `name`: the trainer's name. **Its presence on bank 1 is what turns the fight into a trainer battle** (see below).
- `klass`: the trainer's class name, e.g. `"Pkmn Trainer"`.
- `battler`: the sprite filename in `graphics/battlers`.
- `bag`: the trainer's bag. The AI draws the items it uses from it.
- `base_money`: the base prize money (total reward is `base_money * level of the last Pokémon`).
- `ai_level`: the AI strength, from `0` (basic) to the highest available.
- `victory_text`: the message shown when this trainer is defeated (added in .26).
- `defeat_text`: the message shown when this trainer wins (added in .26).

```ruby
party = []
party << PFM::Pokemon.generate_from_hash(id: :mew, level: 100, shiny: true, given_name: 'Destroyer', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :arceus, level: 100, given_name: 'Featherweight', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :gardevoir, level: 100, given_name: 'Mega Devoir', trainer_name: 'Yuri', trainer_id: 0, item: :gardevoirite)

bag = PFM::Bag.new
bag.add_item(:full_restore, 50)
bag.add_item(:mega_glasses, 1) # Lets the AI mega-evolve, see note below

bi.add_party(1, party, 'Yuri', 'Bad Trainer', 'dp_33', bag, 255, 7)
```

`PFM::Pokemon.generate_from_hash` builds each Pokémon from a hash: `id` (db_symbol), `level`, `shiny`, `given_name` (nickname), `trainer_name`, `trainer_id`, `item` (held item), and many more keys are available.

:::note[Allowing mega evolution]
Mega evolution is not unlocked by one specific key item: any bag item flagged **"allows mega evolution"** in Studio (`isAllowingMega`) enables it. `:mega_glasses` is one such default item, and the Pokémon still needs to hold its mega stone (here `:gardevoirite`). Drop the item from the bag and the AI keeps a normal, non-mega team.
:::

### Step 4: start the battle

Once the BattleInfo is fully set up, hand it to the battle scene:

```ruby
$scene.call_scene(Battle::Scene, bi)
```

## Full script

Putting every step together, a complete custom trainer battle reads:

```ruby
bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)

party = []
party << PFM::Pokemon.generate_from_hash(id: :mew, level: 100, shiny: true, given_name: 'Destroyer', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :arceus, level: 100, given_name: 'Featherweight', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :gardevoir, level: 100, given_name: 'Mega Devoir', trainer_name: 'Yuri', trainer_id: 0, item: :gardevoirite)

bag = PFM::Bag.new
bag.add_item(:full_restore, 50)
bag.add_item(:mega_glasses, 1)

bi.add_party(1, party, 'Yuri', 'Bad Trainer', 'dp_33', bag, 255, 7)
$scene.call_scene(Battle::Scene, bi)
```

Because the whole party is built in plain Ruby, you can now drive it from the game state: scale the levels to `$pokemon_party`, pick the roster from a variable, or randomize it for a Battle Tower run.

## Trainer battle or wild battle

A battle is treated as a **trainer battle** only if the enemy bank carries at least one name. Internally, the engine decides with:

```ruby
def trainer_battle?
  return !@names[1].empty?
end
```

So if you call `add_party(1, party)` with just the bank and the party (no `name`), the enemy side has no name and the fight runs as a **wild battle**. Pass a `name` to bank 1 to get a trainer battle.

## Conclusion

- Build a `Battle::Logic::BattleInfo`, optionally presetting `vs_type`, `max_level` and the BGMs.
- Add the **player** on bank 0 with `add_party(0, *bi.player_basic_info)`.
- Add the **trainer** on bank 1 with `add_party`, providing at least a `name` so the fight counts as a trainer battle.
- Build each Pokémon with `PFM::Pokemon.generate_from_hash` and the trainer's items with `PFM::Bag`.
- Launch the fight with `$scene.call_scene(Battle::Scene, bi)`.
- Since the setup is plain Ruby, the team can depend on the player's level, party or any variable, which is exactly what fixed Studio trainers cannot do.
