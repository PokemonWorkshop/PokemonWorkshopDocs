---
title: "Comment modifier la priorité d'une attaque ?"
slug: modifier-la-priorite-dune-attaque
sidebar_position: 8
description: "Ce guide explique comment changer dynamiquement la priorité d'une attaque au moment de son utilisation, que ce soit depuis la logique propre de l'attaque ou depuis un effet externe."
---

## Principe

La priorité d'une attaque peut être modifiée pour deux raisons distinctes :

- **Depuis l'attaque elle-même** : l'attaque recalcule sa priorité en fonction du contexte de combat.
- **Depuis un effet externe** : un effet actif modifie la priorité de l'attaque avant la détermination de l'ordre du tour.

Dans les deux cas, la valeur retournée est un `Integer` représentant la priorité finale.

## Depuis l'attaque

Certaines attaques peuvent modifier leur priorité selon leurs propres règles. Par exemple, l'attaque **Gliss'Herbe** gagne +1 en priorité si le terrain herbu est actif et que le lanceur est au sol.

Pour gérer ce comportement, on override la méthode `priority` dans la classe de l'attaque.

### Exemple : Gliss'Herbe

```ruby
# Return the priority of the skill
# @param user [PFM::PokemonBattler] user for the priority check
# @return [Integer]
def priority(user = nil)
  base_priority = super
  return base_priority unless @logic.field_terrain_effect.grassy?
  return base_priority unless @logic.current_action.launcher.grounded?

  return base_priority + 1
end
```

- `super` récupère la priorité de base définie dans les données de l'attaque.
- Les conditions sont vérifiées séquentiellement : si l'une échoue, la priorité de base est retournée inchangée.
- La méthode ajoute +1 à la priorité de base au lieu de retourner une valeur fixe, ce qui respecte les modifications antérieures.

## Depuis un effet

Certains effets peuvent modifier la priorité d'une attaque. Par exemple, le talent **Farceur** donne +1 en priorité aux attaques de statut.

Pour gérer ce comportement, on utilise la méthode `on_move_priority_change` dans la classe de l'effet.

### Exemple : Farceur

```ruby
# Function called when we try to check if the effect changes the definitive priority of the move
# @param user [PFM::PokemonBattler]
# @param priority [Integer]
# @param move [Battle::Move]
# @return [Integer, nil]
def on_move_priority_change(user, priority, move)
  return if user != @target
  return unless move&.status?

  return priority + 1
end
```

- La première ligne vérifie que l'utilisateur est bien le porteur du talent.
- La deuxième ligne vérifie que l'attaque est de type statut.
- Le paramètre `priority` contient la priorité actuelle, potentiellement déjà modifiée par d'autres effets.
- Le retour `nil` (implicite) laisse la priorité inchangée.

## Conclusion

- Utilisez `priority` si la modification dépend de la logique propre de l'attaque. Retournez un `Integer`.
- Utilisez `on_move_priority_change` si la modification dépend d'un effet externe. Retournez un `Integer` ou `nil`.
- Modifiez toujours la priorité de manière relative (`base_priority + 1`) plutôt qu'absolue pour respecter les autres modifications.
