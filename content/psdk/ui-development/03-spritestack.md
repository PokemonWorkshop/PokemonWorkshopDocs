---
title: "Comment créer un composant SpriteStack dans PSDK ?"
slug: creer-un-composant-spritestack
sidebar_position: 3
description: "Ce guide explique comment créer un sous-composant visuel en étendant SpriteStack, en utilisant le plugin Mystery Gift comme exemple concret."
---

Ce guide explique comment créer un sous-composant visuel en étendant SpriteStack, en utilisant le plugin Mystery Gift comme exemple concret. On construit GiftRow, la ligne qui affiche un cadeau réclamé (nom à gauche, code à droite). Il suppose que les guides 001 et 002 ont été lus (le lecteur dispose d'une scène avec une Composition).

## Principe

Un sous-composant est une classe qui étend SpriteStack et regroupe des sprites liés entre eux : un fond, un ou plusieurs textes, une icône forment ensemble un seul bloc visuel réutilisable.

Toutes les positions à l'intérieur d'un SpriteStack sont relatives à l'origine du stack, définie par `super(viewport, x, y)`. Le composant ne connaît pas sa position absolue à l'écran — il raisonne uniquement en coordonnées locales.

La Composition crée et orchestre les sous-composants. Elle peut les push dans son propre stack via `push_sprite` pour le lifecycle management (dispose automatique), mais chaque sous-composant reste un SpriteStack indépendant avec son propre état interne.

## API SpriteStack

Les méthodes principales pour construire le contenu d'un SpriteStack :

### add_background

```ruby
@background = add_background('mystery_gift/gift_row')
```

- `add_background` charge un sprite depuis le cache interface et l'ajoute à la position (0, 0) du stack.

### add_sprite

```ruby
@icon = add_sprite(120, 6, 'mystery_gift/icon')
```

- `add_sprite(x, y, filename)` ajoute un sprite à la position (stack.x + x, stack.y + y).
- Les coordonnées sont relatives à l'origine du stack.

### add_text

```ruby
@label = add_text(8, 4, 80, 16, 'Hello', color: 10)
```

- `add_text(x, y, w, h, text, color: N)` ajoute un texte avec une couleur de la palette.
- Le paramètre `align` (3e argument positionnel après le texte) contrôle l'alignement : 0 = gauche (par défaut), 1 = centré, 2 = droite.
- Attention : cette méthode applique le FOY offset (voir section suivante).

### push_sprite

```ruby
custom_sprite = Sprite.new(@viewport)
push_sprite(custom_sprite)
```

- `push_sprite(sprite)` ajoute un sprite créé extérieurement dans le stack.
- Le sprite est ajouté à la liste des enfants sans modification de position.
- Utile pour intégrer un sous-composant SpriteStack dans le lifecycle d'un parent.

### set_rect_div

```ruby
@background.set_rect_div(0, 0, 2, 1)
```

- `set_rect_div(col, row, ncols, nrows)` découpe le bitmap en une grille et affiche une seule cellule.
- Les arguments sont : colonne, ligne, nombre total de colonnes, nombre total de lignes.
- Permet de gérer les spritesheets : une image contient plusieurs états visuels, on en affiche un seul à la fois.

## Piège du FOY

`add_text` soustrait 2 pixels à la position Y passée en paramètre. FOY signifie Font Offset Y. Concrètement :

```ruby
# Place the text at y = 18, NOT y = 20
@label = add_text(10, 20, 80, 16, 'text')
```

- L'appel `add_text(10, 20, ...)` place le texte à y = 18, pas à y = 20.
- Cet offset de 2 pixels est systématique et invisible dans le code.
- Pour un placement pixel-perfect, il faut toujours en tenir compte : si le texte doit être à y = 20, passer y = 22.

## Piège de visible=

Quand on assigne `visible = true` sur un SpriteStack, la visibilité se propage à TOUS les enfants, y compris ceux qu'on avait volontairement cachés. Si certains enfants doivent rester cachés, il faut override `visible=` :

```ruby
# Set visibility of the component
# @param value [Boolean]
def visible=(value)
  super(value)
  @hidden_sprite.visible = false
end
```

- `super(value)` propage la visibilité à tous les enfants du stack.
- Ensuite on force `@hidden_sprite.visible = false` pour maintenir le sprite caché.
- Sans cet override, activer la visibilité du composant rendrait visible des sprites qui ne devraient pas l'être.

## Exemple : composant GiftRow

Voici le composant GiftRow complet du plugin Mystery Gift. Il affiche une ligne avec le nom du cadeau à gauche et le code à droite :

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
      # @param value [Boolean] true to select, false to deselect
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

- Le constructeur reçoit un viewport et une position (x, y) -- `super(viewport, x, y, default_cache: :interface)` définit l'origine du stack et le cache de sprites par défaut.
- `create_background` utilise `add_sprite(0, 0, ...)` au lieu de `add_background` pour pouvoir appeler `set_rect_div` ensuite. Le sprite est une spritesheet 2x1 : deux colonnes (normal et sélectionné), une seule ligne.
- `set_rect_div(0, 0, 2, 1)` affiche la colonne 0 (état normal). `set_rect_div(1, 0, 2, 1)` affiche la colonne 1 (état sélectionné).
- `hovered?` délègue le hit-testing au sprite de fond via `simple_mouse_in?` -- le composant possède sa propre logique de détection du survol.
- `selected=` bascule l'apparence du fond entre les deux colonnes de la spritesheet. Le constructeur appelle `self.selected = false` pour initialiser l'état visuel.
- `data=` est l'API publique pour mettre à jour le contenu affiché. Il reçoit soit un hash avec `:name` et `:code`, soit nil pour cacher la ligne.
- `create_name_text` crée le texte aligné à gauche (alignement par défaut) avec la couleur 10 (blanc).
- `create_code_text` crée le texte aligné à droite en passant `2` comme argument d'alignement, avec la couleur 9 (gris).
- Le paramètre `nil` entre l'alignement et `color:` correspond au font_id -- nil utilise la police par défaut.

## Intégration dans Composition

La Composition crée les instances de GiftRow et les intègre dans son lifecycle :

```ruby
# Create the gift rows
def create_gift_rows
  @rows = Array.new(VISIBLE_ROWS) do |index|
    row = GiftRow.new(@viewport, GIFT_ROW_X, GIFT_ROW_Y + index * GIFT_ROW_PITCH)
    push_sprite(row)
  end
end
```

- `Array.new(VISIBLE_ROWS)` crée un nombre fixe de lignes, positionnées verticalement avec un espacement régulier (`GIFT_ROW_PITCH`).
- Chaque GiftRow est créé avec `@viewport` et des coordonnées calculées -- le sous-composant ne connaît pas sa position dans la liste.
- `push_sprite(row)` ajoute le sous-composant dans le stack de la Composition pour le lifecycle management : quand la Composition est dispose, les GiftRow le sont aussi automatiquement.
- La Composition expose ensuite des méthodes de recherche comme `find_hovered_row_index` pour que la scène puisse interroger l'état des sous-composants sans les manipuler directement.

## Conclusion

- Un sous-composant étend SpriteStack et regroupe des sprites liés entre eux (fond, textes, icônes).
- Toutes les positions internes sont relatives à l'origine du stack, définie dans `super(viewport, x, y)`.
- Utiliser `set_rect_div(col, row, ncols, nrows)` pour les spritesheets : une seule image contient plusieurs états visuels.
- `add_text` applique un FOY offset de 2 pixels -- en tenir compte pour les placements pixel-perfect.
- `visible=` propage à tous les enfants -- override si certains doivent rester cachés.
- Le sous-composant possède son propre hit-testing via `simple_mouse_in?` et expose une API publique (`data=`, `selected=`) pour que la Composition le pilote.
- La Composition orchestre les sous-composants : elle les crée, les stocke, et expose des finder methods pour la scène.
