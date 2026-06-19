---
title: "FollowMe et le mode Let's Go"
slug: followme
sidebar_position: 4
description: "FollowMe est le système PSDK qui fait suivre des personnages au joueur sur la carte : Pokémon de l'équipe, PNJ, ou un seul Pokémon de tête en mode Let's Go. Ce guide explique la pile de followers, les interrupteurs et variables qui le pilotent depuis les événements ou en script, le follower Let's Go, et comment contrôler les followers et les événements suiveurs."
---

**FollowMe** est le système PSDK qui fait suivre des personnages au joueur sur la carte : Pokémon de l'équipe, PNJ, ou un seul Pokémon de tête en mode Let's Go. Ce guide explique la pile de followers, les interrupteurs et variables qui le pilotent depuis les événements ou en script, le follower Let's Go, et comment contrôler les followers et les événements suiveurs.

## Le problème : une équipe vivante

Les Pokémon modernes laissent rarement le joueur marcher seul. Le Pokémon de tête se promène derrière le joueur comme dans Pokémon Let's Go, un rival escorte le joueur le long d'une route, un Pokémon capturé trotte à sa suite jusqu'à être déposé. Chacun de ces cas est un personnage qui copie le trajet du joueur avec un décalage d'une case, qui tourne quand le joueur tourne, qui s'arrête quand le joueur s'arrête.

Scripter cela à la main sur chaque carte est sans espoir : il faudrait enregistrer les déplacements du joueur et les rejouer sur chaque personnage, frame par frame, sur chaque case. **FollowMe** s'en charge. Il maintient une **pile de followers** derrière le joueur et met à jour leur position à chaque frame, si bien qu'on décide seulement *qui* suit et *quand*, jamais *comment* ils se déplacent.

## Comment FollowMe fonctionne

FollowMe est le module `Yuki::FollowMe`. À chaque frame, tant que le joueur est sur la carte, il reconstruit la pile de followers à partir de trois sources, toujours dans le même ordre :

1. Les **humains** (PNJ / héros), pris parmi les acteurs du jeu. L'acteur 1 (`$game_actors[1]`) est le joueur, donc les followers humains commencent au deuxième (`$game_actors[2]`, `$game_actors[3]`...).
2. Les **Pokémon de l'équipe**, pris dans l'équipe du joueur (`$actors`), ou un **seul Pokémon de tête** quand le mode Let's Go est activé.
3. Les **Pokémon d'un allié**, pris dans une équipe secondaire (`$storage.other_party`), utilisée pour les scénarios d'escorte ou de coopération.

Chaque source a un **compte** : combien d'entités en sont issues suivent actuellement. Un compte de `0` signifie que la source ne contribue à personne. La pile entière est la concaténation des trois, donc une seule file de personnages suit le joueur dans cet ordre. Les **Pokémon K.O. sont ignorés automatiquement**, donc on ne recalcule jamais les comptes après un combat.

Le point essentiel à comprendre est que FollowMe stocke toute sa configuration dans **un interrupteur et quelques variables**. Les méthodes de `Yuki::FollowMe` n'en sont que de fines enveloppes. Cela signifie qu'on peut piloter le système soit depuis les commandes d'événement RMXP (Gestion des interrupteurs / Gestion des variables), soit par des appels de script, selon ce qui convient à l'événement qu'on construit.

## Interrupteurs et variables

Voici l'interrupteur du système et les variables que FollowMe lit. On peut les définir directement avec les commandes d'événement **Gestion des interrupteurs** et **Gestion des variables**, ou via l'accesseur `Yuki::FollowMe` correspondant.

