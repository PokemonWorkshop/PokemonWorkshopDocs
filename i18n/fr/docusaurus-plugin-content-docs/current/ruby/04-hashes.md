---
title: "Comment utiliser les tables associatives ?"
slug: tables-associatives
sidebar_position: 4
description: "Ce chapitre présente les Hash (tables associatives), une structure qui associe des clés à des valeurs. Là où un Array range les éléments par position (index 0, 1, 2...), un Hash les range par nom."
---

Ce chapitre présente les **Hash** (tables associatives), une structure qui associe des **clés** à des **valeurs**. Là où un Array range les éléments par position (index 0, 1, 2...), un Hash les range par nom.

## Principe

Avec un Array, on accède à un élément par son numéro : `team[0]`. C'est pratique pour les listes ordonnées, mais pas pour décrire un objet. Pour regrouper les informations d'un Pokémon (nom, niveau, type), il faudrait se rappeler que l'index 0 est le nom, l'index 1 le niveau, etc. C'est fragile et illisible.

Un Hash résout ce problème : chaque valeur est associée à une **clé** qu'on choisit. On accède à la valeur par sa clé, pas par sa position. C'est comme un dictionnaire : on cherche un mot (la clé) pour trouver sa définition (la valeur).

## Créer un Hash

La façon la plus courante de créer un Hash utilise les accolades `{}` avec des clés Symbol :

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }
p pikachu    # => {:name=>"Pikachu", :type=>:electric, :level=>25}
```

- `name:` est la clé (un Symbol `:name`), `'Pikachu'` est la valeur.
- Les paires clé-valeur sont séparées par des virgules.
- La syntaxe `name: 'Pikachu'` est un raccourci pour `:name => 'Pikachu'`. Les deux formes sont équivalentes.

On peut aussi écrire les clés avec la **syntaxe flèche** `=>` :

```ruby
# Syntaxe flèche (ancienne, mais encore utilisée pour les clés non-Symbol)
pikachu = { :name => 'Pikachu', :type => :electric }

# Avec des clés String (rare, mais possible)
translations = { 'fire' => 'feu', 'water' => 'eau' }
```

- La syntaxe raccourcie `name: valeur` ne fonctionne qu'avec des clés Symbol. Pour les clés String ou Integer, il faut utiliser `=>`.
- En pratique, on utilise presque toujours des clés Symbol avec la syntaxe raccourcie.

Un Hash vide se crée avec `{}` :

```ruby
empty = {}
p empty    # => {}
```

## Accéder aux valeurs

On accède à une valeur en passant sa clé entre crochets :

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

puts pikachu[:name]     # => Pikachu
puts pikachu[:level]    # => 25
puts pikachu[:ability]  # => nil (la clé n'existe pas)
```

- Si la clé n'existe pas, `[]` retourne `nil` sans erreur. C'est silencieux, ce qui peut être un piège si on fait une faute de frappe.

Pour éviter ce piège, on peut utiliser `.fetch` qui lève une erreur si la clé n'existe pas :

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

puts pikachu.fetch(:name)              # => Pikachu
# pikachu.fetch(:ability)              # => Erreur ! KeyError

# Avec une valeur par défaut, pas d'erreur
puts pikachu.fetch(:ability, 'aucun')  # => aucun
```

- `.fetch` sans valeur par défaut provoque une erreur si la clé manque. C'est utile quand l'absence de la clé est un bug qu'on veut détecter.
- `.fetch(:clé, valeur_par_défaut)` retourne la valeur par défaut si la clé n'existe pas, sans erreur.

## Ajouter et modifier des entrées

```ruby
pikachu = { name: 'Pikachu', type: :electric }

# Ajouter une nouvelle clé
pikachu[:level] = 25
pikachu[:ability] = :static
p pikachu               # => {:name=>"Pikachu", :type=>:electric, :level=>25, :ability=>:static}

# Modifier une clé existante
pikachu[:level] = 30
puts pikachu[:level]    # => 30
```

- La syntaxe est identique pour ajouter et modifier : `hash[:clé] = valeur`. Si la clé existe, la valeur est remplacée. Sinon, elle est créée.

## Vérifier et supprimer

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

# Vérifier la présence d'une clé
puts pikachu.key?(:name)      # => true
puts pikachu.key?(:ability)   # => false

# Taille et vide
puts pikachu.size             # => 3
puts pikachu.empty?           # => false
puts {}.empty?                # => true

# Supprimer une clé
deleted = pikachu.delete(:level)
puts deleted                  # => 25 (la valeur supprimée est retournée)
p pikachu                     # => {:name=>"Pikachu", :type=>:electric}
```

