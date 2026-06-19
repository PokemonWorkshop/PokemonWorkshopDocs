---
title: "Donner un Pokémon au joueur"
slug: donner-un-pokemon
sidebar_position: 9
description: "PSDK peut remettre un Pokémon au joueur directement depuis un event : un don soigné avec son jingle et sa proposition de surnom, un ajout silencieux qui glisse dans le PC quand l'équipe est pleine, un œuf, ou un Pokémon entièrement configuré dont on règle à l'avance la forme, le genre et l'objet tenu. Ce guide couvre les commandes qui donnent un Pokémon, où chacune le place, et le switch qu'on lit pour savoir s'il a rejoint l'équipe ou le PC."
---

:::warning[Section archivée à la sortie de Pokémon Studio v3.0]

Pokémon Studio v3.0 abandonnera RPG Maker. À ce moment-là, cette section sera archivée : les pages resteront accessibles comme référence mais ne seront plus mises à jour.

:::

PSDK peut remettre un Pokémon au joueur directement depuis un event : un don soigné avec son jingle et sa proposition de surnom, un ajout silencieux qui glisse dans le PC quand l'équipe est pleine, un œuf, ou un Pokémon entièrement configuré dont on règle à l'avance la forme, le genre et l'objet tenu. Ce guide couvre les commandes qui donnent un Pokémon, où chacune le place, et le switch qu'on lit pour savoir s'il a rejoint l'équipe ou le PC.

