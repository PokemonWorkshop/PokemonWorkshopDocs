---
title: "Créer un statut personnalisé"
slug: creer-un-statut-personnalise
sidebar_position: 17
description: "Ce guide explique comment créer un statut personnalisé dans PSDK : déclarer son ID, coder ses méthodes de lecture et d'application, l'enregistrer dans les handlers de combat, créer sa classe d'effet, et ajouter son icône."
---

Ce guide explique comment créer un statut personnalisé dans PSDK : déclarer son ID, coder ses méthodes de lecture et d'application, l'enregistrer dans les handlers de combat, créer sa classe d'effet, et ajouter son icône.

:::info[Versions requises]
Les statuts personnalisés reposent sur l'analyseur de statuts introduit dans **PSDK .26.34** et **Pokémon Studio 2.4.0**. On vérifie que le projet est à jour avant de commencer.
:::

## Principe

Un statut est plus qu'une étiquette : le moteur de combat doit savoir comment l'appliquer, l'empêcher, le prendre en compte dans le taux de capture et exécuter son comportement à chaque tour. En créer un touche donc plusieurs couches :

- **Choisir un nom et l'appliquer dans Studio** : assigner le statut aux attaques qui doivent l'infliger.
- **Déclarer un ID** pour que le moteur dispose d'une référence stable vers le statut.
- **Ajouter des méthodes de lecture et d'application** à `PFM::Pokemon` pour que le reste du code puisse lire et poser le statut.
- **L'enregistrer dans les handlers** : le `StatusChangeHandler` (application, messages, prévention) et, en option, le `CatchHandler` (bonus de capture).
- **Créer la classe d'effet** qui porte le comportement du statut en combat.
- **Le garder sûr en combat** avec un petit patch de compatibilité, puis, en option, lui donner une **animation de combat**.
- **Ajouter l'icône** pour que le statut apparaisse sur l'interface de combat.

Tout au long de ce guide, l'exemple fil rouge est un statut personnalisé affiché **Groggy** dans Studio, que le moteur résout vers le symbole `:custom_groggy` (voir ci-dessous). On remplace ce nom et ce symbole par les siens partout où ils apparaissent.

## Nommer le statut dans Studio

On choisit un nom clair et on s'y tient : il est réutilisé dans tous les scripts ci-dessous.

Dans Studio, on ouvre chaque attaque qui doit infliger le statut et on le définit comme effet de statut de l'attaque. Quand Studio enregistre un statut personnalisé dans son JSON, il préfixe le nom par `Custom_` : un statut nommé `Groggy` est stocké sous `Custom_Groggy`.

À la compilation des données, tout nom de statut commençant par `Custom_` est mis en minuscules et transformé en symbole. `Custom_Groggy` devient donc `:custom_groggy`, le symbole utilisé partout dans le code.

:::tip
On réserve dès le départ un nom qui convient. Renommer le statut dans Studio plus tard oblige à mettre à jour tous les scripts qui référencent le symbole.
:::

## Déclarer l'ID du statut

Le moteur désigne chaque statut par un ID entier. On ouvre `Data/configs/states.json` dans le projet avec un éditeur de texte et on ajoute le statut à la table `ids` :

```json
{
  "klass": "Configs::States",
  "ids": {
    "poison": 1,
    "paralysis": 2,
    "burn": 3,
    "sleep": 4,
    "freeze": 5,
    "confusion": 6,
    "toxic": 8,
    "death": 9,
    "ko": 9,
    "flinch": 7,
    "custom_groggy": 20
  }
}
```

On choisit un ID **bien au-dessus des existants** (20 ici) pour qu'un statut officiel ajouté dans une future version de PSDK ne puisse pas entrer en collision avec le sien. Les statuts officiels s'arrêtent actuellement à 9 : la plage vide entre eux et son ID est donc voulue et sans conséquence. On enregistre le fichier : PSDK recharge automatiquement le `.rxdata` correspondant.

