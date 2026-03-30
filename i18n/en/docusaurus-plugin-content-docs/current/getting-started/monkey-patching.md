---
title: "How to monkey-patch a PSDK class?"
slug: monkey-patch-a-psdk-class
sidebar_position: 3
description: "PSDK is an engine that receives regular updates. If you directly modify an engine file to change a behavior, the next update will overwrite your changes. Monkey-patching allows you to modify the behavior of a PSDK class from your own scripts, without touching the engine's source code."
---

PSDK is an engine that receives regular updates. If you directly modify an engine file to change a behavior, the next update will overwrite your changes. Monkey-patching allows you to modify the behavior of a PSDK class **from your own scripts**, without touching the engine's source code. This guide covers the different monkey-patching techniques used in PSDK: `prepend` to globally modify a method, inheritance for a change local to a single scene, and module reopening for constants and registration functions.

## Principle

The problem is simple: you want to change the behavior of a method that exists in PSDK, but the engine's code is not in your project — it is loaded internally by PSDK. You cannot (and should not) modify it. Ruby solves this problem with **module prepend**:

1. In a Ruby file placed in `scripts/`, reopen the target PSDK class.
2. Declare a module inside that class.
3. This module redefines the method you want to modify.
4. Call `prepend` to insert the module **before** the class in the inheritance chain.
5. In the redefined method, `super` calls PSDK's original implementation.

The advantage of `prepend` over directly reopening the class (redefining the method without a module) is **composability**: if you install multiple plugins that modify the same method, each `super` passes control to the next one in the chain. If you redefined the method directly, you would overwrite patches from other plugins.

## Where to place monkey-patches

All user scripts go in the `scripts/` folder at the root of the project. This is the only place where PSDK loads custom code. The typical structure:

```
scripts/
  my-project/
    001 Patches/
      000 BattleLogic.rb <- monkey-patch on Battle::Logic
      001 ItemUsage.rb   <- monkey-patch on Util::Item
    002 Features/
      ...
```

- Scripts in `scripts/` are always loaded **after** PSDK's internal code. So `prepend` works naturally: the target class already exists at load time.
- Group patches in a dedicated subfolder so they are easy to find.

## Simple prepend: intercept and delegate

The most common case: you want to intercept a call to a PSDK method, check a condition, and either short-circuit the behavior or let PSDK do its job via `super`.

### Example: block EXP after capture based on generation

```ruby
module Battle
  class Logic
    # Patch to prevent EXP distribution after catching when using gen-based EXP sharing
    module EXPAfterCatchingPokemon
      # Function that process the battle end when Pokemon was caught
      def battle_phase_end_caught
        return if $game_variables[Yuki::Var::GEN_EXP_SHARE].between?(1, 5)

        super
      end
    end

    prepend EXPAfterCatchingPokemon
  end
end
```

- `module Battle` / `class Logic`: we **reopen** the existing PSDK class. We are not creating a new class, we are extending the one that already exists in the engine.
- The `EXPAfterCatchingPokemon` module is declared **inside** `Battle::Logic`. This is a PSDK convention: the patch module lives in the class it modifies.
- `battle_phase_end_caught` is the original PSDK method being intercepted. You need to know its exact name (by reading the PSDK source code or documentation).
- `return if ...` short-circuits the method: if the condition is true, we exit immediately without distributing EXP.
- `super` calls PSDK's original implementation. Without this `super`, the original behavior would be entirely suppressed.
- `prepend EXPAfterCatchingPokemon` inserts the module before `Battle::Logic` in the inheritance chain. Every call to `battle_phase_end_caught` passes through the module first.

## Complex prepend: enrich before delegating

When you want to handle a new case that does not exist in PSDK, then let PSDK handle all other cases normally.

### Example: intercept offensive item usage

```ruby
module Util
  module Item
    # Patch to handle attack items in battle
    module AttackItemPatch
      # Use an item in a GamePlay::Base child class
      # @param item_id [Integer] ID of the item in the database
      # @return [PFM::ItemDescriptor::Wrapper, false] item descriptor wrapper if the item could be used
      def util_item_useitem(item_id, &result_process)
        item_wrapper = PFM::ItemDescriptor.actions(item_id)
        return super unless item_wrapper.attack_item && $game_temp.in_battle

        if item_wrapper.chen
          display_message(parse_text(22, 43))
          return false
        elsif item_wrapper.no_effect
          display_message(parse_text(22, 108))
          return false
        end

        return util_attack_item_on_use_sequence(item_wrapper, result_process)
      end
    end

    prepend AttackItemPatch
  end
end
```

- `return super unless item_wrapper.attack_item && $game_temp.in_battle`: if the item is not an attack item or we are not in battle, we delegate entirely to PSDK. The patch is then invisible for all existing cases.
- The `chen` and `no_effect` cases are additional guards: we display a message and return `false` to block usage.
- `util_attack_item_on_use_sequence` is a new method defined elsewhere in our scripts (not in the patch module). The patch module only contains the interception.
- The `return super unless condition` pattern is idiomatic in PSDK: handle your new case, and let everything else pass through the original behavior.

