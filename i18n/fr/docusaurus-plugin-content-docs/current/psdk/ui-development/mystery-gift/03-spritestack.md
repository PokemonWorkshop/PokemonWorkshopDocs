---
title: "Créer un composant SpriteStack"
slug: creer-un-composant-spritestack
sidebar_position: 3
description: "Ce guide explique comment créer un sous-composant visuel en étendant SpriteStack, avec la ligne de cadeau de Mystery Gift comme exemple concret."
---

Ce guide explique comment créer un sous-composant visuel en étendant SpriteStack. On construit **GiftRow**, la ligne qui affiche un cadeau réclamé (nom à gauche, code à droite). Il s'appuie sur le [guide composition](/psdk/ui-development/mystery-gift/creer-une-composition) : vous avez déjà une scène avec une Composition qui dessine l'en-tête et le cadre.

## Principe

Un sous-composant est une classe qui étend SpriteStack et regroupe des sprites liés : un fond, un ou plusieurs textes, une icône -- ensemble, ils forment un bloc visuel réutilisable.

Toutes les positions à l'intérieur d'un SpriteStack sont relatives à l'origine du stack, définie par `super(viewport, x, y)`. Le composant ne connaît pas sa position absolue à l'écran ; il raisonne uniquement en coordonnées locales.

La Composition crée et orchestre les sous-composants. Elle les empile dans son propre stack via `push_sprite` pour la gestion du cycle de vie (dispose automatique), mais chaque sous-composant reste un SpriteStack indépendant avec son propre état interne.

## API SpriteStack

Les méthodes clés pour construire le contenu d'un SpriteStack :

### add_background

```ruby
@background = add_background('mystery_gift/gift_row')
```

- `add_background` charge un sprite depuis le cache interface et l'ajoute en position (0, 0) du stack.

### add_sprite

```ruby
@icon = add_sprite(120, 6, 'mystery_gift/icon')
```

- `add_sprite(x, y, filename)` ajoute un sprite en position (stack.x + x, stack.y + y).
- Les coordonnées sont relatives à l'origine du stack.

### add_text

```ruby
@label = add_text(8, 4, 80, 16, 'Hello', color: 10)
```

- `add_text(x, y, w, h, text, color: N)` ajoute un texte avec une couleur de palette.
- Le paramètre `align` (3e argument positionnel après le texte) contrôle l'alignement : 0 = gauche (défaut), 1 = centre, 2 = droite.
- Attention : cette méthode applique l'offset FOY (voir plus bas).

### push_sprite

```ruby
custom_sprite = Sprite.new(@viewport)
push_sprite(custom_sprite)
```

- `push_sprite(sprite)` ajoute au stack un sprite créé en externe, sans modifier sa position.
- Utile pour intégrer un sous-composant SpriteStack dans le cycle de vie d'un parent.

### set_rect_div

```ruby
@background.set_rect_div(0, 0, 2, 1)
```

- `set_rect_div(col, row, ncols, nrows)` découpe le bitmap en grille et affiche une seule cellule.
- Les arguments sont : colonne, ligne, nombre total de colonnes, nombre total de lignes.
- Utilisé pour les spritesheets : une image contient plusieurs états visuels, un seul est affiché à la fois.

## Le piège FOY

`add_text` soustrait 2 pixels à la position Y passée en paramètre. FOY signifie Font Offset Y. En pratique, un appel comme `add_text(10, 20, ...)` place le texte en y = 18, pas en y = 20. Cet offset de 2 pixels est systématique et invisible dans le code. Pour un placement pixel-perfect, tenez-en compte : si le texte doit être en y = 20, passez y = 22.

## Le piège visible=

Mettre `visible = true` sur un SpriteStack se propage à **tous** les enfants, y compris ceux que vous aviez cachés intentionnellement. Si certains enfants doivent rester cachés, surchargez `visible=` :

```ruby
# Set visibility of the component
# @param value [Boolean]
def visible=(value)
  super(value)
  @hidden_sprite.visible = false
end
```

- `super(value)` propage la visibilité à tous les enfants du stack.
- Puis `@hidden_sprite.visible = false` force le sprite à rester caché.
- Notre GiftRow n'a pas besoin de cette surcharge, mais c'est un piège courant qu'il vaut mieux connaître.

## Le composant GiftRow

Voici le composant GiftRow complet. Il affiche une ligne avec le nom du cadeau à gauche et le code à droite.

Créez `scripts/20 MysteryGift/002 UI/000 GiftRow.rb` :

