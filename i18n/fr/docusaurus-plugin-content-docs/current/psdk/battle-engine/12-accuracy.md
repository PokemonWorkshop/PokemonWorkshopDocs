---
title: "Modifier la précision d'une attaque"
slug: modifier-la-precision-dune-attaque
sidebar_position: 12
description: "Ce guide explique comment modifier dynamiquement la précision d'une attaque, que ce soit en la contournant complètement ou en appliquant un multiplicateur depuis un effet externe."
---

## Principe

La précision d'une attaque est calculée par la méthode `chance_of_hit` selon la formule :

```text
chance_of_hit = factor × accuracy
```

Où `factor` est le produit de trois éléments :

- Les multiplicateurs de tous les effets actifs (`chance_of_hit_multiplier`).
- Le modificateur de précision de l'utilisateur (`accuracy_mod`).
- Le modificateur d'esquive de la cible (`evasion_mod`).

Si `bypass_chance_of_hit?` retourne `true`, le test de précision est ignoré et l'attaque touche automatiquement.

:::note
**Astuce Pokémon Studio** : mettre la précision d'une attaque à `0` dans Pokémon Studio suffit à la rendre infaillible. Le système considère une précision inférieure ou égale à 0 comme un bypass automatique du test de précision.
:::

## Depuis l'attaque

Certaines attaques modifient leur précision selon le contexte. Par exemple, l'attaque **Fatal-Foudre** a une précision de 50 au soleil, touche automatiquement sous la pluie, et conserve sa précision normale sinon.

Pour gérer ce comportement, on override la méthode `accuracy` dans la sous-classe de l'attaque. Si les conditions ne sont pas remplies, on retourne `super` pour conserver la valeur définie dans Pokémon Studio.

### Exemple : Fatal-Foudre

```ruby
# Return the current accuracy of the move
# @return [Integer]
def accuracy
  return 50 if @logic.effective_weather_effect.global_sunny?
  return 0 if @logic.effective_weather_effect.global_rain?

  return super
end
```

- `return 50` réduit la précision à 50% au soleil.
- `return 0` rend l'attaque infaillible sous la pluie (précision de 0 = bypass automatique).
- `return super` conserve la précision définie dans Pokémon Studio pour tous les autres cas.

On peut également override `bypass_chance_of_hit?` pour ignorer complètement le test de précision selon des conditions spécifiques. Par exemple, une attaque qui touche toujours si la cible utilise Lilliput :

```ruby
# Check if the move bypass chance of hit and cannot fail
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def bypass_chance_of_hit?(user, target)
  return true if target.effects.has?(:minimize)

  return super
end
```

- `bypass_chance_of_hit?` est utile quand le bypass dépend d'une condition externe (état de la cible, talent, etc.) plutôt que d'un changement de valeur de précision.

## Depuis un effet

Certains effets peuvent modifier la précision d'une attaque via un multiplicateur. Par exemple, le talent **Oeil Composé** multiplie par 1.3 la précision de toutes les attaques de l'utilisateur.

Pour gérer ce comportement, on utilise la méthode `chance_of_hit_multiplier` dans la classe de l'effet.

### Exemple : Oeil Composé

```ruby
# Return the chance of hit multiplier
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @param move [Battle::Move]
# @return [Float]
def chance_of_hit_multiplier(user, target, move)
  return 1 if user != @target

  return 1.3
end
```

- `super` retourne le multiplicateur par défaut (`1`), à utiliser si les conditions ne sont pas remplies.
- Retourner une valeur supérieure à `1` augmente la précision, inférieure à `1` la réduit.
- Tous les multiplicateurs des effets actifs sont multipliés entre eux avant d'être appliqués à la formule.

### Exemple : Agitation

```ruby
# Return the chance of hit multiplier
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @param move [Battle::Move]
# @return [Float]
def chance_of_hit_multiplier(user, target, move)
  return 1 if user != @target

  return move.physical? ? 0.8 : 1
end
```

- Ici le multiplicateur est conditionnel : `0.8` pour les attaques physiques, `1` pour les autres.
- Le talent Agitation réduit la précision des attaques physiques en échange d'un bonus d'attaque.

## Conclusion

- Surchargez `accuracy` dans la sous-classe de l'attaque pour modifier la précision selon le contexte. Retournez `super` si les conditions ne sont pas remplies.
- Surchargez `bypass_chance_of_hit?` pour ignorer le test de précision selon une condition. Retournez `super` sinon.
- Utilisez `chance_of_hit_multiplier` pour appliquer un multiplicateur sur la précision depuis un effet. Retournez un `Float`.
- La formule finale est : `factor × accuracy`, où `factor` est le produit de tous les multiplicateurs, de la précision de l'utilisateur et de l'esquive de la cible.
