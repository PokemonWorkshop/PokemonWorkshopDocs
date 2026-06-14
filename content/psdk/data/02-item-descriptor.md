---
title: "How to define an item's behavior in PSDK?"
slug: item-descriptor
sidebar_position: 2
description: "This guide explains how PSDK turns item data into in-game behavior with the ItemDescriptor module: the wrapper read by every UI, and the definition functions telling what an item does from the bag, on a creature or on a move."
---

This guide explains how PSDK turns item data into in-game behavior with the **ItemDescriptor** module: the wrapper read by every UI, and the definition functions telling what an item does from the bag, on a creature or on a move.

## From data to behavior

A `Studio::Item` only holds **data**: price, flags, descriptions (see [How to access game data in PSDK?](/psdk/data/access-game-data)). It says nothing about what should happen when the player uses the item. That part lives in `PFM::ItemDescriptor` (`scripts/3 Studio/2 Data/0 Item/000 ItemDescriptor.rb` in the PSDK sources).

When the player uses an item, the UI calls `PFM::ItemDescriptor.actions(item_id)` and receives a **wrapper** describing what to do. Many interfaces call this wrapper `extend_data`. Your job, when creating a custom item, is to register the right definition so the wrapper comes out correctly: you almost never build a wrapper yourself.

## What happens when the player uses an item

The complete flow, from the bag to the effect:

1. The bag calls `PFM::ItemDescriptor.actions(item_id)` and gets the wrapper.
2. If `no_effect` or `chen` is set, the matching message shows and everything stops there.
3. If `open_party` is set, the party opens; for each creature, the UI calls `on_creature_choice` (your usability block) to know whether the item can be used on it.
4. If `open_skill` is set, the move selection opens on the chosen creature, filtered the same way by `on_skill_choice`.
5. The use function matching the context finally runs: `on_use` from the bag, `on_creature_use` or `on_skill_use` on the map. In battle, the UI calls `bind` and the battle engine triggers `execute_battle_action` during the turn.

Each definition function below fills one or several of these steps. You only write the blocks; PSDK drives the flow.

## What the wrapper tells the UIs

The wrapper carries flags that the bag, party and battle UIs read:

| Property             | Meaning when set                                                            |
| -------------------- | --------------------------------------------------------------------------- |
| `no_effect`          | The UI shows the "this item has no effect" message                           |
| `chen`               | The UI shows the "it's not time to use this item" message                    |
| `open_party`         | The UI opens the party so the player picks a creature                        |
| `open_skill`         | The UI opens the move selection on the chosen creature                       |
| `open_skill_learn`   | The party UI opens the move teaching UI for the move carried by the item     |
| `stone_evolve`       | The UI shows whether the chosen creature can evolve with this item           |
| `use_before_telling` | The item acts before the "item is used" message, so it can still refuse      |
| `skill_message_id`   | ID of the message shown in the Summary UI during move selection              |

It also carries the behavior functions filled by your definitions: `on_creature_choice` and `on_creature_use` (can the item be used on this creature, and what it does), `on_skill_choice` and `on_skill_use` (same for a move), `on_use` (action from the bag), plus `bind(scene, creature, skill)` and `execute_battle_action` used by the battle engine.

One thing to keep in mind: your blocks receive **live instances**, not data records. `creature` is a `PFM::Pokemon` (with its current HP, status and moves) and `skill` is a `PFM::Skill` (a learned move with its remaining PP). Their `data` method bridges back to the Studio records: in the examples below, `skill.data.pp` reads the PP defined in Pokémon Studio while `skill.pp` reads the current PP in game.

## Where and how to register a definition

Definitions are plain calls to `PFM::ItemDescriptor.define_*` functions, written in your own script in your project's `scripts/` folder. Each definition targets either:

- a **db_symbol** (`:sacred_ash`) for one specific item, or
- a **`Studio::Item` subclass** (`Studio::PPIncreaseItem`) for a whole family of items.

When both exist, the db_symbol definition wins over the class one. PSDK also enforces a definition order: you cannot register a use action before its usability check (the engine raises an explicit error if you try).

## Items used from the bag

For an item that simply does something from the bag, register `define_bag_use`. The block receives the item and the calling scene. The vanilla Sacred Ash is a complete example, together with its "it's not time" condition registered through `define_chen_prevention`:

```ruby
PFM::ItemDescriptor.define_chen_prevention(:sacred_ash) do
  next $actors.none? { |creature| creature.dead? && !creature.egg? }
end

PFM::ItemDescriptor.define_bag_use(:sacred_ash) do
  $actors.compact.each do |pkmn|
    next unless pkmn.hp <= 0

    pkmn.cure
    pkmn.hp = pkmn.max_hp
    pkmn.skills_set.compact.each { |j| j.pp = j.ppmax }
    $scene.display_message(parse_text(22, 115, PFM::Text::PKNICK[0] => pkmn.given_name))
  end
end
```

