---
title: "Créer un terrain"
slug: creer-un-terrain
sidebar_position: 16
description: "Ce guide explique comment ajouter un nouveau terrain au système de combat, créer ses effets, ajouter les textes associés, et le déclencher via une attaque ou un effet."
---

## Principe

L'ajout d'un terrain se fait en quatre étapes :

- **Ajouter les textes** : les messages affichés lors de l'activation et de la fin du terrain.
- **Créer la classe d'effet** : le comportement mécanique du terrain (boost de puissance, prévention de statut, etc.).
- **Enregistrer le terrain dans le handler** : lier le symbole du terrain aux messages.
- **Le déclencher** : permettre son activation via une attaque ou un effet.

## Ajouter les textes

Les messages de terrain sont stockés dans le fichier 100060 sur Pokémon Studio. Il faut ajouter deux messages :

- Un message **d'activation** (quand le terrain apparaît) — ex : _"An electric current runs across the battlefield!"_
- Un message **de fin** (quand le terrain s'estompe) — ex : _"The electricity disappeared from the battlefield."_

Notez les numéros de ligne de ces messages dans Pokémon Studio, ils seront nécessaires pour l'enregistrement dans le handler.

Les terrains existants utilisent ces numéros de lignes dans le fichier 60 :

| Terrain          | Activation | Fin |
| ---------------- | ---------- | --- |
| Electric Terrain | 226        | 227 |
| Grassy Terrain   | 222        | 223 |
| Misty Terrain    | 224        | 225 |
| Psychic Terrain  | 346        | 347 |

## Créer la classe d'effet

Les terrains héritent de `Battle::Effects::FieldTerrain` et se placent dans le dossier `5 Battle/06 Effects/07 Field Terrain Effects/`.

Voici le minimum requis pour un terrain fonctionnel :

```ruby
module Battle
  module Effects
    class FieldTerrain
      class Void < FieldTerrain
        # Function called at the end of a turn
        # @param logic [Battle::Logic] logic of the battle
        # @param scene [Battle::Scene] battle scene
        # @param battlers [Array<PFM::PokemonBattler>] all alive battlers
        def on_end_turn_event(logic, scene, battlers)
          @internal_counter -= 1
          logic.fterrain_change_handler.fterrain_change(:none) if @internal_counter <= 0
        end

        # Add custom behavior here (status prevention, power boost, etc.)
      end
      register(:void_terrain, Void)
    end
  end
end
```

Le strict minimum est :

- `on_end_turn_event` : gère la durée du terrain. `@internal_counter` décompte les tours restants. Quand il atteint 0, le terrain est retiré en le passant à `:none`. Sans cette méthode, le terrain dure indéfiniment.
- `register(:void_terrain, Void)` : lie le symbole au terrain via le pattern factory. Sans cet appel, le terrain ne peut pas être instancié.

Entre ces deux éléments, on ajoute le comportement souhaité en overridant les hooks de `EffectBase`. Par exemple, Electric Terrain override `on_status_prevention` pour empêcher le sommeil et `mod1_multiplier` pour booster les attaques Électrik. Les terrains existants dans `5 Battle/06 Effects/07 Field Terrain Effects/` montrent les différentes possibilités.

### `affected_by_terrain?`

Quand on ajoute un comportement lié au terrain, il faut vérifier `affected_by_terrain?` sur le Pokémon cible ou utilisateur. Cette méthode retourne `true` si le Pokémon est au sol. Un Pokémon n'est **pas** affecté s'il est de type Vol, a le talent Lévitation, est sous l'effet de Magnéto-Rise ou Télékinésie, ou tient un Ballon.

### Hooks disponibles

Les terrains peuvent override n'importe quel hook de `EffectBase`. La liste complète se trouve dans `5 Battle/06 Effects/100 EffectBase.rb`.

## Enregistrer le terrain dans le handler

Le `FTerrainChangeHandler` gère l'application et les messages des terrains. Le hash `FTERRAIN_SYM_TO_MSG` contient la correspondance entre les symboles de terrain et les numéros de messages. Il n'est pas frozen, on peut donc simplement y ajouter des entrées :

```ruby
module Battle
  module Logic
    class FTerrainChangeHandler
      # Register activation message (terrain symbol => message line)
      FTERRAIN_SYM_TO_MSG[:void_terrain] = 400

      # Register end message (none => { terrain symbol => message line })
      FTERRAIN_SYM_TO_MSG[:none][:void_terrain] = 401
    end
  end
end
```

La structure du hash est la suivante :

- `FTERRAIN_SYM_TO_MSG[:void_terrain] = 400` : le message d'activation (ligne 400 du fichier texte 60).
- `FTERRAIN_SYM_TO_MSG[:none][:void_terrain] = 401` : le message de fin (ligne 401), affiché quand le terrain passe à `:none`.

Les numéros `400` et `401` correspondent aux lignes des messages ajoutés dans Pokémon Studio à la première étape.

## Déclencher le terrain via une attaque

Pour créer une attaque qui invoque le terrain :

### Configurer l'attaque dans PokémonStudio

Créez l'attaque dans Pokémon Studio avec ces propriétés :

- **Procédure** : `s_terrain`
- **Catégorie** : Statut
- **PP** : 10 (typique)
- **Cible** : Tous les Pokémon

### Enregistrer l'attaque dans TerrainMove

Le hash `TERRAIN_MOVES` associe le `db_symbol` de l'attaque au symbole du terrain. Il suffit d'y ajouter une entrée — le `db_symbol` de l'attaque créée dans Studio doit correspondre à la clé :

```ruby
module Battle
  class Move
    class TerrainMove
      TERRAIN_MOVES[:void_terrain] = :void_terrain
    end
  end
end
```

Le système utilise `TERRAIN_MOVES[db_symbol]` pour trouver le terrain à appliquer. Il vérifie aussi automatiquement si le lanceur tient un objet `:terrain_extender` pour prolonger la durée de 5 à 8 tours.

## Déclencher le terrain via un effet

L'exemple ci-dessous montre un effet de talent, mais les mêmes méthodes s'appliquent pour un objet ou tout autre effet qui déclenche un terrain :

```ruby
module Battle
  module Effects
    class Ability
      class VoidSurge < ElectricSurge
        private

        # Return the terrain type
        # @return [Symbol]
        def terrain_type
          return :void_terrain
        end
      end
      register(:void_surge, VoidSurge)
    end
  end
end
```

Le talent hérite de `ElectricSurge` (ou de n'importe quel Surge existant) et override uniquement `terrain_type`. Le système gère automatiquement la vérification de l'objet `:terrain_extender` pour la durée.

Les exemples de référence se trouvent dans le fichier `050 FieldTerrain Setting Abilities.rb`.

## Ajouter un test de terrain

Pour pouvoir vérifier le terrain actif dans le code (par exemple `logic.field_terrain_effect.void?`), il faut ajouter une méthode de requête dans la classe de base :

```ruby
module Battle
  module Effects
    class FieldTerrain
      # Test if the field terrain is void
      # @return [Boolean]
      def void?
        return @db_symbol == :void_terrain
      end
    end
  end
end
```

## Récapitulatif des fichiers

Pour créer un terrain complet, voici les fichiers à créer ou modifier :

| Fichier                                           | Action                                                     |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Studio → Système de combat (fichier texte 60)     | Ajouter les messages d'activation et de fin                |
| `my-project/scripts/001 FTerrainChangeHandler.rb` | Enregistrer les messages dans le handler                   |
| `my-project/scripts/002 FieldTerrain.rb`          | Créer la classe d'effet du terrain                         |
| `my-project/scripts/003 TerrainMove.rb`           | Lier l'attaque au terrain (si attaque)                     |
| `my-project/scripts/004 Ability.rb`               | Créer le talent Surge (si talent)                          |
| Studio → Attaques                                 | Créer l'attaque avec la procédure `s_terrain` (si attaque) |
| Studio → Talents                                  | Créer le talent (si talent)                                |

## Conclusion

- Ajoutez d'abord les **messages** dans Pokémon Studio (fichier texte 60), car ils sont nécessaires pour le handler.
- Créez la **classe d'effet** en héritant de `FieldTerrain` avec au minimum `on_end_turn_event` et `register`.
- Ajoutez les entrées dans `FTERRAIN_SYM_TO_MSG` pour lier les messages au terrain.
- Ajoutez l'entrée dans `TERRAIN_MOVES` pour les attaques, ou héritez de `ElectricSurge` pour les talents.
- Vérifiez toujours `affected_by_terrain?` avant d'appliquer un effet à un Pokémon.
- Les terrains existants dans `5 Battle/06 Effects/07 Field Terrain Effects/` servent de référence pour les comportements possibles.
