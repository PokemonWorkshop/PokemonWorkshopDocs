---
title: "Script a trainer battle"
slug: how-to-script-a-battle
sidebar_position: 1
description: "This guide explains how to build a trainer battle from a script, for the runtime cases Pokémon Studio's editor alone cannot cover: an opposing team that depends on the game state, assembled from existing Studio data."
---

This guide explains how to build a trainer battle from a script, for the runtime cases Pokémon Studio's editor alone cannot cover: an opposing team that depends on the game state, assembled from existing Studio data.

To start a **wild** battle instead, see [Start a wild battle](/rpg-maker-xp/start-a-wild-battle).

## Why script a trainer battle

Pokémon Studio already authors every **static** part of a battle. A trainer carries a full team, a bag, an AI level, prize money and dialogue, and each Pokémon can have its own form, gender, nature, IVs, EVs, held item, moves, ability and shininess. For a fixed fight, the editor is enough and a script adds nothing.

You reach for a script when the opposing side must be decided **at runtime**:

- A trainer whose team **depends on the game state**: a rival that counters the player's starter, or a "trainer tower" whose levels scale with the player.
- Simply launching a battle from **your own logic** instead of a map event.

## Building the battle

When you need full control over the opposing side, or a team that depends on the player, you build the battle yourself with `Battle::Logic::BattleInfo`, the object every battle ultimately runs on.

This guide assumes you are comfortable with the Ruby basics from the [Ruby course](/ruby/variables-and-data-types), especially [methods and blocks](/ruby/methods-and-blocks), [strings and symbols](/ruby/strings-and-symbols) and, for the last section, [prepend](/ruby/extending-code-with-prepend). If a piece of syntax below is unfamiliar, that course is the place to catch up.

### The interface in short

```ruby
bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, name, klass, battler, bag, base_money, ai_level)
$scene.call_scene(Battle::Scene, bi)
```

- `add_party(bank, party, ...)` adds a party to a bank: `0` for the player, `1` for the enemy. Only `bank` and `party` are mandatory; the rest are `name, klass, battler, bag, base_money, ai_level, victory_text, defeat_text`.
- A **`name` on bank 1 is what makes it a trainer battle**. Without one, the enemy side is nameless and the fight runs as a wild battle.
- `player_basic_info` returns the player's party, name, class, sprite and bag, ready to splat into `add_party` on bank 0.
- `BattleInfo.new` accepts a hash to preset `vs_type`, `max_level`, `battle_bgm`, `victory_bgm`, `defeat_bgm`, `background_name`, `battle_id` and more.

Hand-writing the enemy party is possible, but the high-value patterns build it from data that already exists.

### Example: a scaling trainer tower

Instead of cloning a trainer a dozen times at rising levels in the editor, author it **once** in Studio and raise its levels at battle time:

```ruby
trainer = data_trainer(:ace_trainer_gary)
target_level = $actors.sum(&:level) / $actors.size # the player's average level

party = trainer.party.map { |encounter| encounter.to_creature(target_level) }
bag = PFM::Bag.new
trainer.bag_entries.each { |entry| bag.add_item(entry[:dbSymbol], entry[:amount]) }

bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, trainer.name, trainer.class_name, trainer.resources, bag, trainer.base_money, trainer.ai)
$scene.call_scene(Battle::Scene, bi)
```

Here `$actors` is PSDK's global array holding the player's current party. `data_trainer` loads the Studio trainer (by db_symbol or id), and `encounter.to_creature(level)` builds each of its Pokémon at the level you pass, omit the argument to keep the levels set in Studio. One trainer now powers an entire tower of escalating fights.

### Example: a rival that counters the player's starter

Rather than building three near-identical rivals per fight in Studio, author **one** and add the counter of the player's starter to its team when the battle starts:

```ruby
# Replace this with however your project records the chosen starter (here a game variable holding a db_symbol).
player_starter = $game_variables[10]
counter = { bulbasaur: :charmander, charmander: :squirtle, squirtle: :bulbasaur }[player_starter]

trainer = data_trainer(:rival_route_1)
party = trainer.party.map(&:to_creature)
party << PFM::Pokemon.generate_from_hash(id: counter, level: party.map(&:level).max)

bag = PFM::Bag.new
trainer.bag_entries.each { |entry| bag.add_item(entry[:dbSymbol], entry[:amount]) }

bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, trainer.name, trainer.class_name, trainer.resources, bag, trainer.base_money, trainer.ai)
$scene.call_scene(Battle::Scene, bi)
```

You author the rival once and the type matchup follows the player's choice. The same "load then modify" approach opens other ideas: a grind trainer whose team is drawn from the Pokémon the player has caught, or "ghost" trainers replaying another player's team.

## Tune a trainer's Pokémon at runtime with extra

