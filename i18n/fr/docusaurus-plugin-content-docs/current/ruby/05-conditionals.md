---
title: "Comment utiliser les conditions en Ruby ?"
slug: conditions
sidebar_position: 5
description: "Ce chapitre présente les conditions, le mécanisme qui permet à un programme de prendre des décisions. Selon la situation, le code exécute une branche ou une autre."
---

Ce chapitre présente les **conditions**, le mécanisme qui permet à un programme de prendre des décisions. Selon la situation, le code exécute une branche ou une autre.

## Principe

Jusqu'ici, nos programmes s'exécutaient de haut en bas, ligne par ligne. Mais un programme utile doit pouvoir réagir : si le Pokémon est KO, afficher un message. Si l'attaque est super efficace, doubler les dégâts. C'est le rôle des conditions : tester une situation et agir en conséquence.

## Vrai ou faux en Ruby (truthiness)

Avant de voir les conditions, il faut comprendre comment Ruby décide si quelque chose est "vrai" ou "faux".

La règle est très simple : **seuls `false` et `nil` sont considérés comme faux**. Tout le reste est vrai, même les valeurs qui semblent "vides" dans d'autres langages :

```ruby
# Ces valeurs sont toutes considérées comme vraies
puts 'oui' if 0          # 0 est vrai !
puts 'oui' if ''         # une String vide est vraie !
puts 'oui' if []         # un Array vide est vrai !

# Seuls false et nil sont faux
puts 'oui' if false      # pas affiché
puts 'oui' if nil         # pas affiché
```

- C'est une particularité de Ruby. Dans d'autres langages, `0` ou `""` sont souvent faux. Pas en Ruby.
- Pour tester si un nombre vaut zéro, on écrit `number == 0`. Pour tester si une String est vide, on utilise `.empty?`.

## if / elsif / else

La structure la plus courante pour exécuter du code selon une condition :

```ruby live
level = 50

if level >= 100
  puts 'Niveau maximum atteint !'
elsif level >= 50
  puts 'Pokémon de haut niveau'
elsif level >= 20
  puts 'Pokémon de niveau moyen'
else
  puts 'Pokémon de bas niveau'
end
```

- Ruby évalue chaque condition de haut en bas et exécute la **première** qui est vraie.
- `elsif` (pas `elseif` ni `else if`) ajoute des conditions supplémentaires.
- `else` s'exécute quand aucune condition précédente n'est vraie. Il est optionnel.
- Le bloc se termine par `end`.

Un `if` simple sans `elsif` ni `else` :

```ruby
health_points = 0

if health_points <= 0
  puts 'Le Pokémon est KO !'
end
```

## unless

`unless` est l'inverse de `if`. Il exécute le code quand la condition est **fausse** :

```ruby
held_item = nil

unless held_item
  puts 'Le Pokémon ne tient aucun objet.'
end
```

- `unless held_item` veut dire "si `held_item` est faux (c'est-à-dire `nil` ou `false`)".
- `unless` rend le code plus lisible quand on teste une négation simple. La règle d'or est d'éviter les **doubles négations** : `unless !condition` est déroutant, un simple `if condition` est bien plus clair. `unless` avec `&&` est acceptable tant que la phrase reste facile à comprendre. En revanche, éviter `unless` avec `else` : si on a besoin d'un `else`, c'est qu'un `if` serait plus lisible.

## Forme postfixe (sur une ligne)

Quand le code à exécuter tient sur une seule ligne, on peut mettre la condition à la fin :

```ruby
level = 100
health_points = 0

puts 'Niveau maximum !' if level >= 100
puts 'Le Pokémon est KO !' if health_points <= 0
puts 'Le Pokémon est en forme.' unless health_points <= 0
```

- C'est exactement la même chose qu'un `if ... end`, mais plus compact.
- On lit naturellement : "affiche ce message **si** le niveau est supérieur ou égal à 100".
- À utiliser uniquement quand le code tient sur une ligne. Pour les blocs plus longs, garder la forme classique.

## case / when

Quand on compare une même valeur à plusieurs possibilités, `case/when` est plus lisible qu'une série de `if/elsif` :

```ruby live
pokemon_type = :fire

case pokemon_type
when :fire
  puts 'Fort contre Plante, faible contre Eau'
when :water
  puts 'Fort contre Feu, faible contre Plante'
when :grass
  puts 'Fort contre Eau, faible contre Feu'
when :electric
  puts 'Fort contre Eau'
else
  puts "Type inconnu : #{pokemon_type}"
end
```