Ce sont toutes des [méthodes de l'Interpreter](/rpg-maker-xp/utiliser-linterpreter-dans-un-event) : on les appelle depuis la commande **Script** d'un event, sans aucun préfixe. RPG Maker XP ne possède pas de commande d'event « donner un Pokémon », tout passe donc par Script. Le Pokémon est désigné par son db_symbol (`:pikachu`, `:eevee`) ou son ID numérique, exactement tel qu'il apparaît dans la base de données des Pokémon.

## Un don complet

Lorsque le joueur doit *remarquer* qu'il reçoit un Pokémon, le professeur qui remet un starter, un PNJ qui offre un Évoli, on utilise `receive_pokemon_sequence`. C'est la présentation complète : elle ajoute le Pokémon, joue le jingle de réception, affiche le message « a reçu un Pokémon », puis demande au joueur s'il veut lui donner un surnom.

```ruby
receive_pokemon_sequence(pokemon_or_id, level = 5, shiny = false)
```

- `pokemon_or_id` — le Pokémon, sous forme de db_symbol (`:eevee`) ou d'ID numérique.
- `level` — son niveau. Optionnel, vaut `5` par défaut.
- `shiny` — son statut chromatique. Optionnel, vaut `false` par défaut (voir [Chromatique](#chromatique) ci-dessous).

Une seule commande Script donne un Évoli niveau 5 avec toute la cérémonie :

```ruby
receive_pokemon_sequence(:eevee, 5)
```

Si l'équipe est déjà pleine, le Pokémon atterrit au PC et le joueur en est informé. La commande ne supprime jamais l'event : un PNJ qui remet le don reste sur la carte. Elle renvoie l'objet [`PFM::Pokemon`](/rpg-maker-xp/demarrer-un-combat-sauvage) qu'elle a créé, ou `nil` s'il n'a pas pu être placé. Cette séquence est construite sur `add_pokemon`, décrite juste après, avec tout l'habillage des messages par-dessus.

## Ajouter un Pokémon en silence

`add_pokemon` est la primitive sous-jacente : elle place le Pokémon dans l'équipe **sans message ni son**, utile comme effet de bord d'un autre event quand le joueur n'a pas besoin d'une scène.

```ruby
add_pokemon(pokemon_or_id, level = 5, shiny = false)
```

- `pokemon_or_id` — le Pokémon, sous forme de db_symbol, d'ID numérique, ou d'un objet `PFM::Pokemon` qu'on a construit soi-même.
- `level` — son niveau. Optionnel, vaut `5` par défaut. Ignoré quand on passe un `PFM::Pokemon` déjà prêt.
- `shiny` — son statut chromatique. Optionnel, vaut `false` par défaut.

```ruby
add_pokemon(:pikachu, 12)
```

Cela ajoute discrètement un Pikachu niveau 12 à l'équipe. **Si l'équipe contient déjà six Pokémon, il part au PC à la place** : l'ajout n'échoue jamais faute de place. La méthode renvoie le Pokémon (ou `nil` s'il n'a pu être placé ni dans l'équipe ni au PC).

### Savoir où il a atterri

Comme `add_pokemon` peut dévier vers le PC, PSDK enregistre la destination dans un switch du jeu qu'on peut tester juste après l'appel :

| Switch | ID | Signification |
| --- | --- | --- |
| `SYS_Stored` | 9 | `true` = le Pokémon est parti au PC ; `false` = il a rejoint l'équipe |

On lit le switch `9` dans une **Condition** (Conditional Branch) pour réagir, par exemple pour prévenir le joueur que son nouveau Pokémon l'attend au PC. `receive_pokemon_sequence` le lit déjà pour afficher le message « envoyé à la Boîte », ce test n'est donc utile que lorsqu'on appelle `add_pokemon` directement.

### Chromatique

L'argument `shiny`, partagé par `add_pokemon`, `store_pokemon`, `receive_pokemon_sequence` et `add_rename_pokemon`, accepte plus qu'un booléen :

- `false` — probabilité normale, le taux de chromatique configuré dans le jeu. C'est la valeur par défaut.
- `true` — toujours chromatique.
- `0` — jamais chromatique.
- tout entier `n` supérieur à `0` — une chance sur `n` (`8` signifie donc une sur huit).

```ruby
add_pokemon(:gyarados, 30, true)
```

Cela garantit un Léviator chromatique.

## Stocker directement au PC

Lorsque le Pokémon doit aller directement dans une boîte, jamais dans l'équipe même s'il y a de la place, on utilise `store_pokemon` :

```ruby
store_pokemon(pokemon_or_id, level = 5, shiny = false)
```

Les arguments sont identiques à `add_pokemon`, mais la destination est toujours la boîte PC courante. La méthode met le switch `9` (`SYS_Stored`) à `true` et renvoie le Pokémon.

```ruby
store_pokemon(:magikarp, 5)
```

C'est la commande pour une récompense qu'on veut voir attendre dans la boîte plutôt que forcée dans l'équipe active.

## Configurer le Pokémon

Les formes ci-dessus génèrent toujours un Pokémon ordinaire. Lorsqu'on a besoin de contrôler sa forme, son genre, son objet tenu, sa nature ou ses capacités, on le décrit avec un hash qu'on passe à `add_specific_pokemon` :

```ruby
add_specific_pokemon(hash)
```

Le hash est transmis à `PFM::Pokemon.generate_from_hash`, le même constructeur que dans le [guide du combat sauvage](/rpg-maker-xp/demarrer-un-combat-sauvage). Par exemple, un Miaouss d'Alola (son indice de forme est `1`) :

```ruby
add_specific_pokemon(id: :meowth, level: 5, form: 1)
```

Les clés les plus courantes sont :

- `id` — db_symbol ou ID numérique du Pokémon. Obligatoire.
- `level` — son niveau.
- `shiny` / `no_shiny` — forcer ou interdire l'apparence chromatique.
- `form` — l'indice de forme (`-1` laisse PSDK choisir automatiquement).
- `gender` — `0` asexué, `1` mâle, `2` femelle.
- `item` — le db_symbol d'un objet tenu (`:leftovers`).
- `nature`, `stats` (IV), `bonus` (EV), `moves`, `ball` — et les autres attributs qu'un Pokémon peut porter. Le guide du combat sauvage les liste en entier.

Comme `add_pokemon`, la méthode ajoute à l'équipe ou dévie vers le PC quand l'équipe est pleine, et renvoie le Pokémon.

## Laisser le joueur le nommer

Deux commandes couvrent le surnommage.

`add_rename_pokemon` donne un Pokémon et ouvre aussitôt l'écran de nommage :

```ruby
add_rename_pokemon(pokemon_or_id, level = 5, shiny = false, num_char = 12)
```

Les trois premiers arguments correspondent à `add_pokemon` ; `num_char` plafonne la longueur du surnom, à `12` caractères par défaut.

```ruby
add_rename_pokemon(:pikachu, 10)
```

La méthode ajoute le Pokémon, puis, seulement s'il a été placé avec succès, ouvre la fenêtre de renommage. Contrairement à `receive_pokemon_sequence`, elle n'affiche aucun message et ne joue aucun jingle, juste l'écran de nommage.

`rename_pokemon` renomme un Pokémon que le joueur **possède déjà** :

```ruby
rename_pokemon(index_or_pokemon, num_char = 12)
```

- `index_or_pokemon` — l'emplacement dans l'équipe (`0` pour le premier Pokémon, jusqu'à `5`), ou un objet `PFM::Pokemon`.
- `num_char` — la limite de caractères. Optionnel, vaut `12` par défaut.

Pour renommer le Pokémon de tête :

```ruby
rename_pokemon(0)
```

On passe un objet quand on a conservé la valeur de retour d'une commande précédente, ce qui permet de renommer un Pokémon qui a pu partir au PC :

```ruby
meowth = add_specific_pokemon(id: :meowth, level: 5, form: 1)
rename_pokemon(meowth) if meowth
```

La garde `if meowth` saute le renommage quand le Pokémon n'a pas pu être placé.

## Donner un œuf

`add_egg` remet au joueur un œuf plutôt qu'un Pokémon éclos :

```ruby
add_egg(id, egg_how_obtained = :received)
```

- `id` — l'espèce, sous forme de db_symbol ou d'ID numérique ; ou un hash (mêmes clés que `add_specific_pokemon`) pour un œuf configuré.
- `egg_how_obtained` — la provenance de l'œuf. Cela n'affecte que le mémo du Pokémon : `:received` (la valeur par défaut, un œuf remis, par exemple à la Pension) ou `:found` (un œuf ramassé, par exemple sur la carte).

Un œuf de Pichu reçu d'un PNJ :

```ruby
add_egg(:pichu)
```

Un œuf trouvé au sol :

```ruby
add_egg(:growlithe, :found)
```

Un œuf configuré, via un hash :

```ruby
add_egg({ id: :charmander, nature: :bold, form: 0 })
```

Les œufs sont créés au niveau 1 et, comme `add_pokemon`, partent dans l'équipe ou au PC quand l'équipe est pleine.

## Reprendre un Pokémon

L'opération inverse retire un Pokémon de l'équipe. Aucune des deux commandes n'affiche de message, et toutes deux agissent uniquement sur l'équipe.

`withdraw_pokemon` retire par espèce :

```ruby
withdraw_pokemon(id, counter = 1)
```

- `id` — l'espèce à retirer, sous forme de db_symbol ou d'ID numérique.
- `counter` — combien en retirer. Optionnel, vaut `1` par défaut.

```ruby
withdraw_pokemon(:pikachu)
```

Cela retire le premier Pikachu de l'équipe. `withdraw_pokemon_at` retire plutôt par position :

```ruby
withdraw_pokemon_at(index)
```

```ruby
withdraw_pokemon_at(0)
```

Cela retire le Pokémon de tête, quelle que soit son espèce.

## Alias français

PSDK a été conçu par une équipe francophone : chaque commande ci-dessus répond aussi à un alias français. Les deux noms désignent exactement la même méthode, on utilise celui qui se lit le mieux :

| Nom anglais | Alias français |
| --- | --- |
| `add_pokemon` | `ajouter_pokemon`, `ajouter_stocker_pokemon` |
| `store_pokemon` | `stocker_pokemon` |
| `add_specific_pokemon` | `ajouter_pokemon_param` |
| `add_rename_pokemon` | `ajouter_renommer_pokemon` |
| `rename_pokemon` | `renommer_pokemon` |
| `add_egg` | `ajouter_oeuf` |
| `withdraw_pokemon` | `retirer_pokemon` |
| `withdraw_pokemon_at` | `retirer_pokemon_index` |

`receive_pokemon_sequence` n'a pas d'alias français ; on utilise son nom anglais dans les deux langues.

## Conclusion

- On utilise `receive_pokemon_sequence` pour un don que le joueur doit remarquer : la commande affiche le message et le jingle et propose un surnom, exactement comme la réception d'un starter.
- `add_pokemon` est la primitive silencieuse sous-jacente : elle ajoute à l'équipe, ou au PC quand l'équipe est pleine, et met le switch `9` (`SYS_Stored`) pour qu'on sache où le Pokémon a atterri.
- `store_pokemon` envoie toujours le Pokémon au PC ; `add_specific_pokemon` le construit depuis un hash (forme, genre, objet tenu, etc.).
- `add_rename_pokemon` et `rename_pokemon` ouvrent l'écran de nommage ; `add_egg` donne un œuf, `:received` ou `:found`.
- `withdraw_pokemon` et `withdraw_pokemon_at` reprennent un Pokémon dans l'équipe, et chaque commande possède un alias français.
