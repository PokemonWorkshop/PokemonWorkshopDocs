---
title: "Créer un System Tag personnalisé"
slug: creer-un-system-tag-personnalise
sidebar_position: 3
description: "PSDK permet d'apprendre au moteur de carte un System Tag entièrement nouveau, une tuile à soi avec ses propres rencontres sauvages, son arrière-plan de combat, son comportement pour les capacités liées au terrain et ses particules de marche. Ce guide parcourt les cinq points d'ancrage du moteur sur lesquels un nouveau tag se branche, écrit chaque redéfinition de méthode en prepend, et montre où peindre le tag terminé dans Tiled."
---

PSDK permet d'apprendre au moteur de carte un System Tag entièrement nouveau, une tuile à soi avec ses propres rencontres sauvages, son arrière-plan de combat, son comportement pour les capacités liées au terrain et ses particules de marche. Ce guide parcourt les cinq points d'ancrage du moteur sur lesquels un nouveau tag se branche, écrit chaque redéfinition de méthode en prepend, et montre où peindre le tag terminé dans Tiled.

## Le problème : un terrain que le moteur ne connaît pas encore

Les System Tags intégrés couvrent les terrains classiques : herbe, grotte, mer, glace, sable, etc. Chacun sait déjà lancer ses propres combats sauvages, choisir un arrière-plan de combat et projeter la bonne particule de marche. Mais dès qu'on veut quelque chose que le jeu de base n'a pas, par exemple une flaque luisante qui déclenche sa propre table de rencontres et affiche un battleback sur mesure, aucun tag existant ne convient.

Un **System Tag personnalisé**, c'est la façon d'ajouter ce terrain sans modifier le moteur. On déclare une nouvelle constante, puis on la branche dans la poignée de méthodes du moteur qui s'aiguillent déjà sur un tag, en ajoutant à chaque fois son cas et en revenant au comportement d'origine avec `super`. Le résultat se comporte comme un tag de première classe : on le peint dans Tiled et le moteur y réagit à chaque pas.

Ce guide suppose que l'on sait déjà comment un tag est lu et stocké. Sinon, commencer par [Comprendre les System Tags](/psdk/core-systems/les-system-tags). Chaque redéfinition de méthode ci-dessous suit la convention de [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk), un module `prepend` appelant `super`, jamais un `alias`.

## Sur quoi se branche un tag personnalisé

Un tag n'est pas un simple interrupteur : chaque comportement vit dans une partie différente du moteur. Ajouter un tag revient à en toucher jusqu'à cinq, la dernière étant facultative.

| Étape | Point d'ancrage du moteur | Ce qu'il contrôle |
| --- | --- | --- |
| 1 | `GameData::SystemTags.system_tag_db_symbol` | Le symbole lisible renvoyé pour la tuile. |
| 2 | `PFM::Environment#get_zone_type` / `#convert_zone_type` | Le type de zone, qui pilote les rencontres sauvages. |
| 3 | `Battle::Logic::BattleInfo::BACKGROUND_NAMES` | L'arrière-plan de combat affiché quand un combat démarre sur la tuile. |
| 4 | `Game_Map::TERRAIN_TAGS_TABLE` | Le lieu utilisé par les capacités `LocationBased`. |
| 5 | `Game_Character::PARTICLES_METHODS` (facultatif) | La particule générée quand un personnage marche sur la tuile. |

Les cinq extraits peuvent vivre dans des fichiers de script séparés ou être fusionnés en un seul, du moment que la constante de l'étape 1 est définie avant que les étapes suivantes la référencent. L'emplacement de ces scripts dans un projet PSDK est traité dans [monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk).

Dans tout ce guide, le tag d'exemple s'appelle **CustomPuddle**, avec le symbole `:custom_puddle`.

## 1. Déclarer la constante et son symbole

Une constante de tag n'est qu'un identifiant produit par l'aide `gen(x, y)`, où `(x, y)` est la position de la tuile sur le tileset des System Tags. On choisit une case qu'aucun tag existant n'utilise (les tags intégrés s'arrêtent à la ligne 7, donc toute case en dessous est libre) :

