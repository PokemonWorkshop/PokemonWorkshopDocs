---
title: "Modifier la formule de calcul des dégâts"
slug: modifier-la-formule-de-degats
sidebar_position: 11
description: "Ce guide explique comment remplacer la formule de calcul des dégâts d'une attaque pour des cas spéciaux comme les dégâts fixes."
---

## Principe

La formule de calcul des dégâts est définie dans la méthode `damages`. Par défaut, elle utilise la formule standard de Pokémon (puissance, attaque, défense, STAB, efficacité, etc.).

Certaines attaques nécessitent de remplacer entièrement cette formule. Par exemple, **Draco-Rage** inflige toujours 40 PV de dégâts fixes, indépendamment des stats.

## Remplacer la formule complète

Pour gérer ce comportement, on override la méthode `damages` dans la classe de l'attaque.

### Exemple : Attaques à dégâts fixes

```ruby
# Fixed damage values for specific moves
FIXED_DAMAGE_VALUES = {
  sonic_boom: 20,
  dragon_rage: 40
}.freeze

# Method calculating the damages done by the actual move
# @param user [PFM::PokemonBattler] user of the move
# @param target [PFM::PokemonBattler] target of the move
# @return [Integer]
def damages(user, target)
  @critical = false
  @effectiveness = 1
  damage = FIXED_DAMAGE_VALUES.fetch(db_symbol, 1)
  log_data("Fixed Damage Move: #{damage} HP")

  return damage
end
```

- `@critical = false` désactive le coup critique pour cette attaque.
- `@effectiveness = 1` force l'efficacité à neutre (pas de "super efficace" sur des dégâts fixes).

## Modifier des sous-étapes de la formule

Si vous ne souhaitez pas remplacer la formule complète mais ajuster une étape spécifique, plusieurs méthodes internes à `damages` peuvent être overridées :

- `calc_critical_hit` : calcul du coup critique
- `calc_sp_atk` : stat d'attaque (physique ou spéciale)
- `calc_sp_def` : stat de défense (physique ou spéciale)
- `calc_mod1` : premier modificateur (pré-critique)
- `calc_ch` : multiplicateur de coup critique
- `calc_mod2` : deuxième modificateur (post-critique)
- `calc_stab` : bonus STAB (Same Type Attack Bonus)
- `calc_mod3` : troisième modificateur (post-STAB)

Certaines de ces méthodes appellent à leur tour des hooks accessibles depuis les effets.

## Conclusion

- Utilisez `damages` pour remplacer entièrement la formule de calcul des dégâts.
- Utilisez les sous-méthodes (`calc_critical_hit`, `calc_stab`, etc.) pour modifier une étape spécifique de la formule standard.
- Pour les dégâts fixes, pensez à désactiver le critique (`@critical = false`) et l'efficacité (`@effectiveness = 1`).
