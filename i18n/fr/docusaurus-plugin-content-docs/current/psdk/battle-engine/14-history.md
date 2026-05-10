---
title: "Comment créer un historique de combat dans PSDK ?"
slug: creer-un-historique
sidebar_position: 14
description: "Ce guide explique comment créer un historique personnalisé sur un PokemonBattler, en suivant le même pattern que MoveHistory, DamageHistory et StatHistory."
---

## Principe

Un historique est composé de quatre éléments :

1. **Une classe d'historique** : stocke les données d'une entrée (tour, données contextuelles, méthodes utilitaires).
2. **Un `attr_reader`** sur `PokemonBattler` : expose le tableau d'entrées.
3. **Une initialisation** dans le constructeur de `PokemonBattler` : crée le tableau vide.
4. **Une méthode `add_X_to_history`** sur `PokemonBattler` : ajoute une entrée au tableau.

L'alimentation se fait depuis le handler ou la procédure concernée, au moment où l'action a lieu.

## Étape 1 : créer la classe d'historique

Créer un fichier dans `5 Battle/03 PokemonBattler/` (ex: `103 HealHistory.rb`).

```ruby
module PFM
  class PokemonBattler
    class HealHistory
      # @return [Integer] le tour où le soin a eu lieu
      attr_reader :turn
      # @return [Integer] montant de PV soignés
      attr_reader :amount
      # @return [PFM::PokemonBattler, nil] lanceur du soin
      attr_reader :launcher
      # @return [Battle::Move, nil] attaque ayant causé le soin
      attr_reader :move

      # Create a new Heal History
      # @param amount [Integer] amount of HP healed
      # @param launcher [PFM::PokemonBattler, nil]
      # @param move [Battle::Move, nil]
      def initialize(amount, launcher, move)
        @turn = $game_temp.battle_turn
        @amount = amount
        @launcher = launcher
        @move = move
      end

      # Tell if the heal happened during the current turn
      # @return [Boolean]
      def current_turn?
        return @turn == $game_temp.battle_turn
      end

      # Tell if the heal happened during the last turn
      # @return [Boolean]
      def last_turn?
        return @turn == $game_temp.battle_turn - 1
      end
    end
  end
end
```

- Le `turn` est toujours capturé depuis `$game_temp.battle_turn` dans le constructeur.
- Les méthodes `current_turn?` et `last_turn?` sont le pattern standard de tous les historiques.
- Les attributs dépendent de ce qu'on veut tracer.

## Étape 2 : déclarer l'attribut sur PokemonBattler

Dans `001 PokemonBattler.rb`, ajouter l'`attr_reader` :

```ruby
# Get the heal history
# @return [Array<HealHistory>]
attr_reader :heal_history
```

## Étape 3 : initialiser le tableau

Dans la méthode `initialize` de `PokemonBattler`, ajouter l'initialisation :

```ruby
@heal_history = []
```

## Étape 4 : créer la méthode d'ajout

Dans `PokemonBattler`, ajouter la méthode qui crée et ajoute une entrée :

```ruby
# Add a heal to the heal history
# @param amount [Integer] amount of HP healed
# @param launcher [PFM::PokemonBattler, nil]
# @param move [Battle::Move, nil]
def add_heal_to_history(amount, launcher, move)
  @heal_history << HealHistory.new(amount, launcher, move)
end
```

## Alimenter l'historique

Appeler `add_X_to_history` depuis le handler ou la procédure qui effectue l'action. Voici où les historiques existants sont alimentés :

| Historique                | Alimenté depuis                              |
| ------------------------- | -------------------------------------------- |
| `move_history`            | `proceed_internal` (toujours, même si échec) |
| `successful_move_history` | `proceed_internal` (uniquement si réussi)    |
| `damage_history`          | `DamageHandler#damage_change`                |
| `stat_history`            | `StatChangeHandler#stat_change`              |

Pour un historique personnalisé, l'appel se place au même endroit que l'action :

```ruby
# Dans le handler ou la procédure concernée
target.add_heal_to_history(amount, launcher, skill)
```

## Historiques existants — référence

### MoveHistory

| Attribut        | Type                         | Description                        |
| --------------- | ---------------------------- | ---------------------------------- |
| `turn`          | `Integer`                    | Tour de l'utilisation              |
| `move`          | `Battle::Move`               | Copie (`dup`) de l'attaque         |
| `original_move` | `Battle::Move`               | Référence directe à l'objet move   |
| `targets`       | `Array<PFM::PokemonBattler>` | Cibles affectées                   |
| `attack_order`  | `Integer`                    | Ordre d'attaque du Pokémon ce tour |

`SuccessfulMoveHistory` hérite de `MoveHistory` sans ajout.

### DamageHistory

| Attribut   | Type                       | Description                    |
| ---------- | -------------------------- | ------------------------------ |
| `turn`     | `Integer`                  | Tour des dégâts                |
| `damage`   | `Integer`                  | Montant de dégâts subis        |
| `launcher` | `PFM::PokemonBattler, nil` | Lanceur des dégâts             |
| `move`     | `Battle::Move, nil`        | Attaque ayant causé les dégâts |
| `ko`       | `Boolean`                  | Si le Pokémon a été mis KO     |

### StatHistory

| Attribut   | Type                       | Description                                            |
| ---------- | -------------------------- | ------------------------------------------------------ |
| `turn`     | `Integer`                  | Tour du changement                                     |
| `stat`     | `Symbol`                   | `:atk`, `:dfe`, `:spd`, `:ats`, `:dfs`, `:acc`, `:eva` |
| `power`    | `Integer`                  | Puissance (positif = hausse)                           |
| `target`   | `PFM::PokemonBattler`      | Cible du changement                                    |
| `launcher` | `PFM::PokemonBattler, nil` | Lanceur du changement                                  |
| `move`     | `Battle::Move, nil`        | Attaque ayant causé le changement                      |

## Conclusion

- Créer une classe d'historique avec `turn`, `current_turn?`, `last_turn?` et les attributs spécifiques.
- Déclarer un `attr_reader` sur `PokemonBattler` et initialiser le tableau dans `initialize`.
- Ajouter une méthode `add_X_to_history` qui crée et ajoute l'entrée.
- Appeler cette méthode depuis le handler ou la procédure au moment de l'action.
