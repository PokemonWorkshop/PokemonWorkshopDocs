---
title: "Change move effectiveness"
slug: how-to-change-move-effectiveness
sidebar_position: 6
description: "This guide explains how to modify the type multiplier of a move, whether from the move's own logic or from an external effect."
---

## Principle

A move's effectiveness can be changed for two distinct reasons:

- **From the move itself**: the move overrides the `single_type_multiplier_overwrite` method in its subclass.
- **From an external effect**: an active effect modifies the type multiplier before damage calculation.

The returned value is a numeric multiplier applied **per target type**:

- `0` = immune
- `0.5` = not very effective
- `1` = neutral (normal effectiveness)
- `2` = super effective

## From the move

Some moves can change their effectiveness based on their own rules. For example, the move **Freeze-Dry** deals super effective damage against Water-type Pokemon, even though Ice is normally neutral against Water.

To handle this behavior, override the `single_type_multiplier_overwrite` method in the move's subclass. If the conditions are not met, return `super` to let the default calculation chain continue.

### Example: Freeze-Dry

```ruby
module Battle
  class Move
    class FreezeDry < Basic
      private

      def single_type_multiplier_overwrite(target, target_type, type)
        return 2 if target_type == data_type(:water).id

        return super
      end
    end
  end
end
```

- The method checks if the target's type is Water. If so, it returns `2` (super effective).
- If the condition is not met, `return super` delegates to the parent class's default behavior.
- No need to check `db_symbol`: the method is defined in the move's subclass, so it only applies to that move.

## From an effect

Some effects can modify the type effectiveness of a move. For example, the **Foresight** effect allows Normal and Fighting-type moves to hit Ghost-type Pokemon with neutral effectiveness.

To handle this behavior, use the `on_single_type_multiplier_overwrite` method in the effect's class.

### Example: Foresight

```ruby
# Function that computes an overwrite of the type multiplier
# @param target [PFM::PokemonBattler]
# @param target_type [Integer] one of the type of the target
# @param type [Integer] one of the type of the move
# @param move [Battle::Move]
# @return [Numeric, nil] overwriten type multiplier
def on_single_type_multiplier_overwrite(target, target_type, type, move)
  return if target != @pokemon || target_type != data_type(:ghost).id
  return unless [data_type(:normal).id, data_type(:fighting).id].include?(type)

  return 1
end
```

- The first line checks that the target is the effect holder and that the target's type is Ghost.
- The second line checks that the move's type is Normal or Fighting.
- Returning `1` replaces the usual immunity (Ghost immune to Normal/Fighting) with neutral effectiveness.
- Returning `nil` (implicit) leaves the type multiplier unchanged.

## Conclusion

- Override `single_type_multiplier_overwrite` in the move's subclass if the change depends on the move's own logic. Return `super` if the conditions are not met.
- Use `on_single_type_multiplier_overwrite` if the change depends on an external effect. Return `nil` (implicitly) to leave the multiplier unchanged.
- Return a `Numeric` (0, 0.5, 1, 2) to modify the multiplier.
