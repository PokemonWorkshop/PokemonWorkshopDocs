---
title: "Gérer les entrées clavier"
slug: gerer-les-entrees-clavier
sidebar_position: 5
description: "Ce guide explique comment gérer les inputs clavier dans une scène UI : touches boutons, navigation dans la liste, et déplacement de la gestion des entrées dans son propre fichier."
---

Ce guide s'appuie sur le [guide couche de données](./04-mystery-gift-data.md) : la scène affiche maintenant les cadeaux réclamés par le joueur. Ici, on ajoute la gestion clavier -- naviguer dans la liste avec les flèches et quitter avec B -- et on sort le code d'entrée de `001 Main.rb` vers son propre fichier.

## Principe

Les entrées clavier se répartissent en deux mécanismes :

- **Touches boutons** (A/B/X/Y) : gérées par `automatic_input_update`, qui appelle `Input.trigger?` -- le bouton se déclenche une fois par appui.
- **Touches directionnelles** (UP/DOWN) : gérées avec `Input.repeat?` -- la touche se déclenche en continu tant qu'elle est maintenue, après un délai initial.

Deux règles importantes :

- `update_inputs` et la constante `AIU_KEY2METHOD` doivent rester **publics** (au-dessus de `private`). Le framework appelle `update_inputs` depuis l'extérieur de la classe ; si elle était privée, le framework ne pourrait pas l'atteindre.
- La gestion des entrées vit dans son propre fichier qui **rouvre** la classe de scène (`003 Input.rb`). Dans le [guide de la scène](./01-ui-scene.md), on avait mis un `update_inputs`/`action_b` temporaire directement dans `001 Main.rb` ; on les déplace maintenant ici et on les étoffe. Les mêmes méthodes d'action sont partagées par le clavier **et** la souris.

## Le fichier Input

Créez `scripts/20 MysteryGift/003 GamePlay/003 Input.rb` :

```ruby
module GamePlay
  # Keyboard input handling for the Mystery Gift scene
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

    # Action triggered by the B button -- quit
    def action_b
      play_cancel_se
      @running = false
    end
  end
end
```

- `AIU_KEY2METHOD` associe une touche à un nom de méthode. On liste déjà `A: :action_a` ici, mais on ne définit que `action_b` pour l'instant -- `automatic_input_update` vérifie `respond_to?` avant d'appeler, donc appuyer sur A ne fait simplement rien jusqu'à ce qu'on ajoute `action_a` dans le [guide dialogues](./08-dialogs.md).
- `@composition.done?` bloque les entrées pendant qu'une animation joue. Elle renvoie toujours `true` aujourd'hui (pas encore d'animation), mais brancher la garde maintenant fait que les entrées seront automatiquement bloquées une fois les animations ajoutées.
- `automatic_input_update(AIU_KEY2METHOD)` vérifie `Input.trigger?` pour chaque touche mappée et appelle la méthode correspondante. Elle renvoie `false` quand elle a consommé un appui, ce qu'on propage pour stopper le traitement suivant.
- `update_navigation` gère les flèches séparément avec `Input.repeat?`. Elle renvoie `false` pour consommer l'input, `true` pour laisser le traitement continuer.
- `play_cursor_se` et `play_cancel_se` sont les effets sonores standard de navigation et d'annulation, hérités de `GamePlay::Base`.
- `action_b` passe `@running` à `false` pour sortir de la scène.

Comme ce fichier rouvre `GamePlay::MysteryGift`, **retirez** les `update_inputs` et `action_b` temporaires de `001 Main.rb` -- ils vivent ici désormais. `001 Main.rb` devient :

```ruby
module GamePlay
  # Mystery Gift scene -- displays the player's claimed gifts
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
      $user_data[:mystery_gift] ||= PFM::MysteryGift.new
    end

    # Update graphics each frame
    def update_graphics
      @base_ui.update_background_animation
      @composition.update
    end

    private

    # Create all the graphics for the scene
    def create_graphics
      create_viewport
      create_base_ui
      create_composition
      Graphics.sort_z
    end

    # Create the base UI with button texts
    def create_base_ui
      @base_ui = UI::MysteryGiftBase.new(@viewport, button_texts)
    end

    # Create the composition
    def create_composition
      @composition = Composition.new(@viewport, $user_data[:mystery_gift])
    end

    # Return the button texts for the ctrl buttons [A, X, Y, B]
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

## La sélection dans la Composition

La navigation demande à la Composition de déplacer la ligne sélectionnée. Ajoutez ces deux méthodes publiques à `scripts/20 MysteryGift/002 UI/999 Composition.rb` (à côté de `refresh`) :

```ruby
# Select a row by index
# @param index [Integer]
def select_row(index)
  @rows.each_with_index { |row, row_index| row.selected = (row_index == index) }
  @selected_index = index
end

# Move selection by delta, clamped to the valid range
# @param delta [Integer] -1 for up, +1 for down
# @return [Boolean] true if the selection changed
def move_selection(delta)
  gift_count = @mystery_data.claimed_count
  return false if gift_count == 0

  new_index = (@selected_index + delta).clamp(0, [gift_count - 1, VISIBLE_ROWS - 1].min)
  return false if new_index == @selected_index

  select_row(new_index)
  return true
end
```

- `select_row` met en surbrillance une ligne et stocke son index dans `@selected_index`. Elle est aussi réutilisée par la gestion souris dans le guide suivant.
- `move_selection` calcule le nouvel index, **clampé** pour que le curseur s'arrête aux bords de la liste. Elle renvoie `true` seulement si la sélection a réellement changé -- la scène s'en sert pour ne jouer le son de curseur que quand quelque chose a bougé.
- La borne haute du clamp est `[gift_count - 1, VISIBLE_ROWS - 1].min` : on ne peut pas sélectionner au-delà du nombre de cadeaux réclamés, ni au-delà du nombre de lignes visibles.

## Bouclage vs clamp

Mystery Gift utilise `.clamp` : le curseur s'arrête à la première et à la dernière entrée. Pour un menu où le curseur doit revenir au début après le dernier élément, utilisez plutôt le modulo :

```ruby
# Wrap the index around (loops back to the start)
new_index = (@selected_index + delta) % gift_count
```

- `% gift_count` boucle : dépasser la dernière entrée revient à la première, et inversement.
- Utilisez `.clamp(0, max)` pour une liste bornée, `% size` pour un menu qui boucle. Le choix dépend de la scène.

## Essayez

Réclamez quelques codes depuis la console pour avoir de quoi naviguer, puis ouvrez la scène :

```ruby
$user_data[:mystery_gift].claim('POTION50')
$user_data[:mystery_gift].claim('MASTERBALL')
GamePlay.open_mystery_gift
```

UP et DOWN déplacent la surbrillance entre les deux lignes (avec le son de curseur), et B ferme la scène.

## Conclusion

- `update_inputs` et `AIU_KEY2METHOD` doivent être publics -- le framework appelle `update_inputs` depuis l'extérieur.
- Les touches boutons (A/B) utilisent `Input.trigger?` via `automatic_input_update` ; les touches directionnelles (UP/DOWN) utilisent `Input.repeat?`.
- `automatic_input_update` ignore les touches dont la méthode d'action n'est pas encore définie, donc vous pouvez mapper une touche avant d'implémenter son action.
- La gestion des entrées rouvre la classe de scène dans son propre fichier (`003 Input.rb`) ; les méthodes d'action sont partagées avec la souris.
- Vérifiez toujours `@composition.done?` avant d'accepter une entrée.
- Utilisez `.clamp` pour une liste bornée, le modulo pour un menu qui boucle.
