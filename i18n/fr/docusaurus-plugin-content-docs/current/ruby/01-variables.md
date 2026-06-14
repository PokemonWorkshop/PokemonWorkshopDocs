---
title: "Comment utiliser les variables et les types de données ?"
slug: variables-et-types-de-donnees
sidebar_position: 1
description: "Ce guide est le premier d'une série de cours Ruby. Dans ce premier chapitre, on découvre comment stocker des informations dans des variables."
---

Ce guide est le premier d'une série de cours Ruby. Dans ce premier chapitre, on découvre comment stocker des informations dans des variables.

Aucune connaissance préalable en programmation n'est requise. On part de zéro.

## Prérequis

Avant de commencer, il faut avoir Ruby et un éditeur de code installés sur sa machine. Si ce n'est pas encore fait, suivre le guide "Comment préparer son environnement de développement" dans la section Divers des tutoriels.

## Tester du code avec IRB

Tout au long de ce chapitre, on va écrire de petits bouts de code pour comprendre chaque concept. Le moyen le plus rapide de tester du Ruby est d'utiliser **IRB** (Interactive Ruby). C'est une console qui exécute du Ruby ligne par ligne et affiche immédiatement le résultat.

Pour lancer IRB, ouvrir un terminal (dans VSCode : menu Terminal > New Terminal) et taper :

```bash
irb
```

On obtient un prompt `irb(main):001:0>` où l'on peut taper du Ruby :

```
irb(main):001:0> 1 + 1
=> 2
irb(main):002:0> 'Pikachu'.length
=> 7
```

- Chaque ligne est exécutée immédiatement. Le résultat est affiché après `=>`.
- Pour quitter IRB, taper `exit`.
- IRB est parfait pour tester une opération rapide, vérifier un comportement, ou expérimenter. On l'utilisera beaucoup dans les premiers chapitres.

## Principe

Un programme manipule des données : un nom, un nombre, une liste. Pour pouvoir utiliser ces données, il faut les stocker quelque part. C'est le rôle d'une **variable** : un nom qui pointe vers une valeur.

On peut voir une variable comme une étiquette collée sur une boîte. L'étiquette (le nom) permet de retrouver ce que contient la boîte (la valeur). À tout moment, on peut changer le contenu de la boîte sans changer l'étiquette.

## Créer une variable

En Ruby, créer une variable est aussi simple qu'écrire un nom, le signe `=`, puis la valeur qu'on veut stocker :

```ruby
name = 'Pikachu'
level = 25
```

- `name` est le nom de la variable. On a choisi ce nom, il pourrait être n'importe quoi d'autre.
- `=` est l'opérateur d'affectation. Il dit "la variable à gauche contient maintenant la valeur à droite".
- `'Pikachu'` est la valeur qu'on stocke : ici, un texte (qu'on appelle une **chaîne de caractères** ou **String**).
- `level` stocke un nombre entier (**Integer**).

On peut ensuite utiliser ces variables partout où on aurait mis la valeur directement :

```ruby live
name = 'Pikachu'
level = 25

puts name     # Affiche : Pikachu
puts level    # Affiche : 25
```

- `puts` est une commande qui affiche une valeur à l'écran. C'est l'un des premiers outils qu'on utilise pour vérifier que notre code fait bien ce qu'on attend.

## Changer la valeur d'une variable

On peut remplacer le contenu d'une variable à tout moment. L'ancienne valeur est simplement oubliée :

```ruby
name = 'Pikachu'
puts name          # Affiche : Pikachu

name = 'Évoli'
puts name          # Affiche : Évoli
```

- La variable `name` pointe d'abord vers `'Pikachu'`, puis vers `'Évoli'`. Le nom ne change pas, seul le contenu change.

## Les types de données

Toutes les valeurs ne se ressemblent pas. Un nom est du texte, un niveau est un nombre, un statut légendaire est vrai ou faux. Ruby distingue ces différents **types de données**. Voyons les principaux.

### Les nombres entiers (Integer)

Un Integer est un nombre sans virgule. On l'utilise pour les niveaux, les numéros de Pokédex, les points de vie :

```ruby
pokedex_number = 25
level = 50
max_team_size = 6
```

