---
title: "Comment scripter un combat de dresseur ?"
slug: scripter-un-combat-de-dresseur
sidebar_position: 1
description: "Ce guide explique comment lancer un combat de dresseur entièrement personnalisé depuis un script, en construisant un objet Battle::Logic::BattleInfo, en lui fournissant les équipes du joueur et du dresseur, puis en démarrant la scène de combat."
---

Ce guide explique comment lancer un combat de dresseur entièrement personnalisé depuis un script, en construisant un objet Battle::Logic::BattleInfo, en lui fournissant les équipes du joueur et du dresseur, puis en démarrant la scène de combat.

## Pourquoi scripter un combat

La façon habituelle de lancer un combat de dresseur consiste à créer le dresseur dans Pokémon Studio, puis à appeler l'une des commandes d'événement intégrées : `start_trainer_battle`, `start_double_trainer_battle` ou `start_double_trainer_battle_with_friend`. C'est suffisant pour la plupart des combats, mais l'équipe est **figée à la conception** : le même appel produit toujours (à peu de chose près) le même combat.

Cela devient un mur dès que l'adversaire doit dépendre de l'état du jeu :

- Une **Tour de Combat** ou un **Battle Frontier** où l'équipe ennemie s'adapte au niveau ou à l'équipe du joueur, au lieu de préconstruire mille dresseurs à la main dans l'éditeur.
- Un **rival** dont l'équipe, les surnoms ou le genre restent cohérents tout au long du jeu sans verrouiller manuellement chaque attribut.
- Tout combat dont le **nom, la classe ou l'effectif** du dresseur se décide à l'exécution.

Pour tous ces cas, on construit le combat soi-même via `Battle::Logic::BattleInfo`, l'objet que les commandes d'événement alimentent justement en coulisses.

## Ce qu'est `Battle::Logic::BattleInfo`

`Battle::Logic::BattleInfo` est l'objet de données qui décrit tout ce dont la scène de combat a besoin pour démarrer : qui se bat, sur combien de bancs, avec quelle musique et selon quelles règles. Lancer un combat revient, au final, à transmettre un `BattleInfo` à la scène de combat.

Il permet de configurer, entre autres :

- Les **dresseurs** qui participent (un combat peut même se dérouler sans le joueur).
- Les musiques de **combat** et de **victoire**.
- Un **plafond de niveau** (les Pokémon au-dessus sont ramenés à ce niveau, et le combat ne donne alors aucune expérience).
- L'**identifiant de combat** qui relie le combat à ses événements.

