---
title: "Comment scripter un combat ?"
slug: scripter-un-combat
sidebar_position: 1
description: "Ce guide explique comment lancer un combat depuis un script : un combat sauvage contre un Pokémon personnalisé, ou un combat de dresseur construit à partir des données Studio, pour les cas que l'éditeur de Pokémon Studio seul ne couvre pas."
---

Ce guide explique comment lancer un combat depuis un script : un combat sauvage contre un Pokémon personnalisé, ou un combat de dresseur construit à partir des données Studio, pour les cas que l'éditeur de Pokémon Studio seul ne couvre pas.

## Pourquoi scripter un combat

Pokémon Studio édite déjà toute la partie **statique** d'un combat. Un dresseur porte une équipe complète, un sac, un niveau d'IA, un gain d'argent et des dialogues ; un groupe sauvage liste ses espèces, ses fourchettes de niveau et ses taux de rencontre ; et chaque Pokémon, des deux côtés, peut avoir sa forme, son genre, sa nature, ses IV, ses EV, son objet tenu, ses capacités, son talent et son côté chromatique. Pour un combat figé, l'éditeur suffit et un script n'apporte rien.

On passe au script quand le combat doit se décider **à l'exécution** :

- Une rencontre sauvage contre un **Pokémon personnalisé unique** : un légendaire statique, un boss, un shiny avec un moveset défini.
- Un dresseur dont l'équipe **dépend de l'état du jeu** : un rival qui contre le starter du joueur, ou une « tour des dresseurs » dont les niveaux s'adaptent au joueur.
- Le simple fait de lancer un combat depuis **sa propre logique** plutôt que depuis un événement de carte.

Les deux moitiés ci-dessous couvrent chaque camp. Toutes deux passent par la même scène de combat, donc elles lisent leur résultat de la même façon (voir la dernière section).

## Scripter un combat sauvage

Le gestionnaire de combats sauvages, `$wild_battle`, lance un combat sauvage en un seul appel.

### Le combat sauvage le plus simple

On passe une espèce (db_symbol ou id) et un niveau :

```ruby
$wild_battle.start_battle(:pikachu, 12)
```

### Contre un Pokémon personnalisé

Tout l'intérêt de scripter un combat sauvage est d'affronter un Pokémon que l'on a fabriqué soi-même. On le crée avec `PFM::Pokemon.generate_from_hash` et on passe l'objet à la place d'une espèce, le niveau en argument est alors ignoré :

```ruby
legendary = PFM::Pokemon.generate_from_hash(
  id: :mewtwo,
  level: 70,
  shiny: true,
  moves: [:psystrike, :recover, :aura_sphere, :ice_beam]
)
$wild_battle.start_battle(legendary)
```

