---
title: "Démarrer un combat sauvage"
slug: demarrer-un-combat-sauvage
sidebar_position: 8
description: "PSDK peut lancer le joueur dans un combat sauvage directement depuis un event : une rencontre simple, un combat double, ou un Pokémon entièrement configuré dont on règle à l'avance le chromatisme, la forme et l'objet tenu. Ce guide couvre la commande qui démarre le combat, les formes qu'elle accepte, et les switches qu'on lit ensuite pour réagir au résultat."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut lancer le joueur dans un combat sauvage directement depuis un event : une rencontre simple, un combat double, ou un Pokémon entièrement configuré dont on règle à l'avance le chromatisme, la forme et l'objet tenu. Ce guide couvre la commande qui démarre le combat, les formes qu'elle accepte, et les switches qu'on lit ensuite pour réagir au résultat.

`call_battle_wild` est une [méthode de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on l'appelle depuis la commande **Script** d'un event, sans aucun préfixe. Le Pokémon est désigné par son db_symbol (`:pikachu`, `:gyarados`) ou son ID numérique, exactement tel qu'il apparaît dans la base de données des Pokémon.

## Un combat sauvage simple

La forme de base prend le Pokémon et son niveau :

```ruby
call_battle_wild(id, level)
```

- `id` — le Pokémon sauvage, sous forme de db_symbol (`:pikachu`) ou d'ID numérique.
- `level` — le niveau auquel il apparaît.

Ainsi, un Pikachu de niveau 15 s'écrit :

```ruby
call_battle_wild(:pikachu, 15)
```

Le combat démarre immédiatement. Par défaut, le joueur ne peut pas perdre un combat sauvage sans conséquence : une défaite déclenche le black-out habituel et le ramène à la maison ou au dernier Centre Pokémon.

## Un combat sauvage double ou triple

Pour lancer un combat 2 contre 2, on passe un second Pokémon sous la forme d'une autre paire `id`, `level` :

```ruby
call_battle_wild(id1, level1, id2, level2)
```

Par exemple, un Zigzaton et un Chenipotte ensemble :

```ruby
call_battle_wild(:zigzagoon, 7, :wurmple, 6)
```

Le nombre de Pokémon passés détermine à lui seul le format du combat : deux ennemis font un combat double, trois font un combat triple (3 contre 3). Il suffit d'ajouter une autre paire `id`, `level` :

```ruby
call_battle_wild(:zubat, 12, :zubat, 11, :golbat, 14)
```

Un combat triple exige que le joueur ait trois Pokémon valides pour remplir son propre camp. Au-delà de trois, le format reste plafonné au triple ; une horde complète de cinq Pokémon est une propriété d'un groupe sauvage configuré dans Studio, pas quelque chose que cette commande produit.

Le camp du joueur peut aussi être rempli par un dresseur allié plutôt que par ses propres Pokémon, voir [Combattre avec un allié](/rpg-maker-xp/combattre-avec-un-allie).

## Configurer le Pokémon sauvage

Les deux formes ci-dessus génèrent toujours un Pokémon ordinaire. Lorsqu'on a besoin de contrôler sa forme, son genre, son objet tenu ou d'autres attributs, on construit d'abord le Pokémon avec `PFM::Pokemon.generate_from_hash`, puis on le passe à `call_battle_wild` :

```ruby
pokemon = PFM::Pokemon.generate_from_hash(id: :pikachu, level: 15, form: 1, gender: 2)
call_battle_wild(pokemon, nil)
```

Le niveau est lu dans le hash, le second argument de `call_battle_wild` est donc ignoré ici : on passe `nil`.

`generate_from_hash` accepte un hash dont les clés correspondent aux attributs du Pokémon :

- `id` — db_symbol ou ID numérique du Pokémon.
- `level` — son niveau.
- `shiny` / `no_shiny` — forcer ou interdire l'apparence chromatique.
- `form` — l'indice de forme (`-1` laisse PSDK choisir automatiquement).
- `gender` — `0` asexué, `1` mâle, `2` femelle.
- `item` — le db_symbol d'un objet tenu (`:leftovers`).
- `nature`, `stats` (IV), `bonus` (EV), `moves`, `ball` — et les autres attributs qu'un Pokémon peut porter.

:::note

La façon dont `call_battle_wild` distingue ses formes repose sur le type du troisième argument, et le moteur lui-même signale ce mécanisme comme fragile. Pour tout cas dépassant une rencontre simple ou double ordinaire, on préfère construire des objets `PFM::Pokemon` avec `generate_from_hash` : c'est sans ambiguïté et bien plus lisible.

:::

On peut aussi régler le décor du combat juste avant l'appel : affecter `$game_temp.battleback_name` pour forcer un arrière-plan, et `$game_system.battle_bgm = RPG::AudioFile.new('nom', 100, 100)` pour forcer la musique. On pose l'arrière-plan sur la ligne juste avant `call_battle_wild`, car PSDK le réinitialise à chaque frame.

### Une rencontre chromatique

Pour un Pokémon seul, la forme simple prend deux booléens supplémentaires, forcer-shiny puis interdire-shiny :

```ruby
call_battle_wild(:gyarados, 30, true, false)
```

Cela garantit un Léviator chromatique. Le même résultat via un Pokémon configuré, qui est la seule façon de forcer un chromatique dans un combat à plusieurs Pokémon :

```ruby
pokemon = PFM::Pokemon.generate_from_hash(id: :gyarados, level: 30, shiny: true)
call_battle_wild(pokemon, nil)
```

### Un combat double configuré

Pour mener un combat double où chaque Pokémon est configuré, on génère les deux et on passe le second après le `nil` ignoré :

```ruby
first = PFM::Pokemon.generate_from_hash(id: :zigzagoon, level: 7, shiny: true)
second = PFM::Pokemon.generate_from_hash(id: :wurmple, level: 6, form: 1)
call_battle_wild(first, nil, second)
```

Le premier argument est le Pokémon de tête, le `nil` tient lieu de niveau ignoré, et chaque argument suivant est un autre Pokémon du côté sauvage.

## Réagir au résultat du combat

À la fin du combat, PSDK écrit le résultat dans des switches du jeu. On les lit dans une **Condition** (Conditional Branch) juste après la commande `call_battle_wild` pour aiguiller le déroulement selon ce qui s'est passé :

| Switch           | ID  | Signification                  |
| ---------------- | --- | ------------------------------ |
| `BT_Victory`     | 37  | le joueur a gagné              |
| `BT_Defeat`      | 36  | le joueur a été vaincu         |
| `BT_Player_Flee` | 35  | le joueur a fui                |
| `BT_Wild_Flee`   | 34  | le Pokémon sauvage a fui       |
| `BT_Catch`       | 38  | le joueur a capturé le Pokémon |

Par exemple, on ne donne une récompense que si le joueur a réellement gagné, en testant le switch `37` dans une Condition après le combat. En cas de défaite réelle (switch `36`), le joueur a déjà été ramené en arrière, et l'event reprend à partir de là.

## Conclusion

- `call_battle_wild(id, level)` démarre un combat sauvage simple ; le Pokémon est désigné par db_symbol ou ID numérique.
- On ajoute d'autres paires `id`, `level` pour un combat double ou triple ; le nombre d'ennemis fixe le format (plafonné au triple).
- Pour un contrôle complet (chromatique, forme, genre, objet tenu), on construit le Pokémon avec `PFM::Pokemon.generate_from_hash` et on le passe à la place d'un ID.
- Après le combat, les switches `34` à `38` indiquent si le joueur a gagné, perdu, fui, vu le Pokémon fuir, ou capturé le Pokémon.