La liste complète des attributs est documentée dans la [référence YARD de BattleInfo](https://psdk.pokemonworkshop.fr/yard/Battle/Logic/BattleInfo.html).

## Construire le combat

### Étape 1 : créer l'objet BattleInfo

`BattleInfo.new` accepte un hash qui prérègle ses attributs. Les plus courants sont :

- `battle_bgm` : musique jouée au début du combat.
- `victory_bgm` : musique jouée à la victoire.
- `defeat_bgm` : musique jouée à la défaite.
- `vs_type` : nombre de Pokémon envoyés de chaque côté (1 pour un combat simple, 2 pour un double, 3 pour un triple).
- `max_level` : plafond de niveau. Les Pokémon au-dessus y sont ramenés.
- `background_name` : le nom de fichier du fond de combat. Par défaut, celui de la carte courante.
- `battle_id` : l'identifiant de combat utilisé pour charger les événements du combat (par défaut `-1`, aucun événement).
- `fishing` : si le combat a été déclenché par une canne.

Chaque attribut a une valeur par défaut, donc aucun n'est obligatoire. Les attributs audio acceptent soit un simple nom de fichier (volume et tonalité valent alors 100), soit un tableau `[fichier, volume, tonalité]`. Si on omet `battle_bgm` ou `victory_bgm`, RMXP utilise ce que les commandes d'événement ont configuré.

```ruby
# 1v1 battle, audio filenames only (volume and pitch default to 100)
bi = Battle::Logic::BattleInfo.new(
  battle_bgm: 'audio/bgm/rosa_wild_battle',
  victory_bgm: 'audio/bgm/xy_trainer_battle_victory'
)

# 2v2 battle capped at level 70, with full battle BGM info, victory BGM left to RMXP
bi = Battle::Logic::BattleInfo.new(
  vs_type: 2,
  max_level: 70,
  battle_bgm: ['audio/bgm/rosa_wild_battle', 80, 100]
)

# 1v1 battle, everything left to defaults
bi = Battle::Logic::BattleInfo.new
```

### Étape 2 : fournir les données du joueur

La plupart des combats de dresseur impliquent le joueur. Plutôt que de rassembler à la main son sprite, son équipe, son nom et son sac, `BattleInfo` expose `player_basic_info`, qui renvoie le tout prêt à l'emploi. Le joueur combat toujours sur le **banc 0** :

```ruby
bi.add_party(0, *bi.player_basic_info)
```

`player_basic_info` renvoie l'équipe du joueur, son nom, sa classe de dresseur, son sprite de combat et son sac, déstructurés directement dans `add_party`. La classe de dresseur du joueur vaut 0 par défaut, ce qui n'a pas d'importance puisqu'elle n'est jamais affichée de son côté.

### Étape 3 : fournir les données du dresseur

`add_party` est la méthode qui ajoute une équipe à un banc. Elle accepte jusqu'à dix arguments ; seuls les deux premiers sont obligatoires :

- `bank` : le banc sur lequel l'équipe combat, `0` (joueur) ou `1` (ennemi).
- `party` : un tableau de `PFM::Pokemon`, l'équipe elle-même.
- `name` : le nom du dresseur. **Sa présence sur le banc 1 est ce qui transforme le combat en combat de dresseur** (voir plus bas).
- `klass` : le nom de la classe du dresseur, par exemple `"Pkmn Trainer"`.
- `battler` : le nom de fichier du sprite dans `graphics/battlers`.
- `bag` : le sac du dresseur. L'IA y puise les objets qu'elle utilise.
- `base_money` : l'argent de base remporté (la récompense totale vaut `base_money * niveau du dernier Pokémon`).
- `ai_level` : la force de l'IA, de `0` (basique) au plus haut niveau disponible.
- `victory_text` : le message affiché quand ce dresseur est vaincu.
- `defeat_text` : le message affiché quand ce dresseur gagne.

```ruby
party = []
party << PFM::Pokemon.generate_from_hash(id: :mew, level: 100, shiny: true, given_name: 'Destroyer', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :arceus, level: 100, given_name: 'Featherweight', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :gardevoir, level: 100, given_name: 'Mega Devoir', trainer_name: 'Yuri', trainer_id: 0, item: :gardevoirite)

bag = PFM::Bag.new
bag.add_item(:full_restore, 50)
bag.add_item(:mega_glasses, 1) # Lets the AI mega-evolve, see note below

bi.add_party(1, party, 'Yuri', 'Bad Trainer', 'dp_33', bag, 255, 7)
```

`PFM::Pokemon.generate_from_hash` construit chaque Pokémon à partir d'un hash : `id` (db_symbol), `level`, `shiny`, `given_name` (surnom), `trainer_name`, `trainer_id`, `item` (objet tenu), et bien d'autres clés sont disponibles.

On peut appeler `add_party` plusieurs fois sur le même banc : ajouter une seconde équipe au banc 0 pour un allié qui combat aux côtés du joueur, ou au banc 1 pour un côté ennemi à plusieurs dresseurs.

:::note[Autoriser l'évolution méga]
L'évolution méga n'est pas débloquée par un objet-clé précis : tout objet du sac marqué **« autorise l'évolution méga »** dans Studio (`isAllowingMega`) l'active. `:mega_glasses` est l'un de ces objets par défaut, et le Pokémon doit toujours tenir sa méga-gemme (ici `:gardevoirite`). Si on retire l'objet du sac, l'IA garde une équipe normale, sans méga.
:::

### Étape 4 : démarrer le combat

Une fois le BattleInfo entièrement configuré, on le transmet à la scène de combat :

```ruby
$scene.call_scene(Battle::Scene, bi)
```

### Étape 5 : lire le résultat

`call_scene` joue le combat puis revient à la carte : le résultat est donc transmis par un callback que l'on enregistre **avant** de lancer le combat. À la fin du combat, la scène appelle `$game_temp.battle_proc` avec le code de résultat :

```ruby
$game_temp.battle_proc = proc do |result|
  # result: 0 = player won, 1 = player fled, 2 = player lost, 3 = enemy fled
  case result
  when 0
    # handle victory
  when 2
    # handle defeat
  end
end
$scene.call_scene(Battle::Scene, bi)
```

Le même résultat positionne aussi les interrupteurs globaux `BT_Victory`, `BT_Player_Flee`, `BT_Defeat` et `BT_Wild_Flee`, qu'un événement lancé après le combat peut tester directement.

## Script complet

En assemblant chaque étape, un combat de dresseur personnalisé complet donne :

```ruby
bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)

party = []
party << PFM::Pokemon.generate_from_hash(id: :mew, level: 100, shiny: true, given_name: 'Destroyer', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :arceus, level: 100, given_name: 'Featherweight', trainer_name: 'Yuri', trainer_id: 0)
party << PFM::Pokemon.generate_from_hash(id: :gardevoir, level: 100, given_name: 'Mega Devoir', trainer_name: 'Yuri', trainer_id: 0, item: :gardevoirite)

bag = PFM::Bag.new
bag.add_item(:full_restore, 50)
bag.add_item(:mega_glasses, 1)

bi.add_party(1, party, 'Yuri', 'Bad Trainer', 'dp_33', bag, 255, 7)

$game_temp.battle_proc = proc do |result|
  # 0 = player won, 1 = player fled, 2 = player lost, 3 = enemy fled
end
$scene.call_scene(Battle::Scene, bi)
```

Comme toute l'équipe est construite en Ruby, on peut désormais la piloter depuis l'état du jeu : adapter les niveaux à `$pokemon_party`, choisir l'effectif depuis une variable, ou le randomiser pour une Tour de Combat.

## Combat de dresseur ou combat sauvage

Un combat n'est traité comme un **combat de dresseur** que si le banc ennemi porte au moins un nom. En interne, le moteur tranche avec :

```ruby
def trainer_battle?
  return !@names[1].empty?
end
```

Donc si on appelle `add_party(1, party)` avec juste le banc et l'équipe (sans `name`), le côté ennemi n'a aucun nom et le combat se déroule comme un **combat sauvage**. On passe un `name` au banc 1 pour obtenir un combat de dresseur.

## Conclusion

- Construire un `Battle::Logic::BattleInfo`, en préréglant au besoin `vs_type`, `max_level` et les BGM.
- Ajouter le **joueur** sur le banc 0 avec `add_party(0, *bi.player_basic_info)`.
- Ajouter le **dresseur** sur le banc 1 avec `add_party`, en fournissant au moins un `name` pour que le combat compte comme un combat de dresseur.
- Construire chaque Pokémon avec `PFM::Pokemon.generate_from_hash` et les objets du dresseur avec `PFM::Bag`.
- Lancer le combat avec `$scene.call_scene(Battle::Scene, bi)`.
- Lire le résultat via `$game_temp.battle_proc` (ou les interrupteurs `BT_Victory` / `BT_Defeat`) pour aiguiller son événement.
- Puisque la configuration est du Ruby pur, l'équipe peut dépendre du niveau du joueur, de son équipe ou de n'importe quelle variable, ce que les dresseurs Studio figés ne savent pas faire.
