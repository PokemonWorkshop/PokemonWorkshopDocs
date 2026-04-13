---
title: "Comment créer une Composition dans PSDK ?"
slug: creer-une-composition
sidebar_position: 2
description: "Ce guide explique comment créer une Composition, la classe centrale de l'UI qui regroupe tous les composants visuels d'une scène."
---

Ce guide explique comment créer une Composition, la classe centrale de l'UI qui regroupe tous les composants visuels d'une scène. Il fait suite au guide 001 : le lecteur dispose déjà d'une scène Mystery Gift minimale fonctionnelle.

## Principe

La Composition est la classe qui orchestre **tout** le rendu visuel d'une scène. Elle suit des règles précises :

- Elle hérite de `SpriteStack` et se nomme `UI::X::Composition`.
- Elle est le **seul point de contact** entre la scène GamePlay et la couche UI.
- La scène lui délègue la création et la mise à jour de tous les éléments visuels.
- Elle doit toujours exposer les méthodes `update()` et `done?()` pour que le framework de scène puisse la piloter.

## Module de constantes

Avant de créer la Composition, il faut définir les constantes du module UI. Elles centralisent les identifiants de texte, les dimensions et les positions utilisés par tous les fichiers UI.

```ruby
module UI
  # UI module for the Mystery Gift scene
  module MysteryGift
    # CSV file ID for i18n text
    TEXT_FILE_ID = 311_125
    # Text IDs
    TEXT_ENTER_CODE = 0
    TEXT_QUIT = 1
    TEXT_TITLE = 2

    # Layout constants (320x240 resolution)
    HEADER_Y = 0
    FRAME_X = 8
    FRAME_Y = 22
    FRAME_WIDTH = 304
    FRAME_HEIGHT = 188
  end
end
```

- `TEXT_FILE_ID` est l'identifiant du fichier CSV contenant les textes traduits de la scène, utilisé avec `ext_text`.
- `TEXT_ENTER_CODE`, `TEXT_QUIT`, `TEXT_TITLE` sont les index des lignes dans ce CSV. Nommer les index au lieu d'utiliser des nombres bruts rend le code lisible et maintenable.
- Les constantes de layout (`HEADER_Y`, `FRAME_X`, etc.) centralisent les positions et dimensions. Si la résolution change, on modifie un seul endroit.
- Ces constantes sont placées dans le module `UI::MysteryGift`. La Composition, déclarée à l'intérieur de ce module, y accède directement. La scène GamePlay y accède via `include UI::MysteryGift`.

## Composition basique

La Composition hérite de `SpriteStack` et reçoit le viewport en paramètre. Elle crée les éléments visuels dans son constructeur et expose les méthodes requises par le framework.

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      def initialize(viewport)
        super(viewport, 0, 0, default_cache: :interface)
        create_header
        create_frame
      end

      # Update the composition each frame
      def update; end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return true
      end

      private

      # Create the header bar and title
      def create_header
        @header = add_sprite(0, HEADER_Y, 'mystery_gift/header')
        @header.set_z(2)
        @title = add_text(0, 0, 320, 14, ext_text(TEXT_FILE_ID, TEXT_TITLE), 1, nil, color: 10)
        @title.z = 3
      end

      # Create the main content frame
      def create_frame
        @frame = add_sprite(FRAME_X, FRAME_Y, 'mystery_gift/frame')
      end
    end
  end
end
```

- `super(viewport, 0, 0, default_cache: :interface)` initialise le SpriteStack à la position (0, 0) avec le cache d'interface par défaut. Le paramètre `default_cache: :interface` indique que tous les sprites ajoutés ensuite chargent leurs images depuis le cache d'interface.
- `add_sprite` crée un sprite positionné relativement à l'origine du stack. Le troisième argument est le nom de l'image dans le cache.
- `set_z(2)` et `@title.z = 3` contrôlent l'ordre de profondeur : le titre s'affiche au-dessus du header.
- `add_text` crée un texte avec `ext_text(TEXT_FILE_ID, TEXT_TITLE)` qui charge le texte traduit depuis le CSV. Le paramètre `1` est l'alignement (centre), `nil` est le font optionnel, et `color: 10` définit la couleur du texte.
- `done?` retourne `true` en dur car il n'y a pas encore d'animations. Ce sera modifié dans les guides suivants.
- `update` est vide mais **obligatoire** : le framework l'appelle à chaque frame.
- Les constantes `HEADER_Y`, `FRAME_X`, `TEXT_FILE_ID`, `TEXT_TITLE` sont accessibles directement car la Composition est déclarée à l'intérieur du module `UI::MysteryGift`.

## Brancher dans la scène

La scène crée la Composition dans `create_graphics` et la met à jour dans `update_graphics`. L'ajout de `include UI::MysteryGift` permet d'accéder aux constantes et à la classe Composition sans préfixe.

```ruby
module GamePlay
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    def update_graphics
      @base_ui.update_background_animation
      @composition.update
    end

    private

    def create_graphics
      create_viewport
      create_base_ui
      create_composition
      Graphics.sort_z
    end

    def create_composition
      @composition = Composition.new(@viewport)
    end
  end
end
```

- `include UI::MysteryGift` donne accès aux constantes directement (`TEXT_FILE_ID` au lieu de `UI::MysteryGift::TEXT_FILE_ID`) et à la classe `Composition` sans préfixe. Cela fonctionne aussi dans les fichiers Input.rb et Mouse.rb puisqu'ils réouvrent la même classe.
- `create_composition` instancie la Composition et la stocke dans `@composition`. Le viewport est passé en paramètre pour que tous les sprites appartiennent au même viewport.
- `@composition.update` dans `update_graphics` fait avancer les animations à chaque frame.
- `done?` sera utilisé dans `update_inputs` (guide suivant) pour bloquer les inputs pendant les animations.

## Réouverture de classe

Les fichiers UI numérotés peuvent réouvrir la classe Composition pour lui ajouter des méthodes. Ce n'est ni de l'héritage, ni un include : le fichier réouvre littéralement la même classe.

```ruby
module UI
  module MysteryGift
    # Add code input methods to Composition
    class Composition < SpriteStack
      # Update the display after the player enters a character
      # @param code [String] the current code string
      def update_code_display(code)
        # update visuals based on current code
      end
    end
  end
end
```

- C'est la convention PSDK pour découper les Compositions volumineuses en plusieurs fichiers.
- Chaque fichier ajoute des méthodes à la même classe, sans créer de sous-classe ni utiliser de module.
- L'ordre de chargement est déterminé par les préfixes numériques des fichiers.

## Conclusion

- La Composition hérite de `SpriteStack` et vit dans le module `UI::X`.
- Elle doit exposer `update()` et `done?()` pour le framework de scène.
- La scène la crée dans `create_graphics` et la met à jour dans `update_graphics`.
- `include UI::X` dans la classe de scène donne accès direct aux constantes et à la classe Composition.
- Découpez les Compositions volumineuses via la réouverture de classe, pas via des modules ou de l'héritage.
