---
title: "La gestion des erreurs"
slug: gestion-des-erreurs
sidebar_position: 14
description: "Ce chapitre présente la gestion des exceptions, le mécanisme qui permet de réagir quand quelque chose tourne mal dans un programme. Au lieu de crash silencieux ou de valeurs nil inexpliquées, on apprend à lever, capturer et traiter les erreurs proprement."
---

Ce chapitre présente la **gestion des exceptions**, le mécanisme qui permet de réagir quand quelque chose tourne mal dans un programme. Au lieu de crash silencieux ou de valeurs `nil` inexpliquées, on apprend à lever, capturer et traiter les erreurs proprement.

## Principe

Imaginons qu'on essaie de charger un fichier de sauvegarde qui n'existe pas, ou qu'un utilisateur entre un niveau négatif pour un Pokémon. Sans gestion d'erreurs, le programme crash avec un message cryptique.

En Ruby, les erreurs sont des **objets**. Quand quelque chose tourne mal, on **lève** (raise) une exception. Le programme remonte la pile d'appels jusqu'à trouver un bloc `rescue` capable de la capturer. Si aucun `rescue` ne la capture, le programme s'arrête.

Ce mécanisme sépare le code normal du code de gestion d'erreurs : on écrit le chemin normal, et on traite les cas problématiques dans des blocs dédiés.

## Lever une exception avec raise

`raise` interrompt l'exécution et crée un objet exception :

```ruby
# Forme simple : crée un RuntimeError
raise 'Pokémon introuvable'

# Avec une classe spécifique
raise ArgumentError, 'Le niveau doit être entre 1 et 100'
```

- `raise 'message'` crée un `RuntimeError` par défaut.
- `raise ArgumentError, 'message'` crée une erreur d'un type précis. C'est la forme recommandée car elle permet de capturer les erreurs par type.
- Une fois levée, l'exception interrompt tout : les lignes suivantes ne sont pas exécutées.

## Capturer avec begin...rescue...end

Le bloc `begin...rescue...end` capture les exceptions :

```ruby live
begin
  level = -5
  raise ArgumentError, 'Le niveau doit être positif' if level < 1

  puts "Niveau : #{level}"
rescue ArgumentError => error
  puts "Erreur : #{error.message}"
end

puts 'Le programme continue normalement.'
```

Affiche :

```text

Erreur : Le niveau doit être positif
Le programme continue normalement.

```

- `rescue ArgumentError => error` capture les `ArgumentError` et stocke l'objet dans `error`.
- `error.message` retourne le message passé à `raise`.
- Le code après le `end` s'exécute normalement : le programme ne crash pas.

## rescue dans une méthode

Quand le `rescue` couvre toute la méthode, on peut se passer de `begin` :

```ruby
def create_pokemon(name, level)
  raise ArgumentError, 'Le nom ne peut pas être vide' if name.empty?
  raise ArgumentError, 'Le niveau doit être entre 1 et 100' unless (1..100).include?(level)

  return { name: name, level: level }
rescue ArgumentError => error
  puts "Erreur de création : #{error.message}"
  return nil
end

result = create_pokemon('', 25)
puts result.inspect    # => nil

result = create_pokemon('Pikachu', 25)
puts result.inspect    # => {:name=>"Pikachu", :level=>25}
```

- Le `rescue` s'applique à tout le corps de la méthode.
- On retourne `nil` dans le `rescue` pour que l'appelant puisse vérifier si la création a réussi.

## Capturer plusieurs types d'exceptions

On peut enchaîner plusieurs `rescue` pour gérer différents types d'erreurs :

```ruby
def load_pokemon(name)
  raise ArgumentError, 'Nom vide' if name.empty?
  raise RuntimeError, "Pokémon #{name} introuvable" unless name == 'Pikachu'

  return { name: name, level: 25 }
rescue ArgumentError => error
  puts "Argument invalide : #{error.message}"
  return nil
rescue RuntimeError => error
  puts "Erreur : #{error.message}"
  return nil
end
```

- Ruby essaie chaque `rescue` dans l'ordre. Le premier qui correspond est exécuté.
- Toujours placer les exceptions **les plus spécifiques en premier**. Sinon, une clause générale les attraperait toutes.

## La hiérarchie des exceptions

