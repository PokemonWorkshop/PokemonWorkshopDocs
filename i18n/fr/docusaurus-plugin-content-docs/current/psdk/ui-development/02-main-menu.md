---
title: "Personnaliser le menu principal"
slug: personnaliser-le-menu-principal
sidebar_position: 2
description: "Ce guide explique le fonctionnement du menu principal et comment le personnaliser : ajouter un bouton, changer l'apparence d'un bouton et définir un ordre personnalisé. C'est l'une des personnalisations d'UI les plus simples de PSDK, parfaite comme premier contact avec le code d'interface du moteur."
---

Ce guide explique le fonctionnement du **menu principal** et comment le personnaliser : ajouter un bouton, changer l'apparence d'un bouton et définir un ordre personnalisé. C'est l'une des personnalisations d'UI les plus simples de PSDK, parfaite comme premier contact avec le code d'interface du moteur.

## Fonctionnement du menu principal

![Le menu principal en jeu](/img/psdk/ui-development/main-menu.png)

Le menu principal (souvent appelé simplement **Menu**) permet au joueur d'accéder aux interfaces principales du jeu. En interne, son modèle est simple : une liste ordonnée de boutons, où chaque bouton est enregistré avec deux informations.

- Une **action** : un Symbol qui nomme la méthode de `GamePlay::Menu` appelée quand le joueur active le bouton.
- Une **condition de visibilité** : un bloc évalué à chaque ouverture du menu. Le bouton ne s'affiche que si le bloc renvoie une valeur vraie.

C'est pour cela que la capture ci-dessus n'a ni bouton Dex ni bouton équipe : leurs conditions sont fausses tant que le joueur n'a ni Dex ni créature. Voici les boutons que PSDK enregistre par défaut :

| Bouton           | Action         | Condition                           | Signification                                  |
| ---------------- | -------------- | ----------------------------------- | ---------------------------------------------- |
| Dex              | `:open_dex`    | `$game_switches[Yuki::Sw::Pokedex]` | L'interrupteur de jeu activant le Dex est on   |
| Équipe           | `:open_party`  | `$actors.any?`                      | Le joueur a au moins une créature              |
| Sac              | `:open_bag`    | `!$bag.locked`                      | Le sac n'est pas verrouillé par un événement   |
| Carte dresseur   | `:open_tcard`  | `true`                              | Toujours visible                               |
| Options          | `:open_option` | `true`                              | Toujours visible                               |
| Sauvegarde       | `:open_save`   | `!$game_system.save_disabled`       | La sauvegarde n'est pas désactivée             |
| Quitter          | `:open_quit`   | `true`                              | Toujours visible, toujours placé en dernier    |

Comme les conditions sont réévaluées à chaque ouverture du menu, un bouton apparaît dès que sa condition devient vraie. Par exemple, le bouton équipe s'affiche juste après que le joueur a reçu sa première créature.

## Comment ouvrir le menu

