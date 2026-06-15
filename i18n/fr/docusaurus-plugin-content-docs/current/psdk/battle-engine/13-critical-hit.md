---
title: "Modifier le taux de critique"
slug: modifier-le-taux-de-critique
sidebar_position: 13
description: "Ce guide explique comment modifier le taux de coup critique d'une attaque et le multiplicateur de dégâts critique."
---

## Principe

Le système de coup critique fonctionne en deux étapes :

- **Calcul du count** : un compteur part du taux de base de l'attaque (`critical_rate`) puis est ajusté par les effets actifs (talents, objets, statuts...). Ce compteur est converti en probabilité via la table `CRITICAL_RATES`.
- **Multiplicateur de dégâts** : si le coup est critique, la méthode `calc_ch` applique un multiplicateur de x1.5 sur les dégâts.

Une attaque peut aussi décider elle-même de son résultat critique, et les effets peuvent augmenter ou diminuer le count, forcer un critique garanti, ou empêcher tout critique.

La table de probabilité est la suivante :

| Count | Probabilité |
| ----- | ----------- |
| 0     | 0%          |
| 1     | 6.25%       |
| 2     | 12.5%       |
| 3     | 50%         |
| 4+    | 100%        |

## Depuis Pokémon Studio

Le taux de critique de base d'une attaque se configure directement dans Pokémon Studio via le champ `critical_rate`. Cette valeur sert de **count initial** du compteur critique :

- Un `critical_rate` de 1 est la valeur par défaut de toutes les attaques : un count de base de 1 (6.25%).
- Un `critical_rate` de 2 donne un count de base de 2 (12.5%) -- les attaques à fort taux de critique.
- Un `critical_rate` de 0 signifie que l'attaque ne peut jamais infliger de critique par elle-même (count 0 = 0%).

Par exemple, les attaques **Tranche** et **Lame de Roc** ont un `critical_rate` de 2 dans Pokémon Studio, contre 1 par défaut.

## Depuis l'attaque

Pour donner à une attaque sa propre règle de critique, on surcharge `calc_critical_hit` dans la sous-classe de l'attaque. La méthode retourne un `Boolean` : on retourne son propre résultat quand les conditions sont remplies, et `return super` sinon pour conserver le calcul standard (effets, count et table de probabilité).

Aucune attaque de base ne possède une telle surcharge -- les exemples suivants illustrent ce qu'on peut implémenter.

L'ordre compte : `calc_critical_hit` est l'endroit où le calcul standard résout **d'abord la prévention**, puis le forçage, puis le count. Si on retourne `true` (ou une probabilité) trop tôt, on saute cette étape de prévention et un effet comme Air Veinard ou Coque Armure ne peut plus bloquer le critique. On appelle donc `super` pour le cas normal, et on revérifie la prévention avant de forcer son propre critique.

### Exemple : critique garanti sous condition

Une attaque qui critique automatiquement si la cible est empoisonnée, tout en laissant les effets de prévention la bloquer :

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return super unless target.poisoned? || target.toxic?

  # A prevention effect (Lucky Chant, Shell Armor...) must still win
  return false if @logic.each_effects(user, target).any? { |effect| effect.prevent_critical_hit?(user, target) }

  return true
end
```

- `return super unless ...` délègue au calcul standard quand la condition n'est pas remplie -- la prévention, le forçage et le count y sont résolus.
- Le garde revérifie `prevent_critical_hit?` pour que des talents comme Coque Armure ou l'effet Air Veinard puissent quand même annuler le critique.
- `return true` ne force le critique qu'une fois la prévention écartée.

### Exemple : chances augmentées sous condition

Une attaque qui a 50% de chances de critique sous la pluie, la prévention s'appliquant toujours :

```ruby
# Calculate if the move does a critical hit
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Boolean]
def calc_critical_hit(user, target)
  return super unless @logic.weather_effect.global_rain?

  return false if @logic.each_effects(user, target).any? { |effect| effect.prevent_critical_hit?(user, target) }

  return bchance?(0.5)
