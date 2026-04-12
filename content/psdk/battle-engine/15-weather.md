---
title: "Comment créer une météo dans PSDK ?"
slug: creer-une-meteo-et-ses-effets
sidebar_position: 12
description: "Ce guide explique comment ajouter une nouvelle météo au système de combat, créer ses effets, ajouter les textes associés, et la déclencher via une attaque ou un effet."
---

## Principe

L'ajout d'une météo se fait en quatre étapes :

- **Ajouter les textes** : les messages affichés lors de l'activation, de la fin et à chaque tour.
- **Créer la classe d'effet** : le comportement mécanique de la météo (multiplicateurs de type, dégâts par tour, etc.).
- **Enregistrer la météo dans le handler** : lier le symbole de la météo aux messages.
- **La déclencher** : permettre son activation via une attaque ou un effet.

## Ajouter les textes

Les messages de météo sont stockés dans le fichier 100018 sur Studio. Il faut ajouter jusqu'à trois messages :

- Un message **d'activation** (quand la météo apparaît) — ex : _"It started to rain!"_
- Un message **de fin** (quand la météo s'estompe) — ex : _"The rain stopped."_
- Un message **de tour** (affiché à chaque fin de tour, optionnel) — ex : _"The sandstorm rages."_

Notez les numéros de ligne de ces messages dans Studio, ils seront nécessaires pour l'enregistrement dans le handler.

Les météos existantes utilisent ces numéros de lignes dans le fichier 18 :

| Météo     | Activation | Fin | Tour |
| --------- | ---------- | --- | ---- |
| Rain      | 88         | 93  | —    |
| Sunny     | 87         | 92  | —    |
| Sandstorm | 89         | 94  | 98   |
| Hail      | 90         | 95  | 99   |
| Fog       | 91         | 96  | —    |
| Snow      | 287        | 288 | 289  |

## Créer la classe d'effet

Les météos héritent de `Battle::Effects::Weather` et se placent dans le dossier `5 Battle/06 Effects/06 Weather Effects/`.

Voici le minimum requis pour une météo fonctionnelle :

```ruby
module Battle
  module Effects
    class Weather
      class VoidWeather < Weather
        # Function called at the end of a turn
        # @param logic [Battle::Logic] logic of the battle
        # @param scene [Battle::Scene] battle scene
        # @param battlers [Array<PFM::PokemonBattler>] all alive battlers
        def on_end_turn_event(logic, scene, battlers)
          if $env.decrease_weather_duration
            scene.display_message_and_wait(parse_text(id_file, id_text))
            logic.weather_change_handler.weather_change(:none, 0)
          end

          # Add custom per-turn behavior here (damage, healing, etc.)
        end

        # Add custom behavior here (type multipliers, status prevention, etc.)
      end
      register(:void_weather, VoidWeather)
    end
  end
end
```

Le strict minimum est :

- `on_end_turn_event` : gère la durée de la météo. `$env.decrease_weather_duration` décompte les tours et affiche le message de fin (ici ligne 401) quand la météo expire. Sans cette méthode, la météo dure indéfiniment.
- `register(:void_weather, VoidWeather)` : lie le symbole à la météo via le pattern factory. Sans cet appel, la météo ne peut pas être instanciée.

Entre ces deux éléments, on ajoute le comportement souhaité en overridant les hooks de `EffectBase`. Par exemple, Rain override `mod1_multiplier` pour booster les attaques Eau (x1.5) et affaiblir les attaques Feu (x0.5). Les météos existantes dans `5 Battle/06 Effects/06 Weather Effects/` montrent les différentes possibilités.

### Hooks disponibles

Les météos peuvent override n'importe quel hook de `EffectBase`. La liste complète se trouve dans `5 Battle/06 Effects/100 EffectBase.rb`.

## Enregistrer la météo dans le handler

Le `WeatherChangeHandler` gère l'application et les messages des météos. Deux constantes doivent être mises à jour.

### Ajouter le symbole dans WEATHER_NAMES

Le tableau `WEATHER_NAMES` dans `PFM::Environment` liste tous les symboles de météo connus :

```ruby
module PFM
  class Environment
    WEATHER_NAMES << :void_weather
  end
end
```

### Ajouter le message d'activation dans WEATHER_SYM_TO_MSG

Le hash `WEATHER_SYM_TO_MSG` contient la correspondance entre les symboles de météo et les numéros de messages d'activation. Il n'est pas frozen, on peut donc simplement y ajouter une entrée :

```ruby
module Battle
  module Logic
    class WeatherChangeHandler
      # Register activation message (terrain symbol => message line)
      WEATHER_SYM_TO_MSG[:void_terrain] = 400

      # Register end message (none => { terrain symbol => message line })
      WEATHER_SYM_TO_MSG[:none][:void_terrain] = 401
    end
  end
end
```

La structure du hash est la suivante :

- `WEATHER_SYM_TO_MSG[:void_terrain] = 400` : le message d'activation (ligne 400 du fichier texte 60).
- `WEATHER_SYM_TO_MSG[:none][:void_terrain] = 401` : le message de fin (ligne 401), affiché quand le terrain passe à `:none`.

Les numéros `400` et `401` correspondent aux lignes des messages ajoutés dans Studio à la première étape.

## Déclencher la météo via une attaque

Pour créer une attaque qui invoque la météo :

### Configurer l'attaque dans Studio

Créez l'attaque dans Pokémon Studio avec ces propriétés :

- **Procédure** : `s_weather`
- **Catégorie** : Statut
- **PP** : 5 (typique)
- **Cible** : Tous les Pokémon

### Enregistrer l'attaque dans WeatherMove

Le hash `WEATHER_MOVES` associe le `db_symbol` de l'attaque au symbole de la météo. Il suffit d'y ajouter une entrée — le `db_symbol` de l'attaque créée dans Studio doit correspondre à la clé :

```ruby
module Battle
  class Move
    class WeatherMove
      WEATHER_MOVES[:void_weather] = :void_weather
    end
  end
end
```

Le système utilise `WEATHER_MOVES[db_symbol]` pour trouver la météo à appliquer.

### Enregistrer l'objet d'extension de durée (optionnel)

Si un objet prolonge la durée de la météo (de 5 à 8 tours), ajoutez-le dans `WEATHER_ITEMS` :

```ruby
module Battle
  class Move
    class WeatherMove
      WEATHER_ITEMS[:void_weather] = :void_rock
    end
  end
end
```

Le système vérifie automatiquement si le lanceur tient cet objet pour ajuster la durée.

## Déclencher la météo via un effet

L'exemple ci-dessous montre un effet de talent, mais les mêmes méthodes s'appliquent pour un objet ou tout autre effet qui déclenche une météo :

```ruby
module Battle
  module Effects
    class Ability
      class VoidStream < Drizzle
        private

        # Return the weather type
        # @return [Symbol]
        def weather
          return :void_weather
        end

        # Return the item that extends the weather duration
        # @return [Symbol]
        def item_db_symbol
          return :void_rock
        end
      end
      register(:void_stream, VoidStream)
    end
  end
end
```

L'effet hérite de `Drizzle` (ou de n'importe quel effet de météo existant) et override uniquement `weather` (le symbole de la météo) et `item_db_symbol` (l'objet d'extension de durée). Le système gère automatiquement la durée (5 tours, ou 8 avec l'objet).

Les exemples de référence se trouvent dans le fichier `050 Weather Setting Abilitites.rb`.

## Ajouter un test de météo

Pour pouvoir vérifier la météo active dans le code (par exemple `logic.weather_effect.void_weather?`), il faut ajouter une méthode de requête dans la classe de base :

```ruby
module Battle
  module Effects
    class Weather
      # Test if the weather is void
      # @return [Boolean]
      def void_weather?
        return @db_symbol == :void_weather
      end
    end
  end
end
```

## Récapitulatif des fichiers

Pour créer une météo complète, voici les fichiers à créer ou modifier :

| Fichier                                          | Action                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Studio → Système de combat (fichier texte 18)   | Ajouter les messages d'activation, de fin et de tour         |
| `my-project/scripts/001 Weather.rb`              | Ajouter le symbole dans `WEATHER_NAMES`                      |
| `my-project/scripts/002 WeatherChangeHandler.rb` | Ajouter l'entrée dans `WEATHER_SYM_TO_MSG`                   |
| `my-project/scripts/003 WeatherEffect.rb`        | Créer la classe d'effet de la météo                          |
| `my-project/scripts/004 WeatherMove.rb`          | Ajouter dans `WEATHER_MOVES` et `WEATHER_ITEMS` (si attaque) |
| `my-project/scripts/005 Ability.rb`              | Créer l'effet (si effet)                                     |
| Studio → Attaques                               | Créer l'attaque avec la procédure `s_weather` (si attaque)   |

## Conclusion

- Ajoutez d'abord les **messages** dans Studio (fichier texte 18), car ils sont nécessaires pour le handler.
- Créez la **classe d'effet** en héritant de `Weather` avec au minimum `on_end_turn_event` et `register`.
- Ajoutez le symbole dans `WEATHER_NAMES` et l'entrée dans `WEATHER_SYM_TO_MSG` pour lier les messages.
- Ajoutez l'entrée dans `WEATHER_MOVES` pour les attaques, ou héritez de `Drizzle` pour les effets.
- Les météos existantes dans `5 Battle/06 Effects/06 Weather Effects/` servent de référence pour les comportements possibles.
