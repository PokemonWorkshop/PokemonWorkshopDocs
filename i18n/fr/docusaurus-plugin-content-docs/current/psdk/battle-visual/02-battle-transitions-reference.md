---
title: "Référence des transitions de combat"
slug: reference-des-transitions-de-combat
sidebar_position: 2
description: "PSDK fournit treize transitions de combat sauvage et douze transitions de dresseur, toutes choisies par la même variable de jeu. Cette page les liste côte à côte, avec la valeur à mettre, ce qui se joue à l'écran, et les graphismes utilisés par chacune."
---

PSDK fournit treize transitions de combat sauvage et douze transitions de dresseur, toutes choisies par la même variable de jeu. Cette page les liste côte à côte, avec la valeur à mettre, ce qui se joue à l'écran, et les graphismes utilisés par chacune.

## Comment la transition est choisie

Quand un combat démarre, une courte animation se joue avant que les combattants apparaissent. Cette animation est la **transition**, et elle est choisie par la **variable de jeu 31**, que PSDK expose aussi sous le nom `Yuki::Var::TrainerTransitionType`.

Cette seule variable alimente **deux listes distinctes**. Quand le combat oppose un dresseur, PSDK lit la valeur dans la liste des dresseurs. Quand c'est une rencontre sauvage, il lit la *même* valeur dans la liste des combats sauvages. Les deux listes n'ont rien en commun, donc une valeur désigne deux animations différentes :

- `3` correspond à l'intro de **champion d'arène de Diamant/Perle/Platine** dans un combat de dresseur, et au balayage **Rubis/Saphir** dans une rencontre sauvage.
- `0` correspond à l'intro de dresseur **X/Y** dans un combat de dresseur, et au balayage **Rouge/Bleu/Jaune** dans une rencontre sauvage.

:::warning[Remettre la variable après un combat spécial]
La variable 31 garde sa valeur tant que rien ne la change. On la met à `3` pour un champion d'arène, on oublie de la remettre, et toutes les rencontres sauvages qui suivent jouent le balayage Rubis/Saphir au lieu de celui d'habitude. On ajoute toujours une seconde commande **Gestion des variables** après le combat, qui la remet à la valeur utilisée normalement dans le projet, `0` par défaut.
:::

Pour la régler depuis un événement, on ajoute une commande **Gestion des variables** avant celle qui lance le combat. Depuis un script, la ligne est :

```ruby
$game_variables[Yuki::Var::TrainerTransitionType] = 3
```

Dans les deux tableaux ci-dessous, les chemins de la colonne **Graphismes** sont relatifs à `graphics/transitions/` sauf mention contraire. Tous ces fichiers sont fournis avec PSDK, on n'a donc besoin d'y toucher que pour rhabiller une transition.

## Transitions de combat sauvage

Elles se jouent quand le combat n'oppose pas un dresseur.

| Valeur | À l'écran                                                                                                                            | Graphismes                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `0`    | **Rouge/Bleu/Jaune.** L'écran flashe, un balayage plein écran se joue, puis les combattants glissent depuis les deux côtés           | `spritesheets/rby_wild`                                                                              |
| `1`    | **Or.** Même chorégraphie que `0`, balayage différent                                                                                | `spritesheets/gold_wild`                                                                             |
| `2`    | **Cristal.** Même chorégraphie que `0`, balayage différent                                                                           | `spritesheets/crystal_wild`                                                                          |
| `3`    | **Rubis/Saphir.** L'écran se coupe en deux moitiés entrelacées qui glissent à gauche et à droite, découvrant du noir                 | `black_screen`                                                                                       |
| `4`    | **Diamant/Perle/Platine.** La même coupure que `3`, avec un motif d'entrelacement différent                                          | `black_screen`                                                                                       |
| `5`    | **HeartGold/SoulSilver.** Même chorégraphie que `0`, balayage plus lent : 1,5 seconde au lieu de 0,5                                 | `spritesheets/heartgold_soulsilver_wild`                                                             |
| `6`    | **HeartGold/SoulSilver, grotte.** Comme `5` avec le balayage de grotte                                                               | `spritesheets/heartgold_soulsilver_cave_wild`                                                        |
| `7`    | **HeartGold/SoulSilver, mer.** L'écran ondule, une bulle monte en oscillant, puis une vague et un panneau noir défilent vers le haut | `assets/heartgold_soulsilver_sea_wild_01`, `assets/heartgold_soulsilver_sea_wild_02`, `black_screen` |
| `8`    | **Noir/Blanc.** L'écran se déforme en anneau grandissant tout en zoomant jusqu'à trois fois sa taille                                | Aucun, l'effet est calculé                                                                           |
| `9`    | **Diamant/Perle/Platine, grotte.** Un masque dissout l'écran pendant qu'il zoome jusqu'à trois fois sa taille autour de son centre   | `shaders/diamant_perle_wild`                                                                         |
| `10`   | **Rubis/Saphir, grotte.** Un masque dissout l'écran en une seconde, sans aucun zoom                                                  | `shaders/ruby_saphir_wild`                                                                           |
| `11`   | **Noir/Blanc, mer.** L'écran se déforme pendant 1,5 seconde                                                                          | Aucun, l'effet est calculé                                                                           |
| `12`   | **Diamant/Perle/Platine, mer.** L'écran ondule, puis un masque le dissout au bout d'une demi-seconde                                 | `shaders/shader_003`, voir la note ci-dessous                                                        |

