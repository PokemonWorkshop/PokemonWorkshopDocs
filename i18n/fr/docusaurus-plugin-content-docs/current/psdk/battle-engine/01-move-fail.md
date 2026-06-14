---
title: "Comment échouer une attaque ?"
slug: echouer-une-attaque
sidebar_position: 1
description: "Ce guide explique comment faire échouer une attaque avant qu'elle ne soit exécutée, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

Une attaque peut échouer pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque vérifie ses propres conditions et décide qu'elle ne peut pas être utilisée.
- **Depuis un effet externe** : un effet actif sur le Pokémon empêche l'utilisation de l'attaque.

Dans les deux cas, l'échec **doit impérativement être accompagné d'un message** indiquant clairement la raison au joueur.

## Depuis l'attaque

Certaines attaques peuvent échouer selon leurs propres règles. Par exemple, l'attaque **Gravité** échoue si la gravité est déjà active sur le terrain.

Pour gérer ce comportement, on override la méthode `move_usable_by_user` dans la classe de l'attaque.

### Exemple : Gravité

```ruby
# Function that tests if the user is able to use the move
# @param user [PFM::PokemonBattler] user of the move
# @param targets [Array<PFM::PokemonBattler>] expected targets
# @note Thing that prevents the move from being used should be defined by :move_prevention_user Hook
# @return [Boolean] if the procedure can continue
def move_usable_by_user(user, targets)
  return false unless super
  return show_usage_failure(user) && false if @logic.terrain_effects.has?(:gravity)

  return true
end
```

- L'appel à `super` est **indispensable** pour conserver les vérifications par défaut.
- `show_usage_failure(user)` affiche le message d'échec au joueur.
- L'expression `&& false` garantit que la méthode retourne bien `false` après l'affichage du message.

## Depuis un effet

Certaines attaques peuvent échouer à cause d'un effet actif sur l'utilisateur. Par exemple, l'effet **Execu-Son** empêche l'utilisation des attaques sonores.

Pour gérer ce comportement, on utilise la méthode `on_move_prevention_user` dans la classe de l'effet.

### Exemple : Execu-Son

```ruby
# Function called when we try to use a move as the user (returns :prevent if user fails)
# @param user [PFM::PokemonBattler]
# @param targets [Array<PFM::PokemonBattler>]
# @param move [Battle::Move]
# @return [:prevent, nil] :prevent if the move cannot continue
def on_move_prevention_user(user, targets, move)
  return if user != @pokemon
  return unless move.sound_attack?

  move.scene.display_message_and_wait(parse_text_with_pokemon(59, 1860, user))
  return :prevent
end
```

- Les premières lignes vérifient que l'effet concerne bien cet utilisateur et ce type d'attaque.
- Le message d'échec est affiché **avant** le retour `:prevent`.
- Le retour `:prevent` signale au système que l'attaque ne peut pas continuer.

## Conclusion

- Utilisez `move_usable_by_user` si l'échec dépend de la logique propre de l'attaque.
- Utilisez `on_move_prevention_user` si l'échec dépend d'un effet externe actif sur le Pokémon.
- Retournez `false` (depuis l'attaque) ou `:prevent` (depuis un effet) selon le contexte.
- Affichez toujours un message clair au joueur avant de retourner l'échec.
