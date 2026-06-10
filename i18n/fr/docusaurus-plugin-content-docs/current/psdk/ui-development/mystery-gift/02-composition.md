---
title: "Comment créer une Composition dans PSDK ?"
slug: creer-une-composition
sidebar_position: 2
description: "Ce guide explique comment créer une Composition, la classe UI centrale qui regroupe tous les composants visuels d'une scène."
---

Ce guide s'appuie sur le [guide de la scène](./01-ui-scene.md) : vous avez déjà une scène Mystery Gift minimale qui s'affiche et se ferme avec B. Ici, on ajoute la **Composition**, la classe UI centrale qui regroupe tous les composants visuels d'une scène.

## Principe

La Composition orchestre **tout** le rendu visuel d'une scène. Elle suit des règles précises :

- Elle étend `SpriteStack` et s'appelle `UI::X::Composition`.
- C'est le **seul point de contact** entre la scène GamePlay et la couche UI.
- La scène délègue toute la création et la mise à jour de l'UI à la Composition.
- Elle doit toujours exposer les méthodes `update()` et `done?()` pour que le framework de scène puisse la piloter.

## Fichier de constantes

La Composition (et tous les autres fichiers UI) lisent des valeurs partagées dans un module de constantes : IDs de texte, dimensions et positions. On les centralise dans un fichier dès maintenant, et chaque constante est utilisée au fur et à mesure qu'on construit la pièce correspondante -- le [guide i18n](./07-i18n.md) explique les IDs de texte en détail.

Créez `scripts/20 MysteryGift/001 Constants.rb` :

```ruby
module UI
  # UI module for the Mystery Gift scene
  module MysteryGift
    # CSV file ID for i18n text
    TEXT_FILE_ID = 311_125

    # Text row IDs (match Data/Text/Dialogs/311125.csv row order)
    TEXT_ENTER_CODE = 0
    TEXT_QUIT = 1
    TEXT_TITLE = 2
    TEXT_PROMPT = 3
    TEXT_INVALID = 4
    TEXT_ALREADY_CLAIMED = 5
    TEXT_RECEIVED = 6
    TEXT_NO_GIFTS = 7
    TEXT_CONFIRM = 8
    TEXT_GIFT_RECEIVED = 9
    TEXT_YES = 10
    TEXT_NO = 11

    # Layout constants (320x240 resolution)
    HEADER_Y = 0
    FRAME_X = 8
    FRAME_Y = 22
    FRAME_WIDTH = 304
    FRAME_HEIGHT = 188

    # Gift row layout (centered inside the frame with margins)
    GIFT_ROW_MARGIN = 8
    GIFT_ROW_X = FRAME_X + GIFT_ROW_MARGIN
    GIFT_ROW_Y = FRAME_Y + GIFT_ROW_MARGIN + 4
    GIFT_ROW_WIDTH = FRAME_WIDTH - GIFT_ROW_MARGIN * 2
    GIFT_ROW_PITCH = 28
    VISIBLE_ROWS = 6

    # Maximum code length for NameInput
    CODE_MAX_LENGTH = 20
  end
end
```

- `TEXT_FILE_ID` identifie le fichier CSV (`Data/Text/Dialogs/311125.csv`, installé dans le guide de préparation). Les constantes `TEXT_*` sont des index de ligne dans ce fichier -- les nommer évite les nombres magiques dans le code.
- Les constantes de layout centralisent les positions et dimensions. Si la résolution change, vous modifiez un seul endroit.
- `001 Constants.rb` est chargé avant le dossier `001 PFM/` et tout ce qui suit, donc ces constantes sont disponibles pour tous les fichiers qu'on crée ensuite.
- Certaines constantes (`GIFT_ROW_*`, `CODE_MAX_LENGTH`, plusieurs `TEXT_*`) ne sont pas encore utilisées -- on s'en sert au moment de construire les lignes de cadeaux, l'entrée et les dialogues dans les guides suivants.

## Composition de base

La Composition étend `SpriteStack` et reçoit le viewport. Elle crée ses éléments visuels dans le constructeur et expose les deux méthodes requises par le framework. Pour l'instant elle dessine l'en-tête et le cadre ; on ajoute la liste de cadeaux, les données et les animations dans les guides suivants.

