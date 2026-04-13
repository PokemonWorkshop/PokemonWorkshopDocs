---
title: "How to read and write files in Ruby?"
slug: reading-and-writing-files
sidebar_position: 15
description: "This chapter introduces reading and writing files, then **serialization**: turning Ruby objects into data that can be saved and reloaded later."
---

This chapter introduces reading and writing files, then **serialization**: turning Ruby objects into data that can be saved and reloaded later.

## Principle

In a program, all data disappears when it terminates. To keep it, you must write it to a **file** on disk. On the next launch, you read it back.

Ruby provides the `File` class for all file operations. To save complex Ruby objects (not just text), you use **serialization**: Marshal (binary format) or JSON (human-readable text format).

## Reading a file

The simplest way to read an entire file:

```ruby
content = File.read('pokedex.txt')
puts content
```

- `File.read` reads the entire file at once and returns a String.
- If the file does not exist, Ruby raises an `Errno::ENOENT` error.

To read line by line (useful for large files):

```ruby
lines = File.readlines('pokedex.txt')
lines.each { |line| puts line }
```

- `File.readlines` returns an Array of Strings, one per line.

## Writing to a file

```ruby
# Write (overwrites existing content)
File.write('pokedex.txt', "Pikachu,25,electric\nCharizard,36,fire\n")

# Append to the end (without overwriting)
File.open('pokedex.txt', 'a') do |file|
  file.puts 'Blastoise,40,water'
end
```

- `File.write` creates the file if it does not exist and **overwrites** all existing content.
- `File.open('file', 'a')` opens in **append** mode (`a` for append): new content is added at the end.

## File.open with a block

`File.open` with a block is the safest approach: Ruby automatically closes the file at the end of the block, even if an error occurs:

```ruby
File.open('pokedex.txt', 'r') do |file|
  file.each_line do |line|
    puts line
  end
end
```

The main modes:

| Mode   | Meaning                                              |
| ------ | ---------------------------------------------------- |
| `'r'`  | Read-only (default). Error if the file doesn't exist |
| `'w'`  | Write. Creates the file or **overwrites** content    |
| `'a'`  | Append. Creates the file or adds to the end          |
| `'r+'` | Read and write                                       |

- Always prefer `File.open` with a block over `File.open` without one. Without a block, you must remember to close the file manually.

## Checking if a file exists

```ruby
if File.exist?('pokedex.txt')
  puts 'The file exists'
else
  puts 'The file does not exist'
end

puts File.directory?('pokedex')      # => true if it is a directory
puts File.size('pokedex.txt')        # => size in bytes
```

- Always check `File.exist?` before reading to avoid an error.

## Marshal — binary serialization

Marshal converts any Ruby object into binary data, and vice versa. It is the simplest way to save complex objects:

```ruby
# Save an object
pokemon = { name: 'Pikachu', level: 25, types: [:electric] }

File.open('pikachu.dat', 'wb') do |file|
  Marshal.dump(pokemon, file)
end

# Load the object
loaded = File.open('pikachu.dat', 'rb') do |file|
  Marshal.load(file)
end

p loaded    # => {:name=>"Pikachu", :level=>25, :types=>[:electric]}
```

- `Marshal.dump(object, file)` writes the object to the file.
- `Marshal.load(file)` reconstructs the object exactly as it was: classes, symbols, nested structures — everything is preserved.
- `'wb'` and `'rb'`: **binary** modes are mandatory for Marshal. Without the `b`, encoding can corrupt the data.

Marshal also works with custom classes:

```ruby
class Pokemon
  attr_reader :name, :level

  def initialize(name, level)
    @name = name
    @level = level
  end
end

pikachu = Pokemon.new('Pikachu', 25)

# Save
File.open('pikachu.dat', 'wb') { |file| Marshal.dump(pikachu, file) }

# Load: we get a Pokemon object directly
loaded = File.open('pikachu.dat', 'rb') { |file| Marshal.load(file) }
puts loaded.name     # => Pikachu
puts loaded.level    # => 25
```

- After `Marshal.load`, you get back a `Pokemon` instance directly, not a Hash to convert. This is Marshal's biggest strength.

## JSON — text serialization

JSON is a human-readable text format that other languages can also use. You need to load the `json` library:

```ruby
require 'json'

# Convert a Hash to JSON
pokemon_data = { name: 'Charizard', level: 50, types: ['fire', 'flying'] }
json_string = JSON.generate(pokemon_data)
puts json_string
# => {"name":"Charizard","level":50,"types":["fire","flying"]}

# Convert the JSON back to a Hash
parsed = JSON.parse(json_string)
puts parsed['name']    # => Charizard
```

- `JSON.generate` converts a Hash to a JSON String.
- `JSON.parse` does the reverse: it returns a Hash.
- **Warning**: keys become **Strings** after parsing. `parsed[:name]` returns `nil`, you need `parsed['name']`.
- JSON does not support Symbols: `:electric` is converted to `"electric"`.

To save and load from a file:

```ruby
require 'json'

# Save
File.write('pokedex.json', JSON.generate(pokemon_data))

# Load
loaded_data = JSON.parse(File.read('pokedex.json'))
```

## Marshal vs JSON

|                    | Marshal                     | JSON                                        |
| ------------------ | --------------------------- | ------------------------------------------- |
| **Format**         | Binary (unreadable)         | Text (readable)                             |
| **Ruby types**     | Preserved (Symbol, classes) | Lost (everything becomes String/Array/Hash) |
| **Portability**    | Ruby only                   | All languages                               |
| **Reconstruction** | Automatic                   | Manual (you must rebuild the objects)       |
| **Security**       | Never load untrusted data   | Safe                                        |

- **Marshal** is perfect for internal saves within a Ruby program.
- **JSON** is perfect for exchanging data with other programs or for readable configuration files.

## Converting objects for JSON

Since JSON does not know about Ruby classes, you need to write conversion methods:

```ruby
require 'json'

class Pokemon
  attr_reader :name, :level, :types

  def initialize(name, level, types)
    @name = name
    @level = level
    @types = types
  end

  # Convert to Hash for JSON
  def to_hash
    return { name: @name, level: @level, types: @types.map { |type| type.to_s } }
  end

  # Reconstruct from a JSON Hash
  def self.from_hash(data)
    types = data['types'].map { |type| type.to_sym }
    return Pokemon.new(data['name'], data['level'], types)
  end
end

# Save as JSON
pikachu = Pokemon.new('Pikachu', 25, [:electric])
File.write('pikachu.json', JSON.generate(pikachu.to_hash))

# Load from JSON
data = JSON.parse(File.read('pikachu.json'))
loaded = Pokemon.from_hash(data)
puts loaded.name     # => Pikachu
p loaded.types       # => [:electric]
```

- `to_hash` converts Symbols to Strings (JSON does not support them).
- `self.from_hash` converts Strings back to Symbols with `.to_sym`.
- This is the "round-trip": object -> hash -> JSON -> hash -> object.

## Conclusion

- `File.read` and `File.write` are the simplest shortcuts. `File.readlines` returns an Array of lines.
- `File.open` with a block automatically closes the file. Always prefer this form.
- The modes `'r'`, `'w'`, `'a'` control the type of access. `'wb'`/`'rb'` for binary mode.
- `File.exist?` checks existence before reading.
- **Marshal** serializes to binary: preserves Ruby types, automatic reconstruction. Modes `'wb'`/`'rb'` are mandatory.
- **JSON** serializes to text: readable and portable, but loses Ruby types. You need `to_hash` and `self.from_hash` for the round-trip.
- Marshal for internal saves. JSON for exchange and configuration.
