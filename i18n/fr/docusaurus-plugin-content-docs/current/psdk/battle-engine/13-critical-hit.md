---
title: "Comment modifier le taux de critique dans PSDK ?"
slug: modifier-le-taux-de-critique
sidebar_position: 13
description: "Ce guide explique comment modifier le taux de coup critique d'une attaque et le multiplicateur de dégâts critique."
---

## Principe

Le système de coup critique fonctionne en deux étapes :

- **Calcul du count** : un compteur est incrémenté selon le taux de base de l'attaque, les effets actifs, les talents et les objets. Ce compteur est converti en probabilité via la table `CRITICAL_RATES`.
- **Multiplicateur de dégâts** : si le coup est critique, la méthode `calc_ch` applique un multiplicateur de x1.5 sur les dégâts.

La table de probabilité est la suivante :

| Count | Probabilité |
| ----- | ----------- |
| 0     | 0%          |
| 1     | 6.25%       |
| 2     | 12.5%       |
| 3     | 50%         |
| 4+    | 100%        |

## Depuis Pokémon Studio

Le taux de critique de base d'une attaque se configure directement dans Pokémon Studio via le champ `critical_rate`. Cette valeur représente le count initial du compteur critique :

- Un `critical_rate` de 0 donne un count de base de 0 (pas de bonus).
- Un `critical_rate` de 1 donne un count de base de 1 (6.25% de base, cumulable avec d'autres bonus).

Par exemple, les attaques **Tranche** et **Lame de Roc** ont un `critical_rate` de 1 dans Pokémon Studio.

## Depuis l'attaque

Pour une logique de critique plus avancée, on override la méthode `calc_critical_hit` dans la sous-classe de l'attaque. Si les conditions ne sont pas remplies, on retourne `super` pour conserver le comportement par défaut.

### Exemple : critique garanti sous condition

Une attaque qui critique automatiquement si la cible est empoisonnée :

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return true if target.poisoned? || target.toxic?

  return super
end
```

- `return true` garantit le coup critique quand la condition est remplie.
- `return super` délègue au calcul standard (count + table de probabilité) sinon.

### Exemple : chances augmentées sous condition

Une attaque qui a 50% de chances de critique sous la pluie :

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return bchance?(0.5) if @logic.effective_weather_effect.global_rain?

  return super
end
```

- `bchance?(0.5)` effectue un tirage aléatoire avec 50% de chances de succès, en utilisant le RNG du combat.
- Si la condition météo n'est pas remplie, `return super` conserve le calcul normal.

## Depuis le système

Le calcul du count critique est géré par `calc_critical_count` dans la logique de combat. Ce compteur additionne :

- Le `critical_rate` de l'attaque (valeur de base).
- Les bonus des effets actifs (Poing Chanceux, Accro Dragon, Triple Flèches).
- Le bonus du talent Super Chance (+1).
- Le bonus des objets (Griffe Rasoir, Lentilscope, Poireau pour Canarticho).
- Le bonus de la Baie Lansat.

La prévention des coups critiques se fait via :

- Les talents **Armurbaston** et **Coque Armure** qui bloquent les critiques sur la cible.
- L'effet **Voeu Soin** (Lucky Chant) qui empêche les critiques sur toute l'équipe.
- Certains talents comme **Cruauté** garantissent un critique si la cible est empoisonnée.

## Conclusion

- Configurez le `critical_rate` dans Pokémon Studio pour le taux de base (0 = normal, 1 = taux élevé).
- Surchargez `calc_critical_hit` dans la sous-classe de l'attaque pour une logique personnalisée. Utilisez `return true` pour un critique garanti, `bchance?` pour des chances augmentées, et `return super` sinon.
- Le compteur est incrémenté par les talents, objets et effets avant d'être converti en probabilité.
- La prévention se fait via les talents Armurbaston/Coque Armure ou l'effet Voeu Soin.