```ruby
module GameData
  module SystemTags
    # Column 0, row 12 of the System Tags tileset, a free cell
    CustomPuddle = gen 0, 12
  end
end
```

Ensuite, on donne au tag un symbole lisible pour que le reste du moteur, et Pokémon Studio, puissent le désigner par son nom. Le moteur résout un tag en son symbole dans `GameData::SystemTags.system_tag_db_symbol`. On la redéfinit pour renvoyer son symbole pour le nouveau tag et déléguer l'original pour tout le reste. Par convention, un symbole personnalisé commence par `custom_` :

```ruby
module GameData
  module SystemTags
    # Adds the symbol of the custom tag without touching the engine method
    module CustomPuddleSymbol
      def system_tag_db_symbol(system_tag)
        return :custom_puddle if system_tag == CustomPuddle

        super
      end
    end
    # system_tag_db_symbol is a module-level method (module_function),
    # so the override is prepended onto the module's singleton class.
    singleton_class.prepend(CustomPuddleSymbol)
  end
end
```

L'appel à `super` garde chaque tag existant fonctionnel : seul `CustomPuddle` est traité ici, tout le reste retombe sur le `case` du moteur.

## 2. Donner un type de zone au tag

Un **type de zone** est l'entier que le moteur utilise pour classer le sol sur lequel se tient le joueur. C'est lui qui décide quelle liste de rencontres sauvages s'applique et, à l'étape suivante, quel arrière-plan de combat charger. Deux méthodes le produisent : `get_zone_type`, qui lit la tuile actuelle du joueur, et `convert_zone_type`, qui mappe un tag quelconque sur la même valeur. Les deux vivent sur `PFM::Environment`.

Les types de zone intégrés vont de `0` (bâtiment) à `10` (glace), donc la prochaine valeur libre est `11`. On redéfinit les deux méthodes pour la renvoyer pour le tag personnalisé :

```ruby
module PFM
  class Environment
    module CustomPuddleZone
      def get_zone_type(ice_prio = false)
        return 11 if custom_puddle?

        super
      end

      def convert_zone_type(system_tag)
        return 11 if system_tag == GameData::SystemTags::CustomPuddle

        super
      end

      private

      # Is the player standing on the custom puddle tag?
      # @return [Boolean]
      def custom_puddle?
        @game_state.game_player.system_tag == GameData::SystemTags::CustomPuddle
      end
    end
    prepend CustomPuddleZone
  end
end
```

Deux détails comptent ici. Appeler `super` sans argument transmet `ice_prio` intact, donc la logique de priorité d'origine continue de fonctionner pour les tags intégrés. Et `11` n'est que la prochaine valeur libre dans cette version de PSDK : si une mise à jour future ajoute des terrains, ce nombre, ainsi que l'index de l'arrière-plan à l'étape suivante, devront être augmentés en conséquence.

## 3. Choisir l'arrière-plan de combat

Sans cette étape, un combat lancé sur la tuile s'affiche sur un fond noir. Le moteur choisit l'image dans `BACKGROUND_NAMES`, un tableau de noms de fichiers indexé par type de zone, dans `Battle::Logic::BattleInfo`. Comme le moteur décale l'index de un pour toute zone hors bâtiment (`zone_type + 1`), le type de zone `11` lit l'index `12`. Le tableau contient actuellement douze entrées (indices `0` à `11`), donc un seul `push` ajoute l'arrière-plan exactement à l'index `12` :

```ruby
module Battle
  class Logic
    class BattleInfo
      # zone type 11 reads index 12 after the engine's +1 shift,
      # so this must be the entry pushed after the last built-in one
      BACKGROUND_NAMES.push('back_custom_puddle')
    end
  end
end
```

