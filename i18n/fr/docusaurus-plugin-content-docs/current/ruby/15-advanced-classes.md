---
title: "Comment utiliser les fonctionnalités avancées des classes en Ruby ?"
slug: fonctionnalites-avancees-des-classes
sidebar_position: 16
description: "Ce chapitre présente des fonctionnalités avancées des classes : la surcharge d'opérateurs, le duck typing, Struct et la gestion de l'identité des objets. Ces outils rendent les classes plus expressives et naturelles à utiliser."
---

Ce chapitre présente des fonctionnalités avancées des classes : la surcharge d'opérateurs, le duck typing, `Struct` et la gestion de l'identité des objets. Ces outils rendent les classes plus expressives et naturelles à utiliser.

## Principe

En Ruby, les opérateurs comme `==`, `+`, `[]` sont en réalité des **méthodes**. Écrire `a == b` revient à appeler `a.==(b)`. On peut donc les redéfinir dans nos propres classes pour leur donner un comportement logique.

Ruby repose aussi sur le **duck typing** : ce qui compte n'est pas le type d'un objet, mais les méthodes auxquelles il répond. "Si ça marche comme un canard et que ça fait coin-coin comme un canard, alors c'est un canard."

## Surcharger == (égalité)

Par défaut, `==` vérifie si deux variables pointent vers le **même objet** en mémoire. Ce n'est généralement pas ce qu'on veut :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end
end

a = Pokemon.new('Pikachu', 25)
b = Pokemon.new('Pikachu', 25)
puts a == b    # => false (deux objets différents en mémoire !)
```

Pour comparer par **valeur**, on redéfinit `==` :

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end

  def ==(other)
    return false unless other.is_a?(Pokemon)

    return @name == other.name && @level == other.level
  end
end

a = Pokemon.new('Pikachu', 25)
b = Pokemon.new('Pikachu', 25)
puts a == b    # => true (mêmes valeurs)
```

- `other.is_a?(Pokemon)` vérifie le type pour éviter les erreurs si on compare un Pokémon avec autre chose.
- On compare les attributs qui définissent l'identité logique de l'objet.

## Surcharger [] et []= (accès par clé)

On a vu que `pikachu[:attack]` fonctionne quand `pikachu` est un Hash. Mais si `pikachu` est un objet `Pokemon`, ça ne marche pas par défaut. On peut changer ça en définissant les méthodes `[]` et `[]=`.

L'idée : un Pokémon a plusieurs stats (PV, attaque, défense...) stockées dans un Hash interne. Plutôt que d'écrire `pikachu.stats[:attack]`, on aimerait écrire directement `pikachu[:attack]`, comme si le Pokémon lui-même était un Hash.

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level, stats)
    @name = name
    @level = level
    @stats = stats
  end

  # Quand on écrit pikachu[:attack], Ruby appelle cette méthode
  def [](stat_name)
    return @stats[stat_name]
  end

  # Quand on écrit pikachu[:attack] = 60, Ruby appelle cette méthode
  def []=(stat_name, value)
    @stats[stat_name] = value
    return value
  end
end

pikachu = Pokemon.new('Pikachu', 25, { hp: 35, attack: 55, defense: 40 })
puts pikachu[:attack]    # => 55

pikachu[:attack] = 60
puts pikachu[:attack]    # => 60
```

- `def [](stat_name)` est une méthode dont le nom est `[]`. La syntaxe est inhabituelle, mais c'est bien un nom de méthode comme un autre. Quand Ruby voit `pikachu[:attack]`, il traduit ça en `pikachu.[](: attack)`.
- `def []=(stat_name, value)` fonctionne de la même façon : `pikachu[:attack] = 60` devient `pikachu.[]=(:attack, 60)`.
- C'est le même principe que le setter `level=` vu au chapitre 8 : Ruby traduit une syntaxe naturelle en appel de méthode.

## Duck typing et respond_to?

Le duck typing signifie qu'on ne vérifie pas le **type** d'un objet, mais les **méthodes** qu'il possède :

```ruby
def display_creature(creature)
  puts "#{creature.name} Niv.#{creature.level}" if creature.respond_to?(:name)
end
```

- `respond_to?(:name)` retourne `true` si l'objet possède une méthode `name`, quelle que soit sa classe.
- Cela permet à une méthode d'accepter n'importe quel objet qui a les bonnes méthodes, pas seulement des instances d'une classe précise.

## Struct — classes de données rapides

`Struct` crée automatiquement une classe avec constructeur, getters, setters, `==` et `to_s` :

```ruby
Move = Struct.new(:name, :type, :power, :accuracy)

thunderbolt = Move.new('Tonnerre', :electric, 90, 100)
puts thunderbolt.name      # => Tonnerre
puts thunderbolt.power     # => 90

