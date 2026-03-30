---
title: "Comment empêcher la sélection d'une attaque dans PSDK ?"
slug: empecher-la-selection-dune-attaque
sidebar_position: 3
description: "Ce guide explique comment rendre une attaque non sélectionnable dans le menu de combat, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

Une attaque peut ne pas être sélectionnable pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque vérifie ses propres conditions et décide qu'elle ne peut pas être choisie.
- **Depuis un effet externe** : un effet actif sur le Pokémon empêche la sélection de l'attaque.

Dans les deux cas, l'empêchement est signalé par le retour d'un `Proc`. Ce retour **doit impérativement être accompagné d'un message** indiquant clairement la raison au joueur.

> **Différence avec l'échec** (guide 001) : l'empêchement de sélection intervient **avant** le tour, dans le menu de combat. L'échec intervient **pendant** le tour, à l'exécution de l'attaque.

## Depuis l'attaque

Certaines attaques peuvent ne pas être sélectionnables selon leurs propres règles. Par exemple, l'attaque **Garde-à-Joues** ne peut pas être sélectionnée si l'utilisateur ne tient pas de Baie.

Pour gérer ce comportement, on override la méthode `disable_reason` dans la classe de l'attaque.

### Exemple : Garde-à-Joues

```ruby
# Get the reason why the move is disabled
# @param user [PFM::PokemonBattler] user of the move
# @return [#call] Block that should be called when the move is disabled
def disable_reason(user)
  reason_message = @scene.display_message_and_wait(parse_text_with_pokemon(60, 508, user))
  return proc { reason_message } unless user.hold_berry?(user.battle_item_db_symbol)

  return super
end
```

- L'appel à `super` est **indispensable** pour conserver les vérifications par défaut.
- Si la condition n'est pas remplie, un `Proc` contenant le message est retourné pour signaler que l'attaque est désactivée.
- Si la condition est remplie (l'utilisateur tient une Baie), `super` prend le relais.

## Depuis un effet

Certaines attaques peuvent ne pas être sélectionnables à cause d'un effet actif sur l'utilisateur. Par exemple, l'effet **Gravité** empêche la sélection des attaques affectées par la gravité.

Pour gérer ce comportement, on utilise la méthode `on_move_disabled_check` dans la classe de l'effet.

### Exemple : Gravité

```ruby
# Function called when we try to check if the user cannot use a move
# @param user [PFM::PokemonBattler]
# @param move [Battle::Move]
# @return [Proc, nil]
def on_move_disabled_check(user, move)
  return unless move.gravity_affected?

  reason_message = move.scene.display_message_and_wait(parse_text_with_pokemon(19, 1092, user, PFM::Text::MOVE[1] => move.name))
  return proc { reason_message }
end
```

- La première ligne vérifie que l'attaque est bien concernée par la gravité.
- Si elle l'est, un `Proc` contenant le message est retourné.
- Si elle ne l'est pas, `nil` est retourné implicitement (pas de blocage).

## Cas particulier : couplage avec la prévention

Lorsqu'on utilise `disable_reason` pour désactiver une attaque, il faut également implémenter `move_usable_by_user` (guide 001). En effet, une attaque désactivée peut quand même être lancée via des effets comme **Métronome** qui contournent la sélection.

De la même manière, pour les effets, `on_move_disabled_check` doit être couplé avec `on_move_prevention_user` pour couvrir le cas où l'attaque est lancée sans passer par le menu.

## Conclusion

- Utilisez `disable_reason` et `move_usable_by_user` si la logique dépend de l'attaque elle-même.
- Utilisez `on_move_disabled_check` et `on_move_prevention_user` si la logique dépend d'un effet externe.
- Retournez un `Proc` pour signaler que l'attaque est non sélectionnable.
- Affichez toujours un message clair au joueur indiquant la raison.
- Pensez toujours à couvrir le cas où l'attaque est lancée sans passer par le menu de sélection.
