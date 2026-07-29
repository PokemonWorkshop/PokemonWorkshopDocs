---
title: "Créer l'effet secondaire d'une attaque"
slug: creer-leffet-secondaire-dune-attaque
sidebar_position: 7
description: "Ce guide explique comment implémenter l'effet personnalisé d'une attaque et comment valider les conditions d'application de cet effet."
---

## Principe

L'implémentation de l'effet d'une attaque se fait en deux étapes :

- **Appliquer l'effet** : la méthode `deal_effect` exécute l'effet sur les cibles valides.
- **Valider les conditions** : une méthode de vérification détermine si l'effet peut s'appliquer. Cette méthode dépend du type d'attaque (offensive ou statut).

## Appliquer l'effet

Pour définir ce que fait l'attaque, on override la méthode `deal_effect` dans la classe de l'attaque. Cette méthode reçoit les cibles qui seront effectivement affectées.

### Exemple : Sanction Suprême

```ruby
# Function that deals the effect to the pokemon
# @param user [PFM::PokemonBattler] user of the move
# @param actual_targets [Array<PFM::PokemonBattler>] targets that will be affected by the move
def deal_effect(user, actual_targets)
  actual_targets.each do |target|
    next if target.effects.has?(:ability_suppressed)
    next unless action_played_this_turn?(target)
    next if target.dead?

    @logic.ability_change_handler.disable_ability(target, db_symbol, user, self)
    @scene.display_message_and_wait(parse_text_with_pokemon(19, 565, target))
  end
end
```

- La boucle `each` sur `actual_targets` est **indispensable** pour appliquer l'effet à chaque cible individuellement.
- `next` permet de passer à la cible suivante si les conditions ne sont pas remplies pour une cible donnée.

## Valider les conditions

Les conditions d'application de l'effet sont vérifiées **avant** son exécution. Si les conditions ne sont pas remplies, l'effet est ignoré. La méthode à utiliser dépend du type de l'attaque.

### Pour les attaques offensives

On override la méthode `effect_working?` qui détermine si l'effet secondaire de l'attaque peut s'appliquer. Sanction Suprême l'illustre :

```ruby
# Test if the effect is working
# @param user [PFM::PokemonBattler] user of the move
# @param actual_targets [Array<PFM::PokemonBattler>] targets that will be affected by the move
# @return [Boolean]
def effect_working?(user, actual_targets)
  return false if actual_targets.all? { |target| target.effects.has?(:ability_suppressed) }
  return false if actual_targets.none? { |target| action_played_this_turn?(target) }
  return false if actual_targets.all?(&:dead?)

  return true
end
```

- Si la méthode retourne `false`, `deal_effect` n'est pas appelée.
- La vérification porte sur `actual_targets` (les cibles qui ont effectivement été touchées par l'attaque).

### Pour les attaques de statut

On override la méthode `move_usable_by_user` qui détermine si l'attaque peut être lancée (voir guide 001 pour le détail complet). Gravité l'illustre :

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

- Si la méthode retourne `false`, l'attaque échoue entièrement (pas seulement l'effet).
- L'appel à `super` est **indispensable** pour conserver les vérifications par défaut.

## Conclusion

- Utilisez `deal_effect` pour implémenter l'effet de l'attaque, en itérant sur `actual_targets`.
- Utilisez `effect_working?` pour valider les conditions d'un effet secondaire sur une attaque offensive.
- Utilisez `move_usable_by_user` pour valider les conditions d'une attaque de statut (guide 001).