Les exceptions Ruby forment une hiérarchie de classes (comme l'héritage vu au chapitre 9) :

```text

Exception
  SignalException          (Ctrl+C)
  NoMemoryError
  ScriptError
    SyntaxError
    LoadError
  StandardError            ← rescue capture ça par défaut
    ArgumentError
    RuntimeError
    TypeError
    NameError
      NoMethodError
    IOError
    ZeroDivisionError
    KeyError
    IndexError

```

- `rescue` sans type capture `StandardError` et tous ses descendants. C'est le comportement correct dans 99% des cas.
- **Ne jamais écrire `rescue Exception`** : cela capture aussi `SignalException` (Ctrl+C), ce qui rend le programme impossible à interrompre.

## retry — réessayer

`retry` reprend l'exécution au début du bloc `begin`. Il faut **toujours** un compteur pour éviter les boucles infinies :

```ruby
attempts = 0

begin
  attempts += 1
  puts "Tentative #{attempts}..."

  # Simuler une erreur aléatoire
  raise 'Échec du chargement' if rand(3) != 0

  puts 'Chargement réussi !'
rescue RuntimeError => error
  puts "Erreur : #{error.message}"
  retry if attempts < 3
  puts 'Abandon après 3 tentatives.'
end
```

- `retry` revient au `begin` et réexécute tout le bloc.
- Sans le compteur `attempts < 3`, la boucle serait infinie en cas d'erreur permanente.
- `raise` sans argument (seul) dans un `rescue` relève l'exception courante, utile pour abandonner après les tentatives.

## ensure — exécuter quoi qu'il arrive

Le bloc `ensure` s'exécute **toujours**, qu'une exception ait été levée ou non :

```ruby
def save(data, filename)
  puts 'Sauvegarde en cours...'
  raise 'Erreur de sauvegarde' if data.nil?

  puts "Sauvegardé dans #{filename}"
rescue RuntimeError => error
  puts "Échec : #{error.message}"
ensure
  puts 'Nettoyage terminé.'
end

save({ name: 'Pikachu' }, 'save.dat')
save(nil, 'save.dat')
```

Affiche :

```text

Sauvegarde en cours...
Sauvegardé dans save.dat
Nettoyage terminé.
Sauvegarde en cours...
Échec : Erreur de sauvegarde
Nettoyage terminé.

```

- `ensure` s'exécute dans **tous** les cas : après le code normal, après un `rescue`, même après un `return`.
- C'est l'endroit idéal pour fermer des fichiers, libérer des ressources, ou afficher un message final.

## Créer ses propres exceptions

Pour les erreurs spécifiques à son programme, on crée des classes qui héritent de `StandardError` :

```ruby
module Pokedex
  class InvalidPokemonError < StandardError; end
  class DuplicateError < StandardError; end
  class TeamFullError < StandardError; end
end
```

On les utilise ensuite comme n'importe quelle exception :

```ruby
def add_pokemon(team, pokemon)
  raise Pokedex::TeamFullError, "L'équipe est pleine (6 max)" if team.size >= 6
  raise Pokedex::DuplicateError, "#{pokemon} est déjà dans l'équipe" if team.include?(pokemon)

  team << pokemon
  return team
end

begin
  team = ['Pikachu', 'Dracaufeu', 'Tortank', 'Florizarre', 'Dracolosse', 'Ectoplasma']
  add_pokemon(team, 'Mewtwo')
rescue Pokedex::TeamFullError => error
  puts error.message
end
```

Affiche : `L'équipe est pleine (6 max)`

- Hériter de `StandardError` garantit que `rescue` sans type les capture.
- Le nom de la classe décrit le problème : `TeamFullError` est plus parlant que `RuntimeError`.
- Regrouper les exceptions dans un module évite les conflits de noms.

## Relever une exception

`raise` sans argument dans un `rescue` relève l'exception courante. C'est utile pour afficher un message tout en laissant l'erreur remonter :

```ruby
def process_pokemon(data)
  puts "Traitement de #{data[:name]}..."
  raise 'Données corrompues' if data[:level].nil?

  return data
rescue RuntimeError => error
  puts "Échec : #{error.message}"
  raise
end
```

- `raise` seul relève exactement la même exception. L'appelant devra la capturer à son tour.

## Conclusion

- `raise` lève une exception. Préférer `raise ClassName, 'message'` pour des erreurs typées.
- `begin...rescue...end` capture les exceptions. `rescue` dans un `def` fonctionne sans `begin`.
- Placer les clauses `rescue` les plus spécifiques en premier.
- Ne **jamais** écrire `rescue Exception`. Capturer `StandardError` ou plus spécifique.
- `retry` reprend au `begin`. Toujours protéger avec un compteur.
- `ensure` s'exécute toujours, même après une erreur ou un `return`.
- Créer des classes d'erreur qui héritent de `StandardError` pour les erreurs métier.
- `raise` sans argument dans un `rescue` relève l'exception courante.
