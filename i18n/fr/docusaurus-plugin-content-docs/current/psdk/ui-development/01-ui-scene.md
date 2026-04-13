---
title: "Comment créer une scène UI dans PSDK ?"
slug: creer-une-scene-ui
sidebar_position: 1
description: "Ce guide est le premier d'une série de 10 où l'on construit pas à pas un plugin Mystery Gift complet. Ce système permettra aux joueurs d'entrer des codes pour recevoir des récompenses."
---

Ce guide est le premier d'une série de 10 où l'on construit pas à pas un plugin Mystery Gift complet. Ce système permettra aux joueurs d'entrer des codes pour recevoir des récompenses. Dans ce guide, on crée la structure du plugin et une scène minimale qui s'affiche et se ferme avec B.

## Principe

Une UI dans PSDK est organisée en couches distinctes, chacune ayant un rôle précis :

- **PFM** (optionnel) : le modèle de données. Utilisé uniquement si la scène a besoin de persistence. Dans notre plugin Mystery Gift, cette couche stockera les codes déjà utilisés par le joueur.
- **UI** : les composants visuels. Contient les constantes, les sous-composants graphiques (basés sur SpriteStack) et le Composition qui orchestre l'ensemble.
- **GamePlay** : la logique de scène. Gère le cycle de vie, les inputs clavier et souris, et les transitions.

Le nom doit être **identique** dans les trois couches : `PFM::MysteryGift`, `UI::MysteryGift`, `GamePlay::MysteryGift`. Cette convention est obligatoire dans PSDK.

## Structure du plugin

Voici la structure complète du plugin Mystery Gift que l'on va construire au fil des 9 guides :

```
scripts/20 MysteryGift/
  000 Entry.rb              -> GamePlay accessor
  001 Constants.rb          -> UI::MysteryGift module constants
  001 PFM/
    000 MysteryGift.rb      -> PFM::MysteryGift (persistence)
  002 UI/
    000 GiftRow.rb          -> Gift row component
    001 ReceivedBanner.rb   -> Gift received animation banner
    999 Composition.rb      -> Visual orchestrator
  003 GamePlay/
    000 Base.rb             -> GenericBase subclass
    001 Main.rb             -> Scene class
    002 Logic.rb            -> Business logic
    003 Input.rb            -> Keyboard input
    004 Mouse.rb            -> Mouse input
```

- Les fichiers et les dossiers sont préfixés par des numéros qui définissent l'ordre de chargement.
- Un fichier portant le même préfixe qu'un dossier est chargé **avant** le contenu de ce dossier. Par exemple, `001 Constants.rb` est chargé avant tout le contenu du dossier `001 PFM/`.
- Le dossier `001 PFM/` contient la couche persistence (optionnelle), le dossier `002 UI/` contient les composants visuels, le dossier `003 GamePlay/` contient la logique de scène.
- Dans ce premier guide, on crée seulement trois fichiers : `000 Entry.rb`, `003 GamePlay/000 Base.rb` et `003 GamePlay/001 Main.rb`.

## Point d'entrée

Le fichier Entry.rb expose un accessor et une méthode d'ouverture sur le module `GamePlay`. C'est le point d'entrée pour lancer la scène Mystery Gift depuis n'importe où dans le jeu.

```ruby
module GamePlay
  class << self
    # @return [Class] the Mystery Gift scene class
    attr_accessor :mystery_gift_class

    # Open the Mystery Gift scene
    def open_mystery_gift
      return current_scene.call_scene(mystery_gift_class)
    end
  end
end
```

- `attr_accessor :mystery_gift_class` crée un attribut de classe qui stocke la référence vers la classe de scène. Cela permet à d'autres plugins de remplacer la scène par une version personnalisée via monkey-patching.
- `open_mystery_gift` est la méthode publique que le jeu appelle pour ouvrir la scène. Elle utilise `current_scene.call_scene` qui empile la nouvelle scène par-dessus la scène courante.
- La classe de scène est enregistrée dans cet accessor à la fin de Main.rb, ce qu'on verra plus loin dans ce guide.

## GenericBase personnalisé

La classe `GenericBase` fournit les éléments visuels de base communs à toutes les scènes : fond d'écran, barre de boutons, boutons ctrl (A/X/Y/B), et le `win_text` (objet texte réutilisable). On ne reconstruit jamais ces éléments manuellement : on hérite de `GenericBase` et on override les méthodes privées pour personnaliser le rendu.

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

- `MysteryGiftBase < GenericBase` : on hérite de GenericBase pour récupérer tout le socle visuel sans rien recoder.
- `background_filename` : override de la méthode privée qui retourne le chemin de l'image de fond. Le framework charge automatiquement cette image.
- `create_background_animation` : en définissant une méthode vide, on désactive l'animation de défilement du fond. Si on veut l'animation, on ne redéfinit simplement pas cette méthode.

