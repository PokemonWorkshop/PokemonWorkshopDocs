---
title: "Create item and Pokémon shops"
slug: create-shops
sidebar_position: 5
description: "PSDK lets an event open a shop where the player buys items or even Pokémon. A shop can sell from an endless supply or from a limited stock that runs out, and it reports what the player did so the merchant can react. This guide covers both shop families and how to drive them from an event."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK lets an event open a shop where the player buys items or even Pokémon. A shop can sell from an **endless supply** or from a **limited stock** that runs out, and it reports what the player did so the merchant can react. This guide covers both shop families and how to drive them from an event.

All the commands below are [Interpreter methods](/rpg-maker-xp/using-the-interpreter-in-an-event): you call them from an event's **Script** command, without any prefix.

## Two kinds of shop

Before looking at items and Pokémon separately, two ideas apply to every shop.

**Unlimited vs limited.** An **unlimited** shop has infinite supply: the player can buy the same item again and again. You describe its contents inline, right in the call that opens it, and nothing is remembered afterwards. A **limited** shop has a finite stock that decreases with each purchase and persists in the save file. You build its stock once with a dedicated command, give it a `Symbol` to identify it, then open it later by that symbol. The same shop can be reopened, restocked or emptied over the course of the game.

**A price of 0 hides the entry.** Whatever the shop, an item or a Pokémon whose price is `0` (or negative) is silently dropped from the list. Use this to keep an entry defined in a limited shop without offering it for sale yet. A non-limited item the player already owns is also hidden from the list. If every entry ends up filtered out, the shop closes immediately instead of showing an empty window.

