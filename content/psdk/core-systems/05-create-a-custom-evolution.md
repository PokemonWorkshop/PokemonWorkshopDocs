---
title: "Create a custom evolution"
slug: create-a-custom-evolution
sidebar_position: 5
description: "Pokémon Studio's evolution editor covers the classic conditions, but a fangame regularly needs one it cannot express. Studio's Depending on a function field is the escape hatch: it calls a Ruby method you write, and because that method is arbitrary Ruby, it can express any condition at all. This guide shows how to write one, how to drive a counter-based evolution with evolve_var, and how to trigger an evolution by hand."
---

Pokémon Studio's evolution editor covers the classic conditions, but a fangame regularly needs one it cannot express. Studio's **Depending on a function** field is the escape hatch: it calls a Ruby method you write, and because that method is arbitrary Ruby, it can express any condition at all. This guide shows how to write one, how to drive a counter-based evolution with `evolve_var`, and how to trigger an evolution by hand.

## The problem: a condition the editor cannot express

Say your starter is meant to evolve only once it has proven itself in combat: it takes fifty hits, and then it evolves. Open the evolution editor and nothing fits. There is a minimum level, a held item, a moment of the day, a map, but nothing counts anything. The condition simply does not exist in the list.

This is the normal case rather than the exception. The built-in conditions describe the official games, and a fangame invents rules the official games never had.

PSDK's answer is not to extend the editor but to let the condition escape into Ruby. Studio keeps storing the evolution, with its target and its other conditions, and the part it cannot express becomes a method in your own scripts. The engine calls that method when it tests the evolution.

