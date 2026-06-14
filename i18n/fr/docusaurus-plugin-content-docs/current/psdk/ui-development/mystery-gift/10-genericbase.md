---
title: "Comment personnaliser GenericBase ?"
slug: personnaliser-genericbase
sidebar_position: 10
description: "Ce guide termine la base UI : personnaliser le fond, la barre de boutons et les boutons ctrl en héritant de GenericBase."
---

Ce guide s'appuie sur toute la série : vous avez une scène Mystery Gift entièrement fonctionnelle. Dans le [guide de la scène](./01-ui-scene.md), on avait écrit un `MysteryGiftBase` minimal qui ne changeait que le fond. Ici, on le termine -- une barre de boutons et des boutons ctrl thématisés -- c'est le dernier changement de la scène.

## Principe

`GenericBase` est la fondation de toute scène UI : fond, barre de boutons, boutons ctrl et `win_text`. Ne reconstruisez jamais ces éléments de zéro -- héritez de `GenericBase` et surchargez ses méthodes privées. Elle utilise le patron Template Method : les valeurs en dur sont extraites dans des méthodes privées surchargeables.

Pour les boutons ctrl, utilisez l'**héritage** (une sous-classe imbriquée), jamais `prepend` : `prepend` est global et changerait les boutons de toutes les scènes du jeu.

## Méthodes surchargeables

| Besoin                               | Classe                  | Méthode à surcharger          | Valeur par défaut           |
| ------------------------------------ | ----------------------- | ----------------------------- | --------------------------- |
| Fond différent                       | sous-classe GenericBase | `background_filename`         | `'team/Fond'`               |
| Barre de boutons différente          | sous-classe GenericBase | `button_background_filename`  | `'tcard/button_background'` |
| Pas d'animation de fond              | sous-classe GenericBase | `create_background_animation` | Animation de défilement     |
| Classe de bouton ctrl personnalisée  | sous-classe GenericBase | `control_button_class`        | `ControlButton`             |
| Texture de bouton différente         | sous-classe ControlButton | `button_texture`            | `'buttons'`                 |

## Terminer MysteryGiftBase

Modifiez `scripts/20 MysteryGift/003 GamePlay/000 Base.rb` vers sa version complète :

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

- `background_filename` et `create_background_animation` étaient là depuis le guide de la scène ; on ajoute le reste maintenant.
- `button_background_filename` renvoie la barre du bas thématisée (`graphics/interface/mystery_gift/button_background.png`).
- `control_button_class` renvoie la sous-classe `ControlButton` imbriquée ; le `create_control_button` hérité l'utilise automatiquement -- pas besoin de réécrire la création des boutons.
- La `ControlButton` imbriquée hérite de `GenericBase::ControlButton` et ne surcharge que `button_texture` pour utiliser `mystery_gift/buttons`. Elle hérite de tout le reste (état pressé, icône de touche, libellé).
- `control_button_default_cache` renvoie `:interface` pour que la texture des boutons se charge depuis `graphics/interface/` comme le reste de nos assets, au lieu du cache `pokedex` par défaut. Pas besoin de surcharger `initialize`.
- La texture `buttons` suit le format spritesheet 2×2 décrit dans le guide de préparation (colonne A/X/Y, colonne B ; ligne normale, ligne pressée ; séparateurs transparents d'1px).

## Pourquoi l'héritage, pas prepend

`prepend` insère un module dans la chaîne de recherche de la classe d'origine -- il affecte **tous** les ControlButton du jeu, dans toutes les scènes. Une sous-classe imbriquée n'affecte que la scène qui l'instancie : Mystery Gift crée son `ControlButton` local, tandis que l'équipe, le PC et toutes les autres scènes gardent `GenericBase::ControlButton` intact.

## GenericBaseMultiMode

Quand différents états de scène ont besoin de libellés de boutons différents, utilisez `GenericBaseMultiMode` au lieu de `GenericBase` :

```ruby
texts = [
  [scene_text(0), nil, nil, scene_text(1)],          # mode 0: Confirm + Back
  [scene_text(2), scene_text(3), nil, scene_text(1)] # mode 1: Edit + Delete + Back
]
keys = [%i[A X Y B], %i[A X Y B]]
@base_ui = UI::GenericBaseMultiMode.new(@viewport, texts, keys)

@base_ui.mode = 1  # switch to Edit + Delete + Back
```

- Toutes les configurations de boutons sont passées à la construction ; basculez avec `mode=` et les libellés se mettent à jour. Mystery Gift n'en a pas besoin (ses boutons ne changent jamais), mais c'est l'outil à utiliser quand c'est le cas.

## Essayez

Ouvrez la scène une dernière fois :

```ruby
GamePlay.open_mystery_gift
```

La barre du bas et les boutons A/B utilisent maintenant le thème Mystery Gift. La scène est complète : parcourez les cadeaux réclamés au clavier ou à la souris, entrez un code avec A, et regardez la bannière lors d'une réclamation réussie.

## Conclusion

- Héritez toujours de `GenericBase` pour un fond et une barre de boutons personnalisés -- surchargez `background_filename`, `button_background_filename`, `create_background_animation`.
- Personnalisez les textures de boutons avec une **sous-classe imbriquée** de `GenericBase::ControlButton` -- jamais `prepend`, qui est global.
- Surchargez `control_button_class` pour renvoyer votre sous-classe ; pas besoin de réécrire `create_control_button`.
- Les textures de boutons personnalisées suivent le format spritesheet 2×2.
- Utilisez `GenericBaseMultiMode` quand une scène a besoin de libellés de boutons différents selon l'état.