Créez `scripts/20 MysteryGift/002 UI/999 Composition.rb` :

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

- `super(viewport, 0, 0, default_cache: :interface)` initialise le SpriteStack en position (0, 0). `default_cache: :interface` signifie que chaque sprite ajouté ensuite charge son image depuis `graphics/interface/`.
- `add_sprite(x, y, filename)` crée un sprite à la position donnée ; le filename est le nom de l'image dans le cache (`mystery_gift/header` → `graphics/interface/mystery_gift/header.png`).
- `set_z(2)` et `@title.z = 3` contrôlent l'ordre de profondeur : le titre s'affiche au-dessus de l'en-tête.
- `add_text` charge le titre traduit via `ext_text(TEXT_FILE_ID, TEXT_TITLE)`. Le `1` est l'alignement (centré), `nil` est la police optionnelle, et `color: 10` est le blanc.
- `done?` renvoie `true` sans condition car il n'y a pas encore d'animation. On change ça dans le [guide animations](./09-animations.md).
- `update` est vide mais **obligatoire** : le framework l'appelle à chaque frame.
- Les constantes (`HEADER_Y`, `FRAME_X`, `TEXT_FILE_ID`, `TEXT_TITLE`) sont accessibles directement car la Composition est déclarée à l'intérieur du module `UI::MysteryGift`.

## Branchement dans la scène

La scène crée la Composition dans `create_graphics` et la met à jour dans `update_graphics`. Ajouter `include UI::MysteryGift` donne à la scène un accès direct aux constantes et à la classe `Composition` sans préfixe.

Modifiez `scripts/20 MysteryGift/003 GamePlay/001 Main.rb` :

```ruby
module GamePlay
  # Mystery Gift scene -- displays the header, title and frame
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
    end

    # Handle keyboard input each frame
    # @return [Boolean]
    def update_inputs
      return automatic_input_update
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
      @composition = Composition.new(@viewport)
    end

    # Return the button texts for the ctrl buttons [A, X, Y, B]
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end

    # Action triggered by the B button -- quit the scene
    def action_b
      @running = false
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

- `include UI::MysteryGift` donne un accès direct aux constantes (`TEXT_FILE_ID` au lieu de `UI::MysteryGift::TEXT_FILE_ID`) et à la classe `Composition` sans préfixe.
- `create_composition` instancie la Composition et la stocke dans `@composition`. Le viewport est passé pour que tous les sprites appartiennent au même viewport.
- `@composition.update` dans `update_graphics` fait avancer la composition à chaque frame.

## Découper une classe sur plusieurs fichiers

PSDK charge les fichiers numérotés dans l'ordre, et plusieurs fichiers peuvent **rouvrir** la même classe pour lui ajouter des méthodes. Ce n'est ni de l'héritage ni un include de module -- le fichier rouvre littéralement la classe.

On utilise ça pour la scène elle-même : `001 Main.rb`, `002 Logic.rb`, `003 Input.rb` et `004 Mouse.rb` rouvrent tous `GamePlay::MysteryGift`, chacun ajoutant une partie de son comportement (création, logique métier, clavier, souris). La Composition, elle, reste dans un seul fichier. L'ordre de chargement est déterminé par les préfixes numériques.

## Essayez

Rouvrez la scène :

```ruby
GamePlay.open_mystery_gift
```

Vous devriez maintenant voir la barre d'en-tête avec le titre « Mystery Gift » et le cadre de contenu, par-dessus le fond. B ferme toujours la scène.

## Conclusion

- La Composition étend `SpriteStack` et vit dans le module `UI::X`.
- Elle doit exposer `update()` et `done?()` pour le framework de scène.
- La scène la crée dans `create_graphics` et la met à jour dans `update_graphics`.
- `include UI::MysteryGift` dans la classe de scène donne un accès direct aux constantes et à la classe Composition.
- Centralisez les constantes dans `001 Constants.rb` ; le fichier se charge avant tout ce qui les utilise.
- La classe de scène est découpée sur plusieurs fichiers numérotés via la réouverture de classe, pas via des modules ou de l'héritage.