La chaîne ajoutée est le nom d'une image dans le dossier `graphics/battlebacks` du projet, ici `back_custom_puddle`. L'ordre est déterminant : le nouveau nom doit atterrir à l'index que vise le type de zone, donc on l'ajoute une seule fois, après que le moteur a construit le tableau par défaut, et on ne l'insère pas ailleurs.

## 4. Brancher le tag pour les capacités LocationBased

Certaines capacités changent de comportement selon le sol où elles sont utilisées : leur logique `LocationBased` lit un symbole de **lieu** plutôt que le tag brut. Ce mappage vit dans `Game_Map::TERRAIN_TAGS_TABLE`. On ajoute une entrée pour que le moteur traite la tuile comme un lieu connu, ici de l'eau peu profonde :

```ruby
class Game_Map
  # LocationBased moves treat the custom puddle like shallow water
  TERRAIN_TAGS_TABLE[GameData::SystemTags::CustomPuddle] = :shallow_water
end
```

On réutilise le symbole de lieu existant qui correspond au terrain modélisé ; `:shallow_water` est l'un des nombreux que le moteur comprend déjà.

## 5. Ajouter des particules de marche (facultatif)

Cette étape est purement cosmétique : elle génère une particule quand un personnage marche sur la tuile. On la saute entièrement si l'on n'en veut pas. Le moteur consulte `PARTICLES_METHODS`, un hash indexé par tag, pour savoir quelle méthode appeler : on ajoute donc son tag et on définit la méthode associée. Cette méthode demande à `Yuki::Particles` de générer une particule identifiée par son symbole :

```ruby
class Game_Character
  PARTICLES_METHODS[GameData::SystemTags::CustomPuddle] = :particle_push_custom_puddle

  # Spawn the custom puddle particle when a character steps on the tag
  def particle_push_custom_puddle
    Yuki::Particles.add_particle(self, :custom_puddle)
  end
end
```

La particule elle-même, l'animation `:custom_puddle`, se définit dans `Data/Animations/Particles.rb`. On ouvre ce fichier, on défile jusqu'en bas, juste au-dessus de la ligne `save,`, et on ajoute son animation à côté des nombreux exemples existants. Après l'avoir modifié, on régénère les données de particules compilées depuis un terminal ouvert dans `Data/Animations` :

```bash
ruby Particles.rb
```

## Peindre le tag dans Tiled

La constante ne devient utile qu'une fois le tag peint sur une carte. Les System Tags se peignent dans Tiled sur le calque `systemtags`, à partir de l'image de tileset des System Tags située dans `Data/Tiled/Assets/prio_w.png`. Ce calque et les règles qu'il suit sont décrits dans [Calques et priorités de superposition](/tiled/calques-et-priorites). On ajoute sa tuile sur la première case libre de cette image, en respectant la position `(x, y)` passée à `gen`, puis on la peint partout où le terrain doit s'appliquer. Le fonctionnement du calque `systemtags` est détaillé dans [Comprendre les System Tags](/psdk/core-systems/les-system-tags).

## Conclusion

- Un **System Tag personnalisé** est une constante produite par `gen(x, y)` que l'on branche dans les méthodes du moteur qui s'aiguillent déjà sur un tag.
- Chaque redéfinition de méthode est un module `prepend` qui traite son tag et appelle `super` pour le reste, jamais un `alias`.
- Les cinq points d'ancrage sont : le symbole (`system_tag_db_symbol`), le type de zone (`get_zone_type` / `convert_zone_type`), l'arrière-plan de combat (`BACKGROUND_NAMES`), le lieu `LocationBased` (`TERRAIN_TAGS_TABLE`) et, en option, la particule (`PARTICLES_METHODS`).
- Le type de zone et l'index de l'arrière-plan sont des nombres propres à la version : `11` et l'index `12` sont les prochains emplacements libres aujourd'hui, et augmentent si PSDK ajoute des terrains.
- On réutilise un symbole de lieu existant comme `:shallow_water` pour les capacités `LocationBased` plutôt que d'en inventer un.
- On termine en peignant la tuile sur le calque `systemtags` depuis `Data/Tiled/Assets/prio_w.png`.
