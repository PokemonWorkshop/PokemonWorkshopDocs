---
title: "Comment gérer la souris dans PSDK ?"
slug: gerer-la-souris
sidebar_position: 5
description: "Ce guide explique comment gérer les interactions souris dans une scène UI."
---

Ce guide explique comment gérer les interactions souris dans une scène UI. Il fait suite aux guides 001 à 004 : le lecteur dispose déjà d'une scène avec gestion des inputs clavier et une Composition fonctionnelle. L'exemple utilise la scène Mystery Gift.

## Principe

La gestion de la souris suit des conventions précises dans PSDK :

- Elle est placée dans un fichier séparé (XXX Mouse.rb) qui réouvre la classe de scène.
- La méthode `update_mouse(moved)` et la constante `MOUSE_BUTTON_ACTIONS` doivent être **publiques** -- le framework les appelle depuis l'extérieur de la classe.
- Le traitement est décomposé en quatre étapes ordonnées : wheel, hover, click, ctrl buttons.
- Les sous-composants possèdent leur propre détection de collision via `simple_mouse_in?`.
- La scène route les événements souris, elle ne vérifie pas les collisions directement.

## Structure de update_mouse

La méthode `update_mouse` orchestre les quatre types d'interactions souris dans un ordre précis. Chaque sous-méthode retourne `true` si elle a consommé l'événement, ce qui interrompt le traitement.

```ruby
module GamePlay
  # Mouse handling for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Mouse button action mapping for ctrl buttons
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
  end
end
```

- `update_mouse` et `MOUSE_BUTTON_ACTIONS` sont déclarés sans `private` -- ils doivent rester publics car le framework les appelle depuis l'extérieur de la classe.
- `@composition.done?` bloque les inputs souris pendant les animations, exactement comme pour le clavier.
- Chaque sous-méthode retourne `true` si elle a consommé l'événement, ce qui arrête la chaîne via `return false`.
- L'ordre est important : la molette est prioritaire, puis le hover (uniquement si le curseur a bougé), puis le click, et enfin les ctrl buttons en dernier recours.
- `MOUSE_BUTTON_ACTIONS` mappe les positions `[A, X, Y, B]` de la barre du bas aux méthodes d'action. `nil` signifie qu'aucune action n'est associée à cette position -- Mystery Gift n'utilise que A et B.

## Scroll avec la molette

La molette permet de faire défiler la liste des cadeaux sans passer par les flèches du clavier.

```ruby
# Handle mouse wheel scrolling
# @return [Boolean] true if the wheel was used
def update_mouse_wheel
  delta = Mouse.wheel
  return false if delta == 0

  Mouse.wheel = 0
  play_cursor_se if @composition.move_selection(delta > 0 ? -1 : 1)
  return true
end
```

- `Mouse.wheel` retourne le delta de scroll : positif vers le haut, négatif vers le bas.
- `Mouse.wheel = 0` remet la valeur à zéro après lecture. Ce reset est obligatoire : sans lui, la valeur persiste et la molette boucle indéfiniment à chaque frame.
- `@composition.move_selection` déplace la sélection d'un cran dans la direction indiquée et retourne `true` si la sélection a changé.
- `play_cursor_se` n'est joué que si la sélection a effectivement bougé.

## Survol

Le survol met à jour la sélection quand le curseur passe au-dessus d'une ligne de cadeau.

```ruby
# Handle mouse hover over gift rows
# @return [Boolean] true if hover changed selection
def update_mouse_hover
  hovered_index = @composition.find_hovered_row_index
  return false if hovered_index.nil?
  return false if hovered_index == @composition.selected_index

  play_cursor_se
  @composition.select_row(hovered_index)
  return true
end
```

- La Composition expose `find_hovered_row_index` qui interroge ses sous-composants via `simple_mouse_in?`. La scène demande simplement "quel élément est survolé ?", elle ne vérifie pas les sprites directement.
- Si aucun élément n'est survolé (`nil`) ou si l'élément survolé est déjà sélectionné, on retourne `false` pour laisser la chaîne continuer.
- `@composition.selected_index` permet de comparer avec l'index courant sans maintenir un `@index` dupliqué dans la scène.
- Ce pattern respecte le principe de Composition : chaque couche gère sa responsabilité.

## Clic

Le clic gauche sélectionne un élément sous le curseur.

```ruby
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
```

- `Mouse.trigger?(:LEFT)` retourne `true` une seule fois par clic (pas à chaque frame où le bouton est maintenu).
- La méthode réutilise `find_hovered_row_index` de la Composition pour déterminer quel élément est sous le curseur.
- Un clic sur n'importe quelle ligne sélectionne cette ligne et joue le son de curseur.

## Ctrl buttons

Les ctrl buttons sont les boutons de la barre inférieure. Leur gestion est déléguée à un helper hérité de `GamePlay::Base`.

```ruby
# Handle ctrl button mouse interaction
# @return [Boolean]
def update_ctrl_button_mouse
  update_mouse_ctrl_buttons(@base_ui.ctrl, MOUSE_BUTTON_ACTIONS)
  return false
end
```

- `update_mouse_ctrl_buttons` est un helper intégré à `GamePlay::Base`. Il gère l'animation de pression, et le déclenchement de la méthode d'action au clic.
- `MOUSE_BUTTON_ACTIONS` mappe les positions `[A, X, Y, B]` aux noms de méthodes. Les positions à `nil` sont ignorées.
- C'est le dernier maillon de la chaîne dans `update_mouse` : il ne s'exécute que si aucun autre gestionnaire n'a consommé l'événement.

## Hit testing dans les composants

Chaque composant visuel est responsable de sa propre détection de collision. La Composition interroge ses composants, et la scène interroge la Composition.

```ruby
# Tell if the mouse is hovering this component
# @return [Boolean]
def hovered?
  return @background.simple_mouse_in?
end
```

- `simple_mouse_in?` vérifie si le curseur de la souris se trouve dans le rectangle englobant du sprite.
- Le composant possède cette vérification, la Composition l'interroge via `find_hovered_row_index`, et la scène interroge la Composition. Cette délégation à trois niveaux garde chaque couche concentrée sur sa responsabilité.

## Conclusion

- `update_mouse` et `MOUSE_BUTTON_ACTIONS` doivent rester publics -- le framework les appelle depuis l'extérieur.
- Décomposez `update_mouse` en wheel, hover, click, ctrl buttons, chaque étape retournant `true` pour interrompre le traitement.
- Remettez toujours `Mouse.wheel` à 0 après lecture, sinon la molette boucle indéfiniment.
- Les sous-composants possèdent leur détection de collision via `simple_mouse_in?`, la scène interroge la Composition (jamais les sprites directement).
- Utilisez `Mouse.trigger?(:LEFT)` pour les clics et `Mouse.wheel` pour le scroll.
- `MOUSE_BUTTON_ACTIONS` associe les positions `[A, X, Y, B]` des ctrl buttons aux méthodes d'action, avec `nil` pour ignorer une position.
