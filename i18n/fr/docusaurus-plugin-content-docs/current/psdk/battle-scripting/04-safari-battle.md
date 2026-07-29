---
title: "Mettre en place les combats Safari"
slug: combats-safari
sidebar_position: 4
description: "PSDK fournit un mode de combat Safari pour construire une Zone Safari : le joueur lance des Safari Balls, de l'appât ou de la boue au lieu de combattre, et chaque Pokémon sauvage peut fuir de lui-même. Ce guide couvre l'activation et la désactivation du mode, les quatre actions en combat, et les taux de capture et de fuite qui les sous-tendent."
---

PSDK fournit un mode de **combat Safari** pour construire une Zone Safari : le joueur lance des Safari Balls, de l'appât ou de la boue au lieu de combattre, et chaque Pokémon sauvage peut fuir de lui-même. Ce guide couvre l'activation et la désactivation du mode, les quatre actions en combat, et les taux de capture et de fuite qui les sous-tendent.

## En quoi un combat Safari diffère

Dans une Zone Safari, le joueur entre dans les hautes herbes avec un stock fixe de **Safari Balls** et aucune équipe pour combattre. Chaque rencontre est le même pari tendu : amadouer le Pokémon avec de l'appât ou de la boue, lancer une ball, et espérer qu'il ne se libère pas et ne détale pas avant le prochain lancer. Pas d'attaque, pas de K.O., et pas de seconde chance une fois que le Pokémon a fui.

PSDK modélise cela comme un **mode** de combat sauvage plutôt que comme un type de rencontre à part. Quand le mode est actif, tout combat sauvage qui démarrerait normalement passe par `Battle::Safari` au lieu de la scène de combat habituelle : le menu des capacités est remplacé par les actions Safari, le Pokémon du joueur n'attaque jamais, et les deux camps voient leurs talents et objets tenus neutralisés le temps du combat pour que rien ne fausse la capture.

Le mode lui-même tient dans une seule variable de jeu. Tout le reste, distribuer les balls, les rencontres, la zone elle-même, est du contenu PSDK ordinaire que l'on sait déjà construire.

## Activer le mode Safari

Le mode Safari est piloté par la variable de jeu **50**, exposée sous le nom `Yuki::Var::BT_Mode`. La régler à `5` bascule tout combat sauvage vers la scène Safari :

```ruby
$game_variables[Yuki::Var::BT_Mode] = 5
```

C'est un interrupteur de **zone**, pas de combat. Le moteur le relit en permanence pendant que le combat se déroule (pour le menu des actions, l'animation d'intro, les sprites), il doit donc rester à `5` pour tout le combat, et il y reste aussi après. L'endroit naturel pour le régler est le moment où le joueur entre dans la Zone Safari, par exemple dans l'event en processus automatique de la carte ou dans un event de téléportation.

