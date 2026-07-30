---
title: "Combattre avec un allié"
slug: combattre-avec-un-allie
sidebar_position: 13
description: "PSDK peut placer un second dresseur du côté du joueur, qui combat à ses côtés avec sa propre équipe, son propre sac et sa propre IA. Ce guide couvre la façon de déclarer un allié pour un combat de dresseur et pour un combat sauvage, comment un allié force le combat en double ou en triple, et ce que cela change pour le joueur."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut placer un second dresseur du côté du joueur, qui combat à ses côtés avec sa propre équipe, son propre sac et sa propre IA. Ce guide couvre la façon de déclarer un **allié** pour un combat de dresseur et pour un combat sauvage, comment un allié force le combat en double ou en triple, et ce que cela change pour le joueur.

Un allié n'est pas une donnée à part. C'est un dresseur ordinaire de la base de données de Pokémon Studio, placé du côté du joueur au lieu du côté adverse. Le joueur ne lui donne jamais d'ordre : l'allié joue ses tours lui-même.

## Préparer l'allié dans Studio

On crée l'allié comme n'importe quel autre dresseur, dans la base **Dresseurs**. Trois champs font le travail :

- **Équipe** — l'équipe que l'allié amène. Il combat avec ces Pokémon et rien d'autre, l'équipe du joueur n'est pas touchée.
- **Battle sprite** — le sprite affiché du côté du joueur. Sans lui, l'allié n'a rien à afficher.
- **Niveau de l'IA** — la qualité de jeu de l'allié. C'est le seul levier dont on dispose sur son comportement : un « rival qui prête main-forte » et un « gamin qui suit sans rien comprendre » sont la même fonctionnalité avec un nombre différent ici.

Ce niveau compte davantage pour un allié que pour un adversaire, car un allié que le joueur ne commande pas ne vaut que ce que vaut son IA. Trois seuils sont à connaître :

| Niveau de l'IA                     | Ce qu'il débloque                                                           |
| ---------------------------------- | --------------------------------------------------------------------------- |
| **Basique** à **Intermédiaire**    | choisit seulement ses attaques, ne change jamais, n'utilise aucun objet     |
| **Difficile** et **Lieutenant**    | commence à changer ses Pokémon et à utiliser les objets de boost de son sac |
| **Champion d'arène** et **Maître** | utilise aussi les objets de soin, donc se maintient en vie                  |

En dessous de **Difficile**, remplir le sac de l'allié ne change rien, et en dessous de **Champion d'arène** il ne se soignera jamais. Un allié censé porter un combat se règle sur **Champion d'arène** ou au-dessus.

Le **nom** et la **Classe de dresseur** de l'allié servent au message annonçant qu'il envoie son Pokémon.

Trois autres champs sont simplement ignorés pour un allié :

- **Type de combat** — le format est décidé par la présence de l'allié, pas par ce champ. Voir les sections ci-dessous.
- **Argent de base** — l'argent gagné ne vient jamais que du côté adverse, un allié ne verse donc rien au joueur.
- Les dialogues de **victoire** et de **défaite**, que seuls les dresseurs adverses prononcent.

:::warning[Un allié peut détourner la musique du combat]

Dans un combat de **dresseur**, PSDK ajoute l'allié après les adversaires, et chaque dresseur ajouté impose sa propre musique de combat et son propre identifiant de **Combat scénarisé** s'il en a un. Comme l'allié passe en dernier, sa musique de combat prend le dessus sur celle de l'adversaire, et son **Combat scénarisé** remplace celui que le combat était censé jouer. On laisse ces deux champs vides sur un dresseur destiné à servir d'allié, sauf si c'est exactement l'effet recherché.

:::

## Les deux variables

Tout ce qui suit repose sur deux variables de jeu qui contiennent l'ID Studio des dresseurs alliés :

| Variable | ID  | Signification              |
| -------- | --- | -------------------------- |
| Allié    | 36  | le dresseur allié          |
| Allié 2  | 38  | le second dresseur allié   |

