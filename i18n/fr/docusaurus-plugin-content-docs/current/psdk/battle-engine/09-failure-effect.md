---
title: "Créer un effet à l'échec d'une attaque"
slug: creer-un-effet-a-lechec-dune-attaque
sidebar_position: 9
description: "Ce guide explique comment exécuter un effet spécifique lorsqu'une attaque échoue (manque sa cible, est immunisée, etc.), que ce soit depuis l'attaque elle-même ou depuis un effet externe."
---

## Principe

Certaines attaques ou certains effets déclenchent un comportement lorsqu'une attaque échoue. Par exemple, **Pied Sauté** inflige des dégâts de recul à l'utilisateur si l'attaque rate.

Ce comportement peut être géré de deux façons :

- **Depuis l'attaque elle-même** : l'attaque définit sa propre réaction à l'échec.
- **Depuis un effet externe** : un talent, un objet ou un autre effet réagit à l'échec d'une attaque.

## Raisons d'échec

La méthode `on_move_failure` reçoit un paramètre `reason` qui indique pourquoi l'attaque a échoué :

- `:usable_by_user` : l'attaque a échoué dans `move_usable_by_user` (guide 001)
- `:no_target` : toutes les cibles sont KO (aucune cible valide)
- `:accuracy` : l'attaque a raté sa cible (jet de précision)
- `:immunity` : la cible est immunisée à l'attaque (guide 004) ou bien a bloqué l'attaque (guide 002)

## Depuis l'attaque

Pour définir un comportement à l'échec depuis l'attaque, on override la méthode `on_move_failure` dans la classe de l'attaque.

### Exemple : Pied Sauté

```ruby
# Event called if the move failed
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @param reason [Symbol] why the move failed: :usable_by_user, :no_target, :accuracy, :immunity
def on_move_failure(user, targets, reason)
  return if reason == :usable_by_user

  hp = (user.max_hp / 2).clamp(1, Float::INFINITY)
  @logic.damage_handler.damage_change(hp, user)
  @scene.display_message_and_wait(parse_text_with_pokemon(19, 908, user))
end
```

- La raison `:usable_by_user` est exclue car le recul ne s'applique que si l'attaque a été réellement tentée.
- `damage_handler.damage_change` est utilisé pour infliger les dégâts de recul via le handler standard.
- Le message de recul est affiché après l'application des dégâts.

## Depuis un effet

Certains effets peuvent réagir à l'échec d'une attaque. Par exemple, un talent ou un objet pourrait déclencher un comportement quand l'attaque de son porteur échoue.

Pour gérer ce comportement, on utilise la méthode `on_move_failure` dans la classe de l'effet.

### Exemple : Boost de précision quand l'attaque rate

Cet effet augmente la précision de l'utilisateur d'un cran chaque fois qu'une de ses attaques rate sa cible.

```ruby
# Function called when a move fails during its execution
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @param move [Battle::Move] the move that failed
# @param reason [Symbol] why the move failed: :usable_by_user, :no_target, :accuracy, :immunity
def on_move_failure(user, targets, move, reason)
  return if user != @pokemon || reason != :accuracy
  return if @logic.stat_change_handler.stat_increasable?(:acc, 1, user, user)


  @logic.stat_change_handler.stat_change(:acc, 1, user, user)
end
```

- On vérifie que l'utilisateur est bien le porteur de l'effet (`@pokemon`).
- On filtre sur `:accuracy` pour ne réagir qu'aux attaques qui ont raté leur cible (pas les immunités ou l'absence de cible).

:::note
**Différence avec la version attaque** : la signature de l'effet reçoit un paramètre `move` supplémentaire car l'effet ne connaît pas automatiquement quelle attaque a échoué.
:::

## Conclusion

- Utilisez `on_move_failure` dans l'attaque pour définir un effet propre à cette attaque quand elle échoue.
- Utilisez `on_move_failure` dans un effet pour réagir à l'échec de n'importe quelle attaque.
- Filtrez les raisons d'échec avec le paramètre `reason` pour ne réagir qu'aux cas pertinents.
