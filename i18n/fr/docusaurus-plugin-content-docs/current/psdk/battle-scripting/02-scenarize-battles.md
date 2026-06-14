---
title: "Comment scénariser un combat ?"
slug: scenariser-un-combat
sidebar_position: 2
description: "Ce guide explique comment utiliser les battle events : des hooks Ruby dans la scène de combat qui affichent des dialogues en plein combat, mettent en place des effets initiaux, réagissent aux attaques et forcent l'IA, sélectionnés par combat via son battle id."
---

Ce guide explique comment utiliser les battle events : des hooks Ruby dans la scène de combat qui affichent des dialogues en plein combat, mettent en place des effets initiaux, réagissent aux attaques et forcent l'IA, sélectionnés par combat via son battle id.

## Ce que font les battle events

Un battle event est un fichier Ruby qui s'accroche à la scène de combat à des moments précis, pour rendre un combat scénarisé plutôt que mécanique. Trois usages se détachent :

- **Afficher des messages** : un dialogue en plein combat, typiquement le dresseur ennemi qui parle.
- **Mettre en place la logique** une fois chargée, par exemple démarrer le combat avec un effet déjà actif.
- **Forcer l'IA** à exécuter une action précise, alternative légère à l'écriture d'une IA personnalisée complète pour un champion ou un membre de l'élite.

## Créer un fichier de battle event

Les battle events vivent dans `Data/Events/Battle/` sous forme de fichiers Ruby. Le nom de fichier doit commencer par **cinq chiffres**, suivis de n'importe quoi, puis de `.rb` :

```
Data/Events/Battle/00234 Brock battle.rb
```

Ce sont les cinq chiffres qui comptent : ils correspondent au `battle_id` que la scène recherche.

## Choisir quels events charger

`Battle::Logic::BattleInfo#battle_id` décide quel fichier charger. Un `battle_id` de `5` charge `Data/Events/Battle/00005*.rb`. Il y a deux façons de le définir :

- Depuis un script, sur le `BattleInfo` : `bi.battle_id = 5` (voir le [guide de scripting de combat](/psdk/battle-scripting)).
- Dans Pokémon Studio, en réglant le **Battle Group ID** du dresseur sur une valeur non nulle.

Quelques points à garder en tête :

- `battle_id` vaut `-1` par défaut, ce qui ne charge rien. Les events ne tournent qu'une fois la valeur définie.
- Un combat sauvage utilise `battle_id = 1` par défaut (donc `00001*.rb`), sauf si on appelle soi-même `$wild_battle.setup(battle_id)`.

:::warning
On évite deux fichiers partageant les mêmes cinq chiffres (`00005 Brock.rb` et `00005 Misty.rb`) : un seul est chargé, et lequel n'est pas déterminé.
:::

## Enregistrer un event

Un fichier de battle event rouvre `Battle::Scene` et enregistre un bloc pour chaque moment auquel on veut s'accrocher. Rouvrir la classe regroupe tous les events du fichier et évite de répéter le préfixe `Battle::Scene.` à chaque appel :

```ruby
module Battle
  class Scene
    register_event(:battle_begin) do |scene|
      # ...
    end
  end
end
```

Le bloc reçoit toujours la `scene` de combat comme premier argument ; certains events en passent davantage. On ne peut enregistrer qu'un seul bloc par nom d'event : enregistrer le même event deux fois conserve le dernier bloc.

Les exemples ci-dessous montrent les appels `register_event` seuls ; chacun va à l'intérieur de ce bloc `module Battle` / `class Scene`. La forme qualifiée `Battle::Scene.register_event(...)` fonctionne aussi au niveau racine du fichier, elle est juste plus verbeuse.

## Afficher un dialogue en plein combat

L'usage le plus courant est de faire parler le dresseur ennemi. PSDK ne fournit pas de méthode toute prête pour ça, donc on ajoute ce helper une fois. Il fait glisser le sprite du dresseur, affiche les messages, puis le fait ressortir :

```ruby
module Battle
  class Scene
    # Show messages from the enemy trainer during battle.
    # @param messages [Array<String>]
    # @note wraps everything in visual.lock
    def show_event_message(*messages)
      visual.lock do
        sprite = visual.battler_sprite(1, -1) # negative position = trainer sprite, -1 = first trainer
        slide_in = Yuki::Animation.move(0.4, sprite, 320 + sprite.width, sprite.y, 290, sprite.y)
        slide_in.start
        visual.animations << slide_in
        visual.hide_team_info
        visual.wait_for_animation

        messages.each do |message|
          message_window.blocking = true
          message_window.wait_input = true
          display_message_and_wait(message)
        end

        slide_out = Yuki::Animation.move(0.4, sprite, 290, sprite.y, 320 + sprite.width, sprite.y)
        slide_out.start
        visual.animations << slide_out
        visual.show_team_info
        visual.wait_for_animation
      end
    end
  end
end
```