The examples above rebuild the whole battle. Often you only need to nudge **one Pokémon** of an existing trainer, and you can do that without assembling a `BattleInfo` at all. Every entry of `trainer.party` is a `Group::Encounter` carrying a mutable `extra` hash, the very hash Studio fills with each Pokémon's per-instance settings (nature, IVs, held item, and so on). Mutate it before the fight starts and the change is applied when the team is generated.

### Override a Studio setting at runtime

Studio already sets each of these values statically. `extra` earns its place when the value must depend on the **game state**: the difficulty, a story flag, or the player's choices. Load the trainer, tweak the entries you want, then launch the fight with `start_trainer_battle`:

```ruby
trainer = data_trainer(0)              # the trainer authored in Studio

if $game_switches[1]                   # a "hard mode" switch, for example
  boss = trainer.party[0]              # its first Pokémon (a Group::Encounter)
  boss.extra[:stats] = [31, 31, 31, 31, 31, 31] # perfect IVs
  boss.extra[:item] = :leftovers                 # force a held item
end

start_trainer_battle(0)                # launch the fight against that trainer
```

`start_trainer_battle(id)` builds and starts the trainer battle for you, no `BattleInfo` required. The keys `extra` understands mirror Studio's per-Pokémon fields:

| Studio field | `extra` key | Value |
| --- | --- | --- |
| Nickname | `:given_name` | a `String` |
| Gender | `:gender` | `1` (male) or `2` (female) |
| Nature | `:nature` | a db_symbol, e.g. `:adamant` |
| IVs | `:stats` | `[hp, atk, dfe, spd, ats, dfs]`, each `0` to `31` |
| EVs | `:bonus` | `[hp, atk, dfe, spd, ats, dfs]` |
| Held item | `:item` | an item db_symbol, e.g. `:leftovers` |
| Ability | `:ability` | an ability db_symbol |
| Moves | `:moves` | an array of move db_symbols |
| Loyalty | `:loyalty` | an `Integer` |

Setting one of these in Studio and overwriting it here are the same operation, so reach for `extra` only when the value cannot be fixed ahead of time.

### Carry your own data with a custom key

:::note[Optional, advanced]
This subsection reopens a class and uses `module`, `prepend` and `super`. If the built-in `extra` keys in the table above already cover your case, you can skip it.
:::

`extra` is a plain hash, so you can also store a key PSDK knows nothing about:

```ruby
trainer.party[0].extra[:my_flag] = true
```

PSDK ignores keys it does not recognise, and it does **not** copy them onto the generated Pokémon, so on its own this line does nothing. To act on a custom key, read it yourself. The clean way is to extend `PFM::Pokemon`'s constructor with a `prepend` module, the [monkey-patching](/getting-started/customize-psdk/monkey-patching-in-psdk) convention (its mechanics are covered in [Extending code with prepend](/ruby/extending-code-with-prepend)), and keep the value on the Pokémon:

```ruby
module PFM
  class Pokemon
    module ExtraFlagReader
      def initialize(*args)
        super
        # the options hash is optional and comes last, so grab it defensively
        options = args.last.is_a?(Hash) ? args.last : {}
        @my_flag = options[:my_flag]
      end

      # @return [Boolean, nil]
      attr_reader :my_flag
    end
    prepend ExtraFlagReader
  end
end
```

Now any Pokémon generated from an entry whose `extra` held `:my_flag` answers to `pokemon.my_flag`, and your own scripts, or a plugin, can branch on it. This is how a plugin turns a Studio-authored Pokémon into a "boss" without you rebuilding the trainer by hand.

## Reading the outcome

Register `$game_temp.battle_proc` **before** launching the scene; it is called with the result code when the battle ends:

```ruby
$game_temp.battle_proc = proc do |result|
  # 0 = player won, 1 = player fled, 2 = player lost, 3 = enemy fled
  case result
  when 0
    # handle victory
  when 2
    # handle defeat
  end
end
$scene.call_scene(Battle::Scene, bi)
```

The same outcome also sets the global switches `BT_Victory`, `BT_Player_Flee` and `BT_Defeat`, which an event running after the battle can test.

## Conclusion

- Studio authors the static data; you script a trainer battle for runtime-dependent fights, or to launch one from your own logic.
- Build a `Battle::Logic::BattleInfo`, add the player on bank 0 and the trainer on bank 1, then launch with `$scene.call_scene(Battle::Scene, bi)`.
- Load existing Studio trainers with `data_trainer` and `to_creature(level)` to **reuse and modify** their teams: scale a trainer tower, or counter the player's starter, without cloning trainers in the editor.
- Tune a single Pokémon of an existing trainer through its `extra` hash: override a Studio setting at runtime, or carry a custom key your own `prepend` reads, then launch with `start_trainer_battle`.
- Read the result through `$game_temp.battle_proc` (or the `BT_Victory` / `BT_Defeat` switches) to branch your event.
- For a wild battle, see the [Start a wild battle](/rpg-maker-xp/start-a-wild-battle) guide.