L'ID est désormais accessible dans le code via `Configs.states.ids[:custom_groggy]`.

## Ajouter les méthodes de lecture et d'application sur le Pokémon

`PFM::Pokemon` expose, pour chaque statut officiel, trois méthodes sur lesquelles le reste du moteur s'appuie. La paralysie sert de modèle :

```ruby
# Is the Pokemon paralyzed?
# @return [Boolean]
def paralyzed?
  return @status == Configs.states.ids[:paralysis]
end

# Paralyze the Pokemon
# @param forcing [Boolean] force the new status
# @return [Boolean] if the pokemon has been paralyzed
def status_paralyze(forcing = false)
  if (@status == 0 || forcing) && !dead?
    @status = Configs.states.ids[:paralysis]
    return true
  end
  return false
end

# Can the Pokemon be paralyzed?
# @return [Boolean]
def can_be_paralyzed?
  return false if @status != 0
  return false if type_electric?

  return true
end
```

- `paralyzed?` indique si le Pokémon souffre actuellement du statut.
- `status_paralyze(forcing)` applique le statut. Par défaut, il ne prend que sur un Pokémon sans statut et non K.O. ; `forcing = true` contourne ce garde-fou.
- `can_be_paralyzed?` décide si le statut peut être appliqué, en tenant compte d'une éventuelle immunité (ici, les types Électrik).

On recrée les trois mêmes méthodes pour son statut dans un script personnalisé. Si on n'a jamais ajouté de script personnalisé, voir [Préparer son environnement de développement](/getting-started/customize-psdk/preparer-son-environnement#comment-psdk-charge-les-scripts), qui explique où placer le fichier et comment PSDK décide de le charger.

```ruby
module PFM
  class Pokemon
    # Is the Pokemon groggy?
    # @return [Boolean]
    def groggy?
      return @status == Configs.states.ids[:custom_groggy]
    end

    # Make the Pokemon groggy
    # @param forcing [Boolean] force the new status
    # @return [Boolean] if the pokemon has been made groggy
    def status_groggy(forcing = false)
      if (@status == 0 || forcing) && !dead?
        @status = Configs.states.ids[:custom_groggy]
        return true
      end
      return false
    end

    # Can the Pokemon be made groggy?
    # @return [Boolean]
    def can_be_groggy?
      return false if @status != 0
      # Add your own immunity conditions here, one per line.

      return true
    end
  end
end
```

## Enregistrer le statut dans le StatusChangeHandler

`Battle::Logic::StatusChangeHandler` décide si un statut peut être appliqué en combat et, le cas échéant, affiche le bon message et la bonne animation. Plusieurs constantes le pilotent ; toutes sont modifiables, donc on les étend depuis un script personnalisé.

### Lier le symbole à sa méthode d'application

`STATUS_APPLY_METHODS` associe un symbole de statut à la méthode de `PFM::Pokemon` qui l'applique. On la pointe vers la méthode écrite plus haut :

```ruby
module Battle
  class Logic
    class StatusChangeHandler < ChangeHandlerBase
      STATUS_APPLY_METHODS[:custom_groggy] = :status_groggy
    end
  end
end
```

### Déclarer le message d'application (optionnel)

`STATUS_APPLY_MESSAGE` porte la ligne de texte affichée quand le statut prend :

```ruby
      # Text line for the application message
      STATUS_APPLY_MESSAGE[:custom_groggy] = 320
```

La ligne de message renvoie au fichier de texte **100019** dans Pokémon Studio. On y ajoute son texte d'application avec Studio (jamais en éditant le CSV à la main) et on utilise son numéro de ligne.