```ruby
module UI
  module MysteryGift
    # A single row displaying a claimed gift (name left, code right)
    class GiftRow < SpriteStack
      # Padding inside the row
      ROW_PADDING = 8

      # Create a new GiftRow
      # @param viewport [Viewport]
      # @param x [Integer] x position
      # @param y [Integer] y position
      def initialize(viewport, x, y)
        super(viewport, x, y, default_cache: :interface)
        create_background
        create_name_text
        create_code_text
        self.selected = false
      end

      # Tell if the mouse is hovering this row
      # @return [Boolean]
      def hovered?
        return @background.simple_mouse_in?
      end

      # Set the selected state of the row
      # @param value [Boolean]
      def selected=(value)
        @selected = value
        @background.set_rect_div(value ? 1 : 0, 0, 2, 1)
      end

      # Update the displayed gift data
      # @param gift [Hash, nil] the gift data (with :name and :code) or nil to hide
      def data=(gift)
        if gift
          @name_text.text = gift[:name] || '???'
          @code_text.text = gift[:code] || ''
          self.visible = true
        else
          self.visible = false
        end
      end

      private

      # Create the row background sprite
      def create_background
        @background = add_sprite(0, 0, 'mystery_gift/gift_row')
        @background.set_rect_div(0, 0, 2, 1)
      end

      # Create the gift name text (left-aligned)
      def create_name_text
        text_width = (GIFT_ROW_WIDTH - ROW_PADDING * 2) / 2
        @name_text = add_text(ROW_PADDING, 4, text_width, 16, '---', color: 10)
      end

      # Create the gift code text (right-aligned)
      def create_code_text
        text_width = (GIFT_ROW_WIDTH - ROW_PADDING * 2) / 2
        right_x = GIFT_ROW_WIDTH - ROW_PADDING - text_width
        @code_text = add_text(right_x, 4, text_width, 16, '', 2, nil, color: 9)
      end
    end
  end
end
```

- Le constructeur reçoit un viewport et une position ; `super(viewport, x, y, default_cache: :interface)` définit l'origine du stack et le cache de sprite par défaut.
- `create_background` utilise `add_sprite(0, 0, ...)` plutôt que `add_background` pour pouvoir appeler `set_rect_div` ensuite. Le sprite est le spritesheet `gift_row` 2×1 (colonne 0 = normal, colonne 1 = sélectionné), mis en place dans le guide de préparation.
- `selected=` bascule l'apparence du fond entre les deux colonnes du spritesheet. Le constructeur appelle `self.selected = false` pour initialiser l'état visuel.
- `hovered?` délègue la détection de collision au sprite de fond via `simple_mouse_in?` -- le composant possède sa propre détection de survol (utilisée par le guide souris).
- `data=` est l'API publique pour mettre à jour le contenu affiché. Elle reçoit soit un hash avec `:name` et `:code`, soit `nil` pour cacher la ligne. La scène ne touche jamais aux textes directement ; elle passe par cette méthode (utilisée à partir du guide PFM).
- `create_name_text` crée un texte aligné à gauche (alignement par défaut) en couleur 10 (blanc) ; `create_code_text` crée un texte aligné à droite (alignement `2`) en couleur 9 (gris). Le `nil` entre l'alignement et `color:` est le font_id (police par défaut).

## Intégration dans la Composition

La Composition crée un nombre fixe d'emplacements GiftRow et les empile dans son propre stack. Modifiez `scripts/20 MysteryGift/002 UI/999 Composition.rb` :

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
        create_gift_rows
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

- `Array.new(VISIBLE_ROWS)` crée un nombre fixe de lignes, positionnées verticalement avec un espacement régulier (`GIFT_ROW_PITCH`). Chaque ligne est créée avec des coordonnées calculées -- le sous-composant ne connaît pas sa position dans la liste.
- `push_sprite(row)` ajoute chaque GiftRow au stack de la Composition pour la gestion du cycle de vie : quand la Composition est disposée, les GiftRow le sont aussi.
- Pour l'instant les lignes affichent leur texte de remplacement (`---`). Dans le [guide suivant](/psdk/ui-development/mystery-gift/ajouter-une-couche-de-donnees), on ajoute la couche de données et on remplit les lignes avec les cadeaux réclamés par le joueur ; les guides [clavier](/psdk/ui-development/mystery-gift/gerer-les-entrees-clavier) et [souris](/psdk/ui-development/mystery-gift/gerer-la-souris) ajoutent ensuite la sélection et le survol, d'où le fait que GiftRow expose déjà `selected=` et `hovered?`.

## Essayez

Rouvrez la scène :

```ruby
GamePlay.open_mystery_gift
```

Vous devriez maintenant voir six lignes vides (affichant `---`) dans le cadre, sous le titre.

## Conclusion

- Un sous-composant étend SpriteStack et regroupe des sprites liés (fond, textes, icônes).
- Toutes les positions internes sont relatives à l'origine du stack définie dans `super(viewport, x, y)`.
- Utilisez `set_rect_div(col, row, ncols, nrows)` pour les spritesheets : une image contient plusieurs états visuels.
- `add_text` applique un offset FOY de 2 pixels -- tenez-en compte dans les layouts pixel-perfect.
- `visible=` se propage à tous les enfants -- surchargez-la si certains doivent rester cachés.
- Le sous-composant possède sa détection de collision (`simple_mouse_in?`) et expose une API publique (`data=`, `selected=`) pour que la Composition le pilote.
- La Composition orchestre les sous-composants : elle les crée, les stocke, et (plus tard) expose des méthodes de recherche pour la scène.
