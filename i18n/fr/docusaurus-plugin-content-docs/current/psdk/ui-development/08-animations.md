---
title: "Comment créer des animations dans PSDK ?"
slug: creer-des-animations
sidebar_position: 8
description: "Ce guide explique comment créer des animations UI avec Yuki::Animation, en utilisant le plugin Mystery Gift comme exemple concret."
---

Ce guide explique comment créer des animations UI avec `Yuki::Animation`, en utilisant le plugin Mystery Gift comme exemple concret. Le plugin utilise un composant `ReceivedBanner` qui encapsule ses propres sprites et animations, puis la Composition orchestre le tout. Il suppose que les guides 001 à 003 ont été lus (le lecteur dispose d'une scène fonctionnelle avec une Composition).

## Principe

PSDK utilise `Yuki::Animation` pour toutes les animations UI. L'idiome standard dans le codebase est `ya = Yuki::Animation` pour raccourcir les appels.

Deux modes de composition existent :

- `ya.player(...)` exécute les animations les unes après les autres (séquentiel).
- `ya.parallel(...)` exécute les animations en même temps (simultané).

Les briques de base sont :

- `ya.scalar(duration, obj, :setter=, from, to)` interpole progressivement une valeur numérique.
- `ya.move(duration, sprite, x1, y1, x2, y2)` déplace un sprite entre deux positions.
- `ya.send_command_to(obj, :method, args)` appelle une méthode à un point précis de la séquence.
- `ya.wait(duration)` met la séquence en pause.

Les animations sont gérées via un `Animation::Handler` qui fournit `done?` à la scène. La méthode `done?` de la Composition doit vérifier le handler pour que la scène bloque les inputs pendant les animations.

## Composant avec animation intégrée : ReceivedBanner

L'approche recommandée est de laisser chaque composant créer ses propres animations. Le composant possède ses sprites et sait comment les animer. Il retourne l'animation sans la démarrer, ce qui permet à la Composition de la chaîner avec d'autres étapes.

Voici le composant `ReceivedBanner` du plugin Mystery Gift :

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
      # @return [Yuki::AnimationMixin]
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

- Le composant hérite de `SpriteStack` et gère ses propres sprites (fond et texte).
- `create_show_animation` retourne l'animation sans la démarrer. C'est le pattern clé : le composant décrit l'animation, l'appelant décide quand la jouer.
- `ya.player(...)` enchaîne les étapes dans l'ordre : assignation du texte, visibilité, fondu entrant, pause, fondu sortant, masquage.
- `ya.parallel(...)` fait apparaître le fond et le texte en même temps pendant le fondu.
- `ya.send_command_to(self, :visible=, true)` rend le composant visible au bon moment de la séquence.
- `ya.wait(1.0)` laisse le joueur lire le message pendant une seconde.
- Le composant est créé invisible (`self.visible = false`) et l'animation contrôle sa visibilité.

## Animation Handler dans la Composition

Le handler se crée dans le constructeur, se met à jour à chaque frame, et expose `done?` pour que la scène sache si une animation est en cours :

```ruby
module UI
  module MysteryGift
    # Visual orchestrator for the Mystery Gift UI
    class Composition < SpriteStack
      # Create the composition
      # @param viewport [Viewport]
      # @param mystery_data [Hash] the mystery gift data
      def initialize(viewport, mystery_data)
        super(viewport, 0, 0, default_cache: :interface)
        @mystery_data = mystery_data
        @animation_handler = Yuki::Animation::Handler.new
        create_header
        create_frame
        @received_banner = ReceivedBanner.new(viewport)
      end

      # Update the composition each frame
      def update
        @animation_handler.update
      end

      # Tell if all animations are done
      # @return [Boolean]
      def done?
        return @animation_handler.done?
      end
    end
  end
end
```

- `@animation_handler = Yuki::Animation::Handler.new` crée le handler dans le constructeur.
- `@animation_handler.update` fait avancer les animations à chaque frame -- à appeler dans le `update` de la Composition.
- `done?` délègue au handler : retourne `true` quand aucune animation n'est en cours, `false` pendant qu'une animation joue.
- `@received_banner = ReceivedBanner.new(viewport)` crée le composant bannière. La Composition possède le composant mais ne gère pas ses sprites directement.

## Orchestration dans la Composition

La Composition utilise le composant `ReceivedBanner` pour démarrer l'animation. Elle chaîne l'animation du composant avec un callback de rafraîchissement, puis la stocke dans le handler :

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

- `return unless done?` empêche de démarrer une animation si une autre est déjà en cours.
- `@received_banner.create_show_animation(gift_name)` demande au composant de créer son animation. Le composant la retourne sans la démarrer.
- `Yuki::Animation.player(animation, ...)` chaîne l'animation du composant avec un callback. Ici, `refresh` est appelé après l'animation de la bannière.
- `full_animation.start` déclenche l'animation complète.
- `@animation_handler[:gift_received] = full_animation` stocke l'animation avec une clé nommée dans le handler. Pendant qu'elle joue, `done?` retourne `false`, ce qui bloque les inputs dans la scène.

## Valeurs scalaires

`ya.scalar` interpole n'importe quelle valeur numérique via un setter. C'est la brique la plus polyvalente :

```ruby
ya = Yuki::Animation

# Animate opacity from 255 to 0 over 0.5 seconds
fade_out = ya.scalar(0.5, @sprite, :opacity=, 255, 0)

# Animate a src_rect width for a progress bar
bar_fill = ya.scalar(0.3, @bar.src_rect, :width=, old_width, new_width)

# Animate the zoom of a sprite
zoom_in = ya.scalar(0.2, @icon, :zoom_x=, 1.0, 1.2)
```

- `ya.scalar(duration, target, :setter=, start_value, end_value)` fonctionne avec n'importe quel setter : `opacity=`, `x=`, `y=`, `zoom_x=`, `width=`, etc.
- La cible peut être n'importe quel objet Ruby qui possède le setter indiqué (sprite, src_rect, etc.).
- La durée est en secondes.

## Animation en boucle

Pour les animations au repos qui tournent indéfiniment (flèche rebondissante, icône pulsante), utiliser `ya.timed_loop_animation` :

```ruby
# Create a bouncing arrow animation for the gift list
# @param arrow [Sprite] the arrow sprite
# @return [Yuki::Animation::TimedLoopAnimation]
def create_arrow_loop(arrow)
  ya = Yuki::Animation
  duration = 0.5
  loop_animation = ya.timed_loop_animation(duration, [
    ya.shift(duration, arrow, 2, 0, -2, 0)
  ])
  loop_animation.start
  return loop_animation
end
```

- `ya.timed_loop_animation(duration, [animations])` crée une animation qui boucle indéfiniment.
- `ya.shift(duration, sprite, dx1, dy1, dx2, dy2)` déplace un sprite par des offsets relatifs puis revient.
- Doit être démarrée manuellement avec `.start` et mise à jour à chaque frame via le handler.
- Les animations en boucle ne bloquent pas `done?` -- elles sont gérées séparément du flux principal.

## Conclusion

- Les composants peuvent créer leurs propres animations et les retourner sans les démarrer. La Composition chaîne et orchestre les animations via `Animation::Handler`.
- Utiliser `ya = Yuki::Animation` comme idiome standard pour raccourcir les appels.
- `ya.player(...)` pour les animations séquentielles, `ya.parallel(...)` pour les simultanées -- les deux peuvent être imbriqués.
- `ya.scalar` pour toute valeur numérique, `ya.move` pour les déplacements, `ya.wait` pour les pauses, `ya.send_command_to` pour les callbacks.
- `@animation_handler[:key] = animation` stocke les animations avec des clés nommées. Pendant qu'une animation joue, `done?` retourne `false` et bloque les inputs dans la scène.
- Toujours vérifier `done?` avant de démarrer une nouvelle animation pour empêcher les chevauchements.
- Utiliser `timed_loop_animation` pour les animations répétitives au repos (flèches, pulsations).
