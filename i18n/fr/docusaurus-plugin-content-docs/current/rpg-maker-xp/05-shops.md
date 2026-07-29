---
title: "Créer des boutiques d'objets et de Pokémon"
slug: creer-des-boutiques
sidebar_position: 5
description: "PSDK permet à un event d'ouvrir une boutique où le joueur achète des objets, ou même des Pokémon. Une boutique peut vendre depuis un stock infini ou depuis un stock limité qui s'épuise, et elle signale ce que le joueur a fait pour que le marchand puisse réagir. Ce guide couvre les deux familles de boutiques et comment les piloter depuis un event."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK permet à un event d'ouvrir une boutique où le joueur achète des objets, ou même des Pokémon. Une boutique peut vendre depuis un **stock infini** ou depuis un **stock limité** qui s'épuise, et elle signale ce que le joueur a fait pour que le marchand puisse réagir. Ce guide couvre les deux familles de boutiques et comment les piloter depuis un event.

Toutes les commandes ci-dessous sont des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on les appelle depuis la commande **Script** d'un event, sans aucun préfixe.

## Deux familles de boutiques

Avant de séparer objets et Pokémon, deux idées s'appliquent à toute boutique.

**Illimitée ou limitée.** Une boutique **illimitée** a un stock infini : le joueur peut acheter le même objet encore et encore. On décrit son contenu directement dans l'appel qui l'ouvre, et rien n'est mémorisé ensuite. Une boutique **limitée** a un stock fini qui diminue à chaque achat et persiste dans la sauvegarde. On construit son stock une fois avec une commande dédiée, on lui donne un `Symbol` pour l'identifier, puis on l'ouvre plus tard via ce symbole. La même boutique peut être rouverte, réapprovisionnée ou vidée au fil de la partie.

**Un prix de 0 masque l'entrée.** Quelle que soit la boutique, un objet ou un Pokémon dont le prix vaut `0` (ou est négatif) est retiré silencieusement de la liste. On s'en sert pour garder une entrée définie dans une boutique limitée sans la proposer encore à la vente. Un objet non limité que le joueur possède déjà est lui aussi masqué de la liste. Si toutes les entrées finissent filtrées, la boutique se ferme aussitôt au lieu d'afficher une fenêtre vide.

**La boutique signale son issue.** À la fermeture, PSDK écrit un code de résultat dans la **variable système 26** pour que l'event sache si le joueur a acheté quelque chose. Voir [Réagir à la fermeture de la boutique](#réagir-à-la-fermeture-de-la-boutique) à la fin de ce guide.

## Boutiques d'objets

### Boutique illimitée

La méthode `open_shop` ouvre une boutique à partir d'une simple liste d'objets :

```ruby
open_shop(symbol_or_list, prices = {}, show_background: true)
```

- `symbol_or_list` — un tableau de db_symbols d'objets (ou d'ID numériques) à vendre.
- `prices` — un `Hash` facultatif pour surcharger les prix le temps de cette ouverture. Les clés sont des db_symbols d'objets, les valeurs les nouveaux prix. Un objet absent garde son prix de la base de données.
- `show_background` — un argument nommé facultatif. Le mettre à `false` ouvre la boutique par-dessus la map au lieu du fond animé.

```ruby
open_shop(
  [:poke_ball, :potion, :antidote, :paralyze_heal],
  { poke_ball: 150, potion: 250 },
  show_background: true
)
```

Cet appel vend quatre objets ; la Poké Ball et la Potion utilisent les prix surchargés, l'Antidote et l'Anti-Para gardent leurs prix de la base de données. Les objets au prix `0` et les objets non limités déjà dans le sac ne sont pas affichés.

### Boutique limitée

Une boutique limitée vend un stock fini qui survit d'une ouverture à l'autre. La construire demande quelques étapes.

**1. Créer la boutique et son stock** avec `add_limited_shop` :

```ruby
add_limited_shop(symbol_of_shop, items_sym = [], items_quantity = [], shop_rewrite: false)
```

- `symbol_of_shop` — le `Symbol` qui nomme cette boutique. On le réutilise pour réapprovisionner et pour ouvrir.
- `items_sym` — les objets à mettre en stock.
- `items_quantity` — combien de chacun. Un objet sans quantité associée vaut une unité par défaut.
- `shop_rewrite` — le laisser à `false` (la valeur par défaut). Si la boutique existe déjà, l'appel la réapprovisionne sans toucher au reste. Ne le passer à `true` que pour effacer la boutique et la reconstruire de zéro volontairement.

