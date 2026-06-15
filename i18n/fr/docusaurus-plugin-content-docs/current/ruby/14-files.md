---
title: "Lire et écrire des fichiers"
slug: lire-et-ecrire-des-fichiers
sidebar_position: 15
description: "Ce chapitre présente la lecture et l'écriture de fichiers, puis la sérialisation : transformer des objets Ruby en données qu'on peut sauvegarder et recharger plus tard."
---

Ce chapitre présente la lecture et l'écriture de fichiers, puis la **sérialisation** : transformer des objets Ruby en données qu'on peut sauvegarder et recharger plus tard.

## Principe

Dans un programme, toutes les données disparaissent quand il se termine. Pour les conserver, il faut les écrire dans un **fichier** sur le disque. Au prochain lancement, on les relit.

Ruby offre la classe `File` pour toutes les opérations sur les fichiers. Pour sauvegarder des objets Ruby complexes (pas juste du texte), on utilise la **sérialisation** : Marshal (format binaire) ou JSON (format texte lisible).

## Lire un fichier

La façon la plus simple de lire un fichier entier :

```ruby
content = File.read('pokedex.txt')
puts content
```

- `File.read` lit tout le fichier d'un coup et retourne une String.
- Si le fichier n'existe pas, Ruby lève une erreur `Errno::ENOENT`.

Pour lire ligne par ligne (utile pour les gros fichiers) :

```ruby
lines = File.readlines('pokedex.txt')
lines.each { |line| puts line }
```

- `File.readlines` retourne un Array de String, une par ligne.

## Écrire dans un fichier

```ruby
# Écrire (écrase le contenu existant)
File.write('pokedex.txt', "Pikachu,25,electric\nDracaufeu,36,fire\n")

# Ajouter à la fin (sans écraser)
File.open('pokedex.txt', 'a') do |file|
  file.puts 'Tortank,40,water'
end
```

- `File.write` crée le fichier s'il n'existe pas et **écrase** tout le contenu existant.
- `File.open('fichier', 'a')` ouvre en mode **ajout** (`a` pour append) : le nouveau contenu est ajouté à la fin.

## File.open avec un bloc

`File.open` avec un bloc est la méthode la plus sûre : Ruby ferme automatiquement le fichier à la fin du bloc, même si une erreur survient :

```ruby
File.open('pokedex.txt', 'r') do |file|
  file.each_line do |line|
    puts line
  end
end
```

Les modes principaux :

| Mode   | Signification                                             |
| ------ | --------------------------------------------------------- |
| `'r'`  | Lecture seule (défaut). Erreur si le fichier n'existe pas |
| `'w'`  | Écriture. Crée le fichier ou **écrase** le contenu        |
| `'a'`  | Ajout. Crée le fichier ou ajoute à la fin                 |
| `'r+'` | Lecture et écriture                                       |

- Toujours préférer `File.open` avec un bloc à `File.open` sans bloc. Sans bloc, il faut penser à fermer le fichier manuellement.

## Vérifier l'existence d'un fichier

```ruby
if File.exist?('pokedex.txt')
  puts 'Le fichier existe'
else
  puts 'Le fichier n\'existe pas'
end

puts File.directory?('pokedex')      # => true si c'est un dossier
puts File.size('pokedex.txt')        # => taille en octets
```

- Toujours vérifier `File.exist?` avant de lire pour éviter une erreur.

## Marshal — sérialisation binaire

Marshal convertit n'importe quel objet Ruby en données binaires, et inversement. C'est la façon la plus simple de sauvegarder des objets complexes :

```ruby
# Sauvegarder un objet
pokemon = { name: 'Pikachu', level: 25, types: [:electric] }

File.open('pikachu.dat', 'wb') do |file|
  Marshal.dump(pokemon, file)
end

# Charger l'objet
loaded = File.open('pikachu.dat', 'rb') do |file|
  Marshal.load(file)
end

p loaded    # => {:name=>"Pikachu", :level=>25, :types=>[:electric]}
```

- `Marshal.dump(objet, file)` écrit l'objet dans le fichier.
- `Marshal.load(file)` reconstruit l'objet exactement comme il était : classes, symboles, structures imbriquées — tout est préservé.
- `'wb'` et `'rb'` : les modes **binaires** sont obligatoires pour Marshal. Sans le `b`, l'encodage peut corrompre les données.

Marshal fonctionne aussi avec des classes personnalisées :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end
end

pikachu = Pokemon.new('Pikachu', 25)

