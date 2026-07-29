---
title: "Gérer le Pokédex"
slug: gerer-le-pokedex
sidebar_position: 12
description: "Dans PSDK, le Pokédex fait partie de l'état du jeu, on l'atteint via game_state.pokedex. Ce guide couvre comment donner le Pokédex au joueur, lire les compteurs de vus et de capturés, la différence entre dex régional et national, changer de dex affiché, et tester, afficher ou marquer une espèce précise depuis un event."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

Dans PSDK, le Pokédex fait partie de l'**état du jeu**, on l'atteint via `game_state.pokedex`. Ce guide couvre comment donner le Pokédex au joueur, lire les compteurs de vus et de capturés, la différence entre dex régional et national, changer de dex affiché, et tester, afficher ou marquer une espèce précise depuis un event.

L'objet Pokédex vit sur l'état du jeu. On y accède via l'accesseur global `game_state`, donc toute commande de cette page s'écrit `game_state.pokedex.quelque_chose(...)`, saisie dans la commande **Script** d'un event. Si la commande Script est nouvelle pour toi, commence par [Utiliser l'Interpreter dans un event](/rpg-maker-xp/utiliser-linterpreter-dans-un-event).

Plusieurs de ces opérations ont aussi un équivalent 100 % événementiel, via les interrupteurs et variables que PSDK réserve au dex ; chacun est indiqué au bon endroit. Le même Pokédex est aussi accessible via l'ancien global `$pokedex` que l'on croise dans les scripts existants.

## Donner le Pokédex au joueur

Le Pokédex est désactivé au début d'une nouvelle partie. On l'active quand le joueur le reçoit, en général du PNJ qui le lui remet :

```ruby
game_state.pokedex.enable
```

Cela active l'**interrupteur 100**, l'indicateur que PSDK utilise pour savoir que le joueur possède le dex. Dès lors, le joueur peut ouvrir l'écran du Pokédex et ses rencontres sont suivies normalement.

Pour le lui retirer, on le désactive :

```ruby
game_state.pokedex.disable
```

Pour savoir si le joueur l'a, `enabled?` renvoie `true` ou `false`, donc il a sa place dans l'onglet **Script** d'un **Branchement conditionnel** :

```ruby
game_state.pokedex.enabled?
```

Chacune de ces opérations a un équivalent événementiel : activer l'**interrupteur 100** donne le dex, le désactiver le retire, et consulter l'interrupteur 100 en donne l'état, sans aucun Script.

## Tester une espèce précise

:::note[Désigner une espèce]

Toute commande qui prend une espèce accepte soit son **db_symbol**, l'identifiant texte d'une espèce comme `:pikachu`, soit un ID numérique. Un ID numérique est le **numéro du Pokédex national** (l'ID de l'espèce en base), jamais la position affichée dans un dex régional.

:::

`pokemon_seen?` et `pokemon_caught?` répondent à la question de savoir si le joueur a déjà rencontré ou capturé une espèce donnée. Elles renvoient `true` ou `false`, pour l'onglet **Script** d'un **Branchement conditionnel** :

```ruby
# Le joueur a-t-il vu un Pikachu ?
game_state.pokedex.pokemon_seen?(:pikachu)

# En a-t-il capturé un ?
game_state.pokedex.pokemon_caught?(:pikachu)
```

Les deux acceptent un deuxième argument optionnel, un numéro de **forme**, pour tester une forme précise plutôt que l'espèce entière (`0` est la forme de base) :

```ruby
# Le joueur a-t-il vu la forme 2 de Rotom ?
game_state.pokedex.pokemon_seen?(:rotom, 2)
```

C'est l'outil de base des events réactifs : un PNJ qui commente ce que le joueur a capturé, une route qui s'ouvre une fois une espèce enregistrée, et ainsi de suite. Un exemple complet, un PNJ donne le dex et un contrôle ultérieur teste une capture :

```ruby
# Dans l'event du PNJ qui remet le Pokédex
game_state.pokedex.enable

# Plus tard, dans l'onglet Script d'un Branchement conditionnel qui garde une route
game_state.pokedex.pokemon_caught?(:pikachu)
```

Le premier event active le dex ; le second ne laisse passer le joueur qu'une fois qu'il a capturé un Pikachu.

## Lire les compteurs

Le Pokédex suit combien d'espèces le joueur a vues et capturées. `pokemon_seen` et `pokemon_captured` renvoient ces totaux :

```ruby
game_state.pokedex.pokemon_seen
game_state.pokedex.pokemon_captured
```

Les deux renvoient un `Integer`, donc on peut en stocker un dans une variable ou le tester, par exemple un Professeur qui récompense le joueur une fois cinquante espèces capturées :

```ruby
# Onglet Script d'un Branchement conditionnel
game_state.pokedex.pokemon_captured >= 50
```

PSDK recopie aussi les deux totaux dans la **variable 2** (vus) et la **variable 3** (capturés), tenues à jour automatiquement, si bien qu'une simple commande **Gestion des variables** les lit sans Script.

