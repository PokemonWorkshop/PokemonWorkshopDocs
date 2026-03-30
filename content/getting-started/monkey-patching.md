---
title: "Comment monkey-patcher une classe PSDK ?"
slug: monkey-patcher-une-classe-psdk
sidebar_position: 3
description: "PSDK est un moteur qui se met à jour régulièrement. Si on modifie directement un fichier du moteur pour changer un comportement, la prochaine mise à jour écrasera les modifications. Le monkey-patching permet de modifier le comportement d'une classe PSDK depuis ses propres scripts, sans toucher au code source du moteur."
---

PSDK est un moteur qui se met à jour régulièrement. Si on modifie directement un fichier du moteur pour changer un comportement, la prochaine mise à jour écrasera les modifications. Le monkey-patching permet de modifier le comportement d'une classe PSDK **depuis ses propres scripts**, sans toucher au code source du moteur. Ce guide couvre les différentes techniques de monkey-patching utilisées dans PSDK : `prepend` pour modifier globalement une méthode, l'héritage pour un changement local à une seule scène, et la réouverture de module pour les constantes et fonctions d'enregistrement.

## Principe

Le problème est simple : on veut changer le comportement d'une méthode qui existe dans PSDK, mais le code du moteur n'est pas dans notre projet — il est chargé en interne par PSDK. On ne peut pas (et on ne doit pas) le modifier. Ruby permet de résoudre ce problème grâce au **module prepend** :

1. Dans un fichier Ruby placé dans `scripts/`, on rouvre la classe PSDK ciblée.
2. On déclare un module à l'intérieur de cette classe.
3. Ce module redéfinit la méthode qu'on veut modifier.
4. On appelle `prepend` pour insérer le module **avant** la classe dans la chaîne d'héritage.
5. Dans la méthode redéfinie, `super` appelle l'implémentation originale de PSDK.

L'avantage de `prepend` sur la réouverture directe de classe (redéfinir la méthode sans module) est la **composabilité** : si on installe plusieurs plugins qui modifient la même méthode, chaque `super` passe le relais au suivant dans la chaîne. Si on redéfinissait la méthode directement, on écraserait les patches des autres plugins.

## Où placer ses monkey-patches

Tous les scripts utilisateur vont dans le dossier `scripts/` à la racine du projet. C'est le seul endroit où PSDK charge du code personnalisé. La structure typique :

```
scripts/
  my-project/
    001 Patches/
      000 BattleLogic.rb <- monkey-patch sur Battle::Logic
      001 ItemUsage.rb   <- monkey-patch sur Util::Item
    002 Features/
      ...
```

- Les scripts dans `scripts/` sont toujours chargés **après** le code interne de PSDK. Le `prepend` fonctionne donc naturellement : la classe ciblée existe déjà au moment du chargement.
- On regroupe les patches dans un sous-dossier dédié pour les retrouver facilement.

## Prepend simple : intercepter et déléguer

Le cas le plus courant : on veut intercepter un appel à une méthode PSDK, vérifier une condition, et soit court-circuiter le comportement soit laisser PSDK faire son travail via `super`.

### Exemple : bloquer l'EXP après capture selon la génération

```ruby
module Battle
  class Logic
    # Patch to prevent EXP distribution after catching when using gen-based EXP sharing
    module EXPAfterCatchingPokemon
      # Function that process the battle end when Pokemon was caught
      def battle_phase_end_caught
        return if $game_variables[Yuki::Var::GEN_EXP_SHARE].between?(1, 5)

        super
      end
    end

    prepend EXPAfterCatchingPokemon
  end
end
```

