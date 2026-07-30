---
title: "Mettre en place une transition de dresseur VS bar"
slug: transitions-vs-bar
sidebar_position: 1
description: "PSDK fournit trois transitions de dresseur construites sur les graphismes vs_bar : l'intro de champion d'arène de Diamant/Perle/Platine, celle de HeartGold/SoulSilver, et celle de la Team Rocket. Ce guide explique comment les déclencher et quelles images chacune attend."
---

PSDK fournit trois transitions de dresseur construites sur les graphismes `vs_bar` : l'intro de champion d'arène de **Diamant/Perle/Platine**, celle de **HeartGold/SoulSilver**, et celle de la **Team Rocket**. Ce guide explique comment les déclencher et quelles images chacune attend.

:::warning[Le readme livré avec le pack est faux]
Le fichier `readme.txt` présent dans `graphics/battlebacks/vs_bar` demande de « régler l'interrupteur 31 sur 3 ». Aucun interrupteur n'intervient : la transition est choisie par la **variable de jeu 31**. Ce readme ne couvre par ailleurs qu'une des trois transitions, et renvoie vers un message Discord que personne d'extérieur au serveur ne peut ouvrir. Cette page le remplace.
:::

## Ce qu'est une transition

Quand un combat démarre, la carte ne bascule pas directement sur l'écran de combat. Une courte animation joue d'abord : l'écran clignote, un effet le balaye, et seulement ensuite les combattants apparaissent. Cette animation, c'est la **transition**.

PSDK en fournit une douzaine, qui reproduisent celles des jeux officiels. Trois d'entre elles forment la famille « VS bar », les intros spectaculaires réservées aux adversaires importants : une barre défile à l'écran, un logo **VS** clignote, puis le portrait du dresseur arrive en glissant avec son nom. Ce sont celles qui réclament des images supplémentaires, puisqu'elles montrent le visage de l'adversaire.

## Choisir la transition

La transition est choisie par la **variable de jeu 31**, que PSDK expose aussi sous le nom `Yuki::Var::TrainerTransitionType`. La valeur que contient cette variable au démarrage du combat décide de l'animation jouée.

Dans RPG Maker XP, on ouvre l'événement qui lance le combat et on ajoute une commande **Gestion des variables** *avant* la commande qui démarre le combat. On règle la variable 31 sur la valeur de la transition voulue :

- `3` pour la transition de champion d'arène de Diamant/Perle/Platine
- `10` pour celle de HeartGold/SoulSilver
- `11` pour celle de la Team Rocket

:::warning[Remettre la variable après coup]
La variable 31 garde sa valeur tant que rien ne la change, et c'est la **même** variable qui choisit la transition des combats sauvages. En la laissant sur `3`, chaque rencontre sauvage suivante joue une autre animation que d'habitude. On ajoute donc une seconde commande **Gestion des variables** après le combat pour la remettre à la valeur habituelle du projet, `0` par défaut.
:::

