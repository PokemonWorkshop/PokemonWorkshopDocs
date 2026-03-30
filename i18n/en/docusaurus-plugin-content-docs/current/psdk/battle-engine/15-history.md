---
title: "How to create a battle history in PSDK?"
slug: how-to-create-a-history
sidebar_position: 15
description: "This guide explains how to create a custom history on a PokemonBattler, following the same pattern as MoveHistory, DamageHistory, and StatHistory."
---

## Principle

A history is composed of four elements:

1. **A history class**: stores the data of an entry (turn, contextual data, utility methods).
2. **An `attr_reader`** on `PokemonBattler`: exposes the array of entries.
3. **An initialization** in the `PokemonBattler` constructor: creates the empty array.
4. **An `add_X_to_history` method** on `PokemonBattler`: adds an entry to the array.

The feeding is done from the handler or procedure concerned, at the moment the action occurs.

## Step 1: create the history class

Create a file in `5 Battle/03 PokemonBattler/` (e.g., `103 HealHistory.rb`).

```ruby
module PFM
  class PokemonBattler
    class HealHistory
      # @return [Integer] the turn when the heal occurred
      attr_reader :turn
      # @return [Integer] amount of HP healed
      attr_reader :amount
      # @return [PFM::PokemonBattler, nil] launcher of the heal
      attr_reader :launcher
      # @return [Battle::Move, nil] move that caused the heal
      attr_reader :move

      def initialize(amount, launcher, move)
        @turn = $game_temp.battle_turn
        @amount = amount
        @launcher = launcher
        @move = move
      end

      def current_turn?
        return @turn == $game_temp.battle_turn
      end

      def last_turn?
        return @turn == $game_temp.battle_turn - 1
      end
    end
  end
end
```

- The `turn` is always captured from `$game_temp.battle_turn` in the constructor.
- The `current_turn?` and `last_turn?` methods are the standard pattern across all histories.
- The attributes depend on what you want to track.

## Step 2: declare the attribute on PokemonBattler

In `001 PokemonBattler.rb`, add the `attr_reader`:

```ruby
# Get the heal history
# @return [Array<HealHistory>]
attr_reader :heal_history
```

## Step 3: initialize the array

In the `initialize` method of `PokemonBattler`, add the initialization:

```ruby
@heal_history = []
```

## Step 4: create the add method

In `PokemonBattler`, add the method that creates and appends an entry:

```ruby
def add_heal_to_history(amount, launcher, move)
  @heal_history << HealHistory.new(amount, launcher, move)
end
```

## Feeding the history

Call `add_X_to_history` from the handler or procedure that performs the action. Here is where existing histories are fed:

| History                   | Fed from                                     |
| ------------------------- | -------------------------------------------- |
| `move_history`            | `proceed_internal` (always, even on failure) |
| `successful_move_history` | `proceed_internal` (only on success)         |
| `damage_history`          | `DamageHandler#damage_change`                |
| `stat_history`            | `StatChangeHandler#stat_change`              |

For a custom history, the call goes in the same place as the action:

```ruby
# In the relevant handler or procedure
target.add_heal_to_history(amount, launcher, skill)
```

## Existing histories -- reference

### MoveHistory

| Attribute       | Type                         | Description                         |
| --------------- | ---------------------------- | ----------------------------------- |
| `turn`          | `Integer`                    | Turn of use                         |
| `move`          | `Battle::Move`               | Copy (`dup`) of the move            |
| `original_move` | `Battle::Move`               | Direct reference to the move object |
| `targets`       | `Array<PFM::PokemonBattler>` | Affected targets                    |
| `attack_order`  | `Integer`                    | Pokemon's attack order this turn    |

`SuccessfulMoveHistory` inherits from `MoveHistory` without additions.

### DamageHistory

| Attribute  | Type                       | Description                  |
| ---------- | -------------------------- | ---------------------------- |
| `turn`     | `Integer`                  | Turn of damage               |
| `damage`   | `Integer`                  | Amount of damage taken       |
| `launcher` | `PFM::PokemonBattler, nil` | Launcher of the damage       |
| `move`     | `Battle::Move, nil`        | Move that caused the damage  |
| `ko`       | `Boolean`                  | Whether the Pokemon was KO'd |

### StatHistory

| Attribute  | Type                       | Description                                            |
| ---------- | -------------------------- | ------------------------------------------------------ |
| `turn`     | `Integer`                  | Turn of the change                                     |
| `stat`     | `Symbol`                   | `:atk`, `:dfe`, `:spd`, `:ats`, `:dfs`, `:acc`, `:eva` |
| `power`    | `Integer`                  | Power (positive = increase)                            |
| `target`   | `PFM::PokemonBattler`      | Target of the change                                   |
| `launcher` | `PFM::PokemonBattler, nil` | Launcher of the change                                 |
| `move`     | `Battle::Move, nil`        | Move that caused the change                            |

## Conclusion

- Create a history class with `turn`, `current_turn?`, `last_turn?`, and specific attributes.
- Declare an `attr_reader` on `PokemonBattler` and initialize the array in `initialize`.
- Add an `add_X_to_history` method that creates and appends the entry.
- Call this method from the handler or procedure at the moment of the action.
