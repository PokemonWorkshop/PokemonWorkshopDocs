---
title: "Comment gérer la souris ?"
slug: gerer-la-souris
sidebar_position: 6
description: "Ce guide explique comment gérer les interactions souris dans une scène UI : molette, survol, clic et boutons ctrl."
---

Ce guide s'appuie sur le [guide clavier](./05-keyboard.md) : la scène a une liste de cadeaux navigable. Ici, on ajoute la gestion souris -- défilement, survol, clic sur les lignes, et les boutons ctrl du bas -- dans son propre fichier qui rouvre la classe de scène.

## Principe

La gestion souris suit des conventions précises dans PSDK :

- Elle vit dans un fichier séparé (`004 Mouse.rb`) qui rouvre la classe de scène.
- `update_mouse(moved)` et la constante `MOUSE_BUTTON_ACTIONS` doivent être **publics** -- le framework les appelle depuis l'extérieur de la classe.
- Le traitement se décompose en quatre étapes ordonnées : molette, survol, clic, boutons ctrl.
- Les sous-composants possèdent leur détection de collision via `simple_mouse_in?` ; la scène route les événements, elle ne teste jamais les collisions de sprites directement.

## Le fichier Mouse

`update_mouse` orchestre les quatre types d'interaction dans l'ordre. Chaque sous-méthode renvoie `true` si elle a consommé l'événement, ce qui stoppe le traitement suivant. Créez `scripts/20 MysteryGift/003 GamePlay/004 Mouse.rb` :

```ruby
module GamePlay
  # Mouse input handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Mouse button action mapping for ctrl buttons [A, X, Y, B]
    MOUSE_BUTTON_ACTIONS = [:action_a, nil, nil, :action_b]

    # Handle mouse input each frame
    # @param moved [Boolean] whether the mouse moved this frame
    def update_mouse(moved)
      return false unless @composition.done?
      return false if update_mouse_wheel
      return false if moved && update_mouse_hover
      return false if update_mouse_click

      return update_ctrl_button_mouse
    end

    # Handle mouse wheel scrolling
    # @return [Boolean] true if the wheel was used
    def update_mouse_wheel
      delta = Mouse.wheel
      return false if delta == 0

      Mouse.wheel = 0
      play_cursor_se if @composition.move_selection(delta > 0 ? -1 : 1)
      return true
    end

    # Handle mouse hover over gift rows
    # @return [Boolean] true if hover changed the selection
    def update_mouse_hover
      hovered_index = @composition.find_hovered_row_index
      return false if hovered_index.nil?
      return false if hovered_index == @composition.selected_index

      play_cursor_se
      @composition.select_row(hovered_index)
      return true
    end

    # Handle mouse clicks on gift rows
    # @return [Boolean] true if a click was handled
    def update_mouse_click
      return false unless Mouse.trigger?(:LEFT)

      hovered_index = @composition.find_hovered_row_index
      return false if hovered_index.nil?

      play_cursor_se
      @composition.select_row(hovered_index)
      return true
    end

    # Handle ctrl button mouse interaction
    # @return [Boolean]
    def update_ctrl_button_mouse
      update_mouse_ctrl_buttons(@base_ui.ctrl, MOUSE_BUTTON_ACTIONS)
      return false
    end
  end
end
```

- `update_mouse` et `MOUSE_BUTTON_ACTIONS` sont publics -- le framework appelle `update_mouse(Mouse.moved)` à chaque frame.
- `@composition.done?` bloque les entrées souris pendant les animations, exactement comme le clavier.
- L'ordre compte : molette d'abord, puis survol (seulement si le curseur a bougé), puis clic, et enfin les boutons ctrl en dernier recours.
- `Mouse.wheel = 0` réinitialise la valeur après lecture. Cette remise à zéro est obligatoire : sans elle, la valeur persiste et la molette défile à chaque frame.
- `update_mouse_hover` et `update_mouse_click` réutilisent `@composition.find_hovered_row_index` et `@composition.select_row` -- les mêmes méthodes de sélection que le clavier. Le survol compare avec `@composition.selected_index` pour ne se déclencher que quand la sélection change réellement.
- `update_ctrl_button_mouse` délègue à `update_mouse_ctrl_buttons`, un helper hérité de `GamePlay::Base`. Il gère la surbrillance au survol, l'animation d'appui et déclenche l'action mappée au clic. `MOUSE_BUTTON_ACTIONS` associe les positions `[A, X, Y, B]` à des méthodes d'action ; `nil` saute une position. L'entrée A (`:action_a`) devient active une fois qu'on affiche le bouton A et qu'on ajoute `action_a` dans les guides [i18n](./07-i18n.md) et [dialogues](./08-dialogs.md).

## Test de collision dans la Composition

La scène demande à la Composition « quelle ligne est survolée ? » ; la Composition demande à chaque ligne. Ajoutez cette méthode à `scripts/20 MysteryGift/002 UI/999 Composition.rb` :

```ruby
# Find which row the mouse hovers
# @return [Integer, nil] the row index or nil
def find_hovered_row_index
  return @rows.index { |row| row.visible && row.hovered? }
end
```

La scène lit aussi la sélection courante via la Composition, donc exposez-la -- ajoutez `attr_reader :selected_index` en haut de la classe :

```ruby
class Composition < SpriteStack
  # @return [Integer] current selected row index
  attr_reader :selected_index
  # ...
```

- `find_hovered_row_index` renvoie l'index de la première ligne visible dont `hovered?` est vrai, ou `nil`. Chaque GiftRow possède son test de collision via `simple_mouse_in?` (ajouté dans le guide SpriteStack).
- Cette délégation à trois couches -- la ligne possède `hovered?`, la Composition possède `find_hovered_row_index`, la scène route l'événement -- garde chaque couche concentrée sur sa responsabilité. La scène ne touche jamais directement la boîte de collision d'un sprite.

## Essayez

Réclamez quelques codes, puis ouvrez la scène :

```ruby
$user_data[:mystery_gift].claim('POTION50')
$user_data[:mystery_gift].claim('MASTERBALL')
GamePlay.open_mystery_gift
```

Passer la souris sur une ligne la met en surbrillance, la molette fait défiler la sélection, un clic gauche sélectionne une ligne, et cliquer le bouton « Quit » en bas ferme la scène.

## Conclusion

- `update_mouse` et `MOUSE_BUTTON_ACTIONS` doivent être publics -- le framework les appelle depuis l'extérieur.
- Décomposez `update_mouse` en molette, survol, clic, boutons ctrl ; chaque étape renvoie `true` pour stopper la chaîne.
- Réinitialisez toujours `Mouse.wheel` à 0 après lecture, sinon la molette défile sans fin.
- Souris et clavier partagent les mêmes méthodes de Composition (`select_row`, `move_selection`, `find_hovered_row_index`).
- Les sous-composants possèdent leur détection de collision via `simple_mouse_in?` ; la scène interroge la Composition, jamais les sprites directement.
- `MOUSE_BUTTON_ACTIONS` associe les boutons ctrl `[A, X, Y, B]` à des méthodes d'action, avec `nil` pour sauter une position.
