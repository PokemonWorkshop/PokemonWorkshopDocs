---
title: "Donner un objet au joueur"
slug: donner-un-objet
sidebar_position: 7
description: "PSDK peut remettre un objet au joueur de plusieurs façons : une Poké Ball posée au sol, un cadeau d'un PNJ, ou un ajout silencieux en arrière-plan. Ce guide couvre les trois commandes d'event qui donnent un objet, la façon dont chacune traite l'event qui l'exécute, et les méthodes du sac pour vérifier, compter et retirer ce que le joueur possède."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut remettre un objet au joueur de plusieurs façons : une Poké Ball posée au sol, un cadeau d'un PNJ, ou un ajout silencieux en arrière-plan. Ce guide couvre les trois commandes d'event qui donnent un objet, la façon dont chacune traite l'event qui l'exécute, et les méthodes du sac pour vérifier, compter et retirer ce que le joueur possède.

Les trois premières commandes sont des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on les appelle depuis la commande **Script** d'un event, sans aucun préfixe. Les méthodes du sac, à la fin, passent par le global `$bag` ; la différence est expliquée le moment venu.

## Trois façons de remettre un objet

PSDK propose trois commandes pour remettre un objet, et la bonne dépend de **ce que le joueur voit**. Une Poké Ball posée au sol qui disparaît une fois ramassée n'est pas le même event qu'un PNJ qui reste planté là après avoir fait un cadeau. Les commandes diffèrent surtout par le fait de **supprimer ou non l'event** ensuite, et par le message affiché. Dans chacune, l'objet est désigné par son db_symbol (`:potion`, `:poke_ball`) ou son ID numérique, exactement tel qu'il apparaît dans la base de données des objets.

### Ramasser un objet au sol

`pick_item` est la commande pour un objet posé sur la carte, la fameuse Poké Ball dans laquelle le joueur vient marcher :

```ruby
pick_item(item_id, count = 1, no_delete = false)
```

- `item_id` — l'objet à donner, sous forme de db_symbol (`:poke_ball`) ou d'ID numérique.
- `count` — la quantité à donner. Optionnel, vaut `1` par défaut.
- `no_delete` — s'il faut conserver l'event ensuite. Optionnel, vaut `false` par défaut, ce qui signifie que l'event est **supprimé définitivement**.

Sur l'event de la Poké Ball, une seule commande Script suffit :

```ruby
pick_item(:potion)
```

Cela ajoute une Potion, affiche le message « a trouvé une Potion », joue le jingle d'objet, puis **supprime l'event définitivement** : la Poké Ball disparaît et ne reviendra pas, même après que le joueur a quitté puis ré-entré sur la carte. C'est exactement ce que l'on veut pour un objet au sol à usage unique.

Pour en remettre plusieurs d'un coup, on passe une quantité :

```ruby
pick_item(:poke_ball, 5)
```

Si l'objet doit rester disponible (un ramassage qui réapparaît, un event de test), on conserve l'event en passant `true` en troisième argument :

```ruby
pick_item(:potion, 1, true)
```

### Recevoir un objet d'un PNJ

`give_item` est la commande pour un PNJ qui remet quelque chose au joueur. Contrairement à `pick_item`, elle **ne supprime jamais l'event**, donc le personnage reste sur la carte et on peut lui reparler :

```ruby
give_item(item_id, count = 1)
```

- `item_id` — l'objet, sous forme de db_symbol ou d'ID numérique.
- `count` — la quantité. Optionnel, vaut `1` par défaut.

Après le dialogue du cadeau, dans le même event :

```ruby
give_item(:potion)
```

Cela ajoute l'objet, affiche le message de cadeau et joue le jingle, mais laisse le PNJ en place. PSDK choisit le bon message automatiquement : un objet rare reçoit la ligne spécifique aux objets rares, tout le reste la ligne de cadeau générique. Il n'y a pas d'argument `no_delete` ici, conserver l'event est tout l'intérêt de `give_item`.

### La commande générale

Les deux commandes ci-dessus sont construites sur `add_item`, que l'on peut aussi appeler directement quand on a besoin d'un contrôle plus fin :

```ruby
add_item(item_id, no_delete = false, count: 1)
```

- `item_id` — l'objet, sous forme de db_symbol ou d'ID numérique.
- `no_delete` — conserver l'event (`true`) ou le supprimer (`false`, la valeur par défaut).
- `count` — la quantité, sous forme d'argument nommé. Optionnel, vaut `1` par défaut.

