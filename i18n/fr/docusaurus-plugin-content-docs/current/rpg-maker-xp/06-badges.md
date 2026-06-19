---
title: "Donner un badge au joueur"
slug: donner-un-badge
sidebar_position: 6
description: "Dans PSDK, les badges d'arène font partie de l'état du dresseur, pas d'un interrupteur de jeu. Ce guide montre comment attribuer, retirer et tester un badge depuis un event, comment fonctionnent les paramètres optionnels de région et de valeur, et comment compter les badges obtenus par le joueur."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

Dans PSDK, les badges d'arène font partie de l'**état du dresseur**, pas d'un interrupteur de jeu. Ce guide montre comment attribuer, retirer et tester un badge depuis un event, comment fonctionnent les paramètres optionnels de région et de valeur, et comment compter les badges obtenus par le joueur.

Contrairement aux [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event), que l'on appelle sans préfixe, les badges vivent sur l'objet dresseur. On y accède via le global `$trainer`, donc toutes les commandes de cette page s'écrivent `$trainer.quelque_chose(...)`. On les saisit toujours dans la commande **Script** d'un event, le préfixe est la seule différence.

## Ce qu'est un badge dans PSDK

Quand le joueur bat un champion d'arène, l'event du champion lui remet un badge. PSDK le stocke comme un indicateur sur le dresseur : chaque badge est soit obtenu, soit non. Il n'y a pas d'interrupteur système à activer, et rien à déclarer à l'avance.

Le dresseur dispose de la place pour **6 régions de 8 badges chacune**, donc un badge est identifié par deux nombres : son **numéro** (1 à 8) et sa **région** (à partir de 1). La plupart des jeux n'utilisent qu'une seule région, c'est pourquoi la région est optionnelle et vaut `1` par défaut. Les huit badges de la région 1 sont ceux affichés sur la **Carte Dresseur**.

## Attribuer un badge

`set_badge` passe un badge à l'état obtenu :

```ruby
$trainer.set_badge(badge_num, region = 1, value = true)
```

- `badge_num` — le badge à définir, de `1` à `8`.
- `region` — la région à laquelle appartient le badge, à partir de `1`. Optionnel, vaut `1` par défaut.
- `value` — l'état d'obtention. Optionnel, vaut `true` par défaut.

Dans l'event du champion d'arène, juste après le dialogue de victoire, on attribue le cinquième badge avec :

```ruby
$trainer.set_badge(5)
```

Comme `region` et `value` utilisent leurs valeurs par défaut, cela donne le badge 5 de la région 1. Un `badge_num` hors de la plage `1`–`8` est rejeté et consigné comme une erreur au lieu d'être défini.

## Retirer un badge

On passe `false` en troisième argument pour effacer un badge :

```ruby
$trainer.set_badge(5, 1, false)
```

Ici, il faut écrire la région explicitement, car `value` est le troisième paramètre : on ne peut pas sauter celui du milieu. Cela ramène le badge 5 de la région 1 à l'état non obtenu.

## Badges d'une autre région

Un jeu multi-régions stocke les badges de chaque région séparément. On en cible une en passant son numéro en deuxième argument :

```ruby
$trainer.set_badge(5, 3)
```

Cela attribue le badge 5 de la **région 3**. La région doit valoir au moins `1` ; le dresseur a de la place pour six régions, et demander un badge dans une région que le jeu ne prévoit pas est rejeté et consigné comme une erreur.

## Vérifier si le joueur possède un badge

`badge_obtained?` renvoie si un badge est défini :

```ruby
$trainer.badge_obtained?(badge_num, region = 1)
```

Elle renvoie `true` ou `false`, elle a donc sa place dans l'onglet **Script** d'un **branchement conditionnel**. Pour verrouiller une route derrière le cinquième badge :

```ruby
# Le joueur a-t-il le cinquième badge ?
$trainer.badge_obtained?(5)
```

Comme pour `set_badge`, la région est optionnelle et vaut `1` par défaut, donc `$trainer.badge_obtained?(5, 3)` teste le badge 5 de la région 3. La méthode est aussi disponible sous l'alias `has_badge?`, qui se lit mieux dans certaines conditions ; les deux font la même chose.

## Compter les badges

`badge_counter` renvoie le nombre de badges obtenus par le joueur, toutes régions confondues :

```ruby
$trainer.badge_counter
```

Elle renvoie un `Integer`, utile pour débloquer quelque chose une fois que le joueur a réuni assez de badges. Dans l'onglet Script d'un **branchement conditionnel** :

```ruby
# Le joueur a-t-il réuni les huit badges ?
$trainer.badge_counter >= 8
```

## Conclusion

- Les badges sont un état du dresseur, accessible via le global `$trainer`, pas des interrupteurs de jeu.
- On en attribue un avec `$trainer.set_badge(badge_num)` ; on le retire avec `$trainer.set_badge(badge_num, region, false)`.
- Un badge est un **numéro** (1 à 8) plus une **région** (1 par défaut, jusqu'à 6) ; les badges de la région 1 s'affichent sur la Carte Dresseur.
- On teste un badge avec `$trainer.badge_obtained?(badge_num)` (alias `has_badge?`) dans l'onglet Script d'un branchement conditionnel.
- On compte les badges obtenus avec `$trainer.badge_counter`.