Ces totaux couvrent chaque espèce vue ou capturée sur l'ensemble du jeu. Avec le dex national standard, qui liste toutes les espèces, ce sont exactement les chiffres qu'affiche le dex national : `pokemon_seen` vaut `variant_creature_seen(:national)` et `pokemon_captured` vaut `variant_creature_caught(:national)`.

Le nombre sur l'**écran du Pokédex en jeu** n'est pas toujours ce total : il ne compte que le dex actuellement affiché (son *variant*, le db_symbol du dex à l'écran). Un dex régional ne liste qu'une région, donc il en affiche moins. On lit ce compte à l'écran avec `variant_creature_seen` et `variant_creature_caught` :

```ruby
game_state.pokedex.variant_creature_seen             # vus, pour le dex affiché
game_state.pokedex.variant_creature_caught           # capturés, pour le dex affiché
game_state.pokedex.variant_creature_seen(:regional)  # vus, pour un dex précis
```

Sans argument, ils comptent le dex actuellement affiché ; on passe le db_symbol d'un dex pour en compter un autre.

| Ce qu'on lit                                           | Ce que ça compte                               |
| ------------------------------------------------------ | ---------------------------------------------- |
| `pokemon_seen` / `pokemon_captured` (variables 2 et 3) | le total national, inchangé par le dex affiché |
| `variant_creature_seen` / `variant_creature_caught`    | uniquement le dex actuellement affiché         |

:::note

Ces méthodes portent le préfixe `pokemon_` en tant qu'alias. Les noms canoniques de PSDK sont désormais `creature_seen`, `creature_caught`, `creature_seen?` et `creature_caught?` ; les formes `pokemon_` appellent le même code et sont conservées parce qu'elles se lisent mieux dans un jeu Pokémon. Les méthodes sans alias propre au Pokémon (`mark_seen`, `mark_captured`, `variant`) s'écrivent telles quelles.

:::

## Le dex régional et le dex national

Jusqu'ici, le joueur parcourt le **dex régional** : il ne liste que les espèces de la région courante, et seules celles-là peuvent être enregistrées. Le **mode national** déverrouille toutes les espèces, donc n'importe laquelle peut être marquée vue ou capturée, et le dex national les liste toutes.

```ruby
game_state.pokedex.set_national(true)   # passer en mode national
game_state.pokedex.set_national(false)  # revenir au régional
game_state.pokedex.national?            # true quand le mode national est actif
```

Le mode national est stocké dans l'**interrupteur 99**, donc un event peut le basculer en activant ou désactivant l'interrupteur 99, et le lire de la même façon.

Comme un dex régional ne liste que sa région, la même sauvegarde y affiche un compte à l'écran plus petit que sur le dex national. Passer en mode national n'ajoute rien aux enregistrements du joueur ; cela élargit seulement ce que l'écran compte et ce qui peut être enregistré.

## Changer de dex affiché

Un projet peut définir plusieurs dex dans Pokémon Studio, chacun avec son propre db_symbol, par exemple `:regional`, `:national`, et tout dex personnalisé que l'on crée. Le Pokédex retient celui qu'il affiche actuellement :

```ruby
game_state.pokedex.variant              # le db_symbol du dex affiché
game_state.pokedex.variant = :national  # afficher le dex national désormais
game_state.pokedex.variant = :regional  # revenir au dex régional
```

Affecter un dex que le projet ne définit pas est ignoré, donc la valeur pointe toujours sur un dex réel. `set_national(true)` est un raccourci qui passe au dex `:national` **et** active le mode national ; on utilise `variant =` seul quand on veut seulement changer la liste affichée, par exemple pour montrer le dex régional d'une autre zone.

:::warning[Sortir du mode national]

Pour repasser du dex national à un dex régional, on appelle `set_national(false)` **avant** de changer le variant :

```ruby
game_state.pokedex.set_national(false)  # remet l'interrupteur 99 à false et rebascule sur un dex régional
game_state.pokedex.variant = :regional  # puis on choisit le dex exact à afficher
```

`variant = :regional` seul ne désactive **pas** le mode national : l'interrupteur 99 reste à `true`, et on se retrouve à afficher un dex régional alors que toutes les espèces sont encore considérées comme déverrouillées, un état incohérent à éviter. Seul `set_national(false)` coupe le mode national, donc il vient toujours en premier.

:::

## Marquer une espèce vue ou capturée

Quand une créature sauvage apparaît en combat et quand le joueur la capture, PSDK l'enregistre automatiquement via `mark_seen` et `mark_captured`. On en a rarement besoin à la main, mais elles existent pour le contrôle scénaristique, comme une scène qui révèle un légendaire avant tout combat :

```ruby
game_state.pokedex.mark_seen(:mew)      # enregistrer Mew comme vu
game_state.pokedex.mark_captured(:mew)  # enregistrer Mew comme capturé
```

`mark_seen` prend une forme optionnelle et un drapeau forced :

```ruby
game_state.pokedex.mark_seen(db_symbol, form = 0, forced: false)
```

- `db_symbol` — l'espèce, en db_symbol ou numéro de Pokédex national.
- `form` — la forme à enregistrer. Optionnel, `0` est la forme de base.
- `forced` — passe outre les deux gardes ci-dessous. Optionnel, `false` par défaut.

Par défaut, `mark_seen` reste sans effet dans deux cas : quand le Pokédex est désactivé, et quand l'espèce n'appartient pas à la variante de dex affichée (un dex régional n'accepte que ses propres espèces). `forced: true` passe outre les deux :

```ruby
game_state.pokedex.mark_seen(:mew, 0, forced: true)
```

Comme l'enregistrement est conservé globalement, une espèce forcée de cette façon compte quand même sur tous les dex qui la listent et sur le total national, alors que le dex affiché ne l'aurait pas acceptée de lui-même. Le mode national lève aussi la garde de variante, mais pas celle du dex désactivé, donc `forced: true` est ce qui couvre les deux. Quand PSDK enregistre les combats et les captures, il passe la forme propre de la créature (`pokemon.form`) plutôt que `0`, si bien qu'une espèce est enregistrée dans la forme exacte où elle a été rencontrée.

`mark_captured` est plus stricte que `mark_seen` ici : elle n'a pas d'option `forced`, et elle refuse toujours une espèce hors de la variante de dex courante (même si elle n'exige pas que le dex soit activé). Pour enregistrer la capture d'une espèce absente du dex régional, un légendaire par exemple, on active d'abord le mode national :

```ruby
game_state.pokedex.set_national(true)
game_state.pokedex.mark_captured(:mew)
```

Pour annuler un enregistrement, `unmark_seen` et `unmark_captured` retirent l'espèce :

```ruby
game_state.pokedex.unmark_seen(:mew)
game_state.pokedex.unmark_captured(:mew)
```

Le cas courant est une créature capturée avant que le joueur reçoive le Pokédex (voir [Donner un Pokémon au joueur](/rpg-maker-xp/donner-un-pokemon)). PSDK la marque quand même capturée, tant qu'elle appartient au dex courant ; on appelle `unmark_captured` (et `unmark_seen`) si le scénario veut que cette capture reste hors du registre.

## Afficher la fiche d'une créature

`show_pokemon` ouvre le Pokédex directement sur la fiche d'une créature. Contrairement aux commandes précédentes, c'est une [méthode de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on l'appelle sans préfixe.

```ruby
show_pokemon(pokemon_id, form = 0)
```

- `pokemon_id` — la créature à montrer : un db_symbol, un numéro de Pokédex national, ou un objet Pokémon vivant (qui conserve le statut chromatique, shiny, de cet individu).
- `form` — la forme à afficher. Optionnel, `0` est la forme de base ; ignoré pour un Pokémon vivant, qui utilise sa propre forme.

L'appel le plus simple ne prend que l'espèce :

```ruby
show_pokemon(:pikachu)
```

Ce qu'affiche la fiche dépend de l'avancée du joueur sur cette espèce :

- **Jamais vue** — la fiche s'ouvre vide : le sprite et le nom sont masqués et aucune donnée n'est affichée.
- **Vue mais pas capturée** — le sprite, le nom et le cri apparaissent, mais les détails (espèce, nom de forme, poids, taille, types) et la description restent masqués.
- **Capturée** — la fiche complète : sprite, nom, détails et description.

Donc, pour révéler une créature que le joueur n'a pas encore rencontrée, un légendaire montré pendant une cinématique par exemple, on la marque vue d'abord, sinon la fiche s'ouvre vide :

```ruby
game_state.pokedex.mark_seen(:mew, 0, forced: true)
show_pokemon(:mew)
```

Ici `forced: true` passe outre à la fois un dex désactivé et une espèce absente de la variante de dex courante (voir la section précédente).

## Conclusion

- On atteint le Pokédex via `game_state.pokedex` ; on l'active avec `enable` (interrupteur 100) avant que quoi que ce soit soit suivi.
- On teste si le joueur a vu ou capturé une espèce avec `pokemon_seen?` / `pokemon_caught?` dans un branchement conditionnel, l'outil de base des events réactifs.
- `pokemon_seen` / `pokemon_captured` (variables 2 et 3) contiennent le total national ; `variant_creature_seen` / `variant_creature_caught` donnent le compte par dex affiché à l'écran.
- Le mode national (`set_national(true)`, interrupteur 99) déverrouille toutes les espèces ; `variant =` change la liste de dex affichée, et `set_national(false)` doit venir avant lui quand on sort du mode national.
- `mark_seen` enregistre une espèce (`forced: true` passe outre un dex désactivé ou la limite de variante) ; `mark_captured` n'a pas de `forced` et exige toujours l'espèce dans le dex courant ou le mode national. `unmark_seen` / `unmark_captured` annulent un enregistrement.
- On ouvre la fiche d'une créature avec la commande d'Interpreter `show_pokemon` ; on la marque vue d'abord si elle peut être inconnue, sinon la fiche s'ouvre vide.
- Un ID numérique désigne toujours le numéro du Pokédex national, jamais la position affichée dans un dex régional.