- `module Battle` / `class Logic` : on **rouvre** la classe PSDK existante. On ne crée pas une nouvelle classe, on étend celle qui existe déjà dans le moteur.
- Le module `EXPAfterCatchingPokemon` est déclaré **à l'intérieur** de `Battle::Logic`. C'est une convention PSDK : le module de patch vit dans la classe qu'il modifie.
- `battle_phase_end_caught` est la méthode PSDK originale qu'on intercepte. Il faut connaître son nom exact (en lisant le code PSDK ou la documentation).
- `return if ...` court-circuite la méthode : si la condition est vraie, on sort immédiatement sans distribuer d'EXP.
- `super` appelle l'implémentation originale de PSDK. Sans ce `super`, le comportement original serait entièrement supprimé.
- `prepend EXPAfterCatchingPokemon` insère le module avant `Battle::Logic` dans la chaîne d'héritage. Tout appel à `battle_phase_end_caught` passe d'abord par le module.

## Prepend complexe : enrichir avant de déléguer

Quand on veut gérer un nouveau cas qui n'existe pas dans PSDK, puis laisser PSDK gérer tous les autres cas normalement.

### Exemple : intercepter l'utilisation d'items offensifs

```ruby
module Util
  module Item
    # Patch to handle attack items in battle
    module AttackItemPatch
      # Use an item in a GamePlay::Base child class
      # @param item_id [Integer] ID of the item in the database
      # @return [PFM::ItemDescriptor::Wrapper, false] item descriptor wrapper if the item could be used
      def util_item_useitem(item_id, &result_process)
        item_wrapper = PFM::ItemDescriptor.actions(item_id)
        return super unless item_wrapper.attack_item && $game_temp.in_battle

        if item_wrapper.chen
          display_message(parse_text(22, 43))
          return false
        elsif item_wrapper.no_effect
          display_message(parse_text(22, 108))
          return false
        end

        return util_attack_item_on_use_sequence(item_wrapper, result_process)
      end
    end

    prepend AttackItemPatch
  end
end
```

- `return super unless item_wrapper.attack_item && $game_temp.in_battle` : si l'item n'est pas un item offensif ou qu'on n'est pas en combat, on délègue entièrement à PSDK. Le patch est alors invisible pour tous les cas existants.
- Les cas `chen` et `no_effect` sont des gardes supplémentaires : on affiche un message et on retourne `false` pour bloquer l'utilisation.
- `util_attack_item_on_use_sequence` est une nouvelle méthode définie ailleurs dans nos scripts (pas dans le module de patch). Le module de patch ne contient que l'interception.
- Le pattern `return super unless condition` est idiomatique dans PSDK : on traite son nouveau cas, et tout le reste passe par le comportement original.

## Prepend sur un module inclus

La même technique fonctionne sur les modules PSDK qui sont inclus dans des classes. On rouvre le module, on déclare le patch, et on prepend.

### Exemple : rediriger les items offensifs dans l'UI de combat

```ruby
module BattleUI
  module PlayerChoiceAbstraction
    # Patch to redirect attack items to the attack item choice flow
    module AttackItemShortcutPatch
      # Redirect attack items to the attack item choice flow
      # @param item [Studio::Item] the item to use
      def use_item(item)
        item_wrapper = PFM::ItemDescriptor.actions(item.id)
        return super unless item_wrapper.attack_item

        scene.attack_item_shortcut = item_wrapper
        @result = :bag
      end
    end

    prepend AttackItemShortcutPatch
  end
end
```

- `BattleUI::PlayerChoiceAbstraction` est un module PSDK inclus dans plusieurs classes de scène de combat. Le prepend affecte toutes les classes qui incluent ce module.
- Le pattern est identique : `return super unless condition`, puis le traitement spécifique.

## Extension d'une API d'enregistrement

Quand PSDK expose un hash ou une structure d'enregistrement via `module_function`, on peut étendre cette structure sans prepend. On rouvre le module et on ajoute de nouvelles fonctions d'enregistrement.

### Exemple : ajouter une API d'enregistrement d'items offensifs