:::note[Les numéros de ligne viennent de Studio]
Chaque numéro de ligne pointant vers le fichier de texte 100019 dans ce guide, le `320` ci-dessus et les `285`, `282` et `330` utilisés dans les sections prévention, effet et guérison ci-dessous, est un exemple. Quand on ajoute un message dans Studio, il attribue le prochain numéro de ligne libre ; on lit ce numéro et on l'utilise dans son script au lieu de recopier ceux montrés ici.
:::

### Empêcher le statut sous conditions personnalisées

Quand un statut ne peut pas être appliqué (une immunité, un talent, etc.), le handler doit le refuser et expliquer pourquoi. Il le fait via `check_status_prevention`, que les modules personnalisés étendent avec `prepend` :

```ruby
module GroggyPrevention
  # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch
  # @param target [PFM::PokemonBattler]
  # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
  # @param skill [Battle::Move, nil] potential move used
  # @return [:prevent, nil]
  def check_status_prevention(status, target, launcher, skill)
    result = super
    result ||= check_groggy_prevention(status, target, launcher, skill)

    return result
  end

  # Function checking for groggy prevention
  # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch
  # @param target [PFM::PokemonBattler]
  # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
  # @param skill [Battle::Move, nil] potential move used
  # @return [:prevent, nil]
  def check_groggy_prevention(status, target, launcher, skill)
    return if status != :custom_groggy || target.can_be_groggy?

    return prevent_change do
      scene.display_message_and_wait(parse_text_with_pokemon(19, 285, target)) if skill.nil? || skill.status?
    end
  end
end
Battle::Logic::StatusChangeHandler.prepend(GroggyPrevention)
```

`super` exécute d'abord toutes les vérifications de prévention officielles ; `result ||=` ajoute ensuite la sienne uniquement si aucune n'a déjà bloqué le statut, en conservant exactement la structure que le moteur utilise pour ses propres statuts. La fonction dédiée `check_groggy_prevention` se lit : si la demande concerne son statut **et** que la cible ne peut pas le recevoir, on bloque le changement et on affiche le texte de prévention. `parse_text_with_pokemon(19, 285, target)` lit la ligne `285` du fichier de texte 100019, que l'on ajoute via Studio.

### Corriger le message de guérison (optionnel)

Quand un statut est soigné en combat (par une attaque, un objet ou un talent), le handler le retire de façon générique, mais le message affiché est choisi par sa méthode privée `cure_message_id`. Cette méthode ne connaît que les statuts officiels et retombe sur la ligne « réveil » pour tout le reste : un statut personnalisé soigné afficherait donc le mauvais texte. Si le statut peut être soigné en combat, on prepend une surcharge qui renvoie sa propre ligne de message :

```ruby
module GroggyCureMessage
  private

  # @param target [PFM::PokemonBattler]
  # @return [Integer] line of text file 100019
  def cure_message_id(target)
    return 330 if target.groggy?

    return super
  end
end
Battle::Logic::StatusChangeHandler.prepend(GroggyCureMessage)
```

`cure_message_id` s'exécute avant que le statut soit retiré, donc `target.groggy?` est encore vrai à ce moment. On renvoie la ligne de son texte de guérison (ajoutée via Studio dans le fichier 100019) pour son statut, et on délègue à `super` pour tous les autres. La guérison elle-même fonctionne sans cette surcharge ; seul le message affiché en a besoin.

## Ajouter un bonus de capture (optionnel)

Dans les jeux principaux, un Pokémon sous statut est plus facile à capturer. Si le statut doit accorder le même bonus, on étend `STATUS_MODIFIER` sur `Battle::Logic::CatchHandler` :

```ruby
module Battle
  class Logic
    class CatchHandler < ChangeHandlerBase
      STATUS_MODIFIER[:custom_groggy] = 1.5
    end
  end
end
```

La valeur est un multiplicateur appliqué au taux de capture. Pour référence, les statuts officiels utilisent `1.5` (poison, brûlure, paralysie) jusqu'à `2.5` (sommeil, gel). Toute valeur positive fonctionne : un multiplicateur inférieur à `1` ferait _baisser_ le taux de capture.

