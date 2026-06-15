---
title: "Immuniser une cible contre une attaque"
slug: etre-immunise-a-une-attaque
sidebar_position: 4
description: "Ce guide explique comment rendre un Pokémon immunisé à une attaque, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

Un Pokémon peut être immunisé à une attaque pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque vérifie les conditions de la cible et décide qu'elle n'a aucun effet.
- **Depuis un effet externe** : un effet actif sur la cible empêche l'attaque de l'affecter.

Dans les deux cas, l'immunité est signalée par un retour `true`.

> **Différence avec le blocage** (guide 002) : le blocage empêche l'attaque d'atteindre la cible et affiche un message. L'immunité signifie que l'attaque atteint la cible mais n'a **aucun effet** — le système affiche automatiquement le message "Ça n'affecte pas [Pokémon]...".

## Depuis l'attaque

Certaines attaques peuvent ne pas affecter la cible selon leurs propres règles. Par exemple, l'attaque **Attraction** n'a aucun effet si les deux Pokémon ne sont pas de genres opposés ou si la cible est déjà sous l'effet d'Attraction.

Pour gérer ce comportement, on override la méthode `target_immune?` dans la classe de l'attaque.

### Exemple : Attraction

```ruby
# Test if the target is immune
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @return [Boolean]
def target_immune?(user, target)
  return true if super
  return true unless user.gender * target.gender == 2
  return true if target.effects.has?(:attract)

  return false
end
```

- L'appel à `super` est **indispensable** pour conserver les vérifications par défaut.
- `user.gender * target.gender == 2` vérifie que les deux Pokémon sont de genres opposés (mâle=1, femelle=2, donc 1\*2=2).
- La méthode retourne `false` par défaut si aucune condition d'immunité n'est remplie.

## Depuis un effet

Certains effets peuvent immuniser un Pokémon contre certaines attaques. Par exemple, le talent **Pare-Balles** immunise contre les attaques balistiques.

Pour gérer ce comportement, on utilise la méthode `on_move_ability_immunity` dans la classe de l'effet. Malgré le nom de la méthode qui contient `ability`, elle concerne bien **tous les types d'effets**.

### Exemple : Pare-Balles

```ruby
# Function called when we try to check if the Pokemon is immune to a move due to its effect
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Boolean] if the target is immune to the move
def on_move_ability_immunity(user, target, move)
  return false if target != @target
  return false unless move.ballistics?
  return false unless user.can_be_lowered_or_canceled?

  move.scene.visual.show_ability(target)

  return true
end
```

- Les premières lignes vérifient que la cible est bien le porteur du talent et que l'attaque est balistique.
- `can_be_lowered_or_canceled?` vérifie que le talent de l'utilisateur peut être neutralisé (certains talents ignorent les immunités).
- L'animation du talent est affichée avec `show_ability` pour indiquer visuellement l'immunité.

## Conclusion

- Utilisez `target_immune?` si l'immunité dépend de la logique propre de l'attaque.
- Utilisez `on_move_ability_immunity` si l'immunité dépend d'un effet externe actif sur la cible.
- Retournez `true` pour signaler l'immunité — le message est affiché automatiquement par le système.
- Pour les effets de type talent, pensez à afficher l'animation du talent avec `show_ability`.