Pour le faire depuis un script, la ligne est :

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 3
```

## Les trois transitions

| Valeur | À l'écran                                                                                           | Images à fournir                                        | Taille          |
| ------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------- |
| `3`    | Une barre bleue et blanche défile derrière un **VS** blanc, puis le portrait glisse                 | `bar_dpp_<battle sprite>` et `mugshot_<battle sprite>`  | 576x60 et 96x60 |
| `10`   | Même chorégraphie, barre plus rapide, **VS** rouge barré qui vibre                                  | `bar_hgss_<battle sprite>` et `mugshot_<battle sprite>` | 576x65 et 96x60 |
| `11`   | La capture d'écran se coupe en deux, des projecteurs balayent l'image, le portrait traverse l'écran | `mugshot_<battle sprite>` uniquement                    | 96x60           |

Tous ces fichiers se placent dans `graphics/battlebacks/vs_bar/`.

Les barres font 576 pixels de large pour un écran de 320 parce qu'elles défilent en boucle : cette largeur supplémentaire est ce qui permet au motif d'avancer sans raccord visible.

Les logos **VS** et les fonds de la Team Rocket sont livrés avec PSDK et partagés par tous les dresseurs, on n'a donc jamais à les fournir. La transition Team Rocket prend ses fonds dans `graphics/transitions/assets/team_rocket/` et n'emprunte que le portrait au dossier `vs_bar`.

## Nommer ses fichiers

La fin de chaque nom de fichier est le **battle sprite** de l'adversaire, l'image utilisée pour le dresseur sur l'écran de combat. On ouvre le dresseur dans Pokémon Studio, on va dans l'onglet **Resources** et on lit le nom sous **Battle sprite**. Un dresseur dont le battle sprite est `dp_13` a besoin de :

- `bar_dpp_dp_13.png` pour la transition Diamant/Perle/Platine
- `bar_hgss_dp_13.png` pour celle de HeartGold/SoulSilver
- `mugshot_dp_13.png` pour le portrait, commun aux trois

Deux dresseurs qui partagent le même battle sprite partagent donc la même barre VS et le même portrait, ce qui est en général le comportement voulu pour une classe de dresseur récurrente.

On peut aussi déposer un fichier nommé d'après le seul préfixe, sans nom de dresseur : `bar_dpp.png`, `bar_hgss.png` ou `mugshot.png`. PSDK cherche d'abord le fichier propre au dresseur, et se rabat sur celui-là quand il ne le trouve pas. C'est le moyen pratique de donner une image correcte à tous les adversaires sans dessiner une barre par dresseur.

Si aucun des deux n'existe, rien ne plante : l'image manque simplement dans l'animation. En lançant le jeu en mode debug, une ligne `Defaulting to file` s'affiche dans la console et indique le nom que PSDK a fini par chercher. Une barre vide ou un portrait absent vient presque toujours d'une faute de frappe dans le nom de fichier.

## Ajouter son propre dresseur

1. Dans Pokémon Studio, ouvrir le dresseur, aller dans **Resources** et noter le nom sous **Battle sprite**.
2. Dessiner le portrait sur une zone de 96x60 et l'enregistrer sous `mugshot_<battle sprite>.png`.
3. Pour la transition `3` ou `10`, dessiner aussi la barre, 576x60 pour la première, 576x65 pour la seconde, et l'enregistrer sous `bar_dpp_<battle sprite>.png` ou `bar_hgss_<battle sprite>.png`.
4. Copier les fichiers dans le dossier `graphics/battlebacks/vs_bar/` du projet.
5. Dans l'événement qui lance le combat, régler la variable 31 sur `3`, `10` ou `11` avant de démarrer le combat, puis la remettre à sa valeur habituelle après.
6. Lancer le jeu et déclencher le combat.

Dans les deux transitions de champion d'arène, le portrait est d'abord assombri et ne s'éclaire qu'au moment où l'écran flashe : une silhouette lisible en noir vaut donc mieux qu'un détail fin.

## Ce que contient le pack

Le dossier `vs_bar` arrive avec des barres et des portraits d'exemple, utilisables tels quels ou comme gabarit de départ. Quelques points méritent d'être connus avant de construire dessus :

- `bar_hgss_001` à `bar_hgss_005` font 320x128, et non les 576x65 attendus par la transition. Ils appartiennent à un autre lot et ne défileront pas correctement. On prend plutôt `bar_hgss_006` et les suivants comme référence.
- `vs_green.png`, `vs_transparent.png` et `hgss_border.png` ne sont utilisés nulle part par PSDK. Ce sont des restes du pack, on peut les ignorer.
- Les graphismes ont été rassemblés par **SirLinfey**. On garde ce crédit dans son jeu si on les livre tels quels, et on préfère ses propres ressources dès que possible.

## Conclusion

- La transition est choisie par la **variable de jeu 31**, pas par un interrupteur : `3` pour l'intro de champion d'arène de Diamant/Perle/Platine, `10` pour celle de HeartGold/SoulSilver, `11` pour la Team Rocket.
- Cette même variable pilote aussi les transitions de combat sauvage : on la remet à sa valeur habituelle une fois le combat terminé.
- Tous les fichiers vivent dans `graphics/battlebacks/vs_bar/` et se terminent par le nom du **Battle sprite** de l'adversaire, lu dans l'onglet **Resources** de Pokémon Studio.
- Les barres font 576x60 pour la transition DPP et 576x65 pour celle de HGSS ; les portraits font 96x60 et servent aux trois transitions.
- Un fichier nommé d'après le seul préfixe, comme `mugshot.png`, sert de valeur par défaut pour tous les dresseurs qui n'en ont pas.
- Pour construire sa propre transition au lieu d'utiliser celles fournies, voir [Créer une transition de combat personnalisée](/psdk/3d-camera/creer-une-transition-de-combat).
