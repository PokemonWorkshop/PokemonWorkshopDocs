---
title: "Comment manipuler les chaînes et les symboles ?"
slug: chaines-et-symboles
sidebar_position: 2
description: "Ce guide approfondit les String et les Symbol introduits au chapitre 1. On découvre les outils que Ruby offre pour transformer, formater et comparer du texte."
---

Ce guide approfondit les String et les Symbol introduits au chapitre 1. On découvre les outils que Ruby offre pour transformer, formater et comparer du texte.

## Principe

On a vu qu'une String est du texte et qu'un Symbol est un identifiant. Dans ce chapitre, on va apprendre à manipuler les String : les modifier, les découper, les aligner. On verra aussi pourquoi les Symbol sont si importants et comment passer de l'un à l'autre.

## Rappel : guillemets simples et doubles

Les guillemets simples créent un texte brut. Les guillemets doubles permettent l'interpolation (`#{}`) et les séquences d'échappement :

```ruby live
name = 'Pikachu'

# Guillemets simples : texte brut, pas d'interpolation
puts 'Bonjour, #{name}'     # Affiche : Bonjour, #{name}

# Guillemets doubles : interpolation et séquences d'échappement
puts "Bonjour, #{name} !"   # Affiche : Bonjour, Pikachu !
puts "Ligne 1\nLigne 2"     # Affiche sur deux lignes
```

- `\n` crée un retour à la ligne. `\t` crée une tabulation. Ces séquences ne fonctionnent qu'avec les guillemets doubles.
- Règle simple : guillemets simples par défaut, guillemets doubles si on a besoin d'interpolation ou de `\n`.

## Les textes multi-lignes (heredoc)

Pour écrire un texte sur plusieurs lignes sans enchaîner les `\n`, Ruby propose les **heredoc** :

```ruby
description = <<~TEXT
  Pikachu est un Pokémon de type Électrik.
  Il évolue depuis Pichu par bonheur.
TEXT

puts description
```

- `<<~TEXT` ouvre le heredoc. Le texte se termine quand Ruby rencontre `TEXT` seul sur une ligne.
- Le `~` supprime l'indentation commune, ce qui permet d'indenter le texte dans le code sans que les espaces apparaissent à l'affichage.
- Le mot `TEXT` est un choix arbitraire. On pourrait écrire `<<~DESCRIPTION` ou n'importe quel autre mot.

## Interpolation vs concaténation

Il y a deux façons de combiner du texte et des variables. La première, l'interpolation, on la connaît déjà :

```ruby
name = 'Dracaufeu'
level = 36

# Interpolation (à privilégier)
puts "#{name} est niveau #{level}"

# Concaténation (à éviter)
puts name + ' est niveau ' + level.to_s
```

- L'interpolation convertit automatiquement les valeurs en texte. La concaténation exige un appel à `.to_s` sinon Ruby lève une erreur.
- L'interpolation est plus lisible, plus courte, et plus performante. C'est toujours le bon choix.

## Connaître la taille d'une String

```ruby
puts 'Pikachu'.length    # => 7
puts 'Pikachu'.size      # => 7
puts ''.length           # => 0
```

- `.length` et `.size` font exactement la même chose. Utiliser l'un ou l'autre, c'est une question de préférence.

## Changer la casse

Ruby offre plusieurs méthodes pour changer les majuscules et minuscules :

```ruby live
puts 'pikachu'.upcase        # => PIKACHU
puts 'PIKACHU'.downcase      # => pikachu
puts 'pikachu'.capitalize    # => Pikachu
puts 'Pikachu'.swapcase      # => pIKACHU
```

- `.upcase` met tout en majuscules. `.downcase` met tout en minuscules.
- `.capitalize` met la première lettre en majuscule et le reste en minuscules.
- `.swapcase` inverse chaque lettre (majuscule devient minuscule et vice versa). C'est rarement utile, mais bon à connaître.

## Supprimer les espaces

```ruby
name = '  Pikachu  '

puts name.strip     # => "Pikachu"   (supprime les espaces des deux côtés)
puts name.lstrip    # => "Pikachu  " (supprime à gauche seulement)
puts name.rstrip    # => "  Pikachu" (supprime à droite seulement)
```

- `.strip` est très utile quand on récupère du texte saisi par un utilisateur, qui contient souvent des espaces en trop.

## Chercher dans une String

```ruby
puts 'Bulbizarre'.include?('zarre')       # => true
puts 'Bulbizarre'.include?('Feu')         # => false
puts 'Bulbizarre'.start_with?('Bulb')     # => true
puts 'Bulbizarre'.end_with?('zarre')      # => true
```

- Ces méthodes retournent `true` ou `false`. Le `?` à la fin est la convention Ruby pour les méthodes qui posent une question.
- La recherche est sensible à la casse : `'Pikachu'.include?('pika')` retourne `false`.

