---
title: "Créer une scène UI"
slug: creer-une-scene-ui
sidebar_position: 1
description: "C'est le premier guide de code d'une série où l'on construit pas à pas une UI Mystery Gift complète. Ce système permet aux joueurs d'entrer des codes pour recevoir des récompenses. Ici, on crée la structure de fichiers et une scène minimale qui s'affiche et se ferme avec B."
---

C'est le premier guide de code d'une série où l'on construit pas à pas une UI Mystery Gift complète. Ce système permet aux joueurs d'entrer des codes pour recevoir des récompenses. Le [guide de préparation](./00-setup.md) a déjà mis en place les graphismes et les textes ; ici, on crée la structure de fichiers et une scène minimale qui s'affiche et se ferme avec B.

## Principe

Une UI dans PSDK est organisée en couches distinctes, chacune ayant un rôle précis :

- **PFM** (optionnel) : le modèle de données. Utilisé uniquement si la scène a besoin de persistence. Dans notre UI Mystery Gift, cette couche stockera les codes déjà utilisés par le joueur.
- **UI** : les composants visuels. Contient les constantes, les sous-composants graphiques (basés sur SpriteStack) et la Composition qui orchestre l'ensemble.
- **GamePlay** : la logique de scène. Gère le cycle de vie, les inputs clavier et souris, et les transitions.

Le nom doit être **identique** dans les trois couches : `PFM::MysteryGift`, `UI::MysteryGift`, `GamePlay::MysteryGift`. Cette convention est obligatoire dans PSDK.

## Structure des fichiers

Voici la structure complète de fichiers de l'UI Mystery Gift que l'on va construire au fil des guides suivants :

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

- Les fichiers et dossiers sont préfixés de numéros qui définissent l'ordre de chargement.
- Un fichier portant le même préfixe qu'un dossier est chargé **avant** le contenu du dossier. Par exemple, `001 Constants.rb` est chargé avant tout ce qui se trouve dans le dossier `001 PFM/`.
- Le dossier `001 PFM/` contient la couche de persistence (optionnelle), le dossier `002 UI/` contient les composants visuels, le dossier `003 GamePlay/` contient la logique de scène.
- Dans ce premier guide, on ne crée que trois fichiers : `000 Entry.rb`, `003 GamePlay/000 Base.rb` et `003 GamePlay/001 Main.rb`. Les autres fichiers sont ajoutés dans les guides suivants.

## Point d'entrée

Le point d'entrée expose un accesseur et une méthode d'ouverture sur le module `GamePlay`. C'est ainsi que la scène Mystery Gift est lancée depuis n'importe où dans le jeu.

Créez `scripts/20 MysteryGift/000 Entry.rb` :

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

- `attr_accessor :mystery_gift_class` crée un attribut de classe qui stocke la référence vers la classe de la scène. Cela permet à d'autres scripts de remplacer la scène par une version personnalisée via monkey-patching.
- `open_mystery_gift` est la méthode publique que le jeu appelle pour ouvrir la scène. Elle utilise `current_scene.call_scene` qui empile la nouvelle scène par-dessus la scène courante.
- La classe de la scène est enregistrée dans cet accesseur en bas de `001 Main.rb`, ce que l'on verra plus loin dans ce guide.

## GenericBase personnalisé

La classe `GenericBase` fournit les éléments visuels de base communs à toutes les scènes : image de fond, barre de boutons, boutons ctrl (A/X/Y/B), et le `win_text` (objet texte réutilisable). Il ne faut jamais reconstruire ces éléments manuellement : héritez de `GenericBase` et surchargez ses méthodes privées pour personnaliser le rendu.

Créez `scripts/20 MysteryGift/003 GamePlay/000 Base.rb` :

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

- `MysteryGiftBase < GenericBase` : on hérite de GenericBase pour récupérer toute la fondation visuelle sans rien réécrire.
- `background_filename` : surcharge de la méthode privée qui renvoie le chemin de l'image de fond (`graphics/interface/mystery_gift/background.png`, installée dans le guide de préparation). Le framework charge cette image automatiquement.
- `create_background_animation` : en définissant une méthode vide, on désactive l'animation de défilement du fond. Si vous voulez l'animation, ne redéfinissez tout simplement pas cette méthode.
- C'est une version minimale. On personnalise la barre de boutons et les boutons ctrl dans le [guide GenericBase](./10-genericbase.md).

## Scène minimale

La classe de scène elle-même hérite de `BaseCleanUpdate::FrameBalanced`, qui fournit le cycle de vie standard et l'équilibrage de frames. Pour ce premier guide, on crée une version simplifiée sans composition ni navigation dans une liste -- ces éléments sont ajoutés dans les guides suivants. Elle gère déjà le bouton B pour que vous puissiez fermer la scène.

Créez `scripts/20 MysteryGift/003 GamePlay/001 Main.rb` :

