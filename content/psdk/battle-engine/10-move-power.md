---
title: "Comment modifier la puissance d'une attaque dans PSDK ?"
slug: modifier-la-puissance-dune-attaque
sidebar_position: 10
description: "Ce guide explique comment changer dynamiquement la puissance de base d'une attaque, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

La puissance d'une attaque peut être modifiée pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque recalcule sa puissance de base en fonction du contexte.
- **Depuis un effet externe** : un effet actif applique un multiplicateur sur la puissance de base.

Les deux mécanismes n'interviennent pas au même niveau : `real_base_power` retourne la **puissance de base** (valeur absolue), tandis que `base_power_multiplier` retourne un **multiplicateur** appliqué après.

## Depuis l'attaque

Certaines attaques peuvent modifier leur puissance selon leurs propres règles. Par exemple, l'attaque **Acrobatie** double sa puissance si l'utilisateur n'a pas d'objet.

Pour gérer ce comportement, on override la méthode `real_base_power` dans la classe de l'attaque.

### Exemple : Acrobatie

```ruby
# Get the real base power of the move (taking in account all parameter)
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Numeric]
def real_base_power(user, target)
  return power * 2 if user.item_effect.is_a?(Battle::Effects::Item::Gems) && user.item_consumed
  return power * 2 unless user.hold_item?(user.battle_item_db_symbol)

  return super
end
```

- `power` est la puissance de base définie dans les données de l'attaque.
- `super` retourne la puissance de base non modifiée si aucune condition n'est remplie.

## Depuis un effet

Certains effets peuvent modifier la puissance d'une attaque via un multiplicateur. Par exemple, le talent **Technicien** multiplie par 1.5 la puissance des attaques de 60 ou moins.

Pour gérer ce comportement, on utilise la méthode `base_power_multiplier` dans la classe de l'effet.

### Exemple : Technicien

```ruby
# Get the base power multiplier of this move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Float]
def base_power_multiplier(user, target, move)
  return super if user != @target
  return super if move.power > 60

  return 1.5
end
```

- `super` retourne le multiplicateur par défaut (1.0) si les conditions ne sont pas remplies.
- La vérification porte sur `move.power` (puissance de base) et non sur `real_base_power` (puissance après modifications).
- Le retour `1.5` est un multiplicateur : la puissance finale sera `real_base_power * 1.5`.

## Conclusion

- Utilisez `real_base_power` si la modification dépend de la logique propre de l'attaque. Retournez la puissance de base modifiée (`Numeric`).
- Utilisez `base_power_multiplier` si la modification dépend d'un effet externe. Retournez un multiplicateur (`Float`).
- `real_base_power` définit la puissance absolue, `base_power_multiplier` applique un facteur multiplicatif par-dessus.
