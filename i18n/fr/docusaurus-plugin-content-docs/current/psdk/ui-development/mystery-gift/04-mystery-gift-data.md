---
title: "Ajouter une couche de données avec PFM"
slug: ajouter-une-couche-de-donnees
sidebar_position: 4
description: "Ce guide ajoute la couche de persistence PFM qui stocke les codes cadeaux déjà réclamés par le joueur, et la branche dans la Composition pour que les lignes affichent de vraies données."
---

Ce guide s'appuie sur le [guide SpriteStack](/psdk/ui-development/mystery-gift/creer-un-composant-spritestack) : vous avez une Composition qui dessine six lignes vides. Ici, on ajoute la couche **PFM** -- le modèle de données qui sait quels codes sont valides et lesquels le joueur a déjà réclamés -- et on la branche pour que les lignes affichent de vrais cadeaux.

## Principe

La couche **PFM** est le modèle de données d'une scène : elle contient l'état à mémoriser, tandis que les couches UI et GamePlay restent sans état persistant.

- La couche UI (Composition, GiftRow) ne fait qu'*afficher* les données ; elle ne stocke jamais d'état persistant.
- La couche GamePlay (la scène) lit et modifie l'objet PFM, puis demande à la Composition de se rafraîchir.

**Où vivent les données est un choix délibéré.** Pour Mystery Gift, les codes réclamés sont un petit jeu de flags qui doivent persister avec la sauvegarde du joueur et qu'aucun système existant ne suit déjà, donc on les garde dans `$user_data` -- le hash « plug & play » de PSDK pour exactement ce type d'état par-sauvegarde. À la sauvegarde, tout l'état de jeu est sérialisé avec `Marshal`, donc toute donnée **sérialisable Marshal** dans `$user_data` est sauvegardée et restaurée avec lui (valeurs simples, tableaux, hashes, objets simples comme notre `PFM::MysteryGift` ; jamais de sprites, viewports ni procs -- ils casseraient la sauvegarde).

`$user_data` n'est pourtant pas une réponse universelle. Il vit **dans** le fichier de sauvegarde, donc il est par-sauvegarde, pas partagé entre toutes les sauvegardes. L'état UI transitoire (une position de curseur que vous ne voulez pas conserver) reste dans la scène et n'est jamais persisté. Les données qui ont déjà un foyer y vont plutôt -- l'équipe dans la party, les objets dans le sac, les flags de scénario dans les interrupteurs et variables de jeu. Choisissez l'emplacement qui correspond à la nature de votre donnée et à sa durée de vie.

Pour Mystery Gift, la couche PFM répond à trois questions : un code est-il valide ? a-t-il déjà été réclamé ? et « donne-moi la liste des cadeaux réclamés à afficher ».

## La classe PFM

Créez `scripts/20 MysteryGift/001 PFM/000 MysteryGift.rb` :

```ruby
module PFM
  # Persistence layer for the Mystery Gift scene.
  # Stored in $user_data[:mystery_gift] so claimed codes survive across save files.
  class MysteryGift
    # Gift database -- makers add their codes here.
    # @example
    #   'CODE' => { type: :item, item: :potion, quantity: 5, name: 'Potions x5' }
    #   'CODE' => { type: :pokemon, species: :pikachu, level: 25, name: 'Pikachu' }
    GIFT_DATABASE = {
      'PIKACHU2024' => { type: :pokemon, species: :pikachu, level: 25, name: 'Pikachu Lv.25' },
      'POTION50' => { type: :item, item: :potion, quantity: 50, name: 'Potion x50' },
      'MASTERBALL' => { type: :item, item: :master_ball, quantity: 1, name: 'Master Ball' }
    }

    # @return [Hash{String => Boolean}] claimed gift codes
    attr_reader :claimed

    # Create a new MysteryGift tracker
    def initialize
      @claimed = {}
    end

    # Check if a code is valid and not yet claimed
    # @param code [String] the gift code to validate
    # @return [Symbol] :valid, :invalid, or :already_claimed
    def validate(code)
      normalized = code.upcase
      return :invalid unless GIFT_DATABASE[normalized]
      return :already_claimed if @claimed[normalized]

      return :valid
    end

    # Mark a code as claimed and give the reward to the player
    # @param code [String] the gift code to claim
    # @return [String, nil] the gift name if claimed, nil if invalid
    def claim(code)
      normalized = code.upcase
      gift = GIFT_DATABASE[normalized]
      return nil unless gift

      @claimed[normalized] = true
      give_reward(gift)
      return gift[:name]
    end

    # Return the list of claimed gift entries for display
    # @return [Array<Hash>] each entry has :code, :name, :type (and other gift data)
    def claimed_gifts
      return @claimed.keys.filter_map do |code|
        gift = GIFT_DATABASE[code]
        next unless gift

        gift.merge(code: code)
      end
    end

    # Return the number of claimed gifts
    # @return [Integer]
    def claimed_count
      return @claimed.size
    end

    private

    # Give the reward to the player
    # @param gift [Hash] the gift data from GIFT_DATABASE
    def give_reward(gift)
      case gift[:type]
      when :item
        $bag.add_item(gift[:item], gift[:quantity] || 1)
      when :pokemon
        pokemon = PFM::Pokemon.new(gift[:species], gift[:level])
        PFM.game_state.add_pokemon(pokemon)
      end
    end
  end
end
```

