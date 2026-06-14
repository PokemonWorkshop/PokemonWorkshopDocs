---
title: "Comment utiliser les boucles et les itérateurs ?"
slug: boucles-et-iterateurs
sidebar_position: 6
description: "Ce chapitre présente les outils qui permettent de répéter des instructions : les boucles classiques et les itérateurs. On découvre aussi comment lire ce que l'utilisateur tape au clavier."
---

Ce chapitre présente les outils qui permettent de **répéter** des instructions : les boucles classiques et les itérateurs. On découvre aussi comment lire ce que l'utilisateur tape au clavier.

## Principe

On a déjà vu `.each` au chapitre 3 pour parcourir un Array. Mais parfois, on a besoin de répéter du code sans avoir de collection : attendre une action de l'utilisateur, simuler des tours de combat, ou afficher un compte à rebours.

Ruby propose deux familles d'outils :

- **Les boucles** (`while`, `until`, `loop`) : répètent un bloc tant qu'une condition est vraie (ou jusqu'à ce qu'on décide d'arrêter). Utiles quand on ne sait pas à l'avance combien de fois on va boucler.
- **Les itérateurs** (`times`, `upto`, `downto`, `each`) : parcourent un nombre fixe de fois ou une collection. C'est la manière idiomatique de Ruby.

## Lire une entrée utilisateur

Avant de construire des menus, il faut savoir lire ce que l'utilisateur tape. Ruby offre `gets` :

```ruby
print 'Quel est ton nom ? '
name = gets.chomp
puts "Bonjour, #{name} !"
```

- `print` affiche du texte **sans** retour à la ligne (contrairement à `puts`). Le curseur reste sur la même ligne, ce qui est pratique pour les questions.
- `gets` attend que l'utilisateur tape quelque chose et appuie sur Entrée. Il retourne le texte sous forme de String.
- `.chomp` supprime le retour à la ligne `\n` à la fin. Sans `.chomp`, la String contiendrait un saut de ligne invisible.

Pour lire un nombre, on ajoute `.to_i` :

```ruby
print 'Niveau du Pokémon : '
level = gets.chomp.to_i
puts "Niveau : #{level}"
```

- `.to_i` convertit la String en Integer. Si l'utilisateur tape autre chose qu'un nombre, `.to_i` retourne 0.

## La boucle while

`while` répète un bloc **tant que** la condition est vraie :

```ruby live
level = 1

while level < 5
  puts "Pikachu est au niveau #{level}"
  level += 1
end
```

Affiche :

```
Pikachu est au niveau 1
Pikachu est au niveau 2
Pikachu est au niveau 3
Pikachu est au niveau 4
```

- La condition `level < 5` est évaluée **avant** chaque tour. Quand `level` atteint 5, la condition devient fausse et la boucle s'arrête.
- `level += 1` est indispensable. Sans lui, `level` resterait à 1 et la boucle tournerait indéfiniment (boucle infinie). Si ça arrive, appuyer sur Ctrl+C pour interrompre le programme.

## La boucle until

`until` est l'inverse de `while` : elle répète **tant que** la condition est **fausse** (autrement dit, **jusqu'à ce que** la condition devienne vraie) :

```ruby
hp = 50
max_hp = 120

until hp >= max_hp
  hp += 10
  puts "Soin en cours... PV : #{hp}/#{max_hp}"
end

puts 'Soin terminé !'
```

- `until hp >= max_hp` se lit : "répéter jusqu'à ce que les PV atteignent le maximum".
- `until` est parfois plus lisible que `while` quand on pense en termes de "jusqu'à ce que".

## La boucle loop

`loop` crée une boucle infinie. On en sort avec `break` :

```ruby
loop do
  print 'Tape "quit" pour sortir : '
  input = gets.chomp

  break if input == 'quit'

  puts "Tu as tapé : #{input}"
end

puts 'Sorti de la boucle !'
```

- `loop do ... end` tourne indéfiniment jusqu'à ce qu'un `break` soit atteint.
- `break if input == 'quit'` quitte la boucle quand l'utilisateur tape "quit".
- C'est le pattern idéal pour les **menus interactifs** : on affiche les options, on lit le choix, on traite, et on recommence.