```ruby
add_item(:potion, false, count: 3)
```

Cela ajoute trois Potions, affiche le message de découverte et supprime l'event. `pick_item` n'est que `add_item` avec le message de découverte ; `give_item` est `add_item` avec l'event conservé. On n'utilise `add_item` directement que lorsque aucun des deux raccourcis ne convient. Quand le sac est plein (une taille maximale de sac est configurée), `add_item` affiche un message « plus de place » au lieu d'ajouter l'objet, donc on n'a jamais à vérifier la capacité soi-même.

## Ajouter un objet silencieusement

Les trois commandes ci-dessus affichent un message et jouent un son. Quand on a seulement besoin de l'objet dans le sac, sans tambour ni trompette, par exemple comme effet de bord d'un autre event, on passe par l'objet sac directement. Ces méthodes ne sont pas des commandes de l'Interpreter : elles vivent sur le sac du joueur, accessible via le global `$bag`, donc elles s'écrivent `$bag.quelque_chose(...)`. On les saisit toujours dans une commande **Script**, le préfixe est la seule différence.

`$bag.add_item` ajoute un objet sans message ni son :

```ruby
$bag.add_item(db_symbol, nb = 1)
```

- `db_symbol` — l'objet, sous forme de db_symbol ou d'ID numérique.
- `nb` — la quantité. Optionnel, vaut `1` par défaut.

```ruby
$bag.add_item(:potion, 2)
```

Cela glisse discrètement deux Potions dans le sac. Rien ne s'affiche et l'event n'est pas touché.

## Vérifier, compter et retirer des objets

Le même global `$bag` permet de lire et de modifier ce que le joueur possède.

### Vérifier si le joueur possède un objet

`$bag.has_item?` renvoie si le sac contient au moins une quantité donnée d'un objet :

```ruby
$bag.has_item?(db_symbol, quantity = 1)
```

Elle renvoie `true` ou `false`, elle a donc sa place dans l'onglet **Script** d'un **branchement conditionnel**. La quantité est optionnelle et vaut `1` par défaut :

```ruby
# Le joueur a-t-il au moins une Potion ?
$bag.has_item?(:potion)
```

On passe une quantité pour tester un nombre plus élevé :

```ruby
# Le joueur a-t-il au moins cinq Poké Balls ?
$bag.has_item?(:poke_ball, 5)
```

### Compter combien

`$bag.item_quantity` renvoie la quantité exacte que le joueur détient :

```ruby
$bag.item_quantity(db_symbol)
```

Elle renvoie un `Integer` (`0` quand le joueur n'en a aucun), utile pour la stocker dans une variable ou tester un seuil. Dans l'onglet Script d'un branchement conditionnel :

```ruby
# Le joueur a-t-il plus de dix Poké Balls ?
$bag.item_quantity(:poke_ball) > 10
```

### Retirer un objet

`$bag.remove_item` reprend des objets dans le sac :

```ruby
$bag.remove_item(db_symbol, nb = 999)
```

- `db_symbol` — l'objet à retirer.
- `nb` — la quantité. Optionnel ; la valeur par défaut de `999` vide en pratique l'objet entièrement.

```ruby
$bag.remove_item(:potion, 2)
```

Cela retire deux Potions. Si la quantité atteint zéro, l'objet quitte complètement le sac. Appelée sans quantité, elle retire toute la pile :

```ruby
$bag.remove_item(:potion)
```

La méthode est aussi disponible sous le nom `$bag.drop_item`, qui se lit mieux quand le joueur jette quelque chose ; les deux font la même chose.

## Conclusion

- On utilise `pick_item` pour un objet au sol : il affiche le message « a trouvé » et **supprime l'event**, donc le ramassage n'a lieu qu'une fois. On passe `true` en troisième argument pour le conserver.
- On utilise `give_item` pour un cadeau d'un PNJ : il affiche le message de cadeau et **conserve l'event**, donc le personnage reste accessible au dialogue.
- Les deux sont construites sur `add_item` ; on ne l'appelle directement que pour un contrôle plus fin, comme en ajouter plusieurs d'un coup.
- On ajoute un objet sans message ni son via `$bag.add_item`.
- On lit et modifie le sac avec `$bag.has_item?`, `$bag.item_quantity` et `$bag.remove_item` (alias `drop_item`), toutes appelables depuis l'onglet Script d'un branchement conditionnel.
