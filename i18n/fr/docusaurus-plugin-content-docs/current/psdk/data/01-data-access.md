---
title: "Accéder aux données du jeu"
slug: acceder-aux-donnees-du-jeu
sidebar_position: 1
description: "Ce guide explique comment lire les données du jeu (objets, créatures, capacités, types et plus) depuis vos scripts PSDK : les accesseurs de données, les itérateurs, et les pièges à connaître sur les entrées inconnues et les formes de créatures."
---

Ce guide explique comment lire les données du jeu (objets, créatures, capacités, types et plus) depuis vos scripts PSDK : les **accesseurs de données**, les **itérateurs**, et les pièges à connaître sur les entrées inconnues et les formes de créatures.

## Où vivent les données du jeu

Tout ce qu'on édite dans **Pokémon Studio** (objets, créatures, capacités, zones...) est enregistré sous forme de fichiers de données dans `Data/Studio/` du projet. Quand le jeu démarre en mode debug et que le fichier compilé `Data/Studio/psdk.dat` est absent, PSDK le régénère automatiquement à partir de ces fichiers. Vos scripts ne lisent jamais les fichiers eux-mêmes : PSDK charge tout en mémoire et vous fournit des fonctions d'accès.

Les accesseurs sont définis dans `scripts/3 Studio/001 Accessors.rb` (dans les sources de PSDK) comme méthodes privées d'`Object`. En pratique, cela veut dire que vous pouvez les appeler depuis n'importe où dans vos scripts, sans récepteur ni préfixe de module.

## Comment lire une entité

Chaque type d'entité a une fonction `data_<type>` qui prend le **db_symbol** de l'entrée et renvoie un objet de données `Studio` :

| Fonction                               | Renvoie                |
| -------------------------------------- | ---------------------- |
| `data_ability(db_symbol)`              | `Studio::Ability`      |
| `data_creature(db_symbol)`             | `Studio::Creature`     |
| `data_creature_form(db_symbol, form)`  | `Studio::CreatureForm` |
| `data_dex(db_symbol)`                  | `Studio::Dex`          |
| `data_group(db_symbol)`                | `Studio::Group`        |
| `data_item(db_symbol)`                 | `Studio::Item`         |
| `data_map_link(db_symbol)`             | `Studio::MapLink`      |
| `data_move(db_symbol)`                 | `Studio::Move`         |
| `data_nature(db_symbol)`               | `Studio::Nature`       |
| `data_quest(db_symbol)`                | `Studio::Quest`        |
| `data_trainer(db_symbol)`              | `Studio::Trainer`      |
| `data_type(db_symbol)`                 | `Studio::Type`         |
| `data_world_map(db_symbol)`            | `Studio::WorldMap`     |
| `data_zone(db_symbol)`                 | `Studio::Zone`         |

`data_pokemon` existe aussi comme alias de `data_creature`.

Le **db_symbol** est l'identifiant stable qu'on voit dans Pokémon Studio (par exemple `:potion`, `:pikachu`). Par exemple :

```ruby
item = data_item(:potion)
puts item.price

move = data_move(:thunderbolt)
puts move.power
```

Vous pouvez passer un **id** Integer à la place d'un db_symbol ; PSDK cherche alors l'entrée par sa propriété `id`. Préférez les db_symbols : ils survivent aux réorganisations de données, ils sont lisibles, et la recherche par id parcourt toute la collection.

:::warning

Une entrée inconnue ne renvoie **pas** `nil`. Les accesseurs retombent sur une entité de remplacement dont le db_symbol est `:__undef__`. Pour détecter une entrée manquante, comparez le db_symbol :

```ruby
item = data_item(:does_not_exist)
item.db_symbol # => :__undef__
```

:::

### Les créatures et leurs formes

`Studio::Creature` ne contient que la base commune à toutes les formes (id, db_symbol, nom, espèce, description) plus un tableau `forms` de `Studio::CreatureForm`, où vivent les vraies statistiques, types, talents et capacités apprises.

Le tableau `forms` n'est **pas indexé par numéro de forme** : chaque entrée porte sa propre propriété `form`. Pour obtenir une forme précise, utilisez `data_creature_form`, qui trouve la bonne entrée et retombe sur la première forme si celle demandée n'existe pas :

```ruby
creature = data_creature(:pikachu)
puts creature.name

form = data_creature_form(:pikachu, 0)
puts form.base_hp
```

## Comment parcourir les données

Chaque type d'entité a aussi une fonction `each_data_<type>` : `each_data_ability`, `each_data_creature`, `each_data_dex`, `each_data_group`, `each_data_item`, `each_data_map_link`, `each_data_move`, `each_data_nature`, `each_data_quest`, `each_data_trainer`, `each_data_type`, `each_data_world_map` et `each_data_zone`.

Elles acceptent un bloc, ou renvoient un `Enumerator` quand on les appelle sans bloc. La forme Enumerator est la plus utile : elle donne accès à toute la boîte à outils `Enumerable` de Ruby (`select`, `map`, `count`, `find`...).

```ruby
# Combien de types le jeu contient-il ?
type_count = each_data_type.size

# Tous les objets qui coûtent 200 ou moins
cheap_items = each_data_item.select { |item| item.price <= 200 }

# Afficher le nom de chaque créature
each_data_creature { |creature| puts creature.name }
```

## Aller plus loin

Les accesseurs renvoient des instances des classes de données `Studio`. Pour connaître les champs exposés par chaque classe, lisez leur source dans les scripts de PSDK sous `scripts/3 Studio/2 Data/` (un fichier par entité : `021 Item.rb`, `041 Creature.rb`, `042 CreatureForm.rb`, etc.). Ces classes sont de simples conteneurs de données aux attributs documentés : la source se lit comme une liste de champs.

:::note

Si vous maintenez un projet commencé avant PSDK .25.14, vous pouvez encore croiser des accès du style `GameData::Item[...]` dans d'anciens scripts. Le module `GameData` a été remplacé par les classes `Studio` et les accesseurs ci-dessus ; les données sont les mêmes, mais la plupart des drapeaux ont gagné un préfixe `is_` et la plupart des références Integer sont devenues des Symbols.

:::

## Conclusion

- Les données du jeu s'éditent dans Pokémon Studio et se lisent depuis les scripts via les accesseurs `data_<type>(db_symbol)`, appelables de partout.
- Préférez les **db_symbols** aux ids Integer : stables, lisibles et plus rapides à rechercher.
- Une entrée inconnue renvoie l'entité de remplacement `:__undef__`, jamais `nil`.
- Les données d'une créature sont en deux niveaux : `Studio::Creature` pour la base, `Studio::CreatureForm` (via `data_creature_form`) pour les stats, types et capacités. Les formes sont identifiées par leur propriété `form`, pas par leur position dans le tableau.
- `each_data_<type>` parcourt une collection entière et renvoie un `Enumerator` sans bloc, prêt pour `select`, `map` ou `count`.
- La liste des champs de chaque classe `Studio` est dans les sources de PSDK sous `scripts/3 Studio/2 Data/`.