La valeur `0` signifie « pas d'allié ». Toute valeur positive est lue comme un ID de dresseur, et le dresseur portant cet ID rejoint le côté du joueur.

Les commandes ci-dessous sont des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on les appelle depuis la commande **Script** d'un event, sans aucun préfixe.

## Un combat de dresseur double avec un allié

Pour le cas standard, deux adversaires face au joueur et à son allié, une seule commande déclare tout le combat :

```ruby
start_double_trainer_battle_with_friend(286, 287, 289)
```

`286` et `287` sont les deux dresseurs adverses, `289` est l'allié. La commande remplit les variables toute seule, il n'y a rien d'autre à préparer.

Le terrain accueille alors quatre Pokémon : celui de tête du joueur, celui de tête de l'allié, et un Pokémon de chaque adversaire. C'est le point qui surprend le plus de makers : **le joueur n'envoie qu'un seul Pokémon**. L'allié occupe la deuxième place de son côté, ce qui veut dire aussi qu'un combat comme celui-ci peut démarrer avec un seul Pokémon en état de combattre dans l'équipe du joueur.

### Un adversaire seul face au duo

On peut aussi envoyer le joueur et son allié contre un dresseur unique. On déclare alors l'allié à la main, sur la ligne qui suit la commande de combat habituelle :

```ruby
start_trainer_battle(286)
$game_variables[36] = 289
```

L'allié suffit à faire passer le combat en double, donc l'adversaire solitaire doit remplir ses deux places et envoie deux de ses propres Pokémon. C'est le moyen le plus simple d'écrire un combat de boss en infériorité numérique sans créer un second dresseur pour l'occasion.

## Un combat triple avec deux alliés

Deux alliés donnent un combat triple, trois Pokémon par côté :

```ruby
start_triple_trainer_battle_with_friend(286, 287, 288, 289, 290)
```

Les trois premiers ID sont les adversaires, les deux derniers sont les alliés. Les places sont distribuées équipe par équipe, en commençant par le joueur, donc son côté se lit : joueur, premier allié, second allié. Là encore, le joueur n'envoie qu'**un** Pokémon et les alliés occupent les deux places restantes.

Avec un seul allié en combat triple, le joueur prend les places que l'allié ne prend pas : le côté se lit joueur, allié, joueur, et le joueur a besoin de deux Pokémon en état de combattre.

En fin de combat triple, quand il ne reste qu'un Pokémon debout de chaque côté et qu'ils sont séparés de deux places, PSDK les fait glisser tous les deux vers le centre pour qu'ils puissent s'atteindre. Rien à configurer, cela se produit tout seul, et cela s'applique avec des alliés exactement comme sans.

## Un combat sauvage avec un allié

Un allié fonctionne aussi en combat sauvage, mais les deux façons d'en démarrer un ne se comportent pas de la même manière, et les confondre est la raison habituelle pour laquelle un allié semble absent.

### Une rencontre aléatoire

Pour les rencontres dans l'herbe, on déclare l'allié et on laisse le joueur tomber sur un groupe sauvage comme d'habitude :

```ruby
$game_variables[36] = 289
```

L'allié **écrase alors le format du groupe sauvage** : le groupe tire deux Pokémon sauvages même si son **Type de combat** est réglé sur Simple, et trois si on renseigne aussi le second allié dans la variable `38`. C'est le seul endroit où déclarer un allié change le nombre de Pokémon sauvages qui apparaissent.

### Un combat lancé par un event

Quand on démarre soi-même le combat sauvage avec [`call_battle_wild`](/rpg-maker-xp/demarrer-un-combat-sauvage), le format est décidé par le nombre de Pokémon sauvages qu'on passe, et par rien d'autre. Déclarer un allié n'ajoute pas de second Pokémon sauvage ici, c'est à nous de le passer :

```ruby
$game_variables[36] = 289
call_battle_wild(:zigzagoon, 7, :wurmple, 6)
```

