---
title: "Configure a Pokémon's evolutions"
slug: configure-evolutions
sidebar_position: 3
description: "Pokémon Studio lets you give a Pokémon as many evolutions as you want, each guarded by its own set of conditions. This guide walks through the evolution editor, lists every condition it offers, and explains the two rules that decide which evolution actually fires: conditions combine with AND inside one evolution, and the engine keeps the first evolution in the list whose conditions all pass."
---

**Pokémon Studio** lets you give a Pokémon as many evolutions as you want, each guarded by its own set of conditions. This guide walks through the evolution editor, lists every condition it offers, and explains the two rules that decide which evolution actually fires: conditions combine with AND inside one evolution, and the engine keeps the first evolution in the list whose conditions all pass.

## Open the evolution editor

Evolutions are not a separate tab. Open **Database > Pokémon**, select your Pokémon, and find the **Evolution** block on its page. Clicking it opens the evolution editor.

Two things about this editor are worth knowing before you touch anything.

It edits **one form at a time**. The form you are viewing on the Pokémon page is the form whose evolutions you are editing, so a Pokémon with several forms has a separate evolution list per form.

It shows **one evolution per page**. When a Pokémon has more than one evolution, arrows appear at the top of the editor to move between them, numbered `#1 - <target name>`, `#2 - ...` and so on. That number is the position in the list, and as the rest of this guide shows, it is not cosmetic.

## Choose the target

**Evolves into** is the Pokémon this evolution produces. It is required: as long as it is empty, the **New evolution** button stays disabled and you cannot add a second evolution.

**Form** appears only when the target Pokémon has more than one form. Leave it alone unless you are evolving into a specific alternate form.

To add another evolution to the same Pokémon, use **New evolution** in the **Additional Evolution** panel. **Delete this evolution** removes the one currently displayed.

## Add conditions

**Add a condition** appends a condition card to the current evolution. Each card holds one condition: a type picked from the **Evolution condition** dropdown, plus the value that type needs.

An evolution with no condition at all is legal. Studio calls it **No condition**, and the Pokémon then evolves on any level up.

Here is every condition the editor offers, in the order the dropdown lists them.

| Condition | What it checks | Value to fill in |
| --- | --- | --- |
| By level increase | The Pokémon is at least this level | **Level**, 1 to 999 |
| Before a level | The Pokémon is at most this level | **Level**, 1 to 999 |
| With an evolving stone | The stone used on the Pokémon | **Item** |
| By trade with a trainer | The Pokémon is being traded, with anyone | No value |
| By trade for another Pokémon | The Pokémon is traded for this exact species | **Pokémon** |
| By holding an item | The item the Pokémon holds | **Item** |
| Before a maximum of loyalty | Loyalty is at most this value | **Loyalty**, 1 to 255 |
| With a minimum of loyalty | Loyalty is at least this value | **Loyalty**, 1 to 255 |
| By having the move | The Pokémon knows this move | **Move** |
| Depending on the weather | The weather currently in play | **Weather** |
| Depending on the environment | The System Tag the player stands on | **SystemTag**, a number from 0 |
| At a certain time of the day | The current moment of the day | **Moment**: Day, Sunset, Night or Morning |
| If the player is on a map | The player is on one of these maps | **Maps**, map IDs separated by commas |
| Depending on the gender | The Pokémon's gender | **Gender**: Male, Female or Unknown |
| Depending on a function | A condition coded in Ruby, called by name | **Function**, the method name |
| By Mega-Evolving | Reserved for Mega-Evolution, see below | **Item** |

**By having the move** appears four times in the data, as four separate slots, which is why a single evolution can require up to four different moves. The dropdown only offers you the next free slot, so you never have to think about the numbering.

**Depending on a function** is the escape hatch for anything this list cannot express. The value is the name of a Ruby method written on the PSDK side, and Studio does not check that it exists: a typo here crashes the game with a `NoMethodError` the moment the engine tests the evolution, so check the spelling against your script. Writing that method is a topic of its own and is not covered here.

## How conditions combine

This is where evolutions usually go wrong, because two different rules apply at two different levels.

**Inside one evolution, conditions combine with AND.** Every condition card on the page must pass. An evolution requiring a minimum loyalty of 160 and the Night moment fires only when both are true.

**Between evolutions, it is an OR.** A Pokémon with three evolutions can take any of the three.

The part that surprises people is how that OR resolves. The engine walks the list **from top to bottom and stops at the first evolution whose conditions all pass**. It never looks at the ones below. The order of your list is therefore part of the logic, not presentation.

The consequence is worth stating plainly: **put the most demanding evolution first**. If a broad evolution sits above a narrower one, the broad one always wins and the narrow one is unreachable, no matter what the player does.

Say you want a Pokémon to evolve into A at level 20, and into B at level 20 while holding an item. Listed in that order, B can never happen: the player holds the item, but A's single condition already passes, and A is checked first. Swap them, and both work.

The default Eevee is a good illustration of the rule. Sylveon requires a minimum loyalty of 160 plus a function, Umbreon requires a minimum loyalty of 160 plus the Night moment, and Sylveon is listed above Umbreon. So a well-loved Eevee that satisfies the Sylveon function becomes Sylveon even at night. That is a deliberate ordering, not an accident.

:::note
Eevee also ships Leafeon and Glaceon with a **maps** condition set to `-1`, which is not a real map ID. They are placeholders: the default project leaves them unreachable on purpose, waiting for you to fill in the maps of your own mossy and icy rocks.
:::

## Rules the editor enforces

A few constraints are built into the editor and are easier to understand than to discover.

**One condition type per evolution.** Once a type is used, it disappears from the dropdown of every other card in the same evolution. You cannot ask for two held items in one evolution, so "holds item A or item B" needs two separate evolutions. Levels are the exception that proves the rule: **By level increase** and **Before a level** are two distinct types, so bracketing a level between 20 and 30 in a single evolution works.

**Mega-Evolution is a special case.** Adding **By Mega-Evolving** switches the editor into Mega mode: **Evolves into** stops being a dropdown and becomes a greyed-out `Mega-<name>`. You no longer choose the target, Studio derives it.

This is because the condition is not really an evolution condition. Mega-Evolution is handled by the battle engine, elsewhere, and an evolution carrying this condition never fires as a normal evolution. Treat it as a marker declaring that this Pokémon has a Mega form, not as a rule the engine evaluates.

**Values are validated on save.** Leaving a required field empty or out of range blocks the save and focuses the offending field. This also applies when you page from one evolution to another, so a half-filled condition keeps you on the current page until you complete or delete it.

## Conclusion

- Evolutions live in the **Evolution** block of a Pokémon's page, one list **per form**, one evolution **per editor page**.
- Inside one evolution, conditions combine with **AND**; between evolutions it is an **OR**.
- The engine keeps the **first** evolution in the list whose conditions all pass, so **list the most demanding evolution first** or it becomes unreachable.
- A condition type can be used **once per evolution**; expressing an "or" between two values of the same type requires two evolutions.
- **By Mega-Evolving** is a marker for Mega-Evolution, not a condition the engine evaluates: it freezes the target and never triggers a normal evolution.
- **Depending on a function** is the way out when no built-in condition fits; the value is the name of a Ruby method you write yourself.
