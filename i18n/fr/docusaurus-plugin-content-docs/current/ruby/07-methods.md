---
title: "Les méthodes et les blocs"
slug: methodes-et-blocs
sidebar_position: 7
description: "Ce chapitre présente les méthodes (des morceaux de code nommés et réutilisables) et les blocs (des morceaux de code qu'on passe à une méthode). C'est un chapitre fondamental : à partir de maintenant, on peut structurer son code au lieu de tout écrire dans un seul script."
---

Ce chapitre présente les **méthodes** (des morceaux de code nommés et réutilisables) et les **blocs** (des morceaux de code qu'on passe à une méthode). C'est un chapitre fondamental : à partir de maintenant, on peut structurer son code au lieu de tout écrire dans un seul script.

## Principe

Jusqu'ici, tout notre code s'exécutait de haut en bas. Si on voulait réutiliser un calcul ou un affichage, il fallait copier-coller les lignes. C'est fragile : si on corrige un bug, il faut le corriger partout.

Une **méthode** résout ce problème. C'est un ensemble d'instructions qu'on nomme une fois, et qu'on peut appeler autant de fois qu'on veut. On peut aussi lui passer des **paramètres** pour la rendre flexible.

Un **bloc** est un morceau de code qu'on passe à une méthode. On l'a déjà utilisé sans le savoir avec `.each`, `.map`, `.select` : le code entre `{ }` ou `do...end` est un bloc.

## Définir une méthode

On crée une méthode avec `def`, un nom, et `end` :

```ruby
def greet
  puts 'Bonjour, dresseur !'
end

greet    # Affiche : Bonjour, dresseur !
greet    # Affiche : Bonjour, dresseur !
```

- `def greet` déclare la méthode. Le code à l'intérieur n'est **pas** exécuté à ce moment-là.
- `greet` appelle la méthode. Le code s'exécute à chaque appel.
- Le nom d'une méthode suit la convention `snake_case`, comme les variables.

## Paramètres

Une méthode peut recevoir des **paramètres** qui la rendent flexible :

```ruby
def greet_pokemon(name)
  puts "Go, #{name} !"
end

greet_pokemon('Pikachu')     # Affiche : Go, Pikachu !
greet_pokemon('Dracaufeu')   # Affiche : Go, Dracaufeu !
```

- `name` est un paramètre. Quand on appelle la méthode, on lui passe une valeur qui remplace ce paramètre.
- Si on appelle `greet_pokemon` sans argument, Ruby lève une erreur.

### Valeurs par défaut

On peut donner une valeur par défaut à un paramètre :

```ruby live
def greet_pokemon(name, greeting = 'Go')
  puts "#{greeting}, #{name} !"
end

greet_pokemon('Pikachu')              # Affiche : Go, Pikachu !
greet_pokemon('Pikachu', 'En avant')  # Affiche : En avant, Pikachu !
```

- `greeting = 'Go'` : si l'argument n'est pas fourni, `greeting` vaut `'Go'`.

### Paramètres nommés (keyword)

Pour les méthodes avec plusieurs paramètres optionnels, les paramètres nommés sont plus lisibles :

```ruby live
def create_pokemon(name, level:, type: :normal)
  return { name: name, level: level, type: type }
end

pikachu = create_pokemon('Pikachu', level: 25, type: :electric)
rattata = create_pokemon('Rattata', level: 3)
p pikachu    # => {:name=>"Pikachu", :level=>25, :type=>:electric}
p rattata    # => {:name=>"Rattata", :level=>3, :type=>:normal}
```

- `level:` est un paramètre nommé **obligatoire** (pas de valeur par défaut).
- `type: :normal` est un paramètre nommé avec valeur par défaut.
- À l'appel, on écrit `level: 25` au lieu de juste `25`. C'est plus long mais bien plus clair quand il y a plusieurs paramètres.

### Le splat \*args

Le splat collecte un nombre variable d'arguments dans un Array :

```ruby
def display_team(trainer, *pokemon_names)
  puts "Équipe de #{trainer} :"
  pokemon_names.each do |pokemon_name|
    puts "  - #{pokemon_name}"
  end
end

display_team('Sacha', 'Pikachu', 'Dracaufeu', 'Tortank')
```

- `*pokemon_names` rassemble tous les arguments après `trainer` dans un Array.
- On peut passer 0, 1 ou 100 noms — le splat s'adapte.

### Le double-splat \*\*options

Le double-splat collecte les paramètres nommés non déclarés dans un Hash :

```ruby
def create_pokemon(name, level:, **stats)
  pokemon = { name: name, level: level }
  return pokemon.merge(stats)
end

pikachu = create_pokemon('Pikachu', level: 25, attack: 55, speed: 90)
p pikachu    # => {:name=>"Pikachu", :level=>25, :attack=>55, :speed=>90}
```

- `**stats` attrape `attack: 55, speed: 90` dans un Hash `{ attack: 55, speed: 90 }`.
- `.merge(stats)` fusionne ce Hash avec le Hash de base.

## Valeurs de retour

Toute méthode Ruby retourne une valeur. On peut la retourner explicitement avec `return` :

```ruby
def calculate_damage(attack, defense)
  return attack - defense
end

damage = calculate_damage(55, 30)
puts "Dégâts : #{damage}"    # Affiche : Dégâts : 25
```

Sans `return`, Ruby retourne automatiquement la **dernière expression évaluée** :

```ruby
def calculate_damage(attack, defense)
  attack - defense
end
```

Les deux formes fonctionnent. Dans cette série de tutoriels, on utilise `return` explicitement pour que l'intention soit claire, surtout quand on débute.

`return` peut aussi servir à **sortir prématurément** d'une méthode :

```ruby
def heal(pokemon)
  if pokemon[:hp] >= pokemon[:max_hp]
    puts "#{pokemon[:name]} a déjà tous ses PV !"
    return
  end

  pokemon[:hp] = pokemon[:max_hp]
  puts "#{pokemon[:name]} est soigné !"
end
```

- Le premier `return` sort immédiatement de la méthode si le Pokémon est déjà au maximum. Le reste du code n'est pas exécuté.

## Les blocs en profondeur

On utilise des blocs depuis le chapitre 3 avec `.each`, `.map`, `.select`. Voyons comment créer nos propres méthodes qui acceptent des blocs.

### yield — exécuter le bloc

`yield` permet à une méthode d'exécuter le bloc qu'on lui passe :

```ruby
def with_announcement(pokemon_name)
  puts "--- Début ---"
  yield(pokemon_name)
  puts "--- Fin ---"
end

with_announcement('Pikachu') do |name|
  puts "#{name} utilise Tonnerre !"
end
```

Affiche :

```text
--- Début ---
Pikachu utilise Tonnerre !
--- Fin ---
```

- `yield(pokemon_name)` exécute le bloc en lui passant `pokemon_name` comme argument.
- Le bloc reçoit cet argument dans `|name|`.
- La méthode contrôle ce qui se passe **avant** et **après** le bloc.

### block_given? — vérifier si un bloc est passé

```ruby
def display_pokemon(pokemon)
  puts "#{pokemon[:name]} Niv.#{pokemon[:level]}"

  if block_given?
    yield(pokemon)
  else
    puts "  Type : #{pokemon[:type]}"
  end
end

pikachu = { name: 'Pikachu', level: 25, type: :electric, hp: 35, max_hp: 55 }

# Sans bloc : affichage par défaut
display_pokemon(pikachu)

# Avec bloc : affichage personnalisé
display_pokemon(pikachu) do |pokemon|
  puts "  PV : #{pokemon[:hp]}/#{pokemon[:max_hp]}"
end
```

- `block_given?` retourne `true` si un bloc a été passé, `false` sinon.
- Cela permet d'avoir un comportement par défaut que l'appelant peut personnaliser.

### &block — capturer le bloc en objet

Le préfixe `&` convertit un bloc en objet **Proc**, qu'on peut stocker et appeler avec `.call` :

```ruby
def find_pokemon(team, &condition)
  team.each do |pokemon|
    return pokemon if condition.call(pokemon)
  end
  return nil
end

team = [
  { name: 'Pikachu', level: 25 },
  { name: 'Dracaufeu', level: 36 },
  { name: 'Tortank', level: 40 }
]

result = find_pokemon(team) { |pokemon| pokemon[:level] >= 35 }
puts "Trouvé : #{result[:name]}"    # Affiche : Trouvé : Dracaufeu
```

- `&condition` capture le bloc et le transforme en un objet Proc stocké dans `condition`.
- `condition.call(pokemon)` exécute ce Proc avec `pokemon` comme argument.
- La différence avec `yield` : le Proc peut être stocké dans une variable ou passé à une autre méthode.

## Proc et lambda

Ruby permet aussi de créer des blocs "autonomes" qu'on stocke dans des variables :

```ruby
# Lambda (recommandé)
calculate = lambda do |attack, defense|
  return attack - defense
end

puts calculate.call(55, 30)    # => 25

# Syntaxe raccourcie (stabby lambda)
calculate = ->(attack, defense) { attack - defense }

puts calculate.call(55, 30)    # => 25
```

- Un **lambda** est un bloc autonome stocké dans une variable. On l'appelle avec `.call`.
- `->() { }` est un raccourci pour `lambda do ... end`.

Il existe aussi `Proc.new`, qui fonctionne de façon similaire mais avec une différence importante : `return` dans un Proc sort de la **méthode englobante**, tandis que `return` dans un lambda sort seulement du lambda. Pour cette raison, préférer `lambda` qui est plus prévisible.

On peut passer un lambda à une méthode qui attend un bloc avec `&` :

```ruby
high_level = ->(pokemon) { pokemon[:level] >= 35 }

result = team.select(&high_level)
```

- `&high_level` convertit le lambda en bloc pour le passer à `.select`.

## Conclusion

- `def method_name(params) ... end` définit une méthode. Jamais en une seule ligne.
- Les paramètres peuvent être obligatoires, avec défaut, nommés (`key:`), splat (`*args`) ou double-splat (`**options`).
- Utiliser `return` explicitement pour clarifier ce que la méthode retourne.
- `yield` exécute le bloc passé à la méthode. `block_given?` vérifie sa présence.
- `&block` capture le bloc en Proc pour le stocker ou le transmettre.
- Un **lambda** est un bloc autonome stocké dans une variable. Préférer `lambda` à `Proc.new`.
- `&variable` convertit un lambda/Proc en bloc pour le passer à une méthode.
