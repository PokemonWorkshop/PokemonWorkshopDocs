---
title: "Les tableaux"
slug: tableaux
sidebar_position: 3
description: "Ce chapitre présente les Array (tableaux), la structure de données la plus utilisée en Ruby. Un Array permet de stocker plusieurs valeurs dans une seule variable."
---

Ce chapitre présente les **Array** (tableaux), la structure de données la plus utilisée en Ruby. Un Array permet de stocker plusieurs valeurs dans une seule variable.

## Principe

Jusqu'ici, chaque variable ne contenait qu'une seule valeur : un nom, un niveau, un type. Mais comment stocker une équipe de 6 Pokémon ? Créer 6 variables séparées (`pokemon_1`, `pokemon_2`...) serait fastidieux. C'est le rôle de l'**Array** : une liste ordonnée d'éléments, accessible par leur position.

On peut voir un Array comme un casier à plusieurs compartiments numérotés. Chaque compartiment contient une valeur, et on accède à chaque valeur par son numéro.

## Créer un Array

La façon la plus simple de créer un Array est d'utiliser les crochets `[]` :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']
types = [:electric, :fire, :water]
levels = [25, 36, 40]
empty = []

p team     # => ["Pikachu", "Dracaufeu", "Tortank"]
p empty    # => []
```

- Un Array peut contenir n'importe quel type de valeur : des String, des Integer, des Symbol, et même un mélange de types différents.
- `[]` crée un Array vide.

On peut aussi créer un Array d'une taille donnée avec `Array.new` :

```ruby
# Créer un Array de 6 cases, toutes remplies avec nil
slots = Array.new(6, nil)
p slots    # => [nil, nil, nil, nil, nil, nil]

# Créer un Array de 6 cases avec des valeurs calculées
levels = Array.new(6) { |index| (index + 1) * 10 }
p levels   # => [10, 20, 30, 40, 50, 60]
```

- `Array.new(6, nil)` crée 6 cases remplies avec `nil`.
- La seconde forme utilise un **bloc** `{ |index| ... }` qui calcule la valeur de chaque case. On n'a pas encore vu les blocs en détail, mais la syntaxe est simple : entre `{ }`, le `|index|` reçoit le numéro de la case (en partant de 0), et l'expression après produit la valeur.

## Accéder aux éléments

Chaque élément a un **index** (sa position dans l'Array). Attention : les index commencent à **0**, pas à 1 :

```ruby live
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Ectoplasma', 'Dracolosse', 'Ronflex']
#        index 0      index 1     index 2     index 3       index 4      index 5

puts team[0]      # => Pikachu      (premier élément)
puts team[2]      # => Tortank      (troisième élément)
puts team[5]      # => Ronflex      (dernier élément)
puts team[-1]     # => Ronflex      (dernier, en comptant depuis la fin)
puts team[-2]     # => Dracolosse   (avant-dernier)
```text

- `team[0]` accède au premier élément. C'est une convention de la programmation : on commence à compter à partir de 0.
- Les index négatifs comptent depuis la fin. `-1` est le dernier, `-2` l'avant-dernier.

Ruby offre aussi des raccourcis :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

puts team.first    # => Pikachu
puts team.last     # => Tortank
```text

## Modifier un élément

On peut remplacer un élément en assignant une nouvelle valeur à un index :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']
puts team[0]       # => Pikachu

team[0] = 'Raichu'
puts team[0]       # => Raichu
p team             # => ["Raichu", "Dracaufeu", "Tortank"]
```text

## Connaître la taille

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

puts team.size      # => 3
puts team.length    # => 3  (identique à .size)
puts team.empty?    # => false
puts [].empty?      # => true
```text

- `.size` et `.length` font la même chose. `.empty?` retourne `true` si l'Array ne contient aucun élément.

## Ajouter des éléments

```ruby
team = ['Pikachu']

# Ajouter à la fin
team.push('Dracaufeu')
team << 'Tortank'          # raccourci, le plus utilisé
p team    # => ["Pikachu", "Dracaufeu", "Tortank"]

# Ajouter au début
team.unshift('Mew')
p team    # => ["Mew", "Pikachu", "Dracaufeu", "Tortank"]

# Insérer à une position précise
team.insert(2, 'Ectoplasma')
p team    # => ["Mew", "Pikachu", "Ectoplasma", "Dracaufeu", "Tortank"]
```text

- `<<` est la forme la plus courante pour ajouter à la fin. On le lit "ajouter" ou "pousser".
- `.unshift` ajoute au début. `.insert(position, valeur)` insère à un index donné.

## Supprimer des éléments

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Ectoplasma']

# Retirer le dernier
last_removed = team.pop
puts last_removed   # => Ectoplasma
p team              # => ["Pikachu", "Dracaufeu", "Tortank"]

# Retirer le premier
first_removed = team.shift
puts first_removed    # => Pikachu
p team                # => ["Dracaufeu", "Tortank"]

# Retirer par valeur (toutes les occurrences)
team = ['Pikachu', 'Dracaufeu', 'Pikachu']
team.delete('Pikachu')
p team    # => ["Dracaufeu"]

# Retirer par index
team = ['Pikachu', 'Dracaufeu', 'Tortank']
team.delete_at(1)
p team    # => ["Pikachu", "Tortank"]
```text

- `.pop` et `.shift` retournent l'élément retiré, ce qui permet de le stocker dans une variable.
- `.delete(valeur)` supprime **toutes** les occurrences de cette valeur.

## Chercher dans un Array

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Ectoplasma']

puts team.include?('Pikachu')      # => true
puts team.include?('Mewtwo')       # => false
puts team.index('Tortank')         # => 2 (sa position)
puts team.index('Mewtwo')          # => nil (pas trouvé)
```text