## Scène minimale

Le fichier Main.rb contient la classe de scène elle-même. Elle hérite de `BaseCleanUpdate::FrameBalanced` qui fournit le cycle de vie standard et la gestion du frame balancing. Pour ce premier guide, on crée une version simplifiée sans composition ni inputs -- ces éléments seront ajoutés dans les guides suivants.

```ruby
module GamePlay
  # Mystery Gift scene -- allows players to enter codes and claim rewards
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    include UI::MysteryGift

    # Create the scene
    def initialize
      super
      @running = true
    end

    # Update graphics each frame
    def update_graphics
      @base_ui.update_background_animation
    end

    private

    # Create all the graphics for the scene
    def create_graphics
      create_viewport
      create_base_ui
      Graphics.sort_z
    end

    # Create the base UI with button texts
    def create_base_ui
      @base_ui = UI::MysteryGiftBase.new(@viewport, button_texts)
    end

    # Return the button texts for the ctrl buttons
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end

    # Shortcut to access Mystery Gift text
    # @param id [Integer] the text row index
    # @return [String]
    def gift_text(id)
      return ext_text(TEXT_FILE_ID, id)
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

- `super` appelle `GamePlay::Base#initialize` qui crée la fenêtre de messages et l'horloge interne de la scène.
- `@running = true` indique que la scène est active. On mettra cette variable à `false` pour quitter la scène (dans un prochain guide).
- `include UI::MysteryGift` donne accès aux constantes définies dans le module `UI::MysteryGift`, comme `TEXT_FILE_ID` que l'on créera dans le guide sur les constantes.
- `create_graphics` est appelée automatiquement par le framework après `initialize`. Elle crée le viewport, instancie la base UI, puis appelle `Graphics.sort_z` pour trier les éléments visuels par profondeur.
- `create_viewport` est héritée de `GamePlay::Base`. Elle crée le viewport principal `@viewport` à z=10_000, ce qui garantit que la scène s'affiche au-dessus des éléments de jeu.
- `create_base_ui` instancie la sous-classe de GenericBase définie précédemment. Le second argument `button_texts` définit les textes des boutons ctrl.
- `button_texts` retourne un tableau de 4 éléments correspondant aux boutons ctrl dans l'ordre [A, X, Y, B]. Mettre `nil` masque le bouton correspondant. Ici, seul le bouton B est visible avec le texte "Quit".
- `update_graphics` est appelée à chaque frame pour mettre à jour les animations. `update_background_animation` anime le défilement du fond (si actif).
- `gift_text` est un raccourci pour accéder aux textes du plugin Mystery Gift via `ext_text`. On l'utilisera dans les prochains guides.
- La dernière ligne `GamePlay.mystery_gift_class = GamePlay::MysteryGift` enregistre la classe dans l'accessor défini dans Entry.rb, ce qui permet à `GamePlay.open_mystery_gift` de fonctionner.

## Cycle de vie

Le framework exécute la scène selon un cycle précis :

1. **`initialize`** : le constructeur est appelé. On initialise les variables d'état mais on ne crée aucun graphique.
2. **`create_graphics`** : le framework appelle cette méthode une seule fois, juste après `initialize`. C'est ici qu'on crée les viewports, la base UI, et la composition.
3. **Boucle de mise à jour** : à chaque frame, le framework appelle dans l'ordre :
   - `update_inputs` : gestion des inputs clavier
   - `update_mouse(moved)` : gestion des inputs souris
   - `update_graphics` : mise à jour des animations
4. La boucle se répète jusqu'à ce que `@running` passe à `false`.

Ce cycle est le même pour toutes les scènes PSDK. Le framework gère automatiquement le frame balancing grâce à la classe `BaseCleanUpdate::FrameBalanced`. Dans notre scène minimale, on n'a pas encore défini `update_inputs` ni `update_mouse` -- on les ajoutera dans les prochains guides.

## Conclusion

- Un plugin UI nécessite au minimum trois fichiers : Entry.rb (point d'entrée), Base.rb (sous-classe de GenericBase), et Main.rb (classe de scène).
- Toujours utiliser GenericBase pour la couche UI de base. Ne jamais reconstruire le fond, la barre de boutons ou les boutons ctrl manuellement.
- La méthode héritée `create_viewport` crée le viewport à z=10_000.
- Le tableau `button_texts` contrôle la visibilité des boutons ctrl : `nil` masque le bouton, une chaîne l'affiche avec le texte donné.
- Mettre `@running` à `false` pour quitter la scène.
- Enregistrer la classe à la fin de Main.rb avec `GamePlay.mystery_gift_class = GamePlay::MysteryGift`.
