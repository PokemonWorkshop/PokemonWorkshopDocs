---
title: "RPG Maker XP basics"
slug: rpg-maker-xp-basics
sidebar_position: 1
description: "PSDK uses RPG Maker XP (RMXP) only for event management: maps are created with Tiled and the database is managed by Pokémon Studio. RMXP is inexpensive to obtain and only needed until Pokémon Studio v3 ships. This guide explains whether you need it, why PSDK relies on it, and what to learn."
---

:::warning[This section will be archived when Pokémon Studio v3.0 is released]

Pokémon Studio v3.0 will move away from RPG Maker. When that release ships, this RPG Maker XP section will be archived: the pages will remain available as reference but will no longer be updated.

:::

PSDK uses **RPG Maker XP** (RMXP) only for **event** management: maps are created with **Tiled** and the database is managed by **Pokémon Studio**. RMXP is inexpensive to obtain and only needed until Pokémon Studio v3 ships. This guide explains whether you need it, why PSDK relies on it, and what to learn.

## Do you need RPG Maker XP?

Yes, for now. PSDK relies specifically on **RPG Maker XP** (not VX, MV or MZ). Since Pokémon Studio 2.0, maps are built with [**Tiled**](/tiled/introduction-to-tiled) and the database lives in **Pokémon Studio**, so RMXP is now used only to create and edit **events**. It stays required until Pokémon Studio v3 is released.

RPG Maker XP is sold on Steam, at a low price and often on sale: [RPG Maker XP on Steam](https://store.steampowered.com/app/235900/RPG_Maker_XP/).

## Why does PSDK use RPG Maker XP?

PSDK descends from an older Starter Kit, the **Pokémon Script Project**, which was built on RPG Maker XP (the only viable option back in 2007). To offer a smooth transition from that Starter Kit, the developers kept RMXP compatibility while modernizing the engine's performance and technology. This is also why most classic RMXP scripts are not compatible with PSDK.

## Why learn RPG Maker XP?

In a PSDK project, RMXP is where you create and edit events. This is where you:

- Place NPCs and define their dialogues
- Create interactions (picking up an item, triggering a battle, opening a door)
- Manage game logic (switches, variables, conditions)

Without these basics, you cannot build the interactions of a PSDK project.

## The reference resource

The **RPG Maker XP** tutorial from Le Site du Zéro covers everything you need to know. It is available here (in French):

<https://www.yumpu.com/fr/document/read/16933960/rpg-maker-xp-le-site-du-zero>

Only **chapter 1** needs to be read (up to around page 45). It covers:

- **The RMXP interface**: the different windows, the toolbar, navigation
- **Maps**: creation, tilesets, layers, connections between maps (in PSDK maps are created with Tiled, but understanding the concepts is still useful)
- **Events**: creation, triggers, movement, event pages
- **Switches and variables**: RMXP's logic system (enabling/disabling elements, storing values)
- **Conditional branches**: executing commands based on conditions
- **Local switches**: switches specific to an event (useful for pickable items, one-time NPCs)

## What we don't use

**Chapter 2** of the tutorial covers the RMXP **database** (heroes, monsters, items, skills, etc.). In PSDK, this entire part is replaced by **Pokémon Studio** — that's where you define Pokémon, moves, trainers, items and everything else. Chapter 2 can be skipped.

## Conclusion

- You need **RPG Maker XP** (that version only) to edit events — get it cheaply on Steam. Maps and data are handled elsewhere (Tiled and Pokémon Studio).
- Read **chapter 1** of the RPG Maker XP tutorial from Le Site du Zéro to master events.
- Skip **chapter 2** (database) — Pokémon Studio replaces this part in PSDK.
- Once the basics are acquired, guide **002 How to use the Interpreter in an event** explains how to go further with PSDK's Script commands.