| ID | Type | Rôle | Accesseur script |
| --- | --- | --- | --- |
| Interrupteur **19** | Interrupteur | Système entier activé/désactivé (`Sw::FM_Enabled`) | `Yuki::FollowMe.enabled` |
| Interrupteur **29** | Interrupteur | Mode Let's Go activé/désactivé (`Sw::FollowMe_LetsGoMode`) | `Yuki::FollowMe.in_lets_go_mode?` / `lets_go_mode=` |
| Variable **18** | Variable | Nombre de followers humains (`Var::FM_N_Human`) | `Yuki::FollowMe.human_count` |
| Variable **19** | Variable | Nombre de Pokémon de l'équipe suiveurs (`Var::FM_N_Pokem`) | `Yuki::FollowMe.pokemon_count` |
| Variable **20** | Variable | Nombre de Pokémon alliés suiveurs (`Var::FM_N_Friend`) | `Yuki::FollowMe.other_pokemon_count` |
| Variable **21** | Variable | Follower sélectionné pour le déplacement (`Var::FM_Sel_Foll`) | `Yuki::FollowMe.selected_follower` |

À noter que l'interrupteur 19 et la variable 19 n'ont aucun rapport : l'un est l'interrupteur d'activation, l'autre est le compte de Pokémon de l'équipe. Ils vivent dans des espaces d'interrupteurs et de variables séparés.

Tout cela est sauvegardé avec la partie du joueur, si bien qu'une configuration de followers survit à la sauvegarde et au chargement sans travail supplémentaire.

## Activer les followers et choisir qui suit

Activer le système tient en un seul interrupteur. Depuis un événement, on utilise **Gestion des interrupteurs** pour mettre l'interrupteur 19 sur ON. En script :

```ruby
Yuki::FollowMe.enabled = true
```

Interrupteur désactivé, la pile est vidée et personne ne suit ; activé, les comptes prennent effet. On définit ensuite combien d'entités suivent, par source. Depuis un événement, on utilise **Gestion des variables** sur les variables 18, 19 et 20 ; en script :

```ruby
# Les 3 premiers Pokémon de l'équipe du joueur suivent
Yuki::FollowMe.pokemon_count = 3

# Un PNJ (l'acteur d'id 2) suit le joueur
Yuki::FollowMe.human_count = 1

# Deux Pokémon de l'équipe alliée suivent
Yuki::FollowMe.other_pokemon_count = 2
```

Chaque setter correspond à une source :

- `pokemon_count` (variable 19) prend les **N premiers Pokémon de l'équipe du joueur**, dans l'ordre de l'équipe, en ignorant ceux qui sont K.O.
- `human_count` (variable 18) prend **N acteurs à partir de l'id 2**. L'acteur 1 est le joueur, donc `human_count = 1` ajoute l'acteur 2, `human_count = 2` ajoute les acteurs 2 et 3, et ainsi de suite. On configure l'apparence de ces acteurs comme n'importe quel héros RMXP.
- `other_pokemon_count` (variable 20) prend les **N premiers Pokémon de l'équipe secondaire** (`$storage.other_party`), l'équipe utilisée pour les escortes.

Les trois sont aussi des getters, donc on peut lire la configuration courante avant de la changer. Une configuration courante tient en deux lignes dans un événement : activer le système et faire suivre le Pokémon de tête.

```ruby
Yuki::FollowMe.enabled = true
Yuki::FollowMe.pokemon_count = 1
```

Pour que tout le monde cesse de suivre, on remet les comptes à `0`, ou on désactive l'interrupteur 19 (`Yuki::FollowMe.enabled = false`).

## Le mode Let's Go

La configuration ci-dessus affiche les **N premiers** Pokémon de l'équipe. Mais les jeux Let's Go font autrement : un **seul** Pokémon suit, et ce n'est pas forcément le premier de l'équipe. Le joueur ouvre le menu d'équipe et choisit quel Pokémon marche avec lui. C'est le **mode Let's Go**, basculé par l'interrupteur 29.

```ruby
Yuki::FollowMe.lets_go_mode = true
```

Quand cet interrupteur est activé, la source de l'équipe est lue autrement : au lieu des `pokemon_count` premiers Pokémon, la pile affiche **exactement un** Pokémon, celui stocké comme follower Let's Go. Dans ce mode, `pokemon_count` (variable 19) est ignoré pour la source de l'équipe ; les sources humaine et alliée fonctionnent comme avant.

