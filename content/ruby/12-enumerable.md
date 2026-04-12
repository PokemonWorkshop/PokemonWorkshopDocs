---
title: "Comment utiliser Enumerable en Ruby ?"
slug: enumerable
sidebar_position: 12
description: "Ce chapitre présente **Enumerable**, un module qui donne plus de 50 méthodes de manipulation de collections. On découvre aussi **Comparable**, qui permet de comparer des objets entre eux."
---

Ce chapitre présente **Enumerable**, un module qui donne plus de 50 méthodes de manipulation de collections. On découvre aussi **Comparable**, qui permet de comparer des objets entre eux.

## Principe

On a déjà utilisé `.map`, `.select`, `.reject` sur les Array. Ce ne sont pas des méthodes d'Array à proprement parler : elles viennent du module **Enumerable** qu'Array inclut automatiquement.

Le principe est simple : si une classe définit la méthode `each` et inclut `Enumerable`, elle hérite de toutes ces méthodes gratuitement. `each` est la seule brique nécessaire — Ruby construit tout le reste dessus.

C'est exactement ce qu'on a appris au chapitre 10 avec les mixins : `include Enumerable` injecte des dizaines de méthodes dans la classe.

## Inclure Enumerable dans une classe

```ruby
class Registry
  include Enumerable

  def initialize
    @pokemon_list = []
  end

  def add(pokemon)
    @pokemon_list << pokemon
    return self
  end

  # La seule méthode obligatoire pour Enumerable
  def each(&block)
    @pokemon_list.each(&block)
  end
end
```

- `include Enumerable` donne accès à `map`, `select`, `sort_by`, `reduce`, etc.
- `each` est le **contrat** : Enumerable l'utilise comme base pour toutes ses méthodes.
- `&block` capture le bloc passé à `each` et le transmet à `@pokemon_list.each`.
- `return self` dans `add` permet de chaîner : `registry.add(a).add(b)`.

## Transformer : map et flat_map

`map` transforme chaque élément et retourne un nouvel Array :

```ruby
names = registry.map { |pokemon| pokemon.name }
# => ["Pikachu", "Dracaufeu", "Tortank"]
```

`flat_map` fait la même chose, puis aplatit le résultat d'un niveau. C'est utile quand chaque élément produit un Array :

```ruby
# Chaque Pokémon peut avoir plusieurs types
all_types = registry.flat_map { |pokemon| pokemon.types }
# => [:electric, :fire, :flying, :water]

# Sans flat_map, on obtiendrait un Array d'Arrays
registry.map { |pokemon| pokemon.types }
# => [[:electric], [:fire, :flying], [:water]]
```

- `flat_map` = `map` + `flatten(1)`. C'est un raccourci très courant.

## Filtrer : select, reject, find

On les a déjà vus au chapitre 3, mais ils viennent d'Enumerable :

```ruby
# Garder les Pokémon de type Feu
fire_pokemon = registry.select { |pokemon| pokemon.types.include?(:fire) }

# Exclure les Pokémon KO
alive = registry.reject { |pokemon| pokemon.ko? }

# Trouver le premier Pokémon Eau
first_water = registry.find { |pokemon| pokemon.types.include?(:water) }
```

- `select` et `reject` retournent un Array. `find` retourne un seul élément ou `nil`.

## Réduire : reduce

`reduce` (aussi appelé `inject`) accumule une valeur en parcourant la collection :

```ruby
# Additionner tous les niveaux
total = registry.reduce(0) { |sum, pokemon| sum + pokemon.level }
```

Comment ça fonctionne, étape par étape :

1. `sum` commence à `0` (la valeur initiale passée à `reduce`)
2. Premier tour : `sum = 0 + 25` → `sum` vaut `25`
3. Deuxième tour : `sum = 25 + 36` → `sum` vaut `61`
4. Et ainsi de suite... Le résultat final est la dernière valeur de `sum`.

Il existe aussi des raccourcis :

```ruby
# sum est un raccourci pour reduce(0) { |s, p| s + p.level }
total = registry.sum { |pokemon| pokemon.level }

# reduce avec un symbole (quand on travaille directement sur des nombres)
levels = [25, 36, 40]
total = levels.reduce(:+)    # => 101
```

- `sum` est plus lisible que `reduce` pour les additions simples.
- `reduce(:+)` appelle la méthode `+` entre chaque paire d'éléments.

## Trier : sort_by, min_by, max_by

`sort_by` trie selon un critère extrait par le bloc :

