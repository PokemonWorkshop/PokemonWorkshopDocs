---
title: "Scripter un combat de dresseur"
slug: scripter-un-combat
sidebar_position: 1
description: "Ce guide explique comment construire un combat de dresseur depuis un script, pour les cas à l'exécution que l'éditeur de Pokémon Studio seul ne couvre pas : une équipe adverse qui dépend de l'état du jeu, assemblée à partir des données Studio existantes."
---

Ce guide explique comment construire un combat de dresseur depuis un script, pour les cas à l'exécution que l'éditeur de Pokémon Studio seul ne couvre pas : une équipe adverse qui dépend de l'état du jeu, assemblée à partir des données Studio existantes.

Pour lancer un combat **sauvage** à la place, voir [Démarrer un combat sauvage](/rpg-maker-xp/demarrer-un-combat-sauvage).

## Pourquoi scripter un combat de dresseur

Pokémon Studio édite déjà toute la partie **statique** d'un combat. Un dresseur porte une équipe complète, un sac, un niveau d'IA, un gain d'argent et des dialogues, et chaque Pokémon peut avoir sa forme, son genre, sa nature, ses IV, ses EV, son objet tenu, ses capacités, son talent et son côté chromatique. Pour un combat figé, l'éditeur suffit et un script n'apporte rien.

On passe au script quand le camp adverse doit se décider **à l'exécution** :

- Un dresseur dont l'équipe **dépend de l'état du jeu** : un rival qui contre le starter du joueur, ou une « tour des dresseurs » dont les niveaux s'adaptent au joueur.
- Le simple fait de lancer un combat depuis **sa propre logique** plutôt que depuis un événement de carte.

## Construire le combat

Quand on a besoin du contrôle total du camp adverse, ou d'une équipe qui dépend du joueur, on construit le combat soi-même avec `Battle::Logic::BattleInfo`, l'objet sur lequel repose au final tout combat.

Ce guide suppose qu'on est à l'aise avec les bases Ruby du [cours Ruby](/ruby/variables-et-types-de-donnees), en particulier les [méthodes et blocs](/ruby/methodes-et-blocs), les [chaînes et symboles](/ruby/chaines-et-symboles) et, pour la dernière section, le [prepend](/ruby/etendre-du-code-avec-prepend). Si une syntaxe ci-dessous est nouvelle, c'est là qu'on se met à jour.

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

Ici, `$actors` est le tableau global de PSDK contenant l'équipe actuelle du joueur. `data_trainer` charge le dresseur Studio (par db_symbol ou id), et `encounter.to_creature(level)` construit chacun de ses Pokémon au niveau passé, on omet l'argument pour conserver les niveaux définis dans Studio. Un seul dresseur alimente désormais toute une tour de combats de plus en plus durs.

### Exemple : un rival qui contre le starter du joueur

Au lieu de construire trois rivaux quasi identiques par affrontement dans Studio, on en écrit **un** et on ajoute à son équipe le contre du starter du joueur au lancement du combat :

```ruby
# À remplacer par la façon dont le projet enregistre le starter choisi (ici une variable de jeu contenant un db_symbol).
player_starter = $game_variables[10]
counter = { bulbasaur: :charmander, charmander: :squirtle, squirtle: :bulbasaur }[player_starter]

trainer = data_trainer(:rival_route_1)
party = trainer.party.map(&:to_creature)
party << PFM::Pokemon.generate_from_hash(id: counter, level: party.map(&:level).max)

bag = PFM::Bag.new
trainer.bag_entries.each { |entry| bag.add_item(entry[:dbSymbol], entry[:amount]) }

bi = Battle::Logic::BattleInfo.new
bi.add_party(0, *bi.player_basic_info)
bi.add_party(1, party, trainer.name, trainer.class_name, trainer.resources, bag, trainer.base_money, trainer.ai)
$scene.call_scene(Battle::Scene, bi)
```

On écrit le rival une fois et le rapport de types suit le choix du joueur. La même approche « charger puis modifier » ouvre d'autres idées : un dresseur de grind dont l'équipe est tirée des Pokémon que le joueur a capturés, ou des dresseurs « fantômes » qui rejouent l'équipe d'un autre joueur.

## Ajuster les Pokémon d'un dresseur à l'exécution avec extra

Les exemples ci-dessus reconstruisent tout le combat. Souvent, on veut seulement retoucher **un Pokémon** d'un dresseur existant, et cela se fait sans assembler de `BattleInfo`. Chaque entrée de `trainer.party` est un `Group::Encounter` porteur d'un hash `extra` mutable, celui-là même que Studio remplit avec les réglages par Pokémon (nature, IV, objet tenu, etc.). On le mute avant que le combat démarre et le changement est appliqué à la génération de l'équipe.

### Surcharger un réglage Studio à l'exécution

Studio fixe déjà chacune de ces valeurs en statique. `extra` prend son intérêt quand la valeur doit dépendre de l'**état du jeu** : la difficulté, un interrupteur de scénario ou les choix du joueur. On charge le dresseur, on retouche les entrées voulues, puis on lance le combat avec `start_trainer_battle` :