**The shop reports its outcome.** When the shop closes, PSDK writes a result code into **system variable 26** so the event can tell whether the player bought anything. See [React to the shop closing](#react-to-the-shop-closing) at the end of this guide.

## Item shops

### Unlimited item shop

The `open_shop` method opens a shop from a plain list of items:

```ruby
open_shop(symbol_or_list, prices = {}, show_background: true)
```

- `symbol_or_list` — an array of item db_symbols (or numeric IDs) to sell.
- `prices` — an optional `Hash` to override prices for this opening only. Keys are item db_symbols, values are the new prices. Any item left out keeps its database price.
- `show_background` — an optional keyword. Set it to `false` to open the shop over the map instead of the animated background.

```ruby
open_shop(
  [:poke_ball, :potion, :antidote, :paralyze_heal],
  { poke_ball: 150, potion: 250 },
  show_background: true
)
```

This sells four items; the Poké Ball and the Potion use the overridden prices, the Antidote and the Anti-Para use their database prices. Items priced at `0` and non-limited items already in the bag are not shown.

### Limited item shop

A limited shop sells a finite stock that survives across openings. Building one takes a few steps.

**1. Create the shop and its stock** with `add_limited_shop`:

```ruby
add_limited_shop(symbol_of_shop, items_sym = [], items_quantity = [], shop_rewrite: false)
```

- `symbol_of_shop` — the `Symbol` that names this shop. You will reuse it to restock and to open it.
- `items_sym` — the items to put in stock.
- `items_quantity` — how many of each. Any item without a matching quantity defaults to one unit.
- `shop_rewrite` — keep it `false` (the default). If the shop already exists, the call refills it instead of touching the rest. Set it to `true` only when you deliberately want to wipe the shop and rebuild it from scratch.

```ruby
add_limited_shop(
  :celadon_dept_store,
  [:poke_ball, :potion, :antidote, :paralyze_heal],
  [5, 3, 2, 1]
)
```

**2. Restock it later** with `add_items_to_limited_shop`. The quantities add to the current stock; an item that is not in the shop yet is created:

```ruby
add_items_to_limited_shop(symbol_of_shop, items_to_refill = [], quantities_to_refill = [])

add_items_to_limited_shop(:celadon_dept_store, [:poke_ball, :great_ball], [10, 3])
```

**3. Remove stock** with `remove_items_from_limited_shop`. The quantities are subtracted; an entry that reaches zero is deleted. Pass `nil` for a quantity to remove all of that item at once:

```ruby
remove_items_from_limited_shop(symbol_of_shop, items_to_remove, quantities_to_remove)

remove_items_from_limited_shop(:celadon_dept_store, [:potion, :antidote], [2, nil])
```

This removes two Potions and every Antidote left in stock.

**4. Open it** by passing the shop's symbol to `open_shop` instead of an array:

```ruby
open_shop(:celadon_dept_store, { poke_ball: 150 }, show_background: true)
```

The optional price `Hash` works exactly as with an unlimited shop. The player can only buy up to the remaining stock, and any purchase decreases it for next time.

## Pokémon shops

A Pokémon shop works on the same unlimited/limited split, but each entry also needs to describe the Pokémon being sold, not just an ID and a price.

### Unlimited Pokémon shop

```ruby
pokemon_shop_open(symbol_or_list, prices = [], param = [], show_background: true)
```

- `symbol_or_list` — an array of Pokémon db_symbols (or IDs) to sell.
- `prices` — an array of prices, one per Pokémon, in the same order. A Pokémon priced at `0` is hidden.
- `param` — an array describing each Pokémon (see [Describing a Pokémon](#describing-a-pokémon) below), in the same order.
- `show_background` — same optional keyword as for item shops.

```ruby
pokemon_shop_open(
  [:bulbasaur, :charmander, :squirtle],
  [2000, 2000, 2000],
  [5, 5, { level: 10, shiny: true }],
  show_background: true
)
```

This offers the three starters for 2000 each: Bulbasaur and Charmander at level 5, and a shiny Squirtle at level 10.

### Describing a Pokémon

The `param` entry for a Pokémon can take two shapes:

- An **integer**, read as the level. Everything else (form, gender, nature...) uses the species defaults. `5` is shorthand for a level-5 Pokémon.
- A **Hash**, when you need more control. The most common keys are `:level`, `:form`, `:shiny`, `:given_name`, `:nature`, `:gender`, `:item`, `:ability` and `:moves`. Any key omitted falls back to the default.

```ruby
{ level: 25, form: 1, shiny: true, given_name: "Sparky" }
```

The `:form` key matters beyond cosmetics: a limited Pokémon shop tells two entries of the same species apart by their form (see below). When in doubt, set `:form` explicitly; left out, it defaults to form `0`.

### Limited Pokémon shop

The lifecycle mirrors the item shop, with the extra Pokémon description on every command.

**1. Create the shop** with `add_new_pokemon_shop`:

```ruby
add_new_pokemon_shop(sym_new_shop, list_id, list_price, list_param, list_quantity = [], shop_rewrite: false)
```

- `sym_new_shop` — the `Symbol` naming the shop.
- `list_id` — the Pokémon to sell.
- `list_price` — their prices, one per Pokémon.
- `list_param` — their descriptions (integer level or `Hash`), one per Pokémon.
- `list_quantity` — how many of each; defaults to one.
- `shop_rewrite` — same meaning as for item shops: `false` refills an existing shop, `true` rebuilds it.

```ruby
add_new_pokemon_shop(
  :game_corner_prizes,
  [:eevee, :dratini, :magikarp],
  [3000, 4600, 500],
  [25, 18, { level: 5, shiny: true }],
  [1, 1, 2]
)
```

**2. Add Pokémon later** with `add_pokemon_to_shop`. A Pokémon already in stock is matched by **species and form**: with `pkm_rewrite: false` (the default) the quantity is added; with `pkm_rewrite: true` the existing entry is replaced by the new description:

```ruby
add_pokemon_to_shop(symbol_of_shop, list_id, list_price, list_param, list_quantity = [], pkm_rewrite: false)

add_pokemon_to_shop(:game_corner_prizes, [:magikarp], [500], [5], [3])
```

**3. Remove Pokémon** with `remove_pokemon_from_shop`. Because a species may exist in several forms, you pass the form to target; pass `nil` for a quantity to remove that entry entirely:

```ruby
remove_pokemon_from_shop(symbol_of_shop, remove_list_mon, param_form, quantities_to_remove = [])

remove_pokemon_from_shop(:game_corner_prizes, [:eevee, :dratini], [{ form: 0 }, { form: 0 }], [1, nil])
```

This removes one Eevee (form 0) and every Dratini (form 0) in stock.

**4. Open it** by passing the symbol to `pokemon_shop_open`. In this form the second argument is a price-override `Hash` (keyed by Pokémon ID), not an array, and there is no `param` argument since the stock already holds each Pokémon's description:

```ruby
pokemon_shop_open(:game_corner_prizes, { eevee: 2500 }, show_background: true)
```

## React to the shop closing

Whichever shop you open, PSDK writes a result code into **system variable 26** (`Yuki::Var::TMP1` in the engine) when the window closes. Reading it afterwards lets the merchant say something fitting instead of a generic line. The codes are:

| Code | Meaning |
| --- | --- |
| `-1` | The shop could not even open: every entry was filtered out (price `0`, or items already owned). |
| `0` | The player closed the shop without buying anything. |
| `1` | The player bought a single kind of item, or a single Pokémon species. |
| `2` | The player bought several different kinds of item, or several different Pokémon species. |
| `3` | The player bought the last unit in stock, so a limited shop emptied and closed on its own. |

For a Pokémon shop, the `1` vs `2` distinction counts **species**, not units: buying three Magikarp is still `1`, while buying a Magikarp and an Eevee is `2`.

Read the variable right after the shop command, in a **Conditional Branch** on its **Script** tab. The `gv` shortcut keeps it short:

```ruby
# Did the player buy at least one thing?
gv[26] >= 1
```

From there you branch to the right dialogue: a thank-you when `gv[26]` is `1` or `2`, a neutral line when it is `0`, or a "we are sold out" message when it is `-1` or `3`.

## Conclusion

- Open an unlimited shop with `open_shop` (items) or `pokemon_shop_open` (Pokémon), describing the contents inline.
- Build a limited shop once with `add_limited_shop` / `add_new_pokemon_shop`, keep it up to date with the `add_*` and `remove_*` commands, then open it by its `Symbol`.
- A price of `0` hides an entry; a non-limited item already owned is hidden too; an entirely filtered shop closes instead of showing nothing.
- Describe a sold Pokémon with an integer level or a `Hash` (`:level`, `:form`, `:shiny`...); a limited Pokémon shop tells entries apart by species **and** form.
- After every shop, system variable 26 reports the outcome (`-1` to `3`) so the event can react.