This guide assumes you already know how to fill in an evolution in the editor. If not, start with [Configure a Pokémon's evolutions](/pokemon-studio/configure-evolutions). The examples below live in your own scripts, never in the engine files, and the first one needs nothing more than a new method.

## The `func` condition

When you type a method name into Studio's **Depending on a function** field, the engine calls that method on the Pokémon while it tests the evolution. The method takes no argument and returns `true` or `false`. Nothing more, and that is the whole mechanism.

The engine itself uses this for about twenty official special cases, which are the best possible examples because they are real. Hitmonlee compares two stats:

```ruby
def elv_kicklee
  atk > dfe
end
```

Sylveon looks through the move set:

```ruby
def elv_nymphali
  return @skills_set.any? { |skill| skill&.type?(data_type(:fairy).id) }
end
```

All of them are named `elv_*` by convention. Nothing enforces the prefix, but following it keeps your methods recognisable next to the engine's.

To add your own, reopen `PFM::Pokemon` and define the method. There is no `super` here because you are adding a method rather than overriding one:

```ruby
module PFM
  class Pokemon
    # Evolve once the creature has taken 50 hits in battle
    # @return [Boolean] if the condition is valid
    def elv_battle_scarred
      return (@evolve_var || 0) >= 50
    end
  end
end
```

Then type `elv_battle_scarred` in the **Depending on a function** field of the evolution. Studio does not check that the method exists, so a typo crashes the game with an error called `NoMethodError` the moment the engine tests the evolution.

Inside the method you have the whole Pokémon at hand: its level, its stats, its moves, the party, the game state. Anything you can read from Ruby, you can turn into an evolution condition. The counter this particular example reads is the one case that needs a little setup, and it is the next section.

:::note[If your evolution never fires]
Two engine rules are independent of the method you write. A Pokémon holding an **Everstone** never evolves, the engine stops before testing any condition. And when a Pokémon has several evolutions, the engine keeps the **first in the list whose conditions all pass**, so a broader evolution placed above yours can shadow it. Ordering is covered in [Configure a Pokémon's evolutions](/pokemon-studio/configure-evolutions).
:::

:::warning[Do not edit the project files by hand]
The engine knows a few extra condition types the editor does not show, but Studio cannot set them and does not recognise them. Adding one by hand-editing the files in `Data/Studio` makes the **whole project fail to open**, with only a generic error pointing to the logs. There is never a need to: **Depending on a function** already covers anything those could do.
:::

## Counter-based evolutions with `evolve_var`

`@evolve_var` is the general-purpose counter behind every counting evolution. `increase_evolve_var` adds to it, `reset_evolve_var` clears it, and the engine already counts a handful of things into it.

One rule governs everything below:

:::danger[Counting is tied to the function name]
Every place the engine increases `evolve_var` only runs for creatures whose evolution uses the exact `func` name declared in Studio: the step counter for `elv_1000steps`, the critical-hit counter for `elv_sirfetchd`, and so on. Declare one of those names and the counting is already done for you. Invent a fresh name and nothing counts it, you supply the plumbing yourself.
:::

### Reuse an engine counter on your own Pokémon (no code)

The simplest counter-based evolution writes no Ruby at all: in Studio, give your creature's evolution one of the function names the engine already counts. Its counters loop over every creature whose evolution declares that name, so yours is swept in too.

Steps are counted out of battle. `step_evolution_update` runs on every step and increments each party member whose evolution uses `elv_1000steps`:

```ruby
def step_evolution_update
  return unless $game_switches[Yuki::Sw::FM_Enabled]

  if $game_switches[Yuki::Sw::FollowMe_LetsGoMode]
    return unless $storage.lets_go_follower&.evolution_condition_function?(:elv_1000steps)

    $storage.lets_go_follower.increase_evolve_var
  else
    return if $game_variables[Yuki::Var::FM_N_Pokem] <= 0

    $actors.each_with_index do |creature, index|
      break if index >= $game_variables[Yuki::Var::FM_N_Pokem]
      next unless creature.evolution_condition_function?(:elv_1000steps)

      creature.increase_evolve_var
    end
  end
end
```

You never write this, the engine calls it. Declaring `elv_1000steps` on your creature's evolution is what opts it into that loop, and the function evolves at a thousand:

```ruby
def elv_1000steps
  return (@evolve_var || 0) >= 1000
end
```

Battle events work the same way. `handle_elv_sirfetchd_event` runs after damage and increments the attacker when it lands a critical hit and its evolution uses `elv_sirfetchd`:

```ruby
def handle_elv_sirfetchd_event(hp, target, launcher, skill)
  return if launcher.nil?
  return unless launcher.evolution_condition_function?(:elv_sirfetchd)
  return unless skill&.critical_hit?

  launcher.increase_evolve_var
end
```

The engine also carries the value back onto the real Pokémon at the end of the fight, so declaring `elv_sirfetchd` gives you a working "evolves after three critical hits" with no code. The names worth borrowing this way are `elv_1000steps` (steps), `elv_sirfetchd` (critical hits) and `elv_basculin` (recoil damage, at 294).

### Change the numbers (patch the function)

To keep an engine trigger but a different threshold, patch the `elv_*` method. Because this replaces an existing method rather than adding a new one, it goes in a `prepend` module, the [monkey-patching](/getting-started/customize-psdk/monkey-patching-in-psdk) convention, never an `alias`. This one makes the step evolution fire at five hundred instead of a thousand:

```ruby
module PFM
  class Pokemon
    module HalfStepEvolution
      def elv_1000steps
        return (@evolve_var || 0) >= 500
      end
    end
    prepend HalfStepEvolution
  end
end
```

The name is shared with the engine's own species, so this moves their threshold too. That is fine in a fangame that does not feature that species; if it does, or if you need to count something else entirely, give your evolution a fresh name and its own plumbing.

### Count something the engine does not (your own plumbing), advanced

If one of the engine's existing triggers already matches what you need, you can stop here: this section is only for counting something the engine never tracks, hits taken for instance. It is the fifty-hits evolution from the top of the guide, and its `elv_battle_scarred` method is already written, so all that is left is the counting.

Out of battle there is no difficulty: call `increase_evolve_var` on the creature wherever your rule counts, from an event or a quest reward. In battle the engine works on a temporary `PFM::PokemonBattler`, a scratch copy of the creature used only during the fight, so the counting has to happen on that copy. This first patch adds up every hit taken, mirroring the engine's own `handle_elv_sirfetchd_event`, and only touches creatures whose evolution uses your function:

```ruby
module Battle
  class Logic
    class DamageHandler
      # Counts every hit taken by a creature whose evolution uses elv_battle_scarred
      module BattleScarredCounter
        def handle_post_damage_events(hp, target, launcher, skill)
          target.increase_evolve_var if target.evolution_condition_function?(:elv_battle_scarred)

          super
        end
      end
      prepend BattleScarredCounter
    end
  end
end
```

That alone is enough for the evolution to happen. The engine copies your counter back onto the real Pokémon at the end of each fight and reloads it at the start of the next, so the hits add up across battles, and once fifty is reached the creature evolves at its next level-up.

To make it evolve the instant the battle with its fiftieth hit ends, rather than waiting for that level-up, add a second patch that asks the engine to check right there, exactly as the engine does for its own species. Pushing the creature into `logic.evolve_request` is the request:

```ruby
module Battle
  class Logic
    class BattleEndHandler
      # Asks the engine to check the evolution as soon as the battle ends
      module BattleScarredPersistence
        def handle_battle_end_events(players_creatures)
          super

          players_creatures.each do |creature|
            next unless creature.evolution_condition_function?(:elv_battle_scarred)

            creature.original.evolve_var = creature.evolve_var || 0
            logic.evolve_request << creature
          end
        end
      end
      prepend BattleScarredPersistence
    end
  end
end
```

## Trigger an evolution manually

Sometimes the evolution should happen at a moment the engine does not test, at the end of a quest, or after a dialogue. Ask `evolve_check` for the target, then hand it to the evolution scene:

```ruby
pokemon = $actors.first
id, form = pokemon.evolve_check(:level_up)
GamePlay.make_pokemon_evolve(pokemon, id, form, true) if id
```

`evolve_check` still applies every condition, so this triggers the evolution the data describes rather than forcing an arbitrary one, and it returns `false` when nothing matches, hence the `if id` guard.

The last argument of `make_pokemon_evolve` is `forced`. Left at `false`, the player can cancel the evolution by pressing B, which is the level-up behaviour. Set to `true`, the evolution cannot be refused, which is what the engine does for stones and trades.

## Conclusion

- **`func`** is the route: a true-or-false method you write on `PFM::Pokemon`, named `elv_*` by convention, selected in Studio through **Depending on a function**. Being plain Ruby, it can express any condition at all.
- An evolution fires only if no **Everstone** is held and it is the **first** in the list whose conditions all pass, so mind the ordering.
- Do not hand-edit the project files to add condition types the editor does not show: Studio rejects them and the project stops opening. **Depending on a function** already covers them.
- **`evolve_var`** drives counter-based evolutions three ways: reuse an engine name (`elv_1000steps`, `elv_sirfetchd`) for its counting with no code, patch that method to change the numbers, or write your own plumbing for a trigger the engine does not have.
- **`GamePlay.make_pokemon_evolve(pokemon, id, form, forced)`** triggers an evolution by hand, `forced` deciding whether the player can cancel with B.