On le place dans un script personnalisé, pas dans le fichier de battle event, pour que tous les combats puissent l'utiliser. Les exemples ci-dessous supposent qu'il existe.

:::note
`show_event_message` appelle lui-même `visual.lock` : il ne faut donc jamais envelopper un appel à cette méthode dans un autre `visual.lock`, verrouiller deux fois les visuels lève une erreur de race condition.
:::

## Les events disponibles

PSDK déclenche huit events au cours d'un combat. Ils s'enregistrent tous de la même façon ; ils diffèrent par le moment où ils se déclenchent et par les arguments supplémentaires que reçoit le bloc.

| Event | Arguments du bloc | Moment de déclenchement |
| ---------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `:logic_init` | `\|scene\|` | Juste après la construction de la scène, avant toute animation. On y met en place la logique. |
| `:pre_battle_begin` | `\|scene\|` | Pendant l'intro, après « Le dresseur veut se battre ! », avant l'envoi du premier Pokémon. |
| `:battle_begin` | `\|scene\|` | Après que les deux camps ont envoyé leur premier Pokémon, avant le premier choix du joueur. |
| `:trainer_dialog` | `\|scene\|` | Chaque tour, après le choix du joueur, avant celui de l'IA. |
| `:AI_force_action` | `\|scene, ai, index\|` | Chaque tour, une fois par IA. On retourne des actions pour les forcer, ou `nil` pour l'IA par défaut. |
| `:after_attack` | `\|scene, launcher, move\|` | Après la résolution de chaque attaque. |
| `:after_action_dialog` | `\|scene\|` | Après les actions du tour, avant le remplacement des Pokémon K.O. |
| `:battle_turn_end` | `\|scene\|` | À la fin du tour, après le remplacement des Pokémon K.O. |

### Mettre en place la logique

`:logic_init` tourne avant toute animation, alors que la logique existe mais que rien n'est encore à l'écran. C'est l'endroit pour ajouter des effets de départ :

```ruby
register_event(:logic_init) do |scene|
  scene.logic.bank_effects[1].add(Battle::Effects::LightScreen.new(scene.logic, 1, 0, Float::INFINITY))
  scene.logic.bank_effects[1].add(Battle::Effects::Reflect.new(scene.logic, 1, 0, Float::INFINITY))
end
```

Le combat démarre alors avec Mur Lumière et Protection déjà actifs côté ennemi pour un nombre de tours illimité. `bank_effects[bank]` contient les effets d'un banc, et le constructeur d'effet prend `(logic, bank, position, turn_count)`.

### Faire parler le dresseur

Cinq events ne passent que `scene`, donc n'importe lequel peut appeler `show_event_message` ; ils ne diffèrent que par le moment (voir le tableau). Une réplique avant la première action du joueur utilise `:battle_begin` :

```ruby
register_event(:battle_begin) do |scene|
  scene.show_event_message("You actually made it this far? Let me show you a real battle!")
end
```

Une réplique au premier tour seulement utilise `:trainer_dialog` avec un garde sur le tour :

```ruby
register_event(:trainer_dialog) do |scene|
  next if $game_temp.battle_turn != 1 # only on the first turn

  scene.show_event_message("Oh, I forgot to mention, I never intended to play fair.")
end
```

Une vantardise « plus qu'un dernier Pokémon » utilise `:battle_turn_end` (qui se déclenche après le remplacement des Pokémon K.O.), avec un drapeau pour ne tourner qu'une fois :

```ruby
register_event(:battle_turn_end) do |scene|
  next if scene.logic.alive_battlers_without_check(1).size > 1
  next if scene.instance_variable_get(:@ace_dialog_done)

  scene.instance_variable_set(:@ace_dialog_done, true)
  scene.show_event_message("You are pushing me to my limits! Here is my best Pokémon!")
end
```

Le drapeau `@ace_dialog_done`, stocké sur la scène (objet à longue durée de vie), empêche l'event de se déclencher à chaque tour suivant. `:after_action_dialog` est la même idée une étape plus tôt, avant le remplacement.

### Réagir à une attaque