Le Pokémon choisi est conservé dans `$storage.lets_go_follower`. Le joueur le définit normalement depuis le **menu d'équipe** : quand le mode Let's Go est activé, chaque Pokémon gagne un choix **Suivre** / **Ne plus suivre** (ces choix n'apparaissent qu'en mode Let's Go). On peut aussi le définir depuis un script, par exemple pour forcer un starter à suivre juste après l'avoir reçu :

```ruby
# Faire du premier Pokémon de l'équipe le follower Let's Go
$storage.lets_go_follower = $actors[0]

# Retirer le follower (personne ne marche derrière le joueur)
$storage.lets_go_follower = nil
```

Le follower doit être **vivant** et **toujours dans l'équipe** pour être affiché : si le Pokémon choisi tombe K.O. ou est retiré, FollowMe n'affiche simplement personne jusqu'à ce qu'un follower valide soit redéfini.

## Mettre les followers en pause

On a parfois besoin de masquer les followers un instant, une cinématique, une séquence scriptée, sans oublier la configuration. Désactiver puis réactiver l'interrupteur 19 fonctionne, mais il faudrait retenir soi-même l'état précédent. FollowMe offre un duo dédié pour cela :

```ruby
# Masquer les followers tout en retenant qu'ils étaient activés
Yuki::FollowMe.smart_disable

# Plus tard, les restaurer dans leur état précédent
Yuki::FollowMe.smart_enable
```

`smart_disable` retient que le système était activé et le désactive ; `smart_enable` le remet dans l'état qu'il avait. La seule subtilité est que les followers sont masqués tant que le joueur est à vélo, donc un système qui les réactive doit sauter la restauration quand le joueur est en train de rouler :

```ruby
Yuki::FollowMe.smart_enable unless $game_switches[Yuki::Sw::EV_Bicycle] || $game_switches[Yuki::Sw::EV_AccroBike]
```

## Déplacer un seul follower depuis un événement

Les followers reflètent normalement le joueur automatiquement, mais une cinématique a parfois besoin qu'un follower agisse de son côté, par exemple pour marcher jusqu'à un PNJ pendant que le joueur reste immobile. FollowMe permet de **rediriger les commandes de déplacement du joueur vers un follower choisi**.

On définit le **follower sélectionné** (variable 21) par sa position dans la pile (1 pour le premier follower, 2 pour le deuxième, et ainsi de suite) :

```ruby
# Les commandes de déplacement « joueur » qui suivent pilotent désormais le premier follower
Yuki::FollowMe.selected_follower = 1
```

Tant que c'est défini, le reflet automatique est suspendu pour ce follower, et un itinéraire visant le joueur déplace le follower à la place, si bien qu'on peut réutiliser les outils de commande de déplacement habituels sur lui. On le remet à `0` pour rendre le contrôle au joueur :

```ruby
Yuki::FollowMe.selected_follower = 0
```

L'index commence à **1** et est borné au nombre de followers, `0` signifiant « aucun follower sélectionné » (la valeur par défaut). Depuis un script, on peut aussi atteindre un follower directement : `Yuki::FollowMe.get_follower(0)` renvoie le premier follower (ici l'index commence à 0), et retombe sur le joueur si l'index est invalide. Pour agir sur tous à la fois, on itère :

```ruby
# Tourner chaque follower vers le bas
Yuki::FollowMe.each_follower { |character| character.turn_down }
```

## Faire suivre un événement

La pile de followers ci-dessus est le système équipe-et-PNJ. Il existe un second mécanisme, de plus bas niveau : faire suivre **n'importe quel événement de la carte** au joueur ou à un autre événement, comme un Pokémon qu'on escorte sur une seule carte. Cela se fait avec `set_follower`, directement sur le personnage qui doit être suivi.