By default, the bag announces "the item is used", then runs your block, then consumes the item. That order is wrong for items that can turn out to be useless at the exact moment of use: think of a Repel while another repel is still active. Announcing and consuming first would waste the item.

For those items, set the second parameter of `define_bag_use`, `use_before_telling`, to `true`: your block runs **first** and acts as a last-second check. If the item cannot serve, show your own explanation message and return `:unused`. The bag then skips the "item is used" message and does not consume the item: from the player's point of view, nothing happened.

The vanilla Repel is the canonical example. It also targets a **class** this time (the whole `Studio::RepelItem` family, where Sacred Ash targeted one db_symbol). With no active repel it applies; otherwise it explains why and refuses:

```ruby
PFM::ItemDescriptor.define_bag_use(Studio::RepelItem, true) do |item, scene|
  if PFM.game_state.get_repel_count <= 0
    $game_temp.last_repel_used_id = item.id
    next PFM.game_state.set_repel_count(Studio::RepelItem.from(item).repel_count)
  end

  scene.display_message_and_wait(parse_text(22, 47))
  next :unused
end
```

You may wonder why the Repel does not simply use a chen prevention, since both mechanisms refuse a usage. The difference is the feedback: `define_chen_prevention` always shows the **generic** "it's not time to use this item" message, while the `:unused` path lets the item display its **own** explanation first (here, the dedicated "a repel is already active" text) and run logic before deciding. Pick chen when a generic refusal is enough, like the Sacred Ash with no fainted creature; pick `use_before_telling` and `:unused` when the player deserves a specific explanation.

## Items used on a creature

This family needs up to three definitions: whether the item can be used on the chosen creature, what it does on the map, and what it does in battle.

```ruby
PFM::ItemDescriptor.define_on_creature_usability(klass_or_db_symbol) do |item, creature|
  # Return true if the item can be used on this creature
end

PFM::ItemDescriptor.define_on_creature_use(klass_or_db_symbol) do |item, creature, scene|
  # Apply the item on the creature (map context)
end

PFM::ItemDescriptor.define_on_creature_battler_use(klass_or_db_symbol) do |item, creature, scene|
  # Apply the item on the creature (battle context)
end
```

Registering the usability automatically sets `open_party` on the wrapper, so the bag knows it must open the party. The vanilla Gracidea is a compact real example:

```ruby
PFM::ItemDescriptor.define_on_creature_usability(:gracidea) do |_item, creature|
  next false if creature.egg?
  next false unless creature.db_symbol == :shaymin
  next false if creature.form == creature.shaymin_form(:gracidea)

  next true
end

PFM::ItemDescriptor.define_on_creature_use(:gracidea) do |_item, _creature, scene|
  scene.update_pokemon_form(:gracidea)
end
```

For the battle side, the stat boost items (X Attack and friends, `Studio::StatBoostItem`) show the complete pattern. Note the inverted chen prevention: these items are battle-only, so "it's not time" is raised on the map. In battle, the creature is a `PFM::PokemonBattler` (get its battler API with `.from`) and the scene is the battle scene, whose `logic` exposes the handlers your action should go through:

```ruby
PFM::ItemDescriptor.define_chen_prevention(Studio::StatBoostItem) do
  next !$game_temp.in_battle
end

PFM::ItemDescriptor.define_on_creature_usability(Studio::StatBoostItem) do |item, creature|
  next false if creature.egg? || !PFM::PokemonBattler.from(creature).can_fight?

  next creature.send(:"#{item.stat}_stage") < 6
end

PFM::ItemDescriptor.define_on_creature_battler_use(Studio::StatBoostItem) do |item, creature, scene|
  boost_item = Studio::StatBoostItem.from(item)
  creature.loyalty -= boost_item.loyalty_malus

  scene.logic.stat_change_handler.stat_change(boost_item.stat, boost_item.count, creature)
end
```

## Items used on a move of a creature

One more layer: after the creature usability, you define whether the item can act on the chosen move, then what it does. Registering the move usability sets `open_skill` on the wrapper; the optional second parameter is the `skill_message_id` shown in the Summary UI.

The vanilla PP Up shows the full chain with current property names:

```ruby
PFM::ItemDescriptor.define_chen_prevention(Studio::PPIncreaseItem) do
  next $game_temp.in_battle
end

PFM::ItemDescriptor.define_on_creature_usability(Studio::PPIncreaseItem) do |_, creature|
  next false if creature.egg?

  moves = $game_temp.in_battle ? PFM::PokemonBattler.from(creature).moveset : creature.skills_set
  next moves.any? { |move| (move.data.pp * 8 / 5) > move.ppmax }
end

PFM::ItemDescriptor.define_on_move_usability(Studio::PPIncreaseItem, 35) do |_, skill|
  next (skill.data.pp * 8 / 5) > skill.ppmax
end

PFM::ItemDescriptor.define_on_move_use(Studio::PPIncreaseItem) do |item, creature, skill, scene|
  creature.loyalty -= Studio::HealingItem.from(item).loyalty_malus
  if Studio::PPIncreaseItem.from(item).is_max
    skill.ppmax = skill.data.pp * 8 / 5
  else
    skill.ppmax += skill.data.pp * 1 / 5
  end
  skill.pp += 99
  scene.display_message_and_wait(parse_text(22, 117, PFM::Text::MOVE[0] => skill.name))
end
```