`:after_attack` se déclenche après chaque attaque, avec l'attaquant (`launcher`) et l'attaque (`move`). On utilise les prédicats publics de l'attaque pour réagir, sans avoir à fouiller dans ses internes :

```ruby
register_event(:after_attack) do |scene, launcher, move|
  next if launcher.bank != 0 # only react to the player's moves
  next if scene.instance_variable_get(:@praised_player)

  if move.super_effective?
    scene.instance_variable_set(:@praised_player, true)
    next scene.show_event_message("Nicely done! You really know how to hit a weakness.")
  end

  if move.critical_hit?
    scene.instance_variable_set(:@praised_player, true)
    scene.show_event_message("Ouch, that critical hit must have hurt!")
  end
end
```

`move.super_effective?`, `move.critical_hit?` et `move.effectiveness` sont tous publics.

### Forcer l'IA

`:AI_force_action` se déclenche une fois par IA (`index` est sa position, `ai` est l'IA). On retourne un tableau d'actions pour remplacer son tour, ou `nil` pour laisser l'IA par défaut décider :

```ruby
register_event(:AI_force_action) do |scene, ai, index|
  next if index != 0 # only the first AI

  controlled = ai.controlled_pokemon
  next if controlled.empty?
  next unless scene.logic.can_battler_be_replaced?(active = controlled.first)

  bench = ai.party.select { |pokemon| pokemon.alive? && !controlled.include?(pokemon) }
  next if bench.empty?

  next [Battle::Actions::Switch.new(scene, active, bench.sample)]
end
```

Cela force la première IA à remplacer son Pokémon actif par un allié du banc tiré au hasard. `Battle::Actions::Switch.new(scene, out, in)` construit une action de changement (le premier Pokémon sort, le second entre), et retourner le tableau fait exécuter l'action à l'IA.

## Définir ses propres events

Les huit events ci-dessus sont ceux que déclenche la scène de combat, mais `register_event` accepte n'importe quel symbole : un plugin peut donc exposer ses propres hooks. Déclencher un event passe par `call_event`, privé sur la scène, donc on imite les wrappers `on_after_attack` / `on_pre_battle_begin` du moteur et on ajoute une méthode publique qui l'appelle :

```ruby
module Battle
  class Scene
    def on_low_hp_taunt(launcher)
      call_event(:low_hp_taunt, launcher)
    end
  end
end
```

On appelle `scene.on_low_hp_taunt(...)` là où la logique en a besoin (typiquement depuis une méthode de combat surchargée par prepend), et les fichiers d'event y réagissent comme à n'importe quel event natif :

```ruby
register_event(:low_hp_taunt) do |scene, launcher|
  # ...
end
```

C'est exactement ainsi que le moteur déclenche `:after_attack`, `:pre_battle_begin` et `:battle_turn_end` en interne.

## Mettre le tout ensemble

Un fichier de battle event est une suite d'appels `register_event` à l'intérieur d'un même `Battle::Scene` rouvert :

```ruby
module Battle
  class Scene
    register_event(:logic_init) do |scene|
      scene.logic.bank_effects[1].add(Battle::Effects::LightScreen.new(scene.logic, 1, 0, Float::INFINITY))
    end

    register_event(:battle_begin) do |scene|
      scene.show_event_message("So you finally made it. Do not expect me to go easy on you!")
    end
  end
end
```

On règle le `battle_id` du combat sur les chiffres du fichier (depuis un script avec `bi.battle_id = 2`, ou via le Battle Group ID du dresseur dans Studio), on ajoute le helper `show_event_message` à un script personnalisé, et la scène exécute chaque bloc au bon moment.

## Conclusion

- Les battle events sont des fichiers Ruby dans `Data/Events/Battle/NNNNN*.rb`, sélectionnés par `battle_id` (par défaut `-1`, qui ne charge rien ; `1` pour les combats sauvages).
- On rouvre `Battle::Scene` et on enregistre un bloc par moment avec `register_event(:event)` ; le bloc reçoit toujours `scene` en premier.
- On utilise les events de dialogue avec le helper `show_event_message` pour les répliques en plein combat, `:logic_init` pour les effets de départ, `:after_attack` pour réagir aux attaques, et `:AI_force_action` pour scénariser l'IA.
- On définit `battle_id` depuis un `BattleInfo` (`bi.battle_id = N`) ou via le Battle Group ID du dresseur dans Studio.
- Au-delà des huit events natifs, on enregistre son propre symbole et on le déclenche avec un wrapper public `on_*` autour de `call_event` pour exposer des hooks de combat depuis un plugin.