## Prepend on an included module

The same technique works on PSDK modules that are included in classes. Reopen the module, declare the patch, and prepend.

### Example: redirect offensive items in the battle UI

```ruby
module BattleUI
  module PlayerChoiceAbstraction
    # Patch to redirect attack items to the attack item choice flow
    module AttackItemShortcutPatch
      # Redirect attack items to the attack item choice flow
      # @param item [Studio::Item] the item to use
      def use_item(item)
        item_wrapper = PFM::ItemDescriptor.actions(item.id)
        return super unless item_wrapper.attack_item

        scene.attack_item_shortcut = item_wrapper
        @result = :bag
      end
    end

    prepend AttackItemShortcutPatch
  end
end
```

- `BattleUI::PlayerChoiceAbstraction` is a PSDK module included in several battle scene classes. The prepend affects all classes that include this module.
- The pattern is identical: `return super unless condition`, then the specific handling.

## Extending a registration API

When PSDK exposes a hash or registration structure via `module_function`, you can extend that structure without prepend. Reopen the module and add new registration functions.

### Example: add an offensive item registration API

```ruby
module PFM
  module ItemDescriptor
    module_function

    # Define a usage of an attack item from the bag
    # @param klass [Class<Studio::Item>, Symbol] class or db_symbol of the item
    # @yieldparam item [Studio::Item] the item to use
    # @yieldparam scene [GamePlay::Base]
    def define_on_attack_item_use(klass, &block)
      raise 'Block is mandatory' unless block_given?

      EXTEND_DATAS[klass] ||= Wrapper.new
      EXTEND_DATAS[klass].on_attack_item_use = block
      EXTEND_DATAS[klass].attack_item = true
    end

    # Wrapper extension for attack items
    class Wrapper
      # Tell if the item is an attack item
      # @return [Boolean]
      attr_accessor :attack_item
      # Register the on_use block
      attr_writer :on_attack_item_use

      # Call the on_use block
      # @param scene [GamePlay::Base]
      def on_attack_item_use(scene)
        @on_attack_item_use&.call(@item, scene)
      end
    end
  end
end
```

- `EXTEND_DATAS` is an existing hash in PSDK. We do not recreate it, we add entries via `||=`.
- `module_function` makes `define_on_attack_item_use` callable as `PFM::ItemDescriptor.define_on_attack_item_use(...)`.
- The `Wrapper` class is reopened to add new attributes. This works because PSDK constants are **not frozen** with `.freeze`.
- This approach is non-destructive: existing registrations in `EXTEND_DATAS` remain intact.

## Inheritance: local monkey-patching

`prepend` is **global**: it affects all instances of the class across the entire game. When you want a local change (a single scene, a single component), inheritance is the monkey-patching technique to prefer.

### Example: customize GenericBase for a specific scene

```ruby
module UI
  # Custom base UI for the Mystery Gift scene
  class MysteryGiftBase < GenericBase
    private

    # Return the background filename
    # @return [String]
    def background_filename
      return 'mystery_gift/background'
    end

    # Disable the background scroll animation
    def create_background_animation; end
  end
end
```

- `MysteryGiftBase < GenericBase` creates a subclass that only affects the Mystery Gift scene.
- If we had used `prepend` on `GenericBase`, **all** scenes in the game would have been affected.
- Rule: if the change is specific to a single scene and should not affect others, prefer inheritance over `prepend`.

## Survival rules

A few essential rules for clean monkey-patching in PSDK:

- **Always call `super`**: unless the explicit goal is to block the original behavior. Forgetting `super` silently breaks the chain.
- **Never use `.freeze` on constants**: `.freeze` prevents extending structures via `prepend` or reopening. You would then have to delete and rebuild the constant instead of simply adding to it.
- **One module per patched class**: if you patch three methods of the same class, they can be grouped in a single patch module. But never mix patches of different classes in the same module.
- **Name the patch module explicitly**: the name should describe what the patch does (`EXPAfterCatchingPokemon`, `AttackItemPatch`), not just `Patch` or `Fix`.
- **Document patched methods**: note somewhere (README, comment at the top of the file) which PSDK methods are modified. When PSDK updates, this lets you quickly check if the patched methods have changed.

## Conclusion

- Monkey-patching is **necessary** in PSDK: directly modifying the engine would be overwritten on the next update. Always work from your own scripts.
- `prepend` is the standard mechanism to modify an existing PSDK method. It preserves the call chain via `super` and allows multiple patches to coexist.
- The idiomatic pattern is `return super unless condition`: handle your new case, and let everything else pass through the original behavior.
- To extend a registration API, reopen the module and add new functions without overwriting existing ones.
- Inheritance is preferable to `prepend` when the change is local to a single scene or component.
- Never forget `super`, never use `.freeze`, and always document patched methods.
