---
title: "Comment gérer les entrées clavier dans PSDK ?"
slug: gerer-les-entrees-clavier
sidebar_position: 4
description: "Ce guide explique comment gérer les inputs clavier dans une scène UI."
---

Ce guide explique comment gérer les inputs clavier dans une scène UI. Il fait suite aux guides 001 à 003 : le lecteur dispose d'une scène Mystery Gift avec une Composition et des composants visuels. Ici, on ajoute le fichier Input.rb au plugin pour mapper les boutons et la navigation.

## Principe

La gestion des inputs clavier est scindée en deux mécanismes distincts :

- **Boutons d'action** (A/B/X/Y) : gérés par `automatic_input_update(AIU_KEY2METHOD)` qui appelle `Input.trigger?` -- le bouton ne se déclenche qu'une seule fois par appui.
- **Touches directionnelles** (UP/DOWN) : gérées avec `Input.repeat?` -- le bouton se déclenche en continu tant qu'il est maintenu, avec un délai initial avant la répétition.

La logique d'input est placée dans un fichier séparé (Input.rb) qui réouvre la classe de scène. Les mêmes méthodes d'action (`action_a`, `action_b`) sont appelées à la fois par le clavier **et** par la souris.

Point important : `update_inputs`, `AIU_KEY2METHOD` et `MOUSE_BUTTON_ACTIONS` doivent rester **publics** (au-dessus du mot-clé `private`). Le framework appelle `update_inputs` depuis l'extérieur de la classe. Seules les méthodes d'action et la navigation vont sous `private`.

## Fichier Input complet

Le fichier Input.rb réouvre la classe de scène pour y ajouter les méthodes de gestion des inputs. Ce n'est pas un nouveau fichier de classe : il réouvre la même classe définie dans Main.rb.

```ruby
module GamePlay
  # Input handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Key-to-action mapping
    AIU_KEY2METHOD = { A: :action_a, B: :action_b }

    # Handle keyboard input each frame
    # @return [Boolean]
    def update_inputs
      return false unless @composition.done?
      return false unless automatic_input_update(AIU_KEY2METHOD)

      return update_navigation
    end

    private

    # Handle directional key navigation in the gift list
    # @return [Boolean]
    def update_navigation
      if Input.repeat?(:UP)
        play_cursor_se if @composition.move_selection(-1)
        return false
      elsif Input.repeat?(:DOWN)
        play_cursor_se if @composition.move_selection(1)
        return false
      end

      return true
    end

    # Action triggered by the A button -- open code input
    def action_a
      play_decision_se
      open_code_input
    end

    # Action triggered by the B button -- quit
    def action_b
      play_cancel_se
      @running = false
    end
  end
end
```

- `AIU_KEY2METHOD` et `update_inputs` sont déclarés **au-dessus** du mot-clé `private`. C'est obligatoire : le framework appelle `update_inputs` depuis l'extérieur de la classe. Si ces éléments sont sous `private`, le framework ne pourra pas y accéder.
- `@composition.done?` bloque les inputs pendant les animations. Sans cette vérification, le joueur pourrait interagir pendant une transition visuelle.
- `automatic_input_update` vérifie `Input.trigger?` pour chaque clé du hash `AIU_KEY2METHOD` et appelle la méthode correspondante si la touche est pressée. S'il trouve une touche pressée, il retourne `false` pour consommer l'input.
- `update_navigation` gère les touches directionnelles séparément avec `Input.repeat?`. Elle retourne `false` pour consommer l'input, `true` pour laisser le traitement continuer.
- `Input.repeat?` vs `Input.trigger?` : `repeat?` se déclenche en continu tant que la touche est maintenue (avec un délai initial avant la répétition), `trigger?` se déclenche une seule fois par appui.
- `play_cursor_se`, `play_decision_se` et `play_cancel_se` sont les effets sonores standards pour la navigation, la confirmation et l'annulation.
- `action_a` appelle `open_code_input`, une méthode de logique métier qui sera définie dans Logic.rb (guide suivant).
- `action_b` met `@running` à `false` pour quitter la scène.

## Navigation wrapping vs clamping

Le plugin Mystery Gift utilise `.clamp` pour borner l'index : le curseur s'arrête aux extrémités de la liste. C'est le comportement de `@composition.move_selection` qui gère le clamp en interne. Pour une navigation circulaire (le curseur revient au début après le dernier élément), on utilise le modulo :

```ruby
# Update the selected index with wrapping (loops around)
# @param new_index [Integer]
def update_index(new_index)
  max = @items.size
  @index = new_index % max
  @composition.select_row(@index)
end
```

- `% max` fait boucler l'index : descendre après le dernier élément ramène au premier, monter avant le premier ramène au dernier.
- Utilisez `.clamp(0, max - 1)` si vous préférez que le curseur s'arrête aux bornes sans boucler.
- Le choix entre wrapping et clamping dépend de la scène : un menu principal utilise souvent le wrapping, une liste de cadeaux utilise le clamping.

## Conclusion

- `update_inputs` et `AIU_KEY2METHOD` doivent être publics (au-dessus de `private`). Le framework appelle `update_inputs` depuis l'extérieur.
- Les boutons d'action (A/B) utilisent `Input.trigger?` via `automatic_input_update`.
- Les touches directionnelles (UP/DOWN) utilisent `Input.repeat?` dans une méthode `update_navigation` séparée.
- Les mêmes méthodes d'action sont partagées entre le clavier et la souris.
- Vérifiez toujours `@composition.done?` avant d'accepter les inputs.
- Utilisez le modulo pour une navigation circulaire, `.clamp` pour une navigation bornée.
