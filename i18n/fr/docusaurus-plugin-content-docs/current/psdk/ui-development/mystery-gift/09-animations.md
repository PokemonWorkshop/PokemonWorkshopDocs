---
title: "Comment créer des animations ?"
slug: creer-des-animations
sidebar_position: 9
description: "Ce guide ajoute des animations UI avec Yuki::Animation : un composant bannière en fondu, un handler d'animation dans la Composition, et leur usage à la réclamation d'un cadeau."
---

Ce guide s'appuie sur le [guide dialogues](./08-dialogs.md). Réclamer un cadeau affiche pour l'instant un message simple ; ici, on le remplace par une bannière animée avec `Yuki::Animation`, et on branche un handler d'animation dans la Composition pour que les entrées soient bloquées pendant qu'elle joue.

## Principe

PSDK utilise `Yuki::Animation` pour toutes les animations UI. L'idiome standard est `ya = Yuki::Animation` pour raccourcir les appels. Deux modes de composition existent :

- `ya.player(...)` enchaîne les étapes les unes après les autres (séquentiel).
- `ya.parallel(...)` joue les étapes en même temps (simultané).

Les briques de base :

- `ya.scalar(duration, obj, :setter=, from, to)` interpole une valeur numérique.
- `ya.move(duration, sprite, x1, y1, x2, y2)` déplace un sprite.
- `ya.send_command_to(obj, :method, *args)` appelle une méthode à un point de la séquence.
- `ya.wait(duration)` met en pause.

Les animations sont suivies par un `Animation::Handler` qui expose `done?`. Le `done?` de la Composition consulte le handler, donc la scène bloque les entrées pendant qu'une animation joue -- exactement la garde qu'on a branchée dans le clavier et la souris.

## Le composant bannière

Chaque composant crée ses propres animations : il possède ses sprites et sait les animer, et renvoie l'animation sans la démarrer pour que la Composition puisse l'enchaîner. Créez `scripts/20 MysteryGift/002 UI/001 ReceivedBanner.rb` :

```ruby
module UI
  module MysteryGift
    # Banner displayed when a gift is received (background + text with fade animation)
    class ReceivedBanner < SpriteStack
      # Banner dimensions
      BANNER_WIDTH = 280
      BANNER_HEIGHT = 28

      # Create a new ReceivedBanner centered on screen
      # @param viewport [Viewport]
      def initialize(viewport)
        banner_x = (320 - BANNER_WIDTH) / 2
        banner_y = FRAME_Y + FRAME_HEIGHT / 2 - BANNER_HEIGHT / 2
        super(viewport, banner_x, banner_y, default_cache: :interface)
        create_background
        create_text
        self.visible = false
      end

      # Return the animation for showing the banner with a gift name
      # @param gift_name [String] the text to display
      # @return [Yuki::Animation::TimedAnimation]
      def create_show_animation(gift_name)
        ya = Yuki::Animation
        return ya.player(
          ya.send_command_to(@text, :text=, gift_name),
          ya.send_command_to(self, :visible=, true),
          ya.parallel(
            ya.scalar(0.3, @background, :opacity=, 0, 255),
            ya.scalar(0.3, @text, :opacity=, 0, 255)
          ),
          ya.wait(1.0),
          ya.parallel(
            ya.scalar(0.3, @background, :opacity=, 255, 0),
            ya.scalar(0.3, @text, :opacity=, 255, 0)
          ),
          ya.send_command_to(self, :visible=, false)
        )
      end

      private

      # Create the banner background
      def create_background
        @background = add_background('mystery_gift/received_banner')
        @background.z = 10
      end

      # Create the banner text
      def create_text
        @text = add_text(0, 6, BANNER_WIDTH, 16, '', 1, nil, color: 10)
        @text.z = 11
      end
    end
  end
end
```

- Le composant est créé invisible (`self.visible = false`) ; l'animation contrôle sa visibilité.
- `create_show_animation` **renvoie** l'animation sans la démarrer -- le patron clé. `ya.player` enchaîne : poser le texte, afficher la bannière, fondu d'entrée (fond et texte en `parallel`), pause d'une seconde, fondu de sortie, masquer.
- Elle utilise les constantes `FRAME_Y`/`FRAME_HEIGHT` pour se centrer dans le cadre.

## Le handler d'animation dans la Composition

Le handler vit dans la Composition, est mis à jour à chaque frame, et pilote `done?`. Modifiez `scripts/20 MysteryGift/002 UI/999 Composition.rb`.

Ajoutez le handler et la bannière dans le constructeur (gardez tout le reste) :