## Créer la classe d'effet du statut

Le comportement d'un statut en combat vit dans une sous-classe de `Battle::Effects::Status`. On ajoute d'abord une méthode de lecture à la classe parente pour que le moteur puisse reconnaître le statut depuis un effet :

```ruby
module Battle
  module Effects
    class Status < EffectBase
      # Tell if the status effect is groggy
      # @return [Boolean]
      def groggy?
        @status == :custom_groggy
      end
    end
  end
end
```

On crée ensuite la classe d'effet elle-même et on l'enregistre :

```ruby
module Battle
  module Effects
    class Status
      class Groggy < Status
        # Prevent groggy from being applied twice
        # @param handler [Battle::Logic::StatusChangeHandler]
        # @param status [Symbol] :poison, :toxic, :confusion, :sleep, :freeze, :paralysis, :burn, :flinch, :cure
        # @param target [PFM::PokemonBattler]
        # @param launcher [PFM::PokemonBattler, nil] potential launcher of a move
        # @param skill [Battle::Move, nil] potential move used
        # @return [:prevent, nil] :prevent if the status cannot be applied
        def on_status_prevention(handler, status, target, launcher, skill)
          return if target != self.target
          return if status != :custom_groggy

          return handler.prevent_change do
            handler.scene.display_message_and_wait(parse_text_with_pokemon(19, 282, target))
          end
        end

        # Name of the effect
        # @return [Symbol]
        def name
          :custom_groggy
        end
      end

      register(:custom_groggy, Groggy)
    end
  end
end
```

- On nomme la classe en **PascalCase** (`Groggy`, `MyCustomStatus`).
- `on_status_prevention` s'exécute tant que le Pokémon porte déjà le statut : ici, elle bloque sa réapplication et affiche le texte « déjà sous statut » à la ligne `282` du fichier 100019.
- `register(:custom_groggy, Groggy)` lie le symbole à la classe via la factory.

À partir de là, le statut est pleinement reconnu par le moteur. Pour lui donner de vrais effets (dégâts par tour, changements de stats, etc.), on surcharge les hooks d'`EffectBase`. Les statuts existants dans `5 Battle/06 Effects/03 Status Effects/` (rechercher `< Status`, ou `< EffectBase` pour l'ensemble complet des effets surchargeables) sont la référence de ce qui est possible.

## Rendre les statuts personnalisés sûrs en combat

Même un statut sans animation ne doit pas faire planter le combat. Quand un statut est infligé, le moteur tente inconditionnellement de jouer une animation de combat et une teinte d'écran pour lui. Chaque statut officiel enregistre les deux ; un statut personnalisé n'a ni l'une ni l'autre, et le moteur n'offre pour l'instant aucun repli : l'appliquer lève donc une erreur au moment où il prend (`undefined method '>' for nil` pour l'animation manquante, puis `undefined method '[]' for nil` pour la teinte manquante).

En attendant qu'une future version de PSDK les rende optionnelles nativement, on ajoute ce patch de compatibilité une fois. Il rend l'animation et la teinte réellement optionnelles : un statut qui les enregistre les garde, un statut qui ne les enregistre pas les ignore simplement.

```ruby
# Compatibility patch: a custom status with no registered animation or screen
# tint should simply skip them in battle, instead of crashing.
module UI
  class StatusAnimation
    class << self
      # Tell whether a status has a registered battle animation
      # @param db_symbol [Symbol]
      # @return [Boolean]
      def registered?(db_symbol)
        return @registered_status.key?(db_symbol)
      end
    end
  end
end

module BattleUI
  class PokemonSprite
    # Make the battle animation and the screen tint optional for custom statuses
    module OptionalCustomStatusVisuals
      # Play the status animation only when one is registered for the status
      # @param status [Symbol, Integer]
      def status_animation(status)
        symbol = status.is_a?(Integer) ? Configs.states.symbol(status) : status
        return super if UI::StatusAnimation.registered?(symbol)

        set_tone_status(symbol)
      end

      # Apply the screen tint only when the status defines one
      # @param status [Symbol, Integer]
      # @param switch [Boolean]
      def set_tone_status(status, switch = false)
        symbol = status.is_a?(Integer) ? Configs.states.symbol(status) : status
        return if symbol.is_a?(Symbol) && !STATUS_TONE.key?(symbol)

        super
      end
    end
    prepend OptionalCustomStatusVisuals
  end
end
```

