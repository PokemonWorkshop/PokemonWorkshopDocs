---
title: "Bloquer une attaque"
slug: bloquer-une-attaque
sidebar_position: 2
description: "Ce guide explique comment empêcher une attaque d'atteindre sa cible, que ce soit depuis la logique propre de l'attaque ou depuis un effet actif sur la cible."
---

## Principe

Une attaque peut être bloquée pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque vérifie les conditions de la cible et décide qu'elle ne peut pas l'atteindre.
- **Depuis un effet externe** : un effet actif sur la cible empêche l'attaque de l'atteindre.

Dans les deux cas, le blocage **doit impérativement être accompagné d'un message** indiquant clairement la raison au joueur.

> **Différence avec l'échec** (guide 001) : l'échec empêche l'**utilisateur** de lancer l'attaque (`move_usable_by_user`), tandis que le blocage empêche l'attaque d'atteindre la **cible** (`move_blocked_by_target?`).

## Depuis l'attaque

Certaines attaques peuvent être bloquées selon leurs propres règles. Par exemple, l'attaque **Entrave** est bloquée si la cible est déjà sous l'effet d'Entrave ou si elle n'a pas encore utilisé d'attaque.

Pour gérer ce comportement, on override la méthode `move_blocked_by_target?` dans la classe de l'attaque.

### Exemple : Entrave

```ruby
# Function that tests if the target blocks the move
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] expected target
# @note Thing that prevents the move from being used should be defined by :move_prevention_target Hook.
# @return [Boolean] if the target evades the move (and is not selected)
def move_blocked_by_target?(user, target)
  return true if super
  return @scene.display_message_and_wait(parse_text(18, 74)) && true if target.effects.has?(:disable)
  return @scene.display_message_and_wait(parse_text(18, 74)) && true if target.move_history.empty?

  return false
end
```

- L'appel à `super` est **indispensable** pour conserver les vérifications par défaut.
- Chaque condition affiche un message puis retourne `true` via l'expression `&& true`.
- La méthode retourne `false` par défaut si aucune condition de blocage n'est remplie.

## Depuis un effet

Certaines attaques peuvent être bloquées par un effet actif sur la cible. Par exemple, le talent **Corps en Or** bloque toutes les attaques de statut mono-cible.

Pour gérer ce comportement, on utilise la méthode `on_move_prevention_target` dans la classe de l'effet.

### Exemple : Corps en Or

```ruby
# Function called when we try to check if the target evades the move
# @param user [PFM::PokemonBattler]
# @param target [PFM::PokemonBattler] expected target
# @param move [Battle::Move]
# @return [Boolean] if the target is evading the move
def on_move_prevention_target(user, target, move)
  return false if user == @target || target != @target
  return false unless move&.status?
  return false unless move&.one_target?

  @logic.scene.visual.show_ability(target)
  @logic.scene.visual.wait_for_animation
  @logic.scene.display_message_and_wait(parse_text_with_pokemon(19, 210, target))

  return true
end
```

- Les premières lignes vérifient que la cible est bien le porteur de l'effet et que l'attaque est de type statut mono-cible.
- L'animation du talent est affichée avec `show_ability` avant le message (pattern standard pour les talents).
- Le retour `true` signale au système que l'attaque est bloquée par la cible.

## Conclusion

- Utilisez `move_blocked_by_target?` si le blocage dépend de la logique propre de l'attaque.
- Utilisez `on_move_prevention_target` si le blocage dépend d'un effet externe actif sur la cible.
- Retournez `true` pour signaler que l'attaque est bloquée.
- Affichez toujours un message clair au joueur avant de retourner le blocage.