```ruby
module GamePlay
  # Mystery Gift scene -- a minimal scene that displays and closes with B
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    # Create the scene
    def initialize
      super
      @running = true
    end

    # Handle keyboard input each frame
    # @return [Boolean]
    def update_inputs
      return automatic_input_update
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

    # Return the button texts for the ctrl buttons [A, X, Y, B]
    # @return [Array<String, nil>]
    def button_texts
      return [nil, nil, nil, 'Quit']
    end

    # Action triggered by the B button -- quit the scene
    def action_b
      @running = false
    end
  end
end

GamePlay.mystery_gift_class = GamePlay::MysteryGift
```

- `super` appelle `GamePlay::Base#initialize` qui crée la fenêtre de message et l'horloge interne de la scène.
- `@running = true` indique que la scène est active. La passer à `false` fait sortir de la scène.
- `create_graphics` est appelée automatiquement par le framework après `initialize`. Elle crée le viewport, instancie la base UI, puis appelle `Graphics.sort_z` pour trier tous les éléments visuels par profondeur.
- `create_viewport` est héritée de `GamePlay::Base`. Elle crée le viewport principal `@viewport` en z=10_000, ce qui garantit que la scène s'affiche au-dessus des éléments du jeu.
- `create_base_ui` instancie la sous-classe de GenericBase définie plus haut. Le deuxième argument `button_texts` définit les textes des boutons ctrl.
- `button_texts` renvoie un tableau de 4 éléments correspondant aux boutons ctrl dans l'ordre [A, X, Y, B]. Mettre `nil` cache le bouton correspondant. Ici, seul le bouton B est visible avec le texte « Quit ». (On déplace ce texte vers le CSV dans le [guide i18n](./07-i18n.md).)
- `update_inputs` est appelée à chaque frame par le framework. `automatic_input_update` vérifie chaque touche et appelle la méthode `action_*` correspondante si elle est pressée et définie. Ici, seule `action_b` existe, donc appuyer sur B fait sortir.
- `action_b` passe `@running` à `false` pour sortir de la scène. Dans le [guide clavier](./05-keyboard.md), on extrait `update_inputs` et les actions dans leur propre fichier, `003 Input.rb`, et on ajoute la navigation.
- `update_graphics` est appelée à chaque frame pour mettre à jour les animations. `update_background_animation` anime le défilement du fond (sans effet ici puisqu'on l'a désactivé).
- La dernière ligne `GamePlay.mystery_gift_class = GamePlay::MysteryGift` enregistre la classe dans l'accesseur défini dans `000 Entry.rb`, ce qui fait fonctionner `GamePlay.open_mystery_gift`.

## Cycle de vie

Le framework exécute la scène selon un cycle précis :

1. **`initialize`** : le constructeur est appelé. On initialise les variables d'état mais on ne crée aucun graphisme.
2. **`create_graphics`** : le framework appelle cette méthode une fois, juste après `initialize`. C'est là qu'on crée les viewports, la base UI et (plus tard) la composition.
3. **Boucle de mise à jour** : à chaque frame, le framework appelle dans l'ordre :
   - `update_inputs` : gestion des entrées clavier
   - `update_mouse(moved)` : gestion des entrées souris (ajoutée dans le guide souris)
   - `update_graphics` : mises à jour des animations
4. La boucle se répète jusqu'à ce que `@running` soit mis à `false`.

Ce cycle est le même pour toutes les scènes PSDK. Le framework gère automatiquement l'équilibrage de frames via la classe `BaseCleanUpdate::FrameBalanced`. Dans notre scène minimale, on n'a pas encore défini `update_mouse` -- on l'ajoute dans le [guide souris](./06-mouse.md).

## Essayez

Une fois les trois fichiers en place, ouvrez la scène depuis un événement de map (« Appel de script ») ou la console PSDK :

```ruby
GamePlay.open_mystery_gift
```

Vous devriez voir le fond personnalisé avec un bouton « Quit » en bas, et appuyer sur B ferme la scène.

## Conclusion

- Une scène UI a besoin d'au minimum trois fichiers : `000 Entry.rb` (point d'entrée), `003 GamePlay/000 Base.rb` (sous-classe de GenericBase) et `003 GamePlay/001 Main.rb` (classe de scène).
- Utilisez toujours GenericBase pour la couche de base UI. Ne reconstruisez jamais manuellement le fond, la barre de boutons ou les boutons ctrl.
- Le `create_viewport` hérité crée le viewport en z=10_000.
- Le tableau `button_texts` contrôle la visibilité des boutons ctrl : `nil` cache le bouton, une chaîne l'affiche avec le texte donné.
- Le framework n'appelle `update_inputs` que si vous la définissez ; `automatic_input_update` route un appui touche vers sa méthode `action_*`. Mettez `@running` à `false` pour sortir de la scène.
- Enregistrez la classe en bas de `001 Main.rb` avec `GamePlay.mystery_gift_class = GamePlay::MysteryGift`.