- `.include?` vérifie si une valeur est dans l'Array. `.index` retourne sa position, ou `nil` si elle n'y est pas.

## Parcourir un Array avec each

Pour faire quelque chose avec chaque élément d'un Array, on utilise `.each` :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

team.each { |pokemon| puts "Go, #{pokemon} !" }
```text

Affiche :

```

Go, Pikachu !
Go, Dracaufeu !
Go, Tortank !

```text

- `.each` passe chaque élément, un par un, au **bloc** `{ |pokemon| ... }`. Le mot `pokemon` entre les barres `| |` est le nom qu'on donne à l'élément courant. On peut choisir n'importe quel nom, mais il est plus lisible de prendre le singulier de la collection.
- En Ruby, beaucoup de méthodes d'Array acceptent un bloc pour personnaliser leur comportement. Dans ce chapitre, certaines méthodes sont montrées sans bloc (comme `.sort`, `.reverse`), mais elles ont souvent une variante avec bloc qu'on découvrira plus tard. Quand on voit une méthode d'Array, il y a de bonnes chances qu'on puisse lui passer un bloc.
- Pour un bloc qui tient sur une ligne, on utilise `{ }`. Pour un bloc plus long, on utilise `do ... end` :

```ruby
team.each do |pokemon|
  puts "Pokémon : #{pokemon}"
  puts "  Longueur du nom : #{pokemon.length}"
end
```text

## Parcourir avec l'index

Quand on a besoin de la position de chaque élément en plus de sa valeur :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

team.each_with_index do |pokemon, index|
  puts "#{index + 1}. #{pokemon}"
end
```text

Affiche :

```

1. Pikachu
2. Dracaufeu
3. Tortank

```text

- `.each_with_index` passe deux valeurs au bloc : l'élément et son index. On ajoute 1 à l'index pour un affichage plus naturel (commencer à 1 plutôt qu'à 0).

## Transformer un Array avec map

`.map` crée un **nouvel** Array en transformant chaque élément :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank']

uppercased_team = team.map { |pokemon| pokemon.upcase }
p uppercased_team    # => ["PIKACHU", "DRACAUFEU", "TORTANK"]
p team               # => ["Pikachu", "Dracaufeu", "Tortank"]  (inchangé)
```text

- `.map` ne modifie pas l'Array original. Il retourne un nouvel Array avec les résultats.

## Filtrer un Array avec select et reject

```ruby live
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Ectoplasma', 'Dracolosse']

# Garder seulement les noms de plus de 8 caractères
long_names = team.select { |pokemon| pokemon.length > 8 }
p long_names    # => ["Dracaufeu", "Ectoplasma", "Dracolosse"]

# Exclure les noms de plus de 8 caractères
short_names = team.reject { |pokemon| pokemon.length > 8 }
p short_names   # => ["Pikachu", "Tortank"]
```

- `.select` garde les éléments pour lesquels le bloc retourne `true`.
- `.reject` fait l'inverse : il exclut ceux pour lesquels le bloc retourne `true`.

## Trier et réorganiser

```ruby
team = ['Tortank', 'Pikachu', 'Dracaufeu']

p team.sort         # => ["Dracaufeu", "Pikachu", "Tortank"]  (ordre alphabétique)
p team.reverse      # => ["Dracaufeu", "Pikachu", "Tortank"]  (ordre inversé)

levels = [36, 25, 40, 10]
p levels.sort       # => [10, 25, 36, 40]  (ordre croissant)
```

- `.sort` trie par ordre alphabétique (String) ou numérique (Integer). `.reverse` inverse l'ordre.
- `.sort` peut aussi prendre un bloc pour trier selon un critère personnalisé (par exemple trier par longueur de nom). On verra cette forme dans les chapitres suivants.
- Comme `.map` et `.select`, ces méthodes retournent un nouvel Array sans modifier l'original.

## Autres méthodes utiles

```ruby
# Supprimer les nil
sparse = ['Pikachu', nil, 'Tortank', nil]
p sparse.compact        # => ["Pikachu", "Tortank"]

# Supprimer les doublons
duplicates = ['Pikachu', 'Dracaufeu', 'Pikachu', 'Tortank']
p duplicates.uniq       # => ["Pikachu", "Dracaufeu", "Tortank"]

# Convertir un Array en String
team = ['Pikachu', 'Dracaufeu', 'Tortank']
puts team.join(', ')    # => Pikachu, Dracaufeu, Tortank
puts team.join(' | ')   # => Pikachu | Dracaufeu | Tortank
```

- `.compact` supprime tous les `nil`. `.uniq` supprime les doublons.
- `.join` est l'inverse de `.split` (vu au chapitre 2) : il combine les éléments en une seule String avec un séparateur.

## Conclusion

- Un **Array** est une liste ordonnée d'éléments, accessible par index (qui commence à 0).
- `<<` est la façon idiomatique d'ajouter un élément à la fin.
- `.each` parcourt chaque élément. `.each_with_index` donne aussi la position.
- `.map` transforme chaque élément et retourne un nouvel Array.
- `.select` garde les éléments qui correspondent à une condition. `.reject` fait l'inverse.
- `.sort` trie, `.reverse` inverse, `.compact` supprime les nil, `.uniq` supprime les doublons.
- `.include?` vérifie la présence d'un élément. `.index` retourne sa position.
- `.join` convertit en String. `.split` (vu au chapitre 2) fait l'inverse.
