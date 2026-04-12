---
title: "Comment modifier le type d'une attaque dans PSDK ?"
slug: modifier-le-type-dune-attaque
sidebar_position: 5
description: "Ce guide explique comment changer dynamiquement le type d'une attaque au moment de son utilisation, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

Le type d'une attaque peut être modifié pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque détermine son type en fonction de l'utilisateur ou du contexte.
- **Depuis un effet externe** : un effet actif modifie le type de l'attaque avant son exécution.

Les deux mécanismes n'ont pas le même format de retour : `definitive_types` retourne un `Array<Integer>` (liste de types), tandis que `on_move_type_change` retourne un `Integer` unique ou `nil`.

## Depuis l'attaque

Certaines attaques peuvent changer de type selon leurs propres règles. Par exemple, l'attaque **Taurogne** adapte son type en fonction de la forme de Tauros qui l'utilise.

Pour gérer ce comportement, on override la méthode `definitive_types` dans la classe de l'attaque.

### Exemple : Taurogne

```ruby
# @return [Array<Symbol>]
RAGING_BULL_USERS = %i[tauros]

# Get the types of the move with 1st type being affected by effects
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Array<Integer>] list of types of the move
def definitive_types(user, target)
  return [type] unless RAGING_BULL_USERS.include?(user.db_symbol)

  case user.form
  when 1
    return [data_type(:fighting).id]
  when 2
    return [data_type(:fire).id]
  when 3
    return [data_type(:water).id]
  else
    return [type]
  end
end
```

- La constante `RAGING_BULL_USERS` limite l'effet aux Pokémon concernés, permettant un monkey patch facile.
- `data_type(:symbol).id` convertit un symbole de type en son identifiant numérique.
- La méthode retourne toujours un `Array<Integer>`, même pour un seul type (`[type]`).

## Depuis un effet

Certains effets peuvent modifier le type d'une attaque avant son exécution. Par exemple, l'effet **Déluge Plasmique** transforme les attaques de type Normal en type Électrik.

Pour gérer ce comportement, on utilise la méthode `on_move_type_change` dans la classe de l'effet.

### Exemple : Déluge Plasmique

```ruby
# Function called when we try to get the definitive type of a move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler] expected target
# @param move [Battle::Move]
# @param type [Integer] current type of the move (potentially after effects)
# @return [Integer, nil] new type of the move
def on_move_type_change(user, target, move, type)
  return if type != data_type(:normal).id

  return data_type(:electric).id
end
```

- Le paramètre `type` contient le type actuel de l'attaque, potentiellement déjà modifié par d'autres effets.
- La méthode retourne le nouveau type (`Integer`) si la condition est remplie, ou `nil` implicitement pour ne pas modifier le type.

## Conclusion

- Utilisez `definitive_types` si le changement de type dépend de la logique propre de l'attaque. Retournez un `Array<Integer>`.
- Utilisez `on_move_type_change` si le changement dépend d'un effet externe. Retournez un `Integer` ou `nil`.
- Utilisez `data_type(:symbol).id` pour convertir un symbole de type en identifiant numérique.