```ruby
# Faire suivre l'événement 5 au joueur (placé derrière les followers existants)
$game_player.set_follower(get_character(5))

# Faire suivre l'événement 1 à l'événement 2
get_character(2).set_follower(get_character(1))
```

`get_character(id)` est l'aide de l'interpréteur pour atteindre un événement de la carte par son id (et le joueur via `-1`). Quand on attache un événement au joueur, il est placé en **queue** de la file de suiveurs, après les Pokémon et les PNJ déjà présents, donc il ne les déloge jamais.

Pour détacher tout ce qui suit le joueur, on réinitialise la file :

```ruby
$game_player.reset_follower
```

C'est la façon propre de terminer une escorte : l'événement cesse de suivre le joueur et la pile de followers habituelle reprend.

## Garder les followers au-dessus des ponts

Quand le joueur marche sur un pont, le moteur élève sa couche Z pour qu'il se dessine au-dessus des tuiles en dessous. Ses followers doivent se déplacer avec lui, sinon ils s'afficheraient sous le pont. On déplace toute la file d'un coup :

```ruby
# Élever le joueur et chaque follower sur la couche du pont
$game_player.change_z_with_follower(4)

# Retour au niveau du sol
$game_player.change_z_with_follower(0)
```

`change_z_with_follower` définit le Z du joueur et le propage à chaque follower de la file, si bien que les personnages qui suivent restent sur la même couche que le joueur.

## Ce que le moteur gère pour vous

Le reste de FollowMe tourne sans intervention, et il vaut la peine de savoir ce qu'il ne faut *pas* scripter :

- **Les warps.** Quand le joueur change de carte, le moteur repositionne les followers autour du joueur, ou les ramène sur le joueur pour une entrée en intérieur. La file se reforme sur la nouvelle carte gratuitement.
- **Les combats.** Avant un combat, le moteur sauvegarde la position des followers et la restaure ensuite. Un Pokémon défini comme follower Let's Go bénéficie même d'une animation d'envoi dédiée quand il entre en combat.

Au quotidien, on règle l'interrupteur, les comptes et le mode ; la tuyauterie des warps, des combats et des particules s'occupe d'elle-même.

## Pour aller plus loin

- Le [Scheduler](/psdk/core-systems/scheduler) est ce qui pilote la mise à jour par frame de FollowMe et ses hooks de warp. On le lit pour comprendre *quand* le moteur recalcule la pile.
- Les [System Tags](/psdk/core-systems/les-system-tags) régissent la façon dont le terrain réagit sous chaque personnage, y compris les followers qui marchent derrière le joueur.

## Conclusion

- **FollowMe** (`Yuki::FollowMe`) maintient une pile de personnages qui suivent le joueur, reconstruite à chaque frame à partir de trois sources : humains, Pokémon de l'équipe et Pokémon d'un allié, dans cet ordre.
- Le système est piloté par l'**interrupteur 19** (activé/désactivé) et les **variables 18, 19, 20** (les comptes), définissables depuis les commandes d'événement ou via les accesseurs `enabled=`, `human_count=`, `pokemon_count=` et `other_pokemon_count=`. Les Pokémon K.O. sont ignorés, et la configuration est sauvegardée avec la partie.
- Le **mode Let's Go** (interrupteur 29) remplace la source de l'équipe par un seul Pokémon, `$storage.lets_go_follower`, que le joueur choisit via le choix Suivre / Ne plus suivre du menu d'équipe.
- On met les followers en pause avec `smart_disable` / `smart_enable` (en gardant la restauration contre les interrupteurs de vélo), et on déplace un seul follower depuis un événement avec `selected_follower` (variable 21, à partir de 1, `0` pour relâcher).
- On fait suivre n'importe quel événement avec `set_follower` et on le détache avec `reset_follower` ; on garde une file groupée à travers les ponts avec `change_z_with_follower`.
- Les warps, les combats et les particules sont gérés automatiquement.
