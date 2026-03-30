---
title: "How to learn RPG Maker XP basics?"
slug: rpg-maker-xp-basics
sidebar_position: 1
description: "PSDK uses RPG Maker XP (RMXP) only for event management. Maps are created with Tiled and the database is managed by Pokemon Studio. However, until Studio v3 is released, RMXP remains necessary for events. This guide points to the reference resource and clarifies what needs to be learned."
---

PSDK uses **RPG Maker XP** (RMXP) only for **event** management. Maps are created with **Tiled** and the database is managed by **Pokemon Studio**. However, until Studio v3 is released, RMXP remains necessary for events. This guide points to the reference resource and clarifies what needs to be learned.

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

**Chapter 2** of the tutorial covers the RMXP **database** (heroes, monsters, items, skills, etc.). In PSDK, this entire part is replaced by **Pokemon Studio** — that's where you define Pokemon, moves, trainers, items and everything else. Chapter 2 can be skipped.

## Conclusion

- Read **chapter 1** of the RPG Maker XP tutorial from Le Site du Zéro to master events.
- Skip **chapter 2** (database) — Pokemon Studio replaces this part in PSDK.
- Once the basics are acquired, guide **002 How to use the Interpreter in an event** explains how to go further with PSDK's Script commands.