```ruby
add_limited_shop(
  :celadon_dept_store,
  [:poke_ball, :potion, :antidote, :paralyze_heal],
  [5, 3, 2, 1]
)
```

**2. Réapprovisionner plus tard** avec `add_items_to_limited_shop`. Les quantités s'ajoutent au stock courant ; un objet pas encore présent est créé :

```ruby
add_items_to_limited_shop(symbol_of_shop, items_to_refill = [], quantities_to_refill = [])

add_items_to_limited_shop(:celadon_dept_store, [:poke_ball, :great_ball], [10, 3])
```

**3. Retirer du stock** avec `remove_items_from_limited_shop`. Les quantités sont soustraites ; une entrée qui atteint zéro est supprimée. Passer `nil` comme quantité retire tout l'objet d'un coup :

```ruby
remove_items_from_limited_shop(symbol_of_shop, items_to_remove, quantities_to_remove)

remove_items_from_limited_shop(:celadon_dept_store, [:potion, :antidote], [2, nil])
```

Cet appel retire deux Potions et tous les Antidotes restants en stock.

**4. Ouvrir la boutique** en passant son symbole à `open_shop` au lieu d'un tableau :

```ruby
open_shop(:celadon_dept_store, { poke_ball: 150 }, show_background: true)
```

Le `Hash` de prix facultatif fonctionne exactement comme pour une boutique illimitée. Le joueur ne peut acheter que dans la limite du stock restant, et chaque achat le diminue pour la fois suivante.

## Boutiques de Pokémon

Une boutique de Pokémon repose sur le même découpage illimité/limité, mais chaque entrée doit aussi décrire le Pokémon vendu, pas seulement un ID et un prix.

### Boutique illimitée

```ruby
pokemon_shop_open(symbol_or_list, prices = [], param = [], show_background: true)
```