`registered?` indique si un statut possède une animation ; `status_animation` ne joue alors l'animation que si elle existe, et `set_tone_status` n'applique la teinte que si le statut en définit une. Les deux gardes délèguent à `super` pour les statuts officiels, dont le comportement reste inchangé. Avec ce patch en place, le statut fonctionne en combat, avec ou sans les visuels ci-dessous. Si on ne veut ni animation de combat ni teinte, on peut s'arrêter ici et passer à l'icône.

## Ajouter une animation de combat (optionnel)

L'animation jouée quand le statut prend est une planche de sprites gérée par `UI::StatusAnimation`. Pour en donner une à son statut, on en crée une sous-classe, on décrit la planche, et on enregistre la sous-classe :

```ruby
module UI
  class StatusAnimation
    # Battle animation for the groggy status
    class Groggy < StatusAnimation
      # Number of [columns, rows] in the sprite sheet
      # @return [Array<Integer, Integer>]
      def status_dimension
        return [12, 10]
      end

      # Sheet path, resolved under Graphics/animations/
      # @return [String]
      def status_filename
        return 'status/custom_groggy'
      end

      # Duration of the animation in seconds (optional, default 1)
      # @return [Float]
      def status_duration
        return 1.2
      end
    end
    register(:custom_groggy, Groggy)
  end
end
```

- `status_dimension` renvoie la grille `[colonnes, lignes]` de la planche, et `status_filename` son chemin. Les deux sont requises dès qu'on enregistre une sous-classe : le patch de compatibilité ci-dessus ne saute l'animation que tant que le statut n'est _pas_ enregistré.
- `status_filename` est résolu sous `Graphics/animations/`, donc `'status/custom_groggy'` pointe vers `graphics/animations/status/custom_groggy.png`. Les planches officielles (`status/poison`, `status/burn`, etc.) sont la référence pour la taille et la disposition des frames.
- `status_duration`, ainsi que les surcharges `x_offset` / `y_offset`, sont optionnelles.

Deux touches optionnelles complètent l'effet, toutes deux indexées par le symbole du statut :

```ruby
# Screen tint pulsed while the animation plays: [red, green, blue, max_alpha, min_alpha]
BattleUI::PokemonSprite::STATUS_TONE[:custom_groggy] = [0.4, 0, 0.49, 0.6, 0]
# Sound effect played on application
BattleUI::PokemonSprite::STATUS_SE[:custom_groggy] = 'moves/poison'
```

Grâce au patch de compatibilité, ce sont de vrais bonus : sans lui, une teinte manquante ferait planter le combat, et un son manquant ne joue rien.

## Ajouter l'icône du statut

### Éditer le fichier graphique

Les statuts officiels ont une icône sur l'interface de combat, et le sien le peut aussi. Les icônes vivent dans `graphics/interface`, une planche par langue :

- `statutsen.png` (anglais, le repli par défaut)
- `statutsfr.png` (français)
- `statutses.png` (espagnol)

Si la langue du jeu n'a pas de planche, on crée `statuts[code].png` (par exemple `statutsde.png` pour l'allemand, avec le code de langue défini dans Studio). On édite la planche de sa langue, ou l'anglaise par défaut.

Chaque icône occupe une bande de 10 pixels de haut, ordonnée par ID de statut. Pour ajouter la sienne (toutes les coordonnées se mesurent depuis le coin supérieur gauche) :

