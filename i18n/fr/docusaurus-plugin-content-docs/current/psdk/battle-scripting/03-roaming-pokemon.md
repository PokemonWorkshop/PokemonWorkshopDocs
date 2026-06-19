---
title: "Ajouter un Pokémon fuyard"
slug: pokemon-fuyards
sidebar_position: 3
description: "Ce guide explique comment ajouter un Pokémon fuyard : un Pokémon sauvage qui erre entre plusieurs cartes, apparaît au hasard et tente de fuir dès le premier tour du combat."
---

Ce guide explique comment ajouter un **Pokémon fuyard** : un Pokémon sauvage qui erre entre plusieurs cartes, apparaît au hasard et tente de fuir dès le premier tour du combat.

## Principe

Un Pokémon fuyard reproduit le comportement des légendaires comme **Raikou** et **Entei** dans les jeux officiels : au lieu de vivre dans un groupe de rencontres fixe, il se déplace de lui-même entre un ensemble de cartes. Le joueur ne sait jamais exactement où il se trouve, peut le suivre sur la carte du monde, et lorsqu'il finit par croiser sa route le Pokémon s'enfuit presque toujours dès le premier tour.

PSDK gère cela via le gestionnaire de combats sauvages, accessible depuis `$wild_battle`. Un Pokémon fuyard est enregistré une seule fois, puis le moteur s'occupe du reste :

- Il déplace le Pokémon entre les cartes selon un schéma de déplacement.
- Il effectue un test de rencontre à chaque pas tant que le joueur se trouve là où est le Pokémon.
- Il fait tenter au Pokémon une fuite en combat avec une priorité très basse (`-7`, la mécanique de la Gén 5), si bien que le joueur dispose d'une action avant que le Pokémon ne s'enfuie au premier tour.
- Il retire automatiquement le Pokémon une fois qu'il a été vaincu.

Pour capturer un Pokémon fuyard, le joueur doit rentabiliser cette unique action : lancer une Poké Ball dès le premier tour, ou utiliser un effet de blocage qui l'empêche de fuir.

## Ajouter un Pokémon fuyard

Pour enregistrer un Pokémon fuyard, on appelle `add_roaming_pokemon` sur `$wild_battle`. Un bon endroit pour le faire est l'event ou le script qui introduit le Pokémon dans le scénario (par exemple après une cinématique).

```ruby
# Add a roaming Pokemon
# @param chance [Integer] the chance divider to see the Pokemon
# @param proc_id [Integer] ID of the Wild_RoamingInfo::RoamingProcs
# @param pokemon_hash [Hash, PFM::Pokemon] hash to generate the mon (cf. PFM::Pokemon#generate_from_hash), or the Pokemon
# @return [PFM::Pokemon] the generated roaming Pokemon
$wild_battle.add_roaming_pokemon(50, 1, { id: :raikou, level: 40 })
```

- `chance` est un **diviseur** : à chaque pas où le joueur se trouve là où est le Pokémon, le moteur effectue le tirage `rand(chance) == 0`. Une valeur de `50` correspond à environ une chance sur cinquante par pas. Plus la valeur est petite, plus le Pokémon apparaît souvent.
- `proc_id` est l'index du schéma de déplacement dans `RoamingProcs` (voir la section suivante). Le schéma `1` est l'errance multi-cartes fournie par défaut.
- `pokemon_hash` est le même hash que celui utilisé par `PFM::Pokemon.generate_from_hash`. Les clés courantes sont `:id` (le db_symbol du Pokémon), `:level` et `:shiny`. On peut aussi passer directement une instance `PFM::Pokemon` existante.

Une fois cet appel exécuté, le Pokémon est actif : PSDK teste à chaque pas s'il doit apparaître, sans rien d'autre à activer.

La méthode retourne le `PFM::Pokemon` généré, ce qui permet d'en garder une référence pour l'inspecter ou le retirer plus tard.

```ruby
raikou_fuyard = $wild_battle.add_roaming_pokemon(50, 1, { id: :raikou, level: 40, shiny: true })
```

## Définir son territoire d'errance

Le `proc_id` passé à `add_roaming_pokemon` sélectionne un **schéma de déplacement**. Un schéma est un petit bloc de code, réévalué au fur et à mesure que le joueur se déplace, qui répond à une seule question : *où se trouve le Pokémon en ce moment ?* Il y répond en renseignant trois valeurs.

| Valeur | Signification |
| --- | --- |
| `map_id` | L'ID de la carte sur laquelle se trouve le Pokémon, le même numéro de carte que celui affiché dans RPG Maker XP et Pokémon Studio. |
| `zone_type` | Le type de terrain sur lequel se produit la rencontre. `1` correspond aux hautes herbes, comme une rencontre sauvage normale. |
| `tag` | Le terrain (terrain tag) sur lequel le joueur doit se tenir, tel que défini sur le tileset. `0` est la valeur par défaut. |

Les valeurs de `zone_type` sont : `0` sol normal, `1` hautes herbes, `2` très hautes herbes, `3` grotte, `4` montagne, `5` sable, `6` mare, `7` mer, `8` sous l'eau, `9` neige, `10` glace.

On n'a souvent pas besoin d'écrire de schéma soi-même. PSDK en fournit déjà deux :