end
```

- `@logic.weather_effect.global_rain?` vérifie la météo active.
- Le même garde de prévention garantit qu'un critique bloqué le reste.
- `bchance?(0.5)` effectue un tirage aléatoire à 50% via le RNG du combat lorsque le critique est autorisé.

Pour un simple critique garanti, le hook d'effet `force_critical_hit?` (section suivante) est plus simple : le système le vérifie **après** la prévention, donc les bloqueurs l'emportent sans garde manuel.

## Depuis un effet

Au-delà d'une attaque isolée, les critiques sont pilotés par les **effets** : talents, objets tenus, statuts, effets de terrain, et les effets persistants qu'une attaque peut appliquer à un Pokémon. **Puissance** (Focus Energy), par exemple, ne surcharge pas `calc_critical_hit` -- elle applique un effet durable sur le Pokémon qui augmente le count. C'est différent de la logique propre à l'attaque ci-dessus.

Chaque effet peut implémenter jusqu'à trois hooks, tous définis sur la classe de base des effets, avec un retour neutre par défaut :

- `critical_count_modifier(user, target)` -- retourne un `Integer` ajouté au count (Puissance +2, Chanceux +1, Griffe Rasoir / Lentilscope +1, Baie Lansat +2).
- `force_critical_hit?(user, target)` -- retourne `true` pour garantir un critique, en contournant le count (**Cruauté** sur une cible empoisonnée).
- `prevent_critical_hit?(user, target)` -- retourne `true` pour bloquer tout critique (**Air Veinard** sur un camp, **Armurbaston** / **Coque Armure** sur un Pokémon).

Par exemple, l'effet de Puissance n'implémente que le hook de count :

```ruby
# Return the critical count modifier (added to the critical count)
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Integer]
def critical_count_modifier(user, target)
  return 0 unless user == @pokemon

  return 2
end
```

Le count correspond à des paliers discrets (0, 6.25%, 12.5%, 50%, 100%) : pour un critique garanti, on préfère `force_critical_hit?` plutôt qu'un gros modificateur. La création et l'enregistrement d'un effet de combat sont un sujet à part entière -- un guide dédié à la création d'un effet de combat le couvrira.

## Depuis le système

Le calcul au niveau du système est géré par `calc_critical_hit(user, target, initial_critical_count)` dans la logique de combat. L'étape de dégâts de l'attaque l'appelle avec son `critical_rate` comme count initial :

```ruby
@critical = logic.calc_critical_hit(user, target, critical_rate)
```

Il se résout dans cet ordre :

1. **Prévention** : si un effet retourne `true` depuis `prevent_critical_hit?`, le coup n'est pas critique.
2. **Forçage** : sinon, si un effet retourne `true` depuis `force_critical_hit?`, le coup est critique.
3. **Count** : sinon, `calc_critical_count` itère sur chaque effet via `each_effects`, additionne chaque `critical_count_modifier`, et le total est converti en probabilité via `CRITICAL_RATES`.

Le multiplicateur de dégâts est appliqué par `calc_ch` : x1.5 sur un coup critique, avec un x1.5 supplémentaire (x2.25 au total) lorsque le lanceur possède le talent **Sniper**.

## Conclusion

- Configurez le `critical_rate` dans Pokémon Studio pour le taux de base -- il devient le count initial (1 = défaut, 2 = taux élevé, 0 = ne critique jamais par lui-même).
- Surchargez `calc_critical_hit` dans la sous-classe de l'attaque pour sa règle propre : retournez un `Boolean`, `return super` pour conserver le comportement par défaut, et revérifiez `prevent_critical_hit?` avant de forcer pour que les bloqueurs l'emportent.
- Implémentez un hook d'effet (`critical_count_modifier`, `force_critical_hit?`, `prevent_critical_hit?`) pour les talents, objets, statuts, ou les effets persistants qu'une attaque applique.
- Au niveau du système, la logique résout la prévention, puis le forçage, puis la probabilité basée sur le count via `CRITICAL_RATES` ; le multiplicateur de dégâts est x1.5 (x2.25 avec le talent Sniper).