For the battle context, `define_on_battle_move_use` follows the same shape with the same block parameters (`item, creature, skill, scene`).

:::note

Both battle definitions fill the same slot of the wrapper (`action_to_push`). The vanilla PP-restoring items (`Studio::PPHealItem`) actually register their battle action through `define_on_creature_battler_use` with the same four-parameter block; the result is identical. Use `define_on_battle_move_use` for readability when your item targets a move.

:::

## Items calling a common event

A `Studio::EventItem` calls a common event when used; the event to call is **data** (its `event_id` property, set in Pokémon Studio). By default the call is unconditional; `define_event_condition` adds a usability condition for a given event. Note that it targets the **event ID**, not the item. The vanilla Bicycle condition:

```ruby
PFM::ItemDescriptor.define_event_condition(11) do
  next false if $game_player.surfing?

  next $game_switches[Yuki::Sw::EV_Bicycle] ||
       $game_switches[Yuki::Sw::Env_CanFly] ||
       $game_switches[Yuki::Sw::Env_CanDig]
end
```

Worth reading in the sources: the whole EventItem support is itself built with the public API. It is a `define_bag_use(Studio::EventItem, true)` that checks the registered condition and returns `:unused` when it refuses (`001 EventItem.rb`). Everything in this guide rests on the same few bricks.

## A custom item from A to Z

Say you want a Golden Apple that fully heals one creature, usable from the bag on the map.

1. In **Pokémon Studio**, create the item with the db_symbol `golden_apple`, enable its **usable on map** flag (`is_map_usable`) and its **consumable** flag (`is_limited`): consumption is data, not code.
2. In your own script, register the usability and the action:

```ruby
PFM::ItemDescriptor.define_on_creature_usability(:golden_apple) do |_item, creature|
  next false if creature.egg?

  next creature.hp < creature.max_hp
end

PFM::ItemDescriptor.define_on_creature_use(:golden_apple) do |_item, creature, scene|
  creature.hp = creature.max_hp
  scene.display_message_and_wait("#{creature.given_name} is fully healed!")
end
```

That is all. The bag sees `open_party` (set automatically by the usability definition) and opens the team, eggs and full-HP creatures are not valid targets, and using the item heals then shows the message. The `is_map_usable` flag you set in Studio already raises `chen` in battle, and the bag handles the consumption because of `is_limited`.

To go further, read the engine's own definitions: each file under `scripts/3 Studio/2 Data/0 Item/` pairs a `Studio::Item` subclass with its descriptor definitions (`003 HealingItem.rb`, `300 PPIncreaseItem.rb`...), and `000 ItemDescriptor.rb` holds the per-db_symbol special cases. They are ready-made recipes for almost every classic item behavior.

## What PSDK handles automatically

You do not have to define everything yourself. When building the wrapper, `actions` fills several things on its own:

- `chen` is raised automatically when the item's `is_map_usable` or `is_battle_usable` flag (edited in Pokémon Studio) does not match the current context.
- `no_effect` is raised for unknown items (the `:__undef__` placeholder).
- `stone_evolve` is set for any `Studio::StoneItem`, and `open_skill_learn` for any `Studio::TechItem`.
- In battle, the map-only actions are voided so an item never runs its map behavior mid-fight.

:::note

Older PSDK resources name these functions `define_on_pokemon_usability`, `define_on_pokemon_use` and `define_on_pokemon_battler_use`. They were renamed with `creature` in current PSDK versions, as in all the examples above.

:::

## Conclusion

- `Studio::Item` holds the data; `PFM::ItemDescriptor` holds the behavior. The UIs get both through the wrapper returned by `PFM::ItemDescriptor.actions`.
- Register definitions in your own script, targeting a db_symbol (one item) or a `Studio::Item` subclass (a family); the db_symbol wins.
- From the bag: `define_bag_use`; when the item can fail at the moment of use, `use_before_telling` makes the block a last-second check and `:unused` refuses without consuming.
- On a creature: `define_on_creature_usability`, then `define_on_creature_use` (map) and `define_on_creature_battler_use` (battle).
- On a move: add `define_on_move_usability`, then `define_on_move_use` (map) and `define_on_battle_move_use` (battle).
- "It's not time" conditions go through `define_chen_prevention`; common event items through `define_event_condition`.
- The `is_map_usable` and `is_battle_usable` flags from Pokémon Studio are enforced automatically, before any of your code runs; `is_limited` controls the consumption.
- The blocks receive live `PFM::Pokemon` and `PFM::Skill` instances; their `data` method bridges back to the Studio records.
- The vanilla definitions under `scripts/3 Studio/2 Data/0 Item/` are ready-made recipes to copy from.