Avec un seul Pokémon sauvage, le combat reste un un-contre-un et l'allié n'atteint jamais le terrain, même s'il a bien été déclaré. On règle la variable **avant** l'appel : le combat est construit au moment où `call_battle_wild` s'exécute.

### Remettre les variables à zéro ensuite

Un combat de dresseur remet les deux variables d'allié à zéro tout seul quand il se termine, en victoire comme en défaite. **Un combat sauvage, non.** Rien dans le moteur ne remet la variable `36` ou `38` à `0` sur ce chemin, donc un allié déclaré pour une rencontre sauvage reste présent dans tous les combats suivants, y compris le prochain combat de dresseur.

On les efface donc soi-même une fois la rencontre passée, avec une commande de variable (**Control Variables**) ou depuis un script :

```ruby
$game_variables[36] = 0
$game_variables[38] = 0
```

La bonne habitude est de déclarer l'allié au début de la séquence d'escorte et de l'effacer à la fin de cette séquence, plutôt qu'autour de chaque combat pris séparément.

## Ce que l'allié fait, et ne fait pas

L'allié est un coéquipier, pas une seconde manette. Concrètement :

- **Le joueur ne lui donne aucun ordre.** Le menu d'action ne demande jamais que les Pokémon du joueur, l'allié choisit ses attaques via son IA.
- **Le joueur ne peut pas gérer ses Pokémon.** Le menu de changement et le menu d'objet se limitent tous les deux à l'équipe du joueur, ses Pokémon ne peuvent donc être ni remplacés ni soignés par le joueur.
- **L'allié utilise son propre sac,** celui qui est configuré sur le dresseur dans Studio, à partir de **Difficile**.
- **Ses Pokémon ne gagnent ni expérience ni EV,** et ils n'entament pas non plus la part du joueur : l'expérience se répartit entre les Pokémon du joueur exactement comme s'il n'y avait pas d'allié.
- **Ses Pokémon ne conservent aucun dégât.** Ils sont reconstruits depuis les données Studio au début de chaque combat, donc un allié utilisé deux fois de suite entame le second combat avec tous ses PV.
- **Le combat est perdu dès que tous les Pokémon du joueur sont KO,** même avec l'allié encore debout. Un allié offre de l'aide au joueur, pas un filet de sécurité.

## Pour aller plus loin

Le switch `48` lève cette dernière règle. Quand il est actif, le combat ne s'arrête plus lorsque le joueur n'a plus de Pokémon : l'allié continue de jouer et peut terminer le combat seul. C'est ce qu'il faut pour un combat scénarisé que le joueur est censé regarder, ou pour perdre sans être éjecté de l'histoire. On le remet à OFF ensuite, car il s'applique à tous les combats tant qu'il est actif.

## Conclusion

- Un allié est un dresseur Studio ordinaire placé du côté du joueur ; les variables `36` et `38` contiennent les ID des dresseurs alliés.
- `start_double_trainer_battle_with_friend(a, b, allié)` et `start_triple_trainer_battle_with_friend(a, b, c, allié1, allié2)` déclarent un combat de dresseur avec un ou deux alliés.
- Un allié force le combat en double, deux alliés le forcent en triple, et le joueur envoie alors moins de Pokémon à lui : un seul en double, un seul en triple avec deux alliés.
- Dans une rencontre sauvage aléatoire, un allié force aussi le groupe sauvage à tirer deux Pokémon (trois avec un second allié). Avec `call_battle_wild`, c'est à nous de passer le Pokémon sauvage supplémentaire.
- Un combat de dresseur remet les variables d'allié à zéro tout seul, un combat sauvage non : on les remet à `0` à la fin de la séquence.
- L'allié joue avec sa propre IA et son propre sac, ne gagne pas d'expérience et ne rapporte pas d'argent, et le combat reste perdu quand l'équipe du joueur tombe, sauf si le switch `48` est actif.