Le masque de la transition `12` est la seule exception au nommage : PSDK le demande sous le nom `shaders/diamant_perle_sea_wild`, alors que le fichier fourni est `shaders/shader_003.png`. La transition fonctionne telle quelle, mais si on remplace ce graphisme, on nomme son fichier `shader_003.png` plutôt que le nom annoncé par le moteur.

## Transitions de dresseur

Elles se jouent quand le combat oppose un dresseur.

| Valeur | À l'écran                                                                                                                                                                                                     | Graphismes                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`    | **X/Y.** L'écran s'assombrit à travers six masques, puis un fond avec un dégradé et trois halos défilants apparaît, et l'artwork de l'adversaire monte dans le cadre, la petite copie d'abord, puis la grande | `battle_bg`, `battle_deg`, `battle_halo1`, `battle_halo2`, `black_out00` à `black_out05`, plus l'artwork du dresseur que l'on fournit, voir plus bas |
| `1`    | **Diamant/Perle/Platine.** Une image fait un tour complet en zoomant d'un cinquième de l'écran jusqu'à l'écran entier, puis deux animations s'enchaînent                                                      | `spritesheets/diamant_perle_trainer_01`, `spritesheets/diamant_perle_trainer_02`                                                                     |
| `2`    | **Rouge/Bleu/Jaune.** Un masque balaie l'écran pendant 2,75 secondes, puis les combattants glissent depuis les deux côtés                                                                                     | `shaders/rby_trainer`                                                                                                                                |
| `3`    | **Champion d'arène Diamant/Perle/Platine.** Transition VS bar, voir [Mettre en place une transition de dresseur VS bar](/psdk/battle-visual/transitions-vs-bar)                                               | La barre et le portrait sont à dessiner soi-même                                                                                                     |
| `4`    | **HeartGold/SoulSilver.** Même chorégraphie que `1` avec les images HeartGold/SoulSilver                                                                                                                      | `spritesheets/heartgold_soulsilver_trainer_01`, `spritesheets/heartgold_soulsilver_trainer_02`                                                       |
| `5`    | **Rubis/Saphir.** L'écran flashe six fois en 1,5 seconde, puis un masque le dissout                                                                                                                           | `shaders/ruby_saphir_trainer`                                                                                                                        |
| `6`    | **Battle Frontier, vertical.** Comme `5` avec un motif de masque vertical                                                                                                                                     | `shaders/battle_frontier_vertical`                                                                                                                   |
| `7`    | **Battle Frontier, horizontal.** Comme `5` avec un motif de masque horizontal                                                                                                                                 | `shaders/battle_frontier_horizontal`                                                                                                                 |
| `8`    | **Red.** Une Poké Ball dorée se tient au centre de l'écran pendant qu'il flashe six fois, puis un balayage se joue par-dessus                                                                                 | `pokeball_gold`, `spritesheets/crystal_wild`                                                                                                         |
| `9`    | **Noir/Blanc.** L'écran zoome légèrement, puis se déforme pendant 1,4 seconde                                                                                                                                 | Aucun, l'effet est calculé                                                                                                                           |
| `10`   | **Champion d'arène HeartGold/SoulSilver.** Transition VS bar, voir [Mettre en place une transition de dresseur VS bar](/psdk/battle-visual/transitions-vs-bar)                                                | La barre et le portrait sont à dessiner soi-même                                                                                                     |
| `11`   | **Team Rocket.** Transition VS bar, voir [Mettre en place une transition de dresseur VS bar](/psdk/battle-visual/transitions-vs-bar)                                                                          | `assets/team_rocket/hgss_bg_1`, `assets/team_rocket/hgss_bg_2`, `assets/team_rocket/hgss_strobes`, plus le portrait que l'on fournit                 |

