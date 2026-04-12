---
title: "Comment modifier l'efficacité d'une attaque dans PSDK ?"
slug: modifier-lefficacite-dune-attaque
sidebar_position: 6
description: "Ce guide explique comment modifier le multiplicateur de type d'une attaque, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

L'efficacité d'une attaque peut être modifiée pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque surcharge la méthode `single_type_multiplier_overwrite` dans sa sous-classe.
- **Depuis un effet externe** : un effet actif modifie le multiplicateur de type avant le calcul des dégâts.

La valeur retournée est un multiplicateur numérique appliqué **par type de la cible** :

- `0` = immunisé
- `0.5` = pas très efficace
- `1` = neutre (efficacité normale)
- `2` = super efficace

## Depuis l'attaque

Certaines attaques peuvent modifier leur efficacité selon leurs propres règles. Par exemple, l'attaque **Lyophilisation** inflige des dégâts super efficaces contre les Pokémon de type Eau, alors que la Glace est normalement neutre contre l'Eau.

Pour gérer ce comportement, on surcharge la méthode `single_type_multiplier_overwrite` dans la sous-classe de l'attaque. Si les conditions ne sont pas remplies, on retourne `super` pour laisser la chaîne de calcul continuer normalement.

### Exemple : Lyophilisation

```ruby
module Battle
  class Move
    class FreezeDry < Basic
      # Get a single type multiplier overwrite
      # @param target [PFM::PokemonBattler] target of the move
      # @param target_type [Integer] one of the type of the target
      # @param type [Integer] one of the type of the move
      # @return [Float | nil] definitive multiplier
      def single_type_multiplier_overwrite(target, target_type, type)
        return super if target_type != data_type(:water).id

        return 2
      end
    end

    Move.register(:s_freeze_dry, FreezeDry)
  end
end
```

- La méthode vérifie si le type de la cible est Eau. Si oui, elle retourne `2` (super efficace).
- Si la condition n'est pas remplie, `return super` délègue au comportement par défaut de la classe parente.
- Pas besoin de vérifier `db_symbol` : la méthode est définie dans la sous-classe de l'attaque, elle ne s'applique donc qu'à cette attaque.

## Depuis un effet

Certains effets peuvent modifier l'efficacité de type d'une attaque. Par exemple, l'effet **Clairvoyance** permet aux attaques Normal et Combat de toucher les Pokémon de type Spectre avec une efficacité neutre.

Pour gérer ce comportement, on utilise la méthode `on_single_type_multiplier_overwrite` dans la classe de l'effet.

### Exemple : Clairvoyance

```ruby
# Function that computes an overwrite of the type multiplier
# @param target [PFM::PokemonBattler]
# @param target_type [Integer] one of the type of the target
# @param type [Integer] one of the type of the move
# @param move [Battle::Move]
# @return [Numeric, nil] overwriten type multiplier
def on_single_type_multiplier_overwrite(target, target_type, type, move)
  return if target != @pokemon || target_type != data_type(:ghost).id
  return unless [data_type(:normal).id, data_type(:fighting).id].include?(type)

  return 1
end
```

- La première ligne vérifie que la cible est le porteur de l'effet et que le type de la cible est Spectre.
- La deuxième ligne vérifie que le type de l'attaque est Normal ou Combat.
- Le retour `1` remplace l'immunité habituelle (Spectre immunisé à Normal/Combat) par une efficacité neutre.
- Le retour `nil` (implicite) laisse le multiplicateur de type inchangé.

## Conclusion

- Surchargez `single_type_multiplier_overwrite` dans la sous-classe de l'attaque si la modification dépend de la logique propre de l'attaque. Retournez `super` si les conditions ne sont pas remplies.
- Utilisez `on_single_type_multiplier_overwrite` si la modification dépend d'un effet externe. Retournez `nil` (implicitement) pour ne pas modifier le multiplicateur.
- Retournez un `Numeric` (0, 0.5, 1, 2) pour modifier le multiplicateur.