Une fois le mode actif, il faut encore donner au joueur de quoi lancer. On lui remet un stock de **Safari Balls** (l'objet `:safari_ball`) comme n'importe quel objet, voir [Donner un objet au joueur](/rpg-maker-xp/donner-un-objet) :

```ruby
$bag.add_item(:safari_ball, 30)
```

À partir de là, les rencontres dans les herbes de la zone deviennent des combats Safari d'elles-mêmes, sans rien d'autre à brancher. Pour déclencher une rencontre Safari précise depuis un event, on démarre un combat sauvage comme d'habitude pendant que le mode est actif, voir [Démarrer un combat sauvage](/rpg-maker-xp/demarrer-un-combat-sauvage) :

```ruby
call_battle_wild(:tauros, 25)
```

Le même `call_battle_wild` qui produit un combat sauvage normal produit ici un combat Safari, uniquement parce que `BT_Mode` vaut `5`.

## Le désactiver

Le moteur ne remet jamais `BT_Mode` à zéro de lui-même. Si on le laisse à `5`, **toutes** les rencontres sauvages suivantes, partout dans le jeu, restent des combats Safari. On le réinitialise quand le joueur quitte la zone :

```ruby
$game_variables[Yuki::Var::BT_Mode] = 0
```

Une Zone Safari fait en général un peu de nettoyage à la sortie, en plus de réinitialiser le mode : on reprend les Safari Balls inutilisées et on remet au joueur ce qu'il a capturé. Retirer les balls restantes évite qu'elles ne se reportent sur la visite suivante :

```ruby
$game_variables[Yuki::Var::BT_Mode] = 0
$bag.remove_item(:safari_ball, $bag.item_quantity(:safari_ball))
```

PSDK n'a pas de compteur de pas, de minuteur ni de budget de balls intégré pour la Zone Safari. La règle classique du « 500 pas puis on vous raccompagne » est de la logique de jeu que l'on construit soi-même avec des events et des variables ; le moteur ne fournit que le mode de combat.

## À l'intérieur d'un combat Safari

À chaque tour, le joueur choisit une des quatre actions au lieu d'une capacité :

| Action          | Ce qu'elle fait                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **Safari Ball** | Lance une Safari Ball sur le Pokémon, en consommant une du sac, puis applique la formule de capture normale. |
| **Appât**       | Augmente le taux de capture d'un palier. 90 % du temps, rend aussi le Pokémon **plus** enclin à fuir.        |
| **Boue**        | Diminue le taux de fuite d'un palier. 90 % du temps, rend aussi le Pokémon **plus difficile** à capturer.    |
| **Fuir**        | Quitte le combat. Dans un combat Safari, cela réussit toujours.                                              |

L'appât et la boue sont volontairement opposés, et chacun porte un inconvénient que l'autre n'a pas :

- L'**appât** facilite la capture mais rend en général le Pokémon plus nerveux, on court alors contre ses propres lancers.
- La **boue** garde le Pokémon plus longtemps mais rend en général sa capture plus dure, ce qui coûte des balls.

Les tirages à 90 % sont ce qui empêche tout cela d'être gratuit : un appât sur dix augmente le taux de capture sans augmenter le taux de fuite, et une boue sur dix diminue le taux de fuite sans nuire au taux de capture, chacun annoncé par son propre message.

Quand le joueur n'a plus de Safari Balls, en lancer une est impossible : le Pokémon fuit et le combat se termine. Il faut toujours s'assurer que le joueur entre dans la zone avec un stock.

### Taux de capture et de fuite

L'appât et la boue ne modifient pas un pourcentage directement. Ils déplacent un **palier**, un entier qui part de `0` et reste borné à l'intervalle `-6`…`+6`, exactement comme un changement de stat en combat. Un palier est transformé en multiplicateur appliqué au taux sous-jacent :

| Palier | Multiplicateur |
| ------ | -------------- |
| +6     | ×4.0           |
| +2     | ×2.0           |
| +1     | ×1.5           |
| 0      | ×1.0           |
| −1     | ×0.67          |
| −2     | ×0.5           |
| −6     | ×0.25          |

Deux paliers distincts évoluent en parallèle : un palier de **capture** et un palier de **fuite**.

Le palier de capture multiplie le taux de capture du Pokémon (`rareness`) juste avant le lancer d'une ball :

```ruby
catch_rate = (rareness * multiplier(catch_stage)).clamp(1, 255)
```

Ce taux modifié alimente ensuite la formule de capture normale, la même qu'utilise une Poké Ball en dehors de la Zone Safari.

Le palier de fuite multiplie un taux de fuite de base calculé selon la rareté et la vitesse du Pokémon :

```ruby
base_flee_rate = ((255 - rareness + base_spd) / 2).clamp(1, 255)
flee_rate = (base_flee_rate * multiplier(flee_stage)).clamp(1, 255)
```

Un Pokémon plus rare (`rareness` plus bas) et plus rapide (`base_spd` plus haut) fuit plus facilement. Après chaque appât, boue ou ball ratée, le Pokémon prend son tour et tire contre ce taux : si le tirage tombe au niveau ou en dessous de `flee_rate`, il s'échappe et le combat se termine. Une capture réussie est la seule issue qui termine le combat à l'avantage du joueur.

## Lire le résultat

Un combat Safari rend compte via les mêmes interrupteurs que les combats sauvages, si bien qu'un event lancé après le combat peut s'aiguiller selon ce qui s'est passé. Le piège, c'est que la scène Safari ne se termine que de deux façons : une capture, ou `battle_result = 1` pour tout le reste, que le joueur ait choisi Fuir, que le Pokémon ait fui, ou que le sac soit vide. Ce résultat unique correspond à un seul interrupteur :

| Interrupteur     | ID  | Signification                                                                                                   |
| ---------------- | --- | --------------------------------------------------------------------------------------------------------------- |
| `BT_Catch`       | 38  | le joueur a capturé le Pokémon                                                                                  |
| `BT_Player_Flee` | 35  | le combat s'est terminé de toute autre façon (le joueur a fui, le Pokémon a fui, ou il n'y avait plus de balls) |

`BT_Wild_Flee` (interrupteur `34`) n'est **pas** positionné par un combat Safari : il exige le code de résultat `3`, que la scène Safari ne produit jamais, donc un Pokémon sauvage qui fuit est tout de même signalé par `BT_Player_Flee`. La seule distinction à lire est donc `BT_Catch` : on le teste (interrupteur `38`) juste après le combat pour réagir à une capture réussie, et on traite toutes les autres fins comme le joueur repartant les mains vides.

## Conclusion

- Le mode Safari est la variable de jeu **50** (`Yuki::Var::BT_Mode`) : la régler à `5` transforme tout combat sauvage en combat Safari, la remettre à `0` arrête tout.
- C'est un interrupteur de **zone** : on l'active à l'entrée et on l'efface à la sortie ; le moteur ne le réinitialise jamais pour vous, et il doit rester actif tout le combat.
- On donne au joueur des objets `:safari_ball` à lancer ; quand il n'en a plus, le combat se termine sur la fuite du Pokémon.
- En combat, le joueur lance une ball, de l'appât (capture plus facile, Pokémon plus nerveux) ou de la boue (Pokémon plus calme, capture plus dure), ou il fuit, ce qui marche toujours.
- L'appât et la boue déplacent un palier de capture et un palier de fuite dans l'intervalle `-6`…`+6` ; ces paliers multiplient le taux de capture et le taux de fuite de base, et le Pokémon tire pour fuir après chaque action.
- On lit le résultat via `BT_Catch` (interrupteur 38) pour une capture ; toute autre fin est signalée par `BT_Player_Flee` (35), et il n'y a aucun interrupteur de victoire ou de défaite.