- `.key?` vérifie si une clé existe. C'est plus fiable que `hash[:clé]` car une clé peut exister avec la valeur `nil`.
- `.delete` supprime la paire clé-valeur et retourne la valeur supprimée.

## Extraire les clés et les valeurs

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

p pikachu.keys     # => [:name, :type, :level]
p pikachu.values   # => ["Pikachu", :electric, 25]
```

- `.keys` retourne un Array de toutes les clés. `.values` retourne un Array de toutes les valeurs.

## Parcourir un Hash

```ruby
pikachu = { name: 'Pikachu', type: :electric, level: 25 }

pikachu.each do |key, value|
  puts "#{key} : #{value}"
end
```

Affiche :

```
name : Pikachu
type : electric
level : 25
```

- `.each` passe deux valeurs au bloc : la clé et la valeur. C'est la différence avec les Array où `.each` ne passe qu'un seul élément.

On peut aussi parcourir uniquement les clés ou les valeurs :

```ruby
pikachu.each_key { |key| puts key }
pikachu.each_value { |value| puts value }
```

## Filtrer un Hash

Comme les Array, les Hash ont `.select` et `.reject` :

```ruby
pokemon = { name: 'Dracaufeu', type: :fire, level: 36, hp: 150 }

# Garder seulement les paires dont la valeur est un Integer
numbers = pokemon.select { |key, value| value.is_a?(Integer) }
p numbers    # => {:level=>36, :hp=>150}
```

- `.select` sur un Hash retourne un **nouveau Hash** (contrairement à `.map` qui retourne un Array).

## Fusionner deux Hash

```ruby live
base = { hp: 78, attack: 84 }
bonus = { attack: 100, speed: 120 }

result = base.merge(bonus)
p result      # => {:hp=>78, :attack=>100, :speed=>120}
p base        # => {:hp=>78, :attack=>84}  (inchangé)
```

- `.merge` retourne un **nouveau** Hash. En cas de clé en commun, la valeur du second Hash gagne.
- L'original n'est pas modifié.

## Hash imbriqués

Un Hash peut contenir d'autres Hash comme valeurs. C'est très courant pour modéliser des données complexes :

```ruby
dracaufeu = {
  name: 'Dracaufeu',
  types: [:fire, :flying],
  stats: { hp: 78, attack: 84, speed: 100 }
}

puts dracaufeu[:stats][:hp]       # => 78
puts dracaufeu[:stats][:speed]    # => 100
```

- On enchaîne les `[]` pour accéder aux niveaux imbriqués : `hash[:clé1][:clé2]`.

Le problème arrive quand un niveau intermédiaire n'existe pas :

```ruby
# Si :stats n'existait pas, on aurait une erreur
# dracaufeu[:moves][:first]    # => Erreur ! NoMethodError (nil n'a pas de [])
```

Pour éviter ce problème, Ruby offre `.dig` qui navigue en profondeur sans erreur :

```ruby
puts dracaufeu.dig(:stats, :hp)       # => 78
puts dracaufeu.dig(:moves, :first)    # => nil (pas d'erreur)
```

- `.dig` retourne `nil` si un niveau intermédiaire n'existe pas, au lieu de lever une erreur.

## Hash avec valeur par défaut

Normalement, accéder à une clé inexistante retourne `nil`. On peut changer ce comportement avec `Hash.new` :

```ruby live
# Compteur : chaque clé inexistante vaut 0 par défaut
counter = Hash.new(0)

counter[:fire] += 1
counter[:fire] += 1
counter[:water] += 1

puts counter[:fire]     # => 2
puts counter[:water]    # => 1
puts counter[:grass]    # => 0 (valeur par défaut, la clé n'a pas été créée)
p counter               # => {:fire=>2, :water=>1}
```

- `Hash.new(0)` crée un Hash dont la valeur par défaut est `0`. Quand on accède à une clé inexistante, on obtient `0` au lieu de `nil`.
- C'est très pratique pour les compteurs : on peut faire `+= 1` sans vérifier si la clé existe déjà.

## Conclusion

- Un **Hash** associe des clés à des valeurs. Créer avec `{ clé: valeur }` pour les clés Symbol.
- `[]` retourne `nil` si la clé manque. `.fetch` lève une erreur ou retourne un défaut explicite.
- `[]=` ajoute ou modifie une entrée. `.delete` supprime une paire.
- `.key?` vérifie la présence d'une clé. `.keys` et `.values` retournent des Array.
- `.each` parcourt les paires clé-valeur. `.select` filtre et retourne un nouveau Hash.
- `.merge` fusionne deux Hash (le second gagne en cas de conflit).
- Les Hash imbriqués modélisent les données complexes. `.dig` y navigue sans risque d'erreur.
- `Hash.new(valeur_par_défaut)` définit la valeur retournée pour les clés inexistantes.