Pour les grands nombres, Ruby autorise les underscores `_` pour faciliter la lecture. Le programme les ignore complètement :

```ruby
# Ces deux lignes sont identiques pour Ruby
experience = 1000000
experience = 1_000_000
```

### Les nombres décimaux (Float)

Un Float est un nombre avec une virgule (en Ruby, on utilise le point `.` comme séparateur décimal) :

```ruby
damage_multiplier = 1.5
capture_rate = 0.75
```

- On utilise les Float quand on a besoin de précision décimale, comme les multiplicateurs de dégâts.

### Le texte (String)

Une String est une suite de caractères entourée de guillemets. Ruby accepte les guillemets simples `'...'` ou doubles `"..."` :

```ruby
pokemon_name = 'Pikachu'
description = "Un adorable Pokémon de type Électrik"
```

La différence entre les deux est importante. Les guillemets doubles permettent d'**insérer des variables dans le texte** grâce à la syntaxe `#{}`. C'est ce qu'on appelle l'**interpolation** :

```ruby live
name = 'Pikachu'
level = 25

# Avec les guillemets doubles : l'interpolation fonctionne
puts "#{name} est niveau #{level}"    # Affiche : Pikachu est niveau 25

# Avec les guillemets simples : l'interpolation ne fonctionne PAS
puts '#{name} est niveau #{level}'    # Affiche : #{name} est niveau #{level}
```

- L'interpolation est très pratique pour construire des phrases à partir de variables. On l'utilisera constamment.
- Règle simple : si le texte contient des variables, utiliser les guillemets doubles. Sinon, les guillemets simples suffisent.

### Les symboles (Symbol)

Un Symbol ressemble à une String, mais il commence par `:` et n'a pas de guillemets :

```ruby
pokemon_type = :electric
status = :healthy
```

Quelle différence avec une String ? Un Symbol est un **identifiant figé**. On ne le modifie jamais, on le compare. C'est comme une étiquette gravée dans le marbre, alors qu'une String est un texte qu'on peut réécrire.

En pratique :

- On utilise un Symbol quand la valeur est un **identifiant** : un type de Pokémon (`:fire`, `:water`), un statut (`:poisoned`), une nature (`:adamant`).
- On utilise une String quand la valeur est un **texte affiché à l'utilisateur** : un nom, une description, un message.

```ruby
# Symbol -- un identifiant, toujours le même
pokemon_type = :electric

# String -- du texte destiné à l'affichage
pokemon_name = 'Pikachu'
```

### Les booléens (true / false)

Un booléen représente une valeur qui est soit vraie (`true`), soit fausse (`false`). On l'utilise pour les questions dont la réponse est oui ou non :

```ruby
is_legendary = false
is_alive = true
has_mega_evolution = true
```

- Il n'y a pas de classe `Boolean` en Ruby. `true` est de type `TrueClass` et `false` est de type `FalseClass`. C'est une curiosité du langage, pas besoin de s'en souvenir pour l'instant.

### L'absence de valeur (nil)

Parfois, une variable n'a tout simplement pas de valeur. En Ruby, on utilise `nil` pour dire "rien", "vide", "pas défini" :

```ruby
held_item = nil
secondary_type = nil
```

- `nil` n'est pas zéro, ni une chaîne vide. C'est l'absence totale de valeur.
- Un Pokémon mono-type n'a pas de type secondaire. `nil` exprime exactement cette idée.

## Connaître le type d'une valeur

Ruby permet de demander à n'importe quelle valeur quel est son type. Deux outils sont utiles pour cela :

```ruby
puts 'Pikachu'.class     # => String
puts 25.class            # => Integer
puts 1.5.class           # => Float
puts :electric.class     # => Symbol
puts true.class          # => TrueClass
puts nil.class           # => NilClass
```

- `.class` demande à une valeur "de quel type es-tu ?".

On peut aussi poser la question autrement : "es-tu de tel type ?" :

```ruby
puts 25.is_a?(Integer)        # => true
puts 25.is_a?(Float)          # => false
puts 'Pikachu'.is_a?(String)  # => true
```

