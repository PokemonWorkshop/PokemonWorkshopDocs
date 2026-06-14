---
title: "How to script a battle?"
slug: how-to-script-a-battle
sidebar_position: 1
description: "This guide explains how to start a battle from a script: a wild battle against a custom Pokémon, or a trainer battle built from Studio data, for the cases Pokémon Studio's editor alone cannot cover."
---

This guide explains how to start a battle from a script: a wild battle against a custom Pokémon, or a trainer battle built from Studio data, for the cases Pokémon Studio's editor alone cannot cover.

## Why script a battle

Pokémon Studio already authors every **static** part of a battle. A trainer carries a full team, a bag, an AI level, prize money and dialogue; a wild group lists its species, level ranges and encounter rates; and each Pokémon, on either side, can have its own form, gender, nature, IVs, EVs, held item, moves, ability and shininess. For a fixed fight, the editor is enough and a script adds nothing.

You reach for a script when the battle must be decided **at runtime**:

- A wild encounter against a **one-off custom Pokémon**: a static legendary, a boss, a shiny with a set moveset.
- A trainer whose team **depends on the game state**: a rival that counters the player's starter, or a "trainer tower" whose levels scale with the player.
- Simply launching a battle from **your own logic** instead of a map event.

The two halves below cover each side. Both run through the same battle scene, so they read their result the same way (see the last section).

## Scripting a wild battle

The wild battle manager, `$wild_battle`, starts a wild battle in a single call.

### The simplest wild battle

Pass a species (db_symbol or id) and a level:

```ruby
$wild_battle.start_battle(:pikachu, 12)
```

### Against a custom Pokémon

The real value of scripting a wild battle is fighting a Pokémon you built yourself. Create it with `PFM::Pokemon.generate_from_hash` and pass the object instead of a species, the level argument is then ignored:

```ruby
legendary = PFM::Pokemon.generate_from_hash(
  id: :mewtwo,
  level: 70,
  shiny: true,
  moves: [:psystrike, :recover, :aura_sphere, :ice_beam]
)
$wild_battle.start_battle(legendary)
```

This is how you script a **static legendary**, a story boss, or any encounter that Studio's random groups cannot express. `generate_from_hash` accepts the same per-Pokémon keys Studio exposes (`id`, `level`, `shiny`, `form`, `given_name`, `nature`, `ability`, `item`, `moves`, IVs, EVs, and more).

### A double wild battle

Pass several Pokémon, as objects or as `id, level` pairs. The engine derives `vs_type` from their count (capped at 3):

```ruby
$wild_battle.start_battle(:zubat, 8, :zubat, 8)
```

## Scripting a trainer battle

When you need full control over the opposing side, or a team that depends on the player, you build the battle yourself with `Battle::Logic::BattleInfo`, the object every battle ultimately runs on.

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

`data_trainer` loads the Studio trainer (by db_symbol or id), and `encounter.to_creature(level)` builds each of its Pokémon at the level you pass, omit the argument to keep the levels set in Studio. One trainer now powers an entire tower of escalating fights.

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

## Reading the outcome

Both paths run through the same battle scene, so they report their result the same way. Register `$game_temp.battle_proc` **before** launching; the scene calls it with the result code when the battle ends:

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
$wild_battle.start_battle(:pikachu, 12) # or $scene.call_scene(Battle::Scene, bi)
```

The same outcome also sets the global switches `BT_Victory`, `BT_Player_Flee`, `BT_Defeat` and `BT_Wild_Flee`, which an event running after the battle can test. After a wild battle, the switch `BT_Catch` tells you whether the Pokémon was caught.

## Conclusion

- Studio authors the static data; you script a battle for runtime-dependent fights, custom one-off Pokémon, or to launch from your own logic.
- For a **wild battle**, call `$wild_battle.start_battle(species, level)`, or pass a `PFM::Pokemon` built with `generate_from_hash` to fight a fully custom Pokémon.
- For a **trainer battle**, build a `Battle::Logic::BattleInfo`, add the player on bank 0 and the trainer on bank 1, then launch with `$scene.call_scene(Battle::Scene, bi)`.
- Load existing Studio trainers with `data_trainer` and `to_creature(level)` to **reuse and modify** their teams: scale a trainer tower, or counter the player's starter, without cloning trainers in the editor.
- Read the result through `$game_temp.battle_proc` (or the `BT_Victory` / `BT_Defeat` switches) to branch your event.