- Le schéma `0` garde le Pokémon sur un emplacement fixe unique.
- Le schéma `1` le fait errer entre deux cartes dans les hautes herbes, le comportement classique des légendaires.

Pour un Pokémon fuyard standard, passer `1` comme `proc_id` suffit. On n'écrit son propre schéma que lorsqu'on veut le faire errer sur des cartes précises de son jeu.

### Écrire son propre schéma

On ajoute une nouvelle proc à `PFM::Wild_RoamingInfo::RoamingProcs`. Le plus simple garde le Pokémon sur une seule carte, dans les hautes herbes :

```ruby
# Always on map 12, in the tall grass
::PFM::Wild_RoamingInfo::RoamingProcs << proc do |infos|
  infos.map_id = 12
  infos.zone_type = 1 # tall grass
  infos.tag = 0
end
```

Pour qu'il erre réellement, on lui donne une liste de cartes et on le déplace vers une nouvelle à chaque fois que le joueur l'a rencontré :

```ruby
# Roam between maps 10, 11 and 12, in the tall grass
::PFM::Wild_RoamingInfo::RoamingProcs << proc do |infos|
  maps = [10, 11, 12]
  # Relocate when the Pokemon has not been placed yet, or once the player has met it on its current map
  if infos.map_id == -1 || (infos.map_id == $game_map.map_id && infos.spotted)
    infos.map_id = (maps - [infos.map_id]).sample
    infos.spotted = false
  end
  infos.zone_type = 1 # tall grass
  infos.tag = 0
end
```

La règle de relocalisation, ligne par ligne :

- `infos.map_id == -1` est la valeur initiale d'un Pokémon fuyard tout neuf, donc le tout premier passage le place au hasard sur l'une des cartes.
- `infos.spotted` passe à `true` une fois que le joueur a rencontré le Pokémon en combat ou ouvert la carte du monde. Le Pokémon reste donc en place tant que le joueur ne l'a pas trouvé, puis s'éloigne.
- `(maps - [infos.map_id]).sample` choisit l'une des cartes autres que la carte actuelle, si bien que l'emplacement change toujours.

Le nouveau schéma est ajouté à la fin du tableau, donc son `proc_id` est le prochain index libre : avec les deux schémas fournis (`0` et `1`), le premier qu'on ajoute vaut `2`. C'est ce numéro qu'on passe à `add_roaming_pokemon`.

Ajouter une proc de cette façon est un cas typique de monkey-patching, la manière standard d'étendre PSDK. On l'enregistre dans un script dédié pour qu'elle soit chargée avant l'ajout du Pokémon.

## Gérer les Pokémon fuyards

Le gestionnaire expose quelques méthodes utilitaires pour travailler avec les Pokémon fuyards actuellement enregistrés.

Tester si un Pokémon donné est en train d'errer. Cela sert surtout en interne pendant le combat pour activer le comportement de fuite, mais reste accessible aux scripts :

```ruby
$wild_battle.roaming?(raikou_fuyard) # => true
```

Retirer un Pokémon fuyard, par exemple lorsque le joueur le capture ou lorsque le scénario met fin à la poursuite :

```ruby
$wild_battle.remove_roaming_pokemon(raikou_fuyard)
```

Les Pokémon fuyards vaincus comme capturés sont retirés **automatiquement** : le gestionnaire supprime toute entrée dont le Pokémon est K.O., et une capture réussie le retire également. On n'a besoin de `remove_roaming_pokemon` que pour les cas que le moteur ne peut pas deviner, comme mettre fin à la poursuite depuis un event scénaristique.

Parcourir chaque Pokémon fuyard, par exemple pour vérifier son état ou l'afficher :

```ruby
$wild_battle.each_roaming_pokemon do |pokemon|
  log_info("Roaming: #{pokemon.name}")
end
```

Enfin, les Pokémon fuyards s'intègrent à la **carte du monde**. Lorsque le joueur l'ouvre, le moteur appelle `on_map_viewed`, qui marque chaque Pokémon fuyard comme repéré. C'est ce qui permet à la carte du monde d'afficher leur dernière position connue et, combiné au test `infos.spotted` ci-dessus, de déclencher leur prochain déplacement.

Les Pokémon fuyards font partie de la sauvegarde : un Pokémon encore en train d'errer au moment de la sauvegarde est restauré à sa dernière position au chargement. Leur position est également recalculée à chaque changement de carte, moment où un Pokémon repéré se déplace.

## Conclusion

- On enregistre un Pokémon fuyard avec `$wild_battle.add_roaming_pokemon(chance, proc_id, pokemon_hash)`.
- `chance` est un diviseur de rencontre, `proc_id` sélectionne un schéma de déplacement et `pokemon_hash` suit `PFM::Pokemon.generate_from_hash`.
- On définit où le Pokémon erre en ajoutant une proc à `PFM::Wild_RoamingInfo::RoamingProcs` ; son index devient le `proc_id`.
- En combat, le Pokémon tente automatiquement de fuir avec une priorité très basse (`-7`), si bien qu'il s'enfuit au premier tour, juste après que le joueur a agi.
- On utilise `roaming?`, `each_roaming_pokemon` et `remove_roaming_pokemon` pour les gérer ; les fuyards vaincus sont retirés automatiquement.