- On étend la hauteur de l'image à `10 * (ID + 1)` pixels. Avec l'ID 20, la planche fait `10 * 21 = 210` pixels de haut.
- On dessine son icône en `X = 0`, `Y = 10 * ID`. Avec l'ID 20, cela donne `Y = 200`.
- On répète pour chaque planche de langue maintenue.

Un espace vide entre son icône et la précédente est normal quand l'ID n'est pas contigu ; c'est sans conséquence.

### Déclarer le nombre d'icônes dans le code

Enfin, on indique à la classe de sprite combien de bandes de statut la planche contient désormais. `UI::StatusSprite` expose une constante `STATE_COUNT` ; on la surcharge depuis un script personnalisé avec son ID le plus haut plus un :

```ruby
module UI
  class StatusSprite < SpriteSheet
    remove_const :STATE_COUNT
    # Number of status icons in the sheet
    STATE_COUNT = 21
  end
end
```

Avec un ID maximal de 20, `STATE_COUNT` vaut 21. On met cette valeur à jour chaque fois qu'on ajoute un autre statut personnalisé avec un ID plus élevé.

## Récapitulatif des fichiers

| Fichier                                       | Action                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Studio -> Attaques                            | Définir le statut personnalisé sur chaque attaque qui doit l'infliger         |
| `Data/configs/states.json`                    | Déclarer l'ID du statut                                                       |
| Studio -> Textes de combat (fichier 100019)   | Ajouter les messages d'application, de prévention et de guérison (optionnel)  |
| `mon-projet/scripts/001 PokemonStatus.rb`     | Ajouter `groggy?`, `status_groggy`, `can_be_groggy?` à `PFM::Pokemon`         |
| `mon-projet/scripts/002 StatusChange.rb`      | Enregistrer dans `STATUS_APPLY_METHODS`, les messages, la prévention          |
| `mon-projet/scripts/003 CatchHandler.rb`      | Ajouter à `STATUS_MODIFIER` (bonus de capture optionnel)                      |
| `mon-projet/scripts/004 StatusEffect.rb`      | Ajouter la méthode de lecture parente et créer la classe d'effet              |
| `mon-projet/scripts/005 CustomStatusPatch.rb` | Coller le patch de compatibilité (rend l'animation et la teinte optionnelles) |
| `graphics/animations/status/<nom>.png`        | Ajouter la planche d'animation de combat (optionnel)                          |
| `mon-projet/scripts/006 StatusAnimation.rb`   | Enregistrer une sous-classe `UI::StatusAnimation` (animation optionnelle)     |
| `graphics/interface/statuts[lang].png`        | Ajouter l'icône du statut                                                     |
| `mon-projet/scripts/007 StatusSprite.rb`      | Mettre à jour `STATE_COUNT`                                                   |

## Conclusion

- On nomme le statut dans Studio et on l'assigne aux attaques concernées ; le préfixe `Custom_` devient le symbole `:custom_groggy`.
- On déclare son **ID** dans `states.json`, bien au-dessus des officiels.
- On reproduit les **méthodes de lecture et d'application** officielles sur `PFM::Pokemon`.
- On l'enregistre dans le **StatusChangeHandler** (méthode d'application, messages, prévention) et, en option, dans le **CatchHandler** pour un bonus de capture.
- On crée la **classe d'effet** avec `register`, puis on code son comportement en surchargeant les hooks d'`EffectBase`.
- On ajoute le **patch de compatibilité** pour que le statut ne plante jamais en combat, puis, en option, on enregistre une **animation de combat** (une sous-classe `UI::StatusAnimation`) avec une teinte et un son.
- On ajoute l'**icône** aux planches de statut et on incrémente `STATE_COUNT`.
- Les statuts existants dans `5 Battle/06 Effects/03 Status Effects/` sont la référence pour coder des effets plus riches.