- `GIFT_DATABASE` est l'endroit où les makers déclarent les codes et leurs récompenses. Chaque entrée a un `:type` (`:item` ou `:pokemon`), les détails de la récompense, et un `:name` d'affichage. Modifiez ce hash pour définir vos propres cadeaux.
- `@claimed` est un hash `code => true`. Comme tout l'objet `PFM::MysteryGift` est stocké dans `$user_data`, ce hash est sauvegardé avec le jeu.
- `validate` renvoie un symbole sur lequel la scène peut brancher : `:invalid` (code inconnu), `:already_claimed`, ou `:valid`.
- `claim` marque le code comme réclamé et appelle `give_reward`. Elle renvoie le nom du cadeau pour que la scène affiche « Vous avez reçu… ».
- `claimed_gifts` construit la liste d'affichage : chaque code réclamé fusionné avec `code:` pour qu'une ligne puisse montrer le nom et le code. `filter_map` ignore les codes qui n'existent plus dans la base.
- `give_reward` utilise des APIs PSDK standard (`$bag.add_item`, `PFM.game_state.add_pokemon`). Adaptez-la à ce que vos cadeaux octroient.

## Branchement dans la scène

La scène crée l'objet PFM une fois (ou réutilise celui sauvegardé) et le passe à la Composition. Modifiez `scripts/20 MysteryGift/003 GamePlay/001 Main.rb` :

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
      @composition = Composition.new(@viewport, $user_data[:mystery_gift])
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

- `$user_data[:mystery_gift] ||= PFM::MysteryGift.new` crée l'objet de données la première fois et réutilise celui sauvegardé ensuite. C'est `||=` qui fait persister les codes réclamés entre les visites et à travers les sauvegardes.
- `create_composition` passe maintenant l'objet de données en second argument.

## Afficher les données dans la Composition

La Composition reçoit l'objet de données, le stocke, et expose une méthode `refresh` qui lit les cadeaux réclamés et met à jour les lignes. Modifiez `scripts/20 MysteryGift/002 UI/999 Composition.rb` :

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      # @param mystery_data [PFM::MysteryGift] the data object
      def initialize(viewport, mystery_data)
        super(viewport, 0, 0, default_cache: :interface)
        @mystery_data = mystery_data
        @selected_index = 0
        create_header
        create_frame
        create_no_gifts_text
        create_gift_rows
        refresh
      end

      # Update the composition each frame
      def update; end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return true
      end

      # Refresh the display with current gift data
      def refresh
        gifts = @mystery_data.claimed_gifts
        if gifts.empty?
          show_no_gifts
        else
          show_gift_list(gifts)
        end
      end

      private

      # Show the "no gifts" message
      def show_no_gifts
        @no_gifts_text.visible = true
        @rows.each { |row| row.visible = false }
      end

      # Show the gift list
      # @param gifts [Array<Hash>]
      def show_gift_list(gifts)
        @no_gifts_text.visible = false
        @rows.each_with_index do |row, index|
          gift = gifts[index]
          row.data = gift
          row.selected = (index == @selected_index) if gift
        end
      end

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

      # Create the "no gifts claimed yet" text
      def create_no_gifts_text
        @no_gifts_text = add_text(
          FRAME_X, FRAME_Y + FRAME_HEIGHT / 2 - 8,
          FRAME_WIDTH, 16,
          ext_text(TEXT_FILE_ID, TEXT_NO_GIFTS), 1, nil, color: 9
        )
      end

      # Create the gift row slots
      def create_gift_rows
        @rows = Array.new(VISIBLE_ROWS) do |index|
          row = GiftRow.new(@viewport, GIFT_ROW_X, GIFT_ROW_Y + index * GIFT_ROW_PITCH)
          push_sprite(row)
        end
      end
    end
  end
end
```

- `@mystery_data` stocke l'objet PFM ; `@selected_index` suit la ligne mise en surbrillance (utilisée par la navigation dans les guides clavier et souris).
- `refresh` est le point d'entrée unique pour redessiner la liste. Elle est appelée une fois à la fin de `initialize`, puis à chaque changement de données (après une réclamation, dans le guide dialogues).
- `show_no_gifts` affiche le texte centré « Aucun cadeau réclamé » et cache toutes les lignes ; `show_gift_list` remplit chaque ligne via `row.data = gift` et cache les lignes en trop en passant `nil`.
- `create_no_gifts_text` doit être créé avant l'exécution de `refresh`, d'où l'importance de l'ordre des appels dans `initialize`.

## Essayez

Rouvrez la scène :

```ruby
GamePlay.open_mystery_gift
```

Comme rien n'est encore réclamé, vous voyez le message « Aucun cadeau réclamé ». Pour prévisualiser la liste avant de construire le flux de réclamation, réclamez un code depuis la console, puis rouvrez :

```ruby
$user_data[:mystery_gift].claim('POTION50')
GamePlay.open_mystery_gift
```

Vous devriez maintenant voir une ligne avec « Potion x50 » à gauche et « POTION50 » à droite.

## Conclusion

- La couche PFM est le modèle de données. `$user_data` est un bon foyer pour un petit état par-sauvegarde comme le nôtre, mais pas toujours le bon -- choisissez l'emplacement adapté à votre donnée (party, sac, interrupteurs/variables, ou rien si elle ne doit pas persister).
- Gardez l'état persistant uniquement dans PFM -- l'UI l'affiche, la scène le modifie.
- `validate`/`claim`/`claimed_gifts`/`claimed_count` forment l'API publique utilisée par la scène et la Composition.
- La Composition prend l'objet de données en argument de constructeur et expose une méthode `refresh` comme point d'entrée unique de redessin.
- Créez le texte « aucun cadeau » et les lignes avant le premier `refresh`.