En jeu, on appuie sur V (la touche physique associée par défaut à l'entrée X).

Depuis un script, on appelle `GamePlay.open_menu`.

Si vous voulez remplacer le menu principal de PSDK par votre propre Menu entièrement fait maison, assignez votre classe à `GamePlay.menu_class`. C'est une opération avancée : votre classe doit respecter `MenuMixin` (`scripts/4 Systems/100 Menu/099 MenuMixin.rb`), qui définit la fonction `execute_skill_process` dont `Scene_Map` a besoin pour exécuter correctement les capacités de terrain. Pour la plupart des besoins, les personnalisations ci-dessous suffisent, sans avoir à réécrire toute la scène.

## Où écrire vos personnalisations

Ne modifiez jamais les fichiers du moteur : la prochaine mise à jour de PSDK écraserait vos changements. Écrivez plutôt vos personnalisations dans votre propre script, dans le dossier `scripts/` de votre projet, en rouvrant la classe `GamePlay::Menu`. Si cette technique est nouvelle pour vous, lisez d'abord [Qu'est-ce que le monkey-patch et comment l'appliquer dans PSDK ?](/getting-started/customize-psdk/monkey-patch-dans-psdk).

```ruby
module GamePlay
  # Reopen the engine class to add our own registrations
  class Menu
    # Your customizations go here
  end
end
```

Tous les exemples ci-dessous se placent dans ce bloc.

## Comment ajouter un bouton

On appelle `GamePlay::Menu.register_button` avec le Symbol de l'action et la condition de visibilité. Une chose importante à comprendre : le moteur a **déjà enregistré** les sept boutons par défaut quand votre script s'exécute. `register_button` ajoute à la fin de cette liste, il ne remplace rien. Enregistrer `:open_party` une deuxième fois donnerait donc deux boutons équipe au menu ; utilisez `register_button` uniquement pour ajouter de **nouveaux** boutons (pour modifier ceux par défaut, voir la dernière section).

Le Symbol de l'action doit nommer une méthode de `GamePlay::Menu`. Pour un bouton entièrement nouveau, c'est vous qui définissez cette méthode dans la classe rouverte. Un exemple complet avec un journal de quêtes :

```ruby
module GamePlay
  class Menu
    register_button(:open_quests) { $game_switches[42] }

    private

    # Open the quest journal UI
    def open_quests
      call_scene(MyGame::QuestUI)
    end
  end
end
```

Ici, `MyGame::QuestUI` représente la scène que votre bouton doit ouvrir, et l'interrupteur de jeu 42 contrôle le moment où le bouton apparaît. `call_scene` est le même helper que le moteur utilise pour ses propres boutons (regardez `open_save` dans `scripts/4 Systems/100 Menu/100 Menu.rb`).

:::warning

Un nouveau bouton affiche l'icône et le texte de **Quitter** par défaut ! Lisez la suite pour comprendre pourquoi, et comment corriger ça.

:::

Chaque bouton trouve son icône et son texte grâce à son index dans la liste d'enregistrement :

- L'icône vient du fichier `menu_icons` dans les graphismes d'interface de votre projet. C'est une feuille de sprites de 2 colonnes (état normal et sélectionné) par 8 lignes, et le bouton utilise la ligne correspondant à son index. Votre premier bouton personnalisé a l'index 7 : dessinez donc son icône sur la 8e ligne (par défaut, cette ligne contient la variante féminine du sac ; remplacez-la ou utilisez une surcharge de bouton).
- Le texte vient de la méthode `text` de `UI::PSDKMenuButtonBase` (`scripts/4 Systems/100 Menu/300 MenuButtonBase.rb`), qui est un `case` sur l'index. Tout index inconnu retombe sur le texte de Quitter, d'où l'avertissement ci-dessus. Patchez cette méthode avec `prepend`, la technique détaillée dans [le guide du monkey-patch](/getting-started/customize-psdk/monkey-patch-dans-psdk), pour ajouter votre entrée :

```ruby
module UI
  class PSDKMenuButtonBase
    # Patch to add the text of the quest button (index 7)
    module QuestButtonText
      # Get the text based on the index
      # @return [String]
      def text
        return 'Quêtes' if @index == 7

        super
      end
    end

    prepend QuestButtonText
  end
end
```

## Comment changer l'apparence d'un bouton

Une surcharge de bouton remplace la classe de bouton utilisée pour un index précis, ce qui permet de tout changer : icône, texte, ou l'apparence entière. Le moteur lui-même en utilise une : quand le joueur incarne une fille, le bouton du sac (index 2) est affiché par `UI::GirlBagMenuButton`, qui utilise la 8e ligne de `menu_icons` au lieu de la 3e.

```ruby
GamePlay::Menu.register_button_overwrite(2) { $trainer.playing_girl ? UI::GirlBagMenuButton : nil }
```

Le bloc est évalué à l'ouverture du menu : renvoyez une classe pour l'utiliser, ou `nil` pour garder le bouton par défaut.

:::note

Les surcharges ciblent le `real_index` (la position dans la liste d'enregistrement), et non la position à l'écran. Les deux divergent dès qu'un bouton est masqué : si le joueur n'a pas de Dex, le bouton équipe garde le `real_index` 1 mais est dessiné en premier à l'écran (`positional_index` 0). Le `real_index` pilote l'icône et le texte, le `positional_index` pilote la position (voir `UI::PSDKMenuButtonBase`).

:::

## Comment modifier les boutons par défaut

Pour retirer un bouton par défaut, changer sa condition ou réordonner la liste, on ne peut pas éditer une entrée déjà enregistrée : il faut tout effacer et réenregistrer la liste à sa façon.

```ruby
module GamePlay
  class Menu
    clear_previous_registers
    register_button(:open_party) { $actors.any? }
    register_button(:open_bag) { !$bag.locked }
    register_button(:open_save) { !$game_system.save_disabled }
    register_button(:open_quit) { true }
  end
end
```

L'enregistrement par défaut dans `scripts/4 Systems/100 Menu/100 Menu.rb` (présenté dans le tableau en haut de page) vous sert de référence pour les actions et conditions à réenregistrer.

:::warning

Réordonner change l'index de tous les boutons, et les icônes comme les textes sont indexés : avec l'ordre ci-dessus, le bouton équipe afficherait l'icône du Dex. Adaptez les lignes de `menu_icons` et la méthode `text` de `UI::PSDKMenuButtonBase` à votre nouvel ordre.

:::

## Conclusion

- Le menu principal est une liste ordonnée de boutons ; chaque bouton est une **action** (une méthode de `GamePlay::Menu`) plus une **condition de visibilité** évaluée à l'ouverture du menu.
- On écrit ses personnalisations dans son propre script en rouvrant `GamePlay::Menu`, jamais en éditant les fichiers du moteur.
- `register_button(:action) { condition }` **ajoute** un nouveau bouton ; les sept boutons par défaut sont déjà enregistrés.
- Un bouton entièrement nouveau demande trois choses : l'enregistrement, la méthode d'action, et son icône/texte (ligne dans `menu_icons` plus un patch `prepend` de `text` dans `UI::PSDKMenuButtonBase`).
- `register_button_overwrite(real_index) { ClassePersonnalisee }` change l'affichage d'un seul bouton.
- `clear_previous_registers` puis tout réenregistrer est la façon de retirer, modifier ou réordonner les boutons par défaut. On garde `menu_icons` et `text` cohérents avec le nouvel ordre.