# Sauvegarder
File.open('pikachu.dat', 'wb') { |file| Marshal.dump(pikachu, file) }

# Charger : on récupère directement un objet Pokemon
loaded = File.open('pikachu.dat', 'rb') { |file| Marshal.load(file) }
puts loaded.name     # => Pikachu
puts loaded.level    # => 25
```

- Après `Marshal.load`, on récupère directement une instance de `Pokemon`, pas un Hash à convertir. C'est la grande force de Marshal.

## JSON — sérialisation texte

JSON est un format texte lisible par les humains et par d'autres langages. Il faut charger la bibliothèque `json` :

```ruby
require 'json'

# Convertir un Hash en JSON
pokemon_data = { name: 'Dracaufeu', level: 50, types: ['fire', 'flying'] }
json_string = JSON.generate(pokemon_data)
puts json_string
# => {"name":"Dracaufeu","level":50,"types":["fire","flying"]}

# Reconvertir le JSON en Hash
parsed = JSON.parse(json_string)
puts parsed['name']    # => Dracaufeu
```

- `JSON.generate` convertit un Hash en String JSON.
- `JSON.parse` fait l'inverse : il retourne un Hash.
- **Attention** : les clés deviennent des **String** après le parsing. `parsed[:name]` retourne `nil`, il faut `parsed['name']`.
- JSON ne supporte pas les Symbol : `:electric` est converti en `"electric"`.

Pour sauvegarder et charger depuis un fichier :

```ruby
require 'json'

# Sauvegarder
File.write('pokedex.json', JSON.generate(pokemon_data))

# Charger
loaded_data = JSON.parse(File.read('pokedex.json'))
```

## Marshal vs JSON

|                    | Marshal                                  | JSON                                       |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| **Format**         | Binaire (illisible)                      | Texte (lisible)                            |
| **Types Ruby**     | Préservés (Symbol, classes)              | Perdus (tout devient String/Array/Hash)    |
| **Portabilité**    | Ruby uniquement                          | Tous les langages                          |
| **Reconstruction** | Automatique                              | Manuelle (il faut reconstruire les objets) |
| **Sécurité**       | Ne jamais charger de données non fiables | Sûr                                        |

- **Marshal** est parfait pour les sauvegardes internes d'un programme Ruby.
- **JSON** est parfait pour échanger des données avec d'autres programmes ou pour des fichiers de configuration lisibles.

## Convertir des objets pour JSON

Puisque JSON ne connaît pas les classes Ruby, il faut écrire des méthodes de conversion :

```ruby
require 'json'

class Pokemon
  attr_reader :name, :level, :types

  def initialize(name, level, types)
    @name = name
    @level = level
    @types = types
  end

  # Convertir en Hash pour JSON
  def to_hash
    return { name: @name, level: @level, types: @types.map { |type| type.to_s } }
  end

  # Reconstruire depuis un Hash JSON
  def self.from_hash(data)
    types = data['types'].map { |type| type.to_sym }
    return Pokemon.new(data['name'], data['level'], types)
  end
end

# Sauvegarder en JSON
pikachu = Pokemon.new('Pikachu', 25, [:electric])
File.write('pikachu.json', JSON.generate(pikachu.to_hash))

# Charger depuis JSON
data = JSON.parse(File.read('pikachu.json'))
loaded = Pokemon.from_hash(data)
puts loaded.name     # => Pikachu
p loaded.types       # => [:electric]
```

- `to_hash` convertit les Symbol en String (JSON ne les supporte pas).
- `self.from_hash` reconvertit les String en Symbol avec `.to_sym`.
- C'est le "round-trip" : objet → hash → JSON → hash → objet.

## Conclusion

- `File.read` et `File.write` sont les raccourcis les plus simples. `File.readlines` retourne un Array de lignes.
- `File.open` avec un bloc ferme automatiquement le fichier. Toujours préférer cette forme.
- Les modes `'r'`, `'w'`, `'a'` contrôlent le type d'accès. `'wb'`/`'rb'` pour le mode binaire.
- `File.exist?` vérifie l'existence avant de lire.
- **Marshal** sérialise en binaire : préserve les types Ruby, reconstruction automatique. Modes `'wb'`/`'rb'` obligatoires.
- **JSON** sérialise en texte : lisible et portable, mais perd les types Ruby. Il faut `to_hash` et `self.from_hash` pour le round-trip.
- Marshal pour les sauvegardes internes. JSON pour l'échange et la configuration.