Les trois transitions VS bar sont les seules transitions fournies qui attendent des images de notre part, parce qu'elles montrent le visage de l'adversaire. Leurs noms de fichiers, leurs tailles de canevas et leurs règles de nommage sont couverts dans [Mettre en place une transition de dresseur VS bar](/psdk/battle-visual/transitions-vs-bar).

## Ce qui se passe sur une valeur absente de la liste

Rien ne plante. Les deux listes ont une entrée de repli, et toutes les deux pointent vers la transition Rouge/Bleu/Jaune. Une rencontre sauvage lancée avec la variable 31 à `13` joue donc le balayage Rouge/Bleu/Jaune, et un combat de dresseur lancé à `12` joue la transition de dresseur Rouge/Bleu/Jaune.

C'est bon à savoir au moment de déboguer : une animation Rouge/Bleu/Jaune inattendue signifie en général que la variable 31 contient une valeur qui n'existe pas dans la liste lue, et bien souvent que le combat que l'on croyait être un combat de dresseur est lu comme un combat sauvage.

## Quelle image de dresseur la transition affiche

Une transition de dresseur doit montrer l'adversaire quelque part, et PSDK laisse chaque transition choisir laquelle des images du dresseur elle veut. Trois sont disponibles, et ce sont les trois champs de l'onglet **Resources** d'un dresseur dans Pokémon Studio : **Battle sprite**, **Artwork - Full** et **Artwork - Small**.

Toutes les transitions fournies utilisent le **Battle sprite**, sauf une : la transition X/Y, valeur `0`, qui demande l'**Artwork - Full**. Elle attend deux fichiers dans `graphics/battlers/`, dérivés de ce nom : un se terminant par `_sma` pour la petite copie qui apparaît en premier, et un se terminant par `_big` pour la grande qui monte dans le cadre. Si l'on met la variable 31 à `0` pour un dresseur dont le champ **Artwork - Full** est vide, la transition n'a rien à montrer.

Si l'on écrit sa propre transition et que l'on veut lui faire lire une autre image, ce choix se déclare à côté de la classe de transition. Voir [Créer une transition de combat personnalisée](/psdk/battle-visual/3d-camera/creer-une-transition-de-combat).

La caméra 3D réutilise les deux listes : chaque transition présentée ici a une contrepartie 3D, générée automatiquement à partir de la 2D, donc les valeurs de ces tableaux restent valables avec la caméra activée.

## Conclusion

- La **variable de jeu 31** choisit la transition, et une même valeur pointe vers deux animations différentes : une dans la liste des dresseurs, une dans la liste des combats sauvages.
- On remet toujours la variable 31 après un combat spécial, sinon les rencontres sauvages qui suivent héritent de sa valeur.
- PSDK fournit treize transitions sauvages, valeurs `0` à `12`, et douze transitions de dresseur, valeurs `0` à `11`. Tous leurs graphismes sont livrés avec le moteur.
- Une valeur hors de la liste ne plante pas : elle retombe sur la transition Rouge/Bleu/Jaune.
- Les trois transitions VS bar, valeurs `3`, `10` et `11`, sont les seules à demander des images de notre part, et la transition X/Y, valeur `0`, est la seule à lire l'**Artwork - Full** du dresseur au lieu du **Battle sprite**.