## L'itérateur times

`times` exécute un bloc un nombre fixe de fois :

```ruby
3.times do
  puts 'Pikachu utilise Tonnerre !'
end
```

On peut aussi récupérer le numéro du tour :

```ruby
5.times do |turn|
  puts "Tour #{turn + 1}"
end
```

Affiche :

```
Tour 1
Tour 2
Tour 3
Tour 4
Tour 5
```

- `|turn|` reçoit le numéro de l'itération, en commençant à **0**. On ajoute 1 pour un affichage humain.
- `times` est parfait quand on connaît le nombre de répétitions à l'avance.

## Les itérateurs upto et downto

Pour parcourir un intervalle de nombres :

```ruby
# Compter de 1 à 5
1.upto(5) do |level|
  puts "Niveau #{level}"
end
```

```ruby
# Compte à rebours
5.downto(1) do |count|
  puts "#{count}..."
end
puts 'Évolution !'
```

- `1.upto(5)` parcourt de 1 à 5 inclus, dans l'ordre croissant.
- `5.downto(1)` parcourt de 5 à 1 inclus, dans l'ordre décroissant.

## Rappel : each et each_with_index

On a déjà vu `each` au chapitre 3. C'est **la** méthode de parcours en Ruby :

```ruby live
team = ['Pikachu', 'Dracaufeu', 'Tortank']

team.each { |pokemon| puts "Go, #{pokemon} !" }

team.each_with_index do |pokemon, index|
  puts "#{index + 1}. #{pokemon}"
end
```

Pour parcourir un Hash (vu au chapitre 4), le bloc reçoit la clé et la valeur :

```ruby
stats = { hp: 35, attack: 55, defense: 40 }

stats.each do |stat, value|
  puts "#{stat} : #{value}"
end
```

## La boucle for

`for` existe en Ruby mais n'est presque jamais utilisée. On la mentionne parce qu'on peut la croiser dans du code ancien :

```ruby
types = [:fire, :water, :grass]

for type in types
  puts "Type : #{type}"
end
```

- `for` est du sucre syntaxique pour `each`, mais avec un défaut : la variable `type` continue d'exister après la boucle. Avec `each`, la variable du bloc est locale. C'est pour ça que les développeurs Ruby préfèrent `each`.

## Contrôle de flux : break et next

### break — sortir de la boucle

`break` quitte la boucle immédiatement :

```ruby
team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Florizarre']

team.each do |pokemon|
  break if pokemon == 'Tortank'

  puts "Vérification de #{pokemon}..."
end

puts 'Tortank trouvé !'
```

Affiche :

```
Vérification de Pikachu...
Vérification de Dracaufeu...
Tortank trouvé !
```

- Dès que `pokemon` vaut `'Tortank'`, `break` arrête le `each`. Les éléments suivants ne sont pas parcourus.

### next — passer à l'itération suivante

`next` saute le reste du bloc et passe à l'élément suivant :

```ruby
levels = [5, 0, 12, 0, 8]

levels.each do |level|
  next if level == 0

  puts "Pokémon de niveau #{level}"
end
```

Affiche :

```
Pokémon de niveau 5
Pokémon de niveau 12
Pokémon de niveau 8
```

- `next if level == 0` saute les Pokémon de niveau 0 (KO). Le `puts` n'est pas exécuté pour eux, mais la boucle continue avec les éléments suivants.

## Conclusion

- `while` répète tant qu'une condition est vraie. `until` répète jusqu'à ce qu'elle le devienne.
- `loop` avec `break` est le pattern standard pour les menus interactifs.
- `times` répète un nombre fixe de fois. `upto`/`downto` parcourent un intervalle.
- `each` est la méthode idiomatique pour parcourir les collections. Préférer `each` à `for`.
- `break` sort de la boucle. `next` saute à l'itération suivante.
- `gets.chomp` lit l'entrée utilisateur. `.to_i` la convertit en nombre.
- `print` affiche sans retour à la ligne (utile pour les questions).