C'est ainsi que l'on script un **légendaire statique**, un boss de scénario, ou toute rencontre que les groupes aléatoires de Studio ne savent pas exprimer. `generate_from_hash` accepte les mêmes clés par Pokémon que Studio expose (`id`, `level`, `shiny`, `form`, `given_name`, `nature`, `ability`, `item`, `moves`, IV, EV, et d'autres).

### Un combat sauvage double

On passe plusieurs Pokémon, en objets ou en paires `id, niveau`. Le moteur déduit le `vs_type` de leur nombre (plafonné à 3) :

```ruby
$wild_battle.start_battle(:zubat, 8, :zubat, 8)
```

## Scripter un combat de dresseur

Quand on a besoin du contrôle total du camp adverse, ou d'une équipe qui dépend du joueur, on construit le combat soi-même avec `Battle::Logic::BattleInfo`, l'objet sur lequel repose au final tout combat.

### L'interface en bref

```ruby
bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, name, klass, battler, bag, base_money, ai_level)
$scene.call_scene(Battle::Scene, bi)
```

- `add_party(bank, party, ...)` ajoute une équipe à un banc : `0` pour le joueur, `1` pour l'ennemi. Seuls `bank` et `party` sont obligatoires ; le reste est `name, klass, battler, bag, base_money, ai_level, victory_text, defeat_text`.
- Un **`name` sur le banc 1 est ce qui fait un combat de dresseur**. Sans lui, le côté ennemi est sans nom et le combat se déroule comme un combat sauvage.
- `player_basic_info` renvoie l'équipe, le nom, la classe, le sprite et le sac du joueur, prêts à être déstructurés dans `add_party` sur le banc 0.
- `BattleInfo.new` accepte un hash pour prérégler `vs_type`, `max_level`, `battle_bgm`, `victory_bgm`, `defeat_bgm`, `background_name`, `battle_id` et d'autres.

Écrire l'équipe ennemie à la main est possible, mais les usages à forte valeur la construisent à partir de données qui existent déjà.

### Exemple : une tour des dresseurs qui scale

Plutôt que de cloner un dresseur une dizaine de fois à des niveaux croissants dans l'éditeur, on l'écrit **une fois** dans Studio et on remonte ses niveaux au moment du combat :

```ruby
trainer = data_trainer(:ace_trainer_gary)
target_level = $actors.sum(&:level) / $actors.size # le niveau moyen du joueur

party = trainer.party.map { |encounter| encounter.to_creature(target_level) }
bag = PFM::Bag.new
trainer.bag_entries.each { |entry| bag.add_item(entry[:dbSymbol], entry[:amount]) }

bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, trainer.name, trainer.class_name, trainer.resources, bag, trainer.base_money, trainer.ai)
$scene.call_scene(Battle::Scene, bi)
```

`data_trainer` charge le dresseur Studio (par db_symbol ou id), et `encounter.to_creature(level)` construit chacun de ses Pokémon au niveau passé, on omet l'argument pour conserver les niveaux définis dans Studio. Un seul dresseur alimente désormais toute une tour de combats de plus en plus durs.

### Exemple : un rival qui contre le starter du joueur

Au lieu de construire trois rivaux quasi identiques par affrontement dans Studio, on en écrit **un** et on remplace son meneur par le contre du starter du joueur au lancement du combat :

```ruby
# Replace this with however your project records the chosen starter (here a game variable holding a db_symbol).
player_starter = $game_variables[10]
counter = { bulbasaur: :charmander, charmander: :squirtle, squirtle: :bulbasaur }[player_starter]

trainer = data_trainer(:rival_route_1)
party = trainer.party.map(&:to_creature)
party[0] = PFM::Pokemon.generate_from_hash(id: counter, level: party[0].level)

bag = PFM::Bag.new
trainer.bag_entries.each { |entry| bag.add_item(entry[:dbSymbol], entry[:amount]) }

bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, trainer.name, trainer.class_name, trainer.resources, bag, trainer.base_money, trainer.ai)
$scene.call_scene(Battle::Scene, bi)
```

On écrit le rival une fois et le rapport de types suit le choix du joueur. La même approche « charger puis modifier » ouvre d'autres idées : un dresseur de grind dont l'équipe est tirée des Pokémon que le joueur a capturés, ou des dresseurs « fantômes » qui rejouent l'équipe d'un autre joueur.

## Lire le résultat

Les deux voies passent par la même scène de combat, donc elles rapportent leur résultat de la même façon. On enregistre `$game_temp.battle_proc` **avant** de lancer ; la scène l'appelle avec le code de résultat à la fin du combat :

```ruby
$game_temp.battle_proc = proc do |result|
  # 0 = player won, 1 = player fled, 2 = player lost, 3 = enemy fled
  case result
  when 0
    # handle victory
  when 2
    # handle defeat
  end
end
$wild_battle.start_battle(:pikachu, 12) # or $scene.call_scene(Battle::Scene, bi)
```

Le même résultat positionne aussi les interrupteurs globaux `BT_Victory`, `BT_Player_Flee`, `BT_Defeat` et `BT_Wild_Flee`, qu'un événement lancé après le combat peut tester. Après un combat sauvage, l'interrupteur `BT_Catch` indique si le Pokémon a été capturé.

## Conclusion

- Studio édite les données statiques ; on script un combat pour les affrontements qui dépendent du runtime, les Pokémon personnalisés uniques, ou pour lancer depuis sa propre logique.
- Pour un **combat sauvage**, on appelle `$wild_battle.start_battle(espèce, niveau)`, ou on passe un `PFM::Pokemon` construit avec `generate_from_hash` pour affronter un Pokémon entièrement personnalisé.
- Pour un **combat de dresseur**, on construit un `Battle::Logic::BattleInfo`, on ajoute le joueur sur le banc 0 et le dresseur sur le banc 1, puis on lance avec `$scene.call_scene(Battle::Scene, bi)`.
- On charge les dresseurs Studio existants avec `data_trainer` et `to_creature(level)` pour **réutiliser et modifier** leurs équipes : scaler une tour des dresseurs, ou contrer le starter du joueur, sans cloner de dresseurs dans l'éditeur.
- On lit le résultat via `$game_temp.battle_proc` (ou les interrupteurs `BT_Victory` / `BT_Defeat`) pour aiguiller son événement.
