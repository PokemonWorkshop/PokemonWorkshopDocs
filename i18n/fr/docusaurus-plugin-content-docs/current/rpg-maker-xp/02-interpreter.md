---
title: "Comment utiliser l'Interpreter dans un event ?"
slug: utiliser-linterpreter-dans-un-event
sidebar_position: 2
description: "Dans RMXP, quand on crée un event, on dispose de commandes classiques : afficher un message, donner un objet, téléporter le joueur. Mais ces commandes sont limitées. PSDK met à disposition des dizaines de méthodes prêtes à l'emploi qu'on peut appeler directement depuis la commande Script d'un event."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

Dans RMXP, quand on crée un event, on dispose de commandes classiques : afficher un message, donner un objet, téléporter le joueur. Mais ces commandes sont limitées. PSDK met à disposition des dizaines de méthodes prêtes à l'emploi qu'on peut appeler directement depuis la commande **Script** d'un event. Ce guide explique d'où viennent ces méthodes, comment les utiliser, et surtout comment les trouver.

## Qu'est-ce que l'Interpreter ?

Quand un event s'exécute sur la map, c'est un objet appelé **Interpreter** qui traite chaque commande une par une. Cet objet est créé au lancement de la map et vit tant que la map est active. Chaque commande RMXP (afficher un message, déplacer un event, jouer un son) correspond à une méthode de cet objet.

Ce qui rend l'Interpreter puissant dans PSDK, c'est que le moteur l'**enrichit** avec de nombreuses méthodes supplémentaires. Là où RMXP de base ne sait faire que des choses simples, PSDK ajoute des méthodes pour gérer les Pokémon, lancer des combats, ouvrir des menus, déplacer la caméra, et bien plus.

## La commande Script

La commande **Script** de RMXP permet d'écrire du code Ruby qui s'exécute **à l'intérieur** de l'Interpreter. Cela signifie qu'on peut appeler directement toutes ses méthodes, sans préfixe :

```ruby
message("Hello!")
add_pokemon(:pikachu, 10)
emotion(:exclamation)
```

Ces trois lignes appellent trois méthodes de l'Interpreter. On n'a pas besoin d'écrire `self.message(...)` ou de référencer un objet — le code s'exécute déjà dans le bon contexte.

On peut aussi écrire n'importe quelle expression Ruby valide. On a accès aux variables globales (`$game_variables`, `$game_switches`, `$actors`, `$bag`...) et à tout le code du moteur.

## Les raccourcis d'accès

L'Interpreter expose des raccourcis pour accéder rapidement aux objets globaux du jeu :

| Raccourci | Retourne                 | Nom complet            |
| --------- | ------------------------ | ---------------------- |
| `gv`      | Les variables du jeu     | `$game_variables`      |
| `gs`      | Les interrupteurs du jeu | `$game_switches`       |
| `gt`      | Les données temporaires  | `$game_temp`           |
| `gm`      | La map actuelle          | `$game_map`            |
| `gp`      | Le joueur                | `$game_player`         |
| `ge(id)`  | Un event de la map       | `$game_map.events[id]` |
| `party`   | L'état du jeu            | `PFM.game_state`       |

Par exemple :

```ruby
# Modifier la variable 10
gv[10] = 42

# Activer l'interrupteur 5
gs[5] = true

# Récupérer la vitesse du joueur
gp.move_speed

# Accéder à l'event 3 de la map
ge(3)
```

Ces raccourcis sont simplement des méthodes qui retournent les objets globaux correspondants. On les utilise pour écrire du code plus concis dans la commande Script.

## Les conditions Script

Dans RMXP, la commande **Branche conditionnelle** possède un onglet **Script**. Le code écrit ici s'exécute aussi dans l'Interpreter, mais il doit retourner une valeur : si elle est **truthy** (ni `false` ni `nil`), la condition est vraie.

```ruby
# Le joueur a-t-il un Pikachu ?
$actors.any? { |pokemon| pokemon.db_symbol == :pikachu }

# La variable 10 est-elle supérieure à 50 ?
gv[10] >= 50

# L'équipe est-elle complète ?
$actors.size == 6

# Le joueur possède-t-il une Master Ball ?
$bag.contain_item?(:master_ball)
```

N'importe quelle expression Ruby fonctionne. C'est là que les raccourcis (`gv`, `gs`, etc.) deviennent très utiles pour garder le code court.

## Où trouver les méthodes disponibles

C'est la question clé : comment savoir quelles méthodes existent et quels paramètres elles acceptent ?

