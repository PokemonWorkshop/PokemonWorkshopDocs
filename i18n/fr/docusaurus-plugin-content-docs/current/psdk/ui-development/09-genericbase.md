---
title: "Comment personnaliser GenericBase dans PSDK ?"
slug: personnaliser-genericbase
sidebar_position: 9
description: "Ce guide explique comment personnaliser l'apparence des scènes qui héritent de GenericBase : background, barre de boutons et ctrl buttons."
---

Ce guide explique comment personnaliser l'apparence des scènes qui héritent de GenericBase : background, barre de boutons et ctrl buttons. Il utilise le plugin Mystery Gift comme exemple concret. Il suppose que les guides 001 à 003 ont été lus (le lecteur dispose d'une scène fonctionnelle avec GenericBase).

## Principe

GenericBase est le socle de toute scène UI -- il fournit le background, la barre de boutons, les ctrl buttons et le win_text. Il ne faut jamais reconstruire ces éléments de zéro : on sous-classe GenericBase et on override ses méthodes privées.

GenericBase utilise le pattern Template Method : les valeurs codées en dur sont extraites dans des méthodes privées qu'on peut override. Pour la personnalisation des ControlButton, on utilise l'héritage (sous-classe) et non `prepend` -- le prepend est global et affecte toutes les scènes du jeu.

## Méthodes overridables

| Besoin                                   | Classe                    | Méthode à override            | Valeur par défaut           |
| ---------------------------------------- | ------------------------- | ----------------------------- | --------------------------- |
| Background différent                     | sous-classe GenericBase   | `background_filename`         | `'team/Fond'`               |
| Barre de boutons différente              | sous-classe GenericBase   | `button_background_filename`  | `'tcard/button_background'` |
| Pas d'animation de background            | sous-classe GenericBase   | `create_background_animation` | Animation de scrolling      |
| Classe de ctrl buttons personnalisée     | sous-classe GenericBase   | `control_button_class`        | `ControlButton`             |
| Boutons cachés différents sur win_text   | sous-classe GenericBase   | `hidden_button_indexes`       | 0..2                        |
| Texture de bouton différente             | sous-classe ControlButton | `button_texture`              | `'buttons'`                 |
| Disposition du texte différente          | sous-classe ControlButton | `text_rect`                   | `[17, 3, 51, 13]`           |
| Position de l'icône de touche différente | sous-classe ControlButton | `key_button_position`         | `[0, 1]`                    |
| Couleur de texte différente              | sous-classe ControlButton | `text_color(index)`           | 20 ou 21                    |
| Police différente                        | sous-classe ControlButton | `text_font`                   | 20                          |

## Exemple complet : Mystery Gift

Le plugin Mystery Gift personnalise à la fois le background, la barre de boutons et la texture des ctrl buttons. Tout est regroupé dans une seule sous-classe de GenericBase.

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

    # Return the button background filename
    # @return [String]
    def button_background_filename
      return 'mystery_gift/button_background'
    end

    # Return the class used to create control buttons
    # @return [Class]
    def control_button_class
      return ControlButton
    end

    # Disable the background scroll animation
    def create_background_animation; end

    # Return the default cache used by control buttons
    # @return [Symbol]
    def control_button_default_cache
      return :interface
    end

    # Custom control button with mystery gift theme
    class ControlButton < GenericBase::ControlButton
      private

      # Use the mystery gift button texture
      # @return [String]
      def button_texture
        return 'mystery_gift/buttons'
      end
    end
  end
end
```

- `MysteryGiftBase` hérite de `GenericBase` -- tout le comportement de base (barre, ctrl buttons, win_text) est préservé.
- `background_filename` et `button_background_filename` retournent les noms des images spécifiques au plugin.
- `create_background_animation` est override comme méthode vide (no-op) pour désactiver l'effet de scrolling du background.
- `control_button_class` retourne la sous-classe `ControlButton` imbriquée -- `create_control_button` (hérité) l'utilise automatiquement pour instancier les boutons. Pas besoin de réécrire `create_control_button`.
- La classe `ControlButton` est définie comme sous-classe de `GenericBase::ControlButton` -- elle hérite de tout le comportement (état appuyé, affichage des touches, texte) et override uniquement `button_texture`.
- `control_button_default_cache` retourne `:interface` pour charger les textures depuis `graphics/interface/` au lieu de `graphics/pokedex/`. Tous les assets du plugin sont ainsi regroupés au même endroit. Pas besoin d'override `initialize` sur ControlButton.
- La texture doit suivre le même format de spritesheet : grille 2x2 (colonne 0 = A/X/Y, colonne 1 = B, ligne 0 = normal, ligne 1 = appuyé), séparées par 1px transparent.

## Pourquoi l'héritage et pas prepend pour ControlButton

`prepend` insère un module dans la chaîne de lookup de la classe originale -- il affecte TOUS les ControlButton du jeu, dans toutes les scènes. Si un plugin utilise `prepend` pour changer la texture des boutons, les boutons de l'équipe, du PC et de toutes les autres scènes changent aussi.

L'héritage (sous-classe imbriquée) n'affecte que la scène qui instancie cette sous-classe. Le plugin Mystery Gift instancie `ControlButton` (sa sous-classe locale) dans `create_control_button` -- les autres scènes continuent d'utiliser `GenericBase::ControlButton` sans être affectées.

## GenericBaseMultiMode

```ruby
# Create base UI with multiple button configurations
texts = [
  [scene_text(0), nil, nil, scene_text(1)],           # mode 0: Confirm + Back
  [scene_text(2), scene_text(3), nil, scene_text(1)]  # mode 1: Edit + Delete + Back
]

keys = [
  %i[A X Y B],
  %i[A X Y B]
]

@base_ui = UI::GenericBaseMultiMode.new(@viewport, texts, keys)

# Switch mode later
@base_ui.mode = 1  # changes to Edit + Delete + Back
```

- GenericBaseMultiMode s'utilise quand différents états de la scène ont besoin de labels de boutons différents.
- Toutes les configurations de boutons sont passées à la construction via les tableaux `texts` et `keys`.
- On change de mode avec `mode=` -- les labels des ctrl buttons se mettent à jour automatiquement.
- Le tableau `keys` définit les icônes de touches affichées dans chaque mode.

## Conclusion

- Toujours sous-classer GenericBase pour les backgrounds et barres de boutons personnalisés -- override `background_filename`, `button_background_filename` et `create_background_animation`.
- Utiliser l'héritage (sous-classe imbriquée de `GenericBase::ControlButton`) pour personnaliser la texture des boutons -- jamais `prepend`, qui est global et affecte toutes les scènes.
- Override `control_button_class` pour retourner la sous-classe locale -- pas besoin de réécrire `create_control_button`.
- Les textures de boutons personnalisées doivent suivre le format de spritesheet 2x2 (colonne A/X/Y, colonne B, ligne normal, ligne appuyé).
- Utiliser GenericBaseMultiMode quand la scène a besoin de labels de boutons différents selon les états.