```ruby
def initialize(viewport, mystery_data)
  super(viewport, 0, 0, default_cache: :interface)
  @mystery_data = mystery_data
  @animation_handler = Yuki::Animation::Handler.new
  @selected_index = 0
  create_header
  create_frame
  create_no_gifts_text
  create_gift_rows
  create_received_banner
  refresh
end
```

Changez `update` et `done?` pour utiliser le handler (elles étaient un no-op et `true`) :

```ruby
# Update the composition each frame
def update
  @animation_handler.update
end

# Tell if all animations are done
# @return [Boolean]
def done?
  return @animation_handler.done?
end
```

Ajoutez la création de la bannière (privée) et la méthode publique qui joue l'animation :

```ruby
# Start the gift received animation
# @param gift_name [String] the text to display
def start_gift_animation(gift_name)
  return unless done?

  animation = @received_banner.create_show_animation(gift_name)
  full_animation = Yuki::Animation.player(animation, Yuki::Animation.send_command_to(self, :refresh))
  full_animation.start
  @animation_handler[:gift_received] = full_animation
end
```

```ruby
# Create the received banner component
def create_received_banner
  @received_banner = ReceivedBanner.new(@viewport)
  push_sprite(@received_banner)
end
```

- `@animation_handler.update` fait avancer les animations à chaque frame ; `done?` renvoie `false` tant qu'une joue, ce qui bloque maintenant les entrées via les gardes ajoutées plus tôt.
- `start_gift_animation` demande son animation à la bannière, puis enchaîne un `refresh` après elle via `Yuki::Animation.player(animation, ...send_command_to(self, :refresh))`, la démarre, et la stocke sous une clé nommée dans le handler.
- `return unless done?` empêche le chevauchement d'animations.

## La jouer à la réclamation

Remplacez le message simple et le refresh dans `claim_gift` par la bannière. Modifiez `scripts/20 MysteryGift/003 GamePlay/002 Logic.rb` :

```ruby
# Claim a valid gift after confirmation
# @param code [String] the valid code
# @param mystery_data [PFM::MysteryGift] the data object
def claim_gift(code, mystery_data)
  choice = display_message_and_wait(gift_text(TEXT_CONFIRM), 1, gift_text(TEXT_YES), gift_text(TEXT_NO))
  return unless choice == 0

  gift_name = mystery_data.claim(code)
  @composition.start_gift_animation(format(gift_text(TEXT_RECEIVED), gift_name))
end
```

- Le dialogue de confirmation reste. Après la réclamation, au lieu d'un message bloquant + `refresh` manuel, on joue la bannière ; le `refresh` enchaîné met à jour la liste une fois la bannière terminée.

## Autres briques

`ya.scalar` interpole n'importe quelle valeur numérique via un setter -- la brique la plus polyvalente :

```ruby
ya = Yuki::Animation
fade_out = ya.scalar(0.5, @sprite, :opacity=, 255, 0)
bar_fill = ya.scalar(0.3, @bar.src_rect, :width=, old_width, new_width)
zoom_in  = ya.scalar(0.2, @icon, :zoom_x=, 1.0, 1.2)
```

Pour une animation d'attente qui tourne en boucle (une flèche qui rebondit, une icône qui pulse), utilisez `ya.timed_loop_animation` :

```ruby
ya = Yuki::Animation
loop_animation = ya.timed_loop_animation(0.5, [ya.shift(0.5, arrow, 2, 0, -2, 0)])
loop_animation.start
```

- Une animation en boucle doit être démarrée manuellement et mise à jour via le handler ; elle ne bloque pas `done?`.

## Essayez

Ouvrez la scène, appuyez sur A, tapez `MASTERBALL`, confirmez avec Oui :

```ruby
GamePlay.open_mystery_gift
```

La bannière « Vous avez recu Master Ball ! » apparaît en fondu par-dessus le cadre, tient une seconde, disparaît en fondu, et la liste se rafraîchit avec la nouvelle ligne. Les entrées sont ignorées pendant que la bannière joue.

## Conclusion

- Les composants créent et renvoient leurs propres animations sans les démarrer ; la Composition les enchaîne et les exécute via un `Animation::Handler`.
- Utilisez `ya = Yuki::Animation` ; `ya.player` pour le séquentiel, `ya.parallel` pour le simultané.
- `ya.scalar` pour les nombres, `ya.move` pour le déplacement, `ya.wait` pour les pauses, `ya.send_command_to` pour les callbacks.
- Stockez les animations avec `@animation_handler[:key] = animation` ; tant qu'une joue, `done?` est `false` et les entrées sont bloquées.
- Vérifiez toujours `done?` avant de démarrer une nouvelle animation ; utilisez `timed_loop_animation` pour les effets d'attente répétés.