# == compare automatiquement toutes les valeurs
other = Move.new('Tonnerre', :electric, 90, 100)
puts thunderbolt == other  # => true
```

- `Struct.new` crée une classe complète en une seule ligne. C'est parfait pour les objets de données simples comme les attaques.
- On peut ajouter des méthodes au Struct avec un bloc :

```ruby
Move = Struct.new(:name, :type, :power, :accuracy) do
  def to_s
    return "#{name} (#{type}) — Puissance : #{power}"
  end
end

puts Move.new('Tonnerre', :electric, 90, 100)
# => Tonnerre (electric) — Puissance : 90
```

## method_missing — interception dynamique

`method_missing` est appelée quand on invoque une méthode qui n'existe pas. On peut l'utiliser pour créer des accesseurs dynamiques :

```ruby live
class Pokemon
  KNOWN_STATS = [:hp, :attack, :defense, :speed]

  def initialize(name, stats)
    @name = name
    @stats = stats
  end

  def method_missing(method_name, *arguments)
    return @stats[method_name] if KNOWN_STATS.include?(method_name)

    super
  end

  def respond_to_missing?(method_name, include_private = false)
    return KNOWN_STATS.include?(method_name) || super
  end
end

pikachu = Pokemon.new('Pikachu', { hp: 35, attack: 55, defense: 40, speed: 90 })
puts pikachu.attack    # => 55
puts pikachu.speed     # => 90

puts pikachu.respond_to?(:attack)    # => true
puts pikachu.respond_to?(:unknown)   # => false
```

- `method_missing` intercepte l'appel. Si le nom correspond à une stat connue, on retourne sa valeur. Sinon, `super` propage l'erreur normalement.
- **Toujours** implémenter `respond_to_missing?` en parallèle. Sans elle, `respond_to?` retournerait `false` même si `method_missing` gère l'appel.
- Ce mécanisme est puissant mais à utiliser avec **parcimonie** : il rend le code plus difficile à comprendre. Préférer les méthodes explicites quand c'est possible.

## Identité des objets

Ruby a plusieurs niveaux de comparaison :

```ruby
a = 'Pikachu'
b = 'Pikachu'

puts a == b         # => true  (même valeur)
puts a.equal?(b)    # => false (objets différents en mémoire)
puts a.eql?(b)      # => true  (même valeur et même type)
```

- `==` : égalité par valeur (la plus courante, celle qu'on redéfinit)
- `.equal?` : identité mémoire (même objet). **Ne jamais la redéfinir.**
- `.eql?` : utilisée par les Hash pour les clés. Si on redéfinit `==`, redéfinir aussi `eql?` et `hash` :

```ruby
class Pokemon
  def ==(other)
    return false unless other.is_a?(Pokemon)

    return @name == other.name && @level == other.level
  end

  def eql?(other)
    return self == other
  end

  def hash
    return [@name, @level].hash
  end
end
```

- `eql?` et `hash` doivent être cohérents avec `==` : deux objets égaux doivent avoir le même `hash`.
- Sans ça, utiliser un Pokémon comme clé de Hash donnerait des résultats incohérents.

## freeze, dup et clone

`freeze` rend un objet immutable :

```ruby
name = 'Pikachu'
name.freeze
puts name.frozen?    # => true
# name.upcase!       # => Erreur ! FrozenError
```

`dup` crée une copie superficielle :

```ruby
original = { name: 'Pikachu', stats: { hp: 35 } }
copy = original.dup

copy[:name] = 'Raichu'          # Ne modifie PAS l'original
copy[:stats][:hp] = 999         # MODIFIE l'original aussi !
```

- `dup` copie le Hash lui-même, mais les valeurs imbriquées (comme le Hash `stats`) sont **partagées**. C'est une copie "superficielle".
- `clone` est similaire à `dup` mais préserve aussi l'état `frozen`.
- Pour une copie profonde, on peut utiliser `Marshal.dump` + `Marshal.load` (vu au chapitre 13).

Note : dans certains projets Ruby, on ne met pas `.freeze` sur les constantes car cela peut empêcher certaines techniques d'extension du code. C'est un choix de conception.

## Conclusion

- Les opérateurs Ruby (`==`, `[]`, `[]=`, `<=>`, `to_s`) sont des méthodes qu'on peut redéfinir.
- Redéfinir `==` pour comparer par valeur. Toujours vérifier le type avec `is_a?`.
- `respond_to?` vérifie les capacités d'un objet plutôt que son type (duck typing).
- `Struct` crée des classes de données complètes en une ligne.
- `method_missing` intercepte les appels à des méthodes inexistantes. Toujours implémenter `respond_to_missing?`. À utiliser avec parcimonie.
- Si on redéfinit `==`, redéfinir aussi `eql?` et `hash` pour la cohérence avec les Hash.
- `freeze` rend un objet immutable. `dup` crée une copie superficielle.