```ruby
# Trier par niveau croissant
by_level = registry.sort_by { |pokemon| pokemon.level }

# Trier par niveau décroissant (nier la valeur)
strongest = registry.sort_by { |pokemon| -pokemon.level }
```

`min_by` et `max_by` trouvent l'élément extrême sans trier toute la collection :

```ruby
strongest = registry.max_by { |pokemon| pokemon.level }
weakest = registry.min_by { |pokemon| pokemon.level }

# Les deux à la fois
weakest, strongest = registry.minmax_by { |pokemon| pokemon.level }
```

- `sort_by` retourne un nouvel Array trié.
- `min_by`/`max_by` sont plus performants que `sort_by.first`/`sort_by.last` car ils ne parcourent la collection qu'une seule fois.

## Regrouper : group_by et tally

`group_by` organise les éléments en sous-groupes selon un critère :

```ruby
by_type = registry.group_by { |pokemon| pokemon.types.first }
# => { :electric => [...], :fire => [...], :water => [...] }
```

`tally` compte les occurrences de chaque valeur dans un Array :

```ruby
# Compter combien de Pokémon de chaque type
census = registry.flat_map { |pokemon| pokemon.types }.tally
# => { :electric => 2, :fire => 3, :water => 1, :flying => 1 }
```

- `group_by` retourne un Hash dont les clés sont les valeurs retournées par le bloc.
- `tally` est un raccourci très pratique pour les comptages.

## Compter : count et sum

```ruby
# Combien de Pokémon au total ?
total = registry.count

# Combien de Pokémon de type Feu ?
fire_count = registry.count { |pokemon| pokemon.types.include?(:fire) }

# Somme de tous les niveaux
total_levels = registry.sum { |pokemon| pokemon.level }
```

- `count` sans bloc retourne le nombre total. Avec un bloc, il compte ceux qui satisfont la condition.

## Prédicats : any?, all?, none?

Ces méthodes retournent `true` ou `false` :

```ruby
# Y a-t-il au moins un Pokémon Eau ?
registry.any? { |pokemon| pokemon.types.include?(:water) }    # => true

# Tous les Pokémon sont-ils au-dessus du niveau 10 ?
registry.all? { |pokemon| pokemon.level > 10 }                # => true

# Aucun Pokémon n'est KO ?
registry.none? { |pokemon| pokemon.ko? }                      # => true
```

## Découper : take et drop

```ruby
# Les 3 premiers Pokémon
first_three = registry.take(3)

# Tous sauf les 2 premiers
without_first_two = registry.drop(2)
```

## Chaîner les appels

On peut enchaîner plusieurs méthodes Enumerable pour construire des requêtes complexes :

```ruby
# Les 3 noms des Pokémon de plus haut niveau
top_three = registry
  .sort_by { |pokemon| -pokemon.level }
  .take(3)
  .map { |pokemon| pokemon.name }
```

- Chaque méthode retourne un Array, ce qui permet d'appeler la suivante dessus.
- L'ordre des opérations compte : filtrer **avant** de trier est plus performant.

## Le module Comparable

Comparable fonctionne sur le même principe qu'Enumerable : on inclut le module et on définit **une seule méthode**, l'opérateur `<=>` (spaceship). En retour, on obtient `<`, `>`, `<=`, `>=`, `between?` et `clamp`.

```ruby live
class Pokemon
  include Comparable

  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def <=>(other)
    return @level <=> other.level
  end
end

pikachu = Pokemon.new('Pikachu', 25)
charizard = Pokemon.new('Dracaufeu', 50)

puts pikachu < charizard                                    # => true
puts charizard > pikachu                                    # => true
puts pikachu.between?(Pokemon.new('Min', 10), charizard)    # => true
```

- `<=>` retourne `-1` si `self` est inférieur, `0` si égal, `1` si supérieur.
- Une fois `<=>` défini, `.sort` fonctionne automatiquement sans bloc.

## Conclusion

- Inclure `Enumerable` et définir `each` donne accès à plus de 50 méthodes.
- `map` transforme, `flat_map` transforme et aplatit.
- `select`/`reject` filtrent, `find` trouve le premier.
- `reduce` accumule une valeur. `sum` est un raccourci pour les additions.
- `sort_by` trie par critère. `min_by`/`max_by` trouvent les extrêmes.
- `group_by` regroupe, `tally` compte les occurrences.
- `count` compte, `any?`/`all?`/`none?` vérifient des conditions.
- Inclure `Comparable` et définir `<=>` donne `<`, `>`, `<=`, `>=`, `between?`, `clamp`.
- On peut chaîner les appels Enumerable pour des requêtes complexes.