- `symbol_or_list` — un tableau de db_symbols de Pokémon (ou d'ID) à vendre.
- `prices` — un tableau de prix, un par Pokémon, dans le même ordre. Un Pokémon au prix `0` est masqué.
- `param` — un tableau décrivant chaque Pokémon (voir [Décrire un Pokémon](#décrire-un-pokémon) plus bas), dans le même ordre.
- `show_background` — le même argument nommé facultatif que pour les boutiques d'objets.

```ruby
pokemon_shop_open(
  [:bulbasaur, :charmander, :squirtle],
  [2000, 2000, 2000],
  [5, 5, { level: 10, shiny: true }],
  show_background: true
)
```

Cet appel propose les trois starters à 2000 chacun : Bulbizarre et Salamèche au niveau 5, et un Carapuce chromatique au niveau 10.

### Décrire un Pokémon

L'entrée `param` d'un Pokémon prend deux formes :

- Un **entier**, lu comme le niveau. Tout le reste (forme, genre, nature...) utilise les valeurs par défaut de l'espèce. `5` est un raccourci pour un Pokémon de niveau 5.
- Un **Hash**, quand on veut plus de contrôle. Les clés les plus courantes sont `:level`, `:form`, `:shiny`, `:given_name`, `:nature`, `:gender`, `:item`, `:ability` et `:moves`. Toute clé omise revient à la valeur par défaut.

```ruby
{ level: 25, form: 1, shiny: true, given_name: "Sparky" }
```

La clé `:form` ne fait pas que changer l'apparence : une boutique de Pokémon limitée distingue deux entrées d'une même espèce par leur forme (voir plus bas). Dans le doute, on renseigne `:form` explicitement ; omise, elle vaut la forme `0`.

### Boutique limitée

Le cycle de vie reflète celui de la boutique d'objets, avec la description du Pokémon en plus sur chaque commande.

**1. Créer la boutique** avec `add_new_pokemon_shop` :

```ruby
add_new_pokemon_shop(sym_new_shop, list_id, list_price, list_param, list_quantity = [], shop_rewrite: false)
```

- `sym_new_shop` — le `Symbol` qui nomme la boutique.
- `list_id` — les Pokémon à vendre.
- `list_price` — leurs prix, un par Pokémon.
- `list_param` — leurs descriptions (niveau entier ou `Hash`), une par Pokémon.
- `list_quantity` — combien de chacun ; vaut une unité par défaut.
- `shop_rewrite` — même sens que pour les boutiques d'objets : `false` réapprovisionne une boutique existante, `true` la reconstruit.

```ruby
add_new_pokemon_shop(
  :game_corner_prizes,
  [:eevee, :dratini, :magikarp],
  [3000, 4600, 500],
  [25, 18, { level: 5, shiny: true }],
  [1, 1, 2]
)
```

**2. Ajouter des Pokémon plus tard** avec `add_pokemon_to_shop`. Un Pokémon déjà en stock est reconnu par **espèce et forme** : avec `pkm_rewrite: false` (la valeur par défaut) la quantité s'ajoute ; avec `pkm_rewrite: true` l'entrée existante est remplacée par la nouvelle description :

```ruby
add_pokemon_to_shop(symbol_of_shop, list_id, list_price, list_param, list_quantity = [], pkm_rewrite: false)

add_pokemon_to_shop(:game_corner_prizes, [:magikarp], [500], [5], [3])
```

**3. Retirer des Pokémon** avec `remove_pokemon_from_shop`. Comme une espèce peut exister sous plusieurs formes, on précise la forme à viser ; passer `nil` comme quantité retire l'entrée entièrement :

```ruby
remove_pokemon_from_shop(symbol_of_shop, remove_list_mon, param_form, quantities_to_remove = [])

remove_pokemon_from_shop(:game_corner_prizes, [:eevee, :dratini], [{ form: 0 }, { form: 0 }], [1, nil])
```

Cet appel retire un Évoli (forme 0) et tous les Minidraco (forme 0) en stock.

**4. Ouvrir la boutique** en passant le symbole à `pokemon_shop_open`. Sous cette forme, le deuxième argument est un `Hash` de surcharge de prix (indexé par ID de Pokémon), pas un tableau, et il n'y a pas d'argument `param` puisque le stock contient déjà la description de chaque Pokémon :

```ruby
pokemon_shop_open(:game_corner_prizes, { eevee: 2500 }, show_background: true)
```

## Réagir à la fermeture de la boutique

Quelle que soit la boutique ouverte, PSDK écrit un code de résultat dans la **variable système 26** (`Yuki::Var::TMP1` dans le moteur) quand la fenêtre se ferme. La lire ensuite permet au marchand de dire quelque chose d'adapté au lieu d'une ligne générique. Les codes sont :

| Code | Signification                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| `-1` | La boutique n'a même pas pu s'ouvrir : toutes les entrées étaient filtrées (prix `0`, ou objets déjà possédés). |
| `0`  | Le joueur a fermé la boutique sans rien acheter.                                                                |
| `1`  | Le joueur a acheté un seul type d'objet, ou une seule espèce de Pokémon.                                        |
| `2`  | Le joueur a acheté plusieurs types d'objets, ou plusieurs espèces de Pokémon.                                   |
| `3`  | Le joueur a acheté la dernière unité en stock, donc une boutique limitée s'est vidée et fermée d'elle-même.     |

Pour une boutique de Pokémon, la distinction `1` contre `2` compte les **espèces**, pas les unités : acheter trois Magicarpe reste `1`, alors qu'acheter un Magicarpe et un Évoli donne `2`.

On lit la variable juste après la commande de boutique, dans une **Condition** sur son onglet **Script**. Le raccourci `gv` permet de rester concis :

```ruby
# Le joueur a-t-il acheté au moins une chose ?
gv[26] >= 1
```

De là, on aiguille vers le bon dialogue : un remerciement quand `gv[26]` vaut `1` ou `2`, une ligne neutre quand il vaut `0`, ou un message « nous sommes en rupture » quand il vaut `-1` ou `3`.

## Conclusion

- On ouvre une boutique illimitée avec `open_shop` (objets) ou `pokemon_shop_open` (Pokémon), en décrivant le contenu directement dans l'appel.
- On construit une boutique limitée une fois avec `add_limited_shop` / `add_new_pokemon_shop`, on la tient à jour avec les commandes `add_*` et `remove_*`, puis on l'ouvre via son `Symbol`.
- Un prix de `0` masque une entrée ; un objet non limité déjà possédé est masqué aussi ; une boutique entièrement filtrée se ferme au lieu de ne rien montrer.
- On décrit un Pokémon vendu avec un niveau entier ou un `Hash` (`:level`, `:form`, `:shiny`...) ; une boutique de Pokémon limitée distingue les entrées par espèce **et** forme.
- Après chaque boutique, la variable système 26 signale l'issue (`-1` à `3`) pour que l'event puisse réagir.