### La documentation en ligne

La documentation YARD de PSDK est disponible à cette adresse :

<https://psdk.pokemonworkshop.fr/yard/Interpreter.html>

La classe `Interpreter` y est documentée avec toutes ses méthodes, leurs paramètres, et leurs types. C'est la référence la plus accessible — elle ne nécessite aucune installation.

### Les fichiers source

Pour ceux qui préfèrent lire le code directement, toutes les méthodes de l'Interpreter sont définies dans le dossier `pokemonsdk/scripts/2 PSDK Event Interpreter/`. Chaque fichier correspond à un thème :

| Fichier                            | Thème                                     |
| ---------------------------------- | ----------------------------------------- |
| `100 Interpreter_Environnement.rb` | Détection du joueur, suppression d'events |
| `105 Interpreter_Camera.rb`        | Déplacement de la caméra                  |
| `110 Interpreter_Pokemon.rb`       | Ajout, retrait, modification de Pokémon   |
| `120 Interpreter_Shortcut.rb`      | Raccourcis, émotions, menus, pathfinding  |
| `121 Interpreter_add_item.rb`      | Gestion des objets                        |
| `125 Interpreter_Fiber.rb`         | Messages et choix                         |
| `130 Interpreter_Sequences.rb`     | Séquences de combat, échanges             |
| `140 Interpreter_Player.rb`        | Gestion du profil joueur                  |
| `150 Interpreter_Time.rb`          | Événements temporisés                     |
| `160 Interpreter_Overlay.rb`       | Overlays de map                           |
| `165 Interpreter_Message_Font.rb`  | Police des messages                       |

Ces fichiers font partie du code interne de PSDK. Pour y accéder, il faut suivre le guide **003 Comment préparer son environnement de développement** qui explique comment récupérer le code source du moteur.

Chaque méthode dans ces fichiers est documentée avec des commentaires YARD qui décrivent les paramètres et leur type. En lisant un fichier, on découvre rapidement tout ce qui est disponible pour un thème donné.

## Ajouter ses propres méthodes

L'Interpreter est une classe Ruby comme une autre. On peut la **rouvrir** depuis ses propres scripts pour y ajouter des méthodes. Tous les scripts placés dans le dossier `scripts/` à la racine du projet sont chargés par PSDK après le code du moteur.

Par exemple, si on veut une méthode réutilisable pour soigner toute l'équipe :

```ruby
# my-project/scripts/001 Interpreter.rb
class Interpreter
  # Heal all Pokemon in the party
  def heal_all_pokemon
    $actors.each do |pokemon|
      pokemon.hp = pokemon.max_hp
      pokemon.status = 0
      pokemon.skills_set.each { |skill| skill.pp = skill.ppmax if skill }
    end
  end
end
```

Une fois ce fichier en place, la méthode est disponible dans tous les events du jeu :

```ruby
# In a Script command
heal_all_pokemon
message("Your Pokémon have been fully healed!")
```

C'est le même principe que le monkey-patching décrit dans le guide **001 Qu'est-ce que le monkey-patch et comment l'appliquer dans PSDK** : on rouvre la classe, on ajoute une méthode, et elle devient accessible partout. La différence est qu'ici on ne modifie pas une méthode existante — on en crée une nouvelle.

C'est utile pour plusieurs raisons :

- **Factoriser** : au lieu de copier-coller le même bloc Script dans plusieurs events, on l'écrit une fois dans une méthode et on l'appelle par son nom.
- **Simplifier les events** : l'éditeur d'events de RMXP n'est pas conçu pour gérer de la logique complexe. Les branches conditionnelles imbriquées, les events à rallonge et le mélange commandes RMXP / blocs Script deviennent vite illisibles. En déplaçant cette logique dans une méthode Ruby, l'event se réduit à un simple appel, et le code est plus facile à lire, tester et modifier.

## Conclusion

- L'**Interpreter** est l'objet qui exécute les commandes des events. PSDK l'enrichit avec des dizaines de méthodes supplémentaires.
- La commande **Script** et l'onglet **Script** des branches conditionnelles exécutent du Ruby directement dans l'Interpreter.
- Les raccourcis (`gv`, `gs`, `gp`, `ge`, `party`) simplifient l'accès aux données du jeu.
- Pour découvrir les méthodes disponibles : consulter la [documentation YARD](https://psdk.pokemonworkshop.fr/yard/) ou lire les fichiers source après avoir suivi le guide **003**.