- `.is_a?` répond par `true` ou `false`. Le `?` à la fin du nom est une convention Ruby : les méthodes qui posent une question se terminent par `?`.

## Afficher et déboguer

On a vu `puts` pour afficher. Il existe un second outil très utile : `p`.

```ruby
name = 'Pikachu'
types = [:electric]

puts name    # => Pikachu       (affichage propre, pour l'utilisateur)
p name       # => "Pikachu"     (affichage technique, pour le développeur)

puts types   # => electric       (affiche chaque élément sur une ligne)
p types      # => [:electric]    (montre la structure complète)

puts nil     # =>                (affiche une ligne vide)
p nil        # => nil            (affiche le mot nil)
```

- `puts` affiche la valeur de façon lisible. C'est ce qu'on utilise pour les messages destinés à l'utilisateur.
- `p` affiche la valeur de façon technique, avec les guillemets, les crochets, etc. C'est ce qu'on utilise quand on veut comprendre exactement ce que contient une variable. C'est un outil de **debug**.

## Les opérateurs d'affectation composés

On a souvent besoin de modifier une variable en fonction de sa valeur actuelle. Par exemple, augmenter l'expérience de 100 points. On pourrait écrire :

```ruby
experience = 0
experience = experience + 100
puts experience    # => 100
```

Ruby offre un raccourci avec `+=` :

```ruby
experience = 0
experience += 100    # Équivalent à : experience = experience + 100
puts experience      # => 100
```

Voici les principaux raccourcis :

```ruby
experience = 100
experience += 50     # addition         => 150
experience -= 20     # soustraction     => 130
experience *= 2      # multiplication   => 260
experience /= 4      # division         => 65
experience %= 10     # modulo (reste de la division) => 5
```

- `+=` est de loin le plus courant. Les autres sont utiles mais moins fréquents.
- Le modulo (`%`) retourne le reste d'une division. `10 % 3` donne `1` car 10 divisé par 3 fait 3 reste 1.

## Nommer ses variables

En Ruby, les noms de variables suivent une convention appelée `snake_case` : tout en minuscules, les mots séparés par des underscores :

```ruby
# Bons noms
pokemon_name = 'Pikachu'
max_health_points = 142
is_legendary = false

# Mauvais noms -- à éviter
pokemonName = 'Pikachu'    # c'est du camelCase, pas utilisé en Ruby
n = 'Pikachu'              # trop court, impossible à comprendre
x = 142                    # même problème
```

- Un bon nom de variable décrit ce qu'elle contient. Quelqu'un qui lit le code doit comprendre sans effort ce que représente chaque variable.
- Jamais d'abréviation : `pokemon_name` et jamais `pkmn_name` ou `pn`.

## Les constantes

Certaines valeurs ne changent jamais pendant l'exécution du programme. Le nombre maximum de Pokémon dans une équipe est toujours 6. On les définit comme des **constantes**, en majuscules :

```ruby
MAX_TEAM_SIZE = 6
POKEDEX_VERSION = '0.1.0'
TYPE_FIRE = :fire
```

- Les constantes utilisent le `SCREAMING_SNAKE_CASE` : tout en majuscules, séparé par des underscores.
- Ruby affiche un avertissement si on modifie une constante, mais ne l'empêche pas. C'est une convention, pas une interdiction technique.

## Conclusion

- Une **variable** est un nom qui pointe vers une valeur. On la crée avec `=`.
- Ruby a 6 types fondamentaux : **Integer** (nombre entier), **Float** (nombre décimal), **String** (texte), **Symbol** (identifiant), **Boolean** (`true`/`false`), et **nil** (absence de valeur).
- Les **Symbol** servent d'identifiants (`:fire`, `:water`). Les **String** servent pour le texte affiché.
- L'**interpolation** (`"#{variable}"`) insère une variable dans un texte. Elle ne fonctionne qu'avec les guillemets doubles.
- `puts` affiche pour l'utilisateur, `p` affiche pour le debug.
- Les noms de variables utilisent le `snake_case`. Les constantes utilisent le `SCREAMING_SNAKE_CASE`.
- `.class` donne le type d'une valeur. `.is_a?` vérifie si une valeur est d'un certain type.