```ruby
trainer = data_trainer(0)              # le dresseur écrit dans Studio

if $game_switches[1]                   # un interrupteur « mode difficile », par exemple
  boss = trainer.party[0]              # son premier Pokémon (un Group::Encounter)
  boss.extra[:stats] = [31, 31, 31, 31, 31, 31] # IV parfaits
  boss.extra[:item] = :leftovers                 # force un objet tenu
end

start_trainer_battle(0)                # lance le combat contre ce dresseur
```

`start_trainer_battle(id)` construit et démarre le combat de dresseur à notre place, sans aucun `BattleInfo`. Les clés que `extra` comprend reprennent les champs par Pokémon de Studio :

| Champ Studio | Clé `extra` | Valeur |
| --- | --- | --- |
| Surnom | `:given_name` | une `String` |
| Genre | `:gender` | `1` (mâle) ou `2` (femelle) |
| Nature | `:nature` | un db_symbol, ex. `:adamant` |
| IV | `:stats` | `[hp, atk, dfe, spd, ats, dfs]`, chacun de `0` à `31` |
| EV | `:bonus` | `[hp, atk, dfe, spd, ats, dfs]` |
| Objet tenu | `:item` | un db_symbol d'objet, ex. `:leftovers` |
| Talent | `:ability` | un db_symbol de talent |
| Capacités | `:moves` | un tableau de db_symbols de capacités |
| Bonheur | `:loyalty` | un `Integer` |

Régler l'une de ces valeurs dans Studio ou l'écraser ici, c'est la même opération : on ne recourt à `extra` que lorsque la valeur ne peut pas être fixée d'avance.

### Transporter ses propres données avec une clé personnalisée

:::note[Optionnel, avancé]
Cette sous-section rouvre une classe et utilise `module`, `prepend` et `super`. Si les clés `extra` intégrées du tableau ci-dessus couvrent déjà le besoin, on peut la sauter.
:::

`extra` est un simple hash : on peut aussi y stocker une clé dont PSDK ignore tout :

```ruby
trainer.party[0].extra[:my_flag] = true
```

PSDK ignore les clés qu'il ne connaît pas, et il ne les recopie **pas** sur le Pokémon généré : seule, cette ligne ne fait donc rien. Pour qu'une clé personnalisée agisse, on la relit soi-même. La voie propre est d'étendre le constructeur de `PFM::Pokemon` avec un module `prepend`, la convention du [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk) (sa mécanique est détaillée dans [Étendre du code avec prepend](/ruby/etendre-du-code-avec-prepend)), et de garder la valeur sur le Pokémon :

```ruby
module PFM
  class Pokemon
    module ExtraFlagReader
      def initialize(*args)
        super
        # le hash d'options est optionnel et arrive en dernier, on le récupère prudemment
        options = args.last.is_a?(Hash) ? args.last : {}
        @my_flag = options[:my_flag]
      end

      # @return [Boolean, nil]
      attr_reader :my_flag
    end
    prepend ExtraFlagReader
  end
end
```

Désormais, tout Pokémon généré depuis une entrée dont l'`extra` portait `:my_flag` répond à `pokemon.my_flag`, et l'on peut s'en servir, dans ses propres scripts ou dans un plugin, pour aiguiller. C'est ainsi qu'un plugin transforme un Pokémon écrit dans Studio en « boss » sans qu'on reconstruise le dresseur à la main.

## Lire le résultat

On enregistre `$game_temp.battle_proc` **avant** de lancer la scène ; il est appelé avec le code de résultat à la fin du combat :

```ruby
$game_temp.battle_proc = proc do |result|
  # 0 = joueur gagne, 1 = joueur fuit, 2 = joueur perd, 3 = ennemi fuit
  case result
  when 0
    # gérer la victoire
  when 2
    # gérer la défaite
  end
end
$scene.call_scene(Battle::Scene, bi)
```

Le même résultat positionne aussi les interrupteurs globaux `BT_Victory`, `BT_Player_Flee` et `BT_Defeat`, qu'un événement lancé après le combat peut tester.

## Conclusion

- Studio édite les données statiques ; on script un combat de dresseur pour les affrontements qui dépendent du runtime, ou pour le lancer depuis sa propre logique.
- On construit un `Battle::Logic::BattleInfo`, on ajoute le joueur sur le banc 0 et le dresseur sur le banc 1, puis on lance avec `$scene.call_scene(Battle::Scene, bi)`.
- On charge les dresseurs Studio existants avec `data_trainer` et `to_creature(level)` pour **réutiliser et modifier** leurs équipes : scaler une tour des dresseurs, ou contrer le starter du joueur, sans cloner de dresseurs dans l'éditeur.
- Ajuster un seul Pokémon d'un dresseur existant via son hash `extra` : surcharger un réglage Studio à l'exécution, ou transporter une clé personnalisée que son propre `prepend` relit, puis lancer avec `start_trainer_battle`.
- On lit le résultat via `$game_temp.battle_proc` (ou les interrupteurs `BT_Victory` / `BT_Defeat`) pour aiguiller son événement.
- Pour un combat sauvage, voir le guide [Démarrer un combat sauvage](/rpg-maker-xp/demarrer-un-combat-sauvage).