## Remplacer du texte

```ruby
phrase = 'Pikachu utilise Tonnerre. Pikachu gagne !'

# Remplacer la première occurrence
puts phrase.sub('Pikachu', 'Raichu')
# => Raichu utilise Tonnerre. Pikachu gagne !

# Remplacer toutes les occurrences
puts phrase.gsub('Pikachu', 'Raichu')
# => Raichu utilise Tonnerre. Raichu gagne !
```

- `.sub` remplace uniquement la **première** occurrence. `.gsub` remplace **toutes** les occurrences (le `g` signifie "global").
- Ces méthodes retournent une nouvelle String. L'originale n'est pas modifiée.

## Répéter une String

L'opérateur `*` permet de répéter une String :

```ruby
puts '=' * 30       # => ==============================
puts 'Pika' * 3     # => PikaPikaPika
```

- C'est très pratique pour créer des lignes de séparation ou des barres visuelles.

## Aligner du texte

Ruby permet d'aligner du texte dans un espace de largeur fixe :

```ruby
puts 'Pikachu'.ljust(15)          # => "Pikachu        "
puts 'Pikachu'.rjust(15)          # => "        Pikachu"
puts 'Pikachu'.center(15)         # => "    Pikachu    "
puts 'Pikachu'.center(15, '-')    # => "----Pikachu----"
```

- `.ljust(n)` aligne à gauche sur `n` caractères en remplissant avec des espaces à droite.
- `.rjust(n)` aligne à droite. `.center(n)` centre le texte.
- On peut remplacer l'espace par un autre caractère en le passant en second argument.

## Formater des nombres dans du texte

Pour afficher un nombre avec un format précis (zéros en tête, décimales fixes), Ruby offre la méthode `format` :

```ruby
pokedex_number = 6
health = 88.5

puts format('No.%03d', pokedex_number)    # => No.006
puts format('PV: %.1f%%', health)         # => PV: 88.5%
```

- `%03d` signifie : un entier (`d`) sur au moins 3 caractères (`3`), complété par des zéros (`0`).
- `%.1f` signifie : un nombre décimal (`f`) avec 1 chiffre après la virgule.
- `%%` affiche un vrai `%` (sinon Ruby pense que c'est un format).

## Les Symbol en profondeur

On a vu au chapitre 1 que les Symbol sont des identifiants. Voyons pourquoi ils sont différents des String :

```ruby
# Deux Symbol identiques sont le même objet en mémoire
puts :fire.object_id            # => toujours le même nombre
puts :fire.object_id            # => exactement le même nombre

# Deux String identiques sont des objets différents
puts 'fire'.object_id           # => un nombre
puts 'fire'.object_id           # => un nombre différent !
```

- Chaque fois qu'on écrit `'fire'`, Ruby crée un **nouvel objet** en mémoire. Chaque fois qu'on écrit `:fire`, Ruby réutilise le **même objet**.
- C'est pour cela que la comparaison entre Symbol est instantanée : Ruby compare juste un numéro, pas chaque caractère un par un.

## Convertir entre String et Symbol

```ruby
type_symbol = :fire
type_string = type_symbol.to_s    # => "fire"

type_string = 'water'
type_symbol = type_string.to_sym  # => :water
```

- `.to_s` convertit un Symbol en String. `.to_sym` convertit une String en Symbol.
- On a parfois besoin de ces conversions pour afficher un Symbol (qui ne peut pas être interpolé tel quel sans `.to_s`, mais l'interpolation appelle `.to_s` automatiquement).

## Quand utiliser String vs Symbol

- **Symbol** : pour tout ce qui est un identifiant interne. Un type de Pokémon (`:fire`), un statut (`:poisoned`), une clé dans une structure de données.
- **String** : pour tout ce qui est du texte affiché ou manipulé. Un nom de Pokémon (`'Pikachu'`), une description, un message.

En cas de doute : est-ce qu'on va afficher cette valeur à l'utilisateur ? Si oui, c'est une String. Est-ce qu'on va l'utiliser comme étiquette pour identifier quelque chose ? Si oui, c'est un Symbol.

## Conclusion

- Les guillemets simples créent un texte brut. Les guillemets doubles permettent l'interpolation et les séquences d'échappement (`\n`, `\t`).
- Toujours préférer l'interpolation à la concaténation.
- `.upcase`, `.downcase`, `.capitalize` changent la casse. `.strip` supprime les espaces.
- `.include?`, `.start_with?`, `.end_with?` cherchent dans une String.
- `.sub` remplace la première occurrence, `.gsub` toutes les occurrences.
- `*` répète une String. `.ljust`, `.rjust`, `.center` alignent du texte.
- `format` permet de formater des nombres avec des zéros en tête ou des décimales fixes.
- Les Symbol sont immuables et uniques en mémoire. Utiliser `.to_s` et `.to_sym` pour convertir.