- `case` prend la valeur à comparer. Chaque `when` teste une possibilité.
- Un seul `when` s'exécute (pas de "fall-through" comme en C ou JavaScript).
- `else` est optionnel, il couvre tous les cas non listés.

`case/when` fonctionne aussi avec des **ranges** (intervalles) :

```ruby
level = 45

case level
when 1..30
  puts 'Bas niveau'
when 31..60
  puts 'Niveau moyen'
when 61..100
  puts 'Haut niveau'
end
```

- `1..30` est un Range (intervalle) qui inclut 1 et 30. Ruby vérifie si `level` est dans cet intervalle.

Et avec des **classes** (types) :

```ruby
value = 42

case value
when Integer
  puts 'Un nombre entier'
when String
  puts 'Du texte'
when Symbol
  puts 'Un symbole'
end
```

## Les opérateurs de comparaison

```ruby
puts 50 == 50     # => true   (égal)
puts 50 != 75     # => true   (différent)
puts 50 < 75      # => true   (inférieur)
puts 50 > 75      # => false  (supérieur)
puts 50 <= 50     # => true   (inférieur ou égal)
puts 50 >= 75     # => false  (supérieur ou égal)
```

- `==` compare les **valeurs**. Attention à ne pas confondre avec `=` qui est l'affectation.

Il existe aussi l'opérateur "vaisseau spatial" `<=>` qui retourne -1, 0 ou 1 :

```ruby
puts 10 <=> 20    # => -1  (10 est plus petit)
puts 20 <=> 20    # => 0   (égaux)
puts 30 <=> 20    # => 1   (30 est plus grand)
```

- `<=>` est utilisé par `.sort` pour comparer les éléments entre eux. On le reverra dans les chapitres suivants.

## Les opérateurs logiques

Pour combiner plusieurs conditions, on utilise `&&` (et), `||` (ou) et `!` (non) :

```ruby
level = 80
is_legendary = false

# && : les DEUX conditions doivent être vraies
if level >= 50 && !is_legendary
  puts 'Pokémon puissant et non légendaire'
end

# || : au moins UNE condition doit être vraie
if is_legendary || level >= 80
  puts 'Pokémon rare !'
end

# ! : inverse la valeur
if !is_legendary
  puts 'Pokémon non légendaire'
end
```

- `&&` retourne `true` si les deux côtés sont vrais.
- `||` retourne `true` si au moins un côté est vrai.
- `!` inverse : `!true` donne `false`, `!false` donne `true`, `!nil` donne `true`.

Ruby propose aussi `and`, `or` et `not` qui font la même chose mais avec une priorité plus basse. En pratique, **toujours utiliser `&&`, `||` et `!`** pour éviter les surprises.

## L'opérateur ||= (ou-égal)

`||=` est un raccourci très courant. Il assigne une valeur uniquement si la variable est `nil` ou `false` :

```ruby
ability = nil
ability ||= :static
puts ability    # => static (ability était nil, donc :static a été assigné)

ability ||= :lightning_rod
puts ability    # => static (ability avait déjà une valeur, rien ne change)
```

- `ability ||= :static` est équivalent à `ability = ability || :static`.
- Si `ability` est `nil`, `||` prend la valeur de droite (`:static`). Si `ability` a déjà une valeur, `||` garde celle de gauche.
- C'est très pratique pour définir des valeurs par défaut.

## L'opérateur ternaire

Pour choisir entre deux valeurs en une seule ligne :

```ruby
level = 50
category = level >= 50 ? 'fort' : 'faible'
puts category    # => fort
```

- `condition ? valeur_si_vrai : valeur_si_faux` est un raccourci pour un `if/else` qui retourne une valeur.
- À utiliser quand le choix est simple et tient sur une ligne. Pour les cas plus complexes, préférer `if/else`.

## Conclusion

- En Ruby, seuls `false` et `nil` sont faux. Tout le reste (`0`, `""`, `[]`) est vrai.
- `if/elsif/else/end` pour les conditions. Le mot-clé est `elsif` (pas `elseif`).
- `unless` pour les négations simples. Ne pas l'utiliser avec `else` ou des conditions composées.
- La forme postfixe (`puts 'message' if condition`) est idéale pour les lignes simples.
- `case/when` compare une valeur à plusieurs possibilités (valeurs, ranges, classes).
- `==` compare les valeurs. `&&` (et), `||` (ou), `!` (non) combinent les conditions.
- `||=` assigne une valeur uniquement si la variable est `nil` ou `false`.
- L'opérateur ternaire `condition ? vrai : faux` choisit entre deux valeurs en une ligne.