```ruby
module PFM
  module ItemDescriptor
    module_function

    # Define a usage of an attack item from the bag
    # @param klass [Class<Studio::Item>, Symbol] class or db_symbol of the item
    # @yieldparam item [Studio::Item] the item to use
    # @yieldparam scene [GamePlay::Base]
    def define_on_attack_item_use(klass, &block)
      raise 'Block is mandatory' unless block_given?

      EXTEND_DATAS[klass] ||= Wrapper.new
      EXTEND_DATAS[klass].on_attack_item_use = block
      EXTEND_DATAS[klass].attack_item = true
    end

    # Wrapper extension for attack items
    class Wrapper
      # Tell if the item is an attack item
      # @return [Boolean]
      attr_accessor :attack_item
      # Register the on_use block
      attr_writer :on_attack_item_use

      # Call the on_use block
      # @param scene [GamePlay::Base]
      def on_attack_item_use(scene)
        @on_attack_item_use&.call(@item, scene)
      end
    end
  end
end
```

- `EXTEND_DATAS` est un hash existant dans PSDK. On ne le recrée pas, on y ajoute des entrées via `||=`.
- `module_function` rend `define_on_attack_item_use` appelable comme `PFM::ItemDescriptor.define_on_attack_item_use(...)`.
- La classe `Wrapper` est rouverte pour y ajouter de nouveaux attributs. Cela fonctionne parce que les constantes PSDK ne sont **pas gelées** avec `.freeze`.
- Cette approche est non-destructive : les enregistrements existants dans `EXTEND_DATAS` restent intacts.

## Héritage : monkey-patching local

Le `prepend` est **global** : il affecte toutes les instances de la classe dans tout le jeu. Quand on veut un changement local (une seule scène, un seul composant), l'héritage est la technique de monkey-patching à privilégier.

### Exemple : personnaliser GenericBase pour une scène spécifique

```ruby
module UI
  # Custom base UI for the Mystery Gift scene
  class MysteryGiftBase < GenericBase
    private

    # Return the background filename
    # @return [String]
    def background_filename
      return 'mystery_gift/background'
    end

    # Disable the background scroll animation
    def create_background_animation; end
  end
end
```

- `MysteryGiftBase < GenericBase` crée une sous-classe qui n'affecte que la scène Mystery Gift.
- Si on avait utilisé `prepend` sur `GenericBase`, **toutes** les scènes du jeu auraient été affectées.
- Règle : si le changement est propre à une seule scène et ne doit pas affecter les autres, préférer l'héritage au `prepend`.

## Règles de survie

Quelques règles essentielles pour un monkey-patching propre dans PSDK :

- **Toujours appeler `super`** : sauf si le but explicite est de bloquer le comportement original. Oublier `super` casse silencieusement la chaîne.
- **Jamais de `.freeze` sur les constantes** : `.freeze` empêche l'extension des structures via `prepend` ou réouverture. Il faudrait alors supprimer et reconstruire la constante au lieu de simplement ajouter.
- **Un module par classe patchée** : si on patche trois méthodes d'une même classe, on peut les grouper dans un seul module de patch. Mais ne jamais mélanger des patches de classes différentes dans un même module.
- **Nommer le module de patch explicitement** : le nom doit décrire ce que fait le patch (`EXPAfterCatchingPokemon`, `AttackItemPatch`), pas juste `Patch` ou `Fix`.
- **Documenter les méthodes patchées** : noter quelque part (README, commentaire en tête de fichier) quelles méthodes PSDK sont modifiées. Lors d'une mise à jour de PSDK, cela permet de vérifier rapidement si les méthodes patchées ont changé.

## Conclusion

- Le monkey-patching est **nécessaire** dans PSDK : modifier directement le moteur serait écrasé à la prochaine mise à jour. On travaille toujours depuis ses propres scripts.
- `prepend` est le mécanisme standard pour modifier une méthode PSDK existante. Il préserve la chaîne d'appel via `super` et permet à plusieurs patches de coexister.
- Le pattern idiomatique est `return super unless condition` : on traite son nouveau cas, et tout le reste passe par le comportement original.
- Pour étendre une API d'enregistrement, on rouvre le module et on ajoute de nouvelles fonctions sans écraser l'existant.
- L'héritage est préférable au `prepend` quand le changement est local à une seule scène ou composant.
- Ne jamais oublier `super`, ne jamais utiliser `.freeze`, et toujours documenter les méthodes patchées.
