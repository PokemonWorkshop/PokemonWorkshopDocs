---
title: "Comment utiliser les dialogues de confirmation dans PSDK ?"
slug: utiliser-les-dialogues-de-confirmation
sidebar_position: 7
description: "Ce guide explique comment ajouter de la logique métier à une scène UI en utilisant les dialogues de confirmation et les messages bloquants."
---

Ce guide explique comment ajouter de la logique métier à une scène UI en utilisant les dialogues de confirmation et les messages bloquants. Il fait suite aux guides 001 à 007 : le lecteur dispose d'une scène Mystery Gift complète avec Composition, inputs clavier et souris, GenericBase et texte multilingue. Ici, on ajoute le fichier Logic.rb au plugin pour gérer la validation des codes, les dialogues de confirmation et la récupération des cadeaux.

## Principe

PSDK fournit deux mécanismes pour communiquer avec le joueur :

- `display_message_and_wait` bloque la game loop et attend la réponse du joueur. Il sert aussi bien pour les messages simples (le joueur valide avec A) que pour les dialogues Oui/Non.
- `show_win_text` / `hide_win_text` affichent un message dans la barre inférieure sans bloquer la game loop.

La logique métier est placée dans un fichier séparé (Logic.rb) qui réouvre la classe de scène. Les méthodes de logique sont appelées depuis les méthodes d'action définies dans Input.rb.

## Fichier Logic complet

Le fichier Logic.rb réouvre la classe de scène pour y ajouter la logique métier. Il gère trois responsabilités : ouvrir la saisie de code, valider le code entré, et réclamer le cadeau après confirmation.

```ruby
module GamePlay
  # Business logic for the Mystery Gift scene
  class MysteryGift < BaseCleanUpdate::FrameBalanced
    private

    # Open the NameInput scene to type a gift code
    def open_code_input
      code = nil
      call_scene(GamePlay::NameInput, '', CODE_MAX_LENGTH, nil, phrase: gift_text(TEXT_PROMPT)) do |scene|
        code = scene.return_name
      end
      return if code.nil? || code.empty?

      process_code(code)
    end

    # Validate and process the entered code
    # @param code [String] the code to process
    def process_code(code)
      mystery_data = $user_data[:mystery_gift]
      result = mystery_data.validate(code)

      case result
      when :invalid
        display_message_and_wait(gift_text(TEXT_INVALID))
      when :already_claimed
        display_message_and_wait(gift_text(TEXT_ALREADY_CLAIMED))
      when :valid
        claim_gift(code, mystery_data)
      end
    end

    # Claim a valid gift after confirmation
    # @param code [String] the valid code
    # @param mystery_data [PFM::MysteryGift] the data object
    def claim_gift(code, mystery_data)
      choice = display_message_and_wait(gift_text(TEXT_CONFIRM), 1, gift_text(TEXT_YES), gift_text(TEXT_NO))
      return unless choice == 0

      gift_name = mystery_data.claim(code)
      display_message_and_wait(format(gift_text(TEXT_RECEIVED), gift_name))
      @composition.refresh
    end
  end
end
```

- `open_code_input` utilise `call_scene` pour ouvrir la scène `GamePlay::NameInput` par-dessus la scène courante. Le bloc capture le code saisi via `scene.return_name`. Si le joueur annule ou laisse le champ vide, la méthode fait un return early.
- `call_scene` empile une sous-scène par-dessus la scène courante. Le bloc est exécuté à la fermeture de la sous-scène, ce qui permet de récupérer la valeur de retour.
- `process_code` récupère les données de persistence et valide le code entré. Le `case` dispatch vers trois branches : code invalide, code déjà utilisé, ou code valide.
- Pour les branches `:invalid` et `:already_claimed`, `display_message_and_wait(message)` affiche un message simple que le joueur valide en appuyant sur A. La game loop est bloquée pendant l'affichage.
- `claim_gift` affiche un dialogue Oui/Non avec `display_message_and_wait(message, default, choice1, choice2)`. Le premier argument est le message, le deuxième est l'index du choix par défaut, les suivants sont les labels des choix.
- Le deuxième argument `1` définit le choix par défaut sur Non (index 1). C'est la convention pour les actions destructives : le joueur doit activement choisir Oui pour confirmer.
- La méthode retourne l'index du choix sélectionné : 0 pour le premier choix (Oui), 1 pour le second (Non). On ne continue que si `choice == 0`.
- Les textes Oui/Non sont stockés dans le CSV du plugin (`gift_text(TEXT_YES)`, `gift_text(TEXT_NO)`). Il ne faut pas dépendre d'un CSV externe qui pourrait ne pas exister dans le projet du joueur.
- `format(gift_text(TEXT_RECEIVED), gift_name)` remplace `%s` dans la chaîne par le nom du cadeau. La méthode `format` de Ruby fonctionne comme `sprintf`.
- `@composition.refresh` met à jour l'affichage après le changement d'état pour refléter le cadeau fraîchement réclamé dans la liste.

## Sous-scène avec call_scene

`call_scene` ouvre une scène par-dessus la scène courante. Le bloc reçu est exécuté à la fermeture de la sous-scène.

```ruby
# Open the NameInput scene to type a gift code
def open_code_input
  code = nil
  call_scene(GamePlay::NameInput, '', CODE_MAX_LENGTH, nil, phrase: gift_text(TEXT_PROMPT)) do |scene|
    code = scene.return_name
  end
  return if code.nil? || code.empty?

  process_code(code)
end
```

- La variable `code` est déclarée avant `call_scene` pour être accessible après le bloc. Le bloc assigne la valeur de retour de la sous-scène à cette variable.
- Les arguments de `call_scene` après la classe de scène sont passés directement au constructeur de `GamePlay::NameInput`. Ici : chaîne vide (valeur initiale), longueur maximale du code, `nil` (pas de Pokémon), et `phrase:` pour le message d'invite.
- Le guard clause `return if code.nil? || code.empty?` gère le cas où le joueur a annulé la saisie en appuyant sur B dans la scène NameInput.

## Message simple

`display_message_and_wait` appelé avec un seul argument affiche un message que le joueur valide avec A.

```ruby
# Validate and process the entered code
# @param code [String] the code to process
def process_code(code)
  mystery_data = $user_data[:mystery_gift]
  result = mystery_data.validate(code)

  case result
  when :invalid
    display_message_and_wait(gift_text(TEXT_INVALID))
  when :already_claimed
    display_message_and_wait(gift_text(TEXT_ALREADY_CLAIMED))
  when :valid
    claim_gift(code, mystery_data)
  end
end
```

- `display_message_and_wait(gift_text(TEXT_INVALID))` affiche le message d'erreur et bloque la game loop. Le joueur appuie sur A pour fermer le message, puis la méthode retourne et la scène reprend normalement.
- Le `case/when` utilise des symboles Ruby (`:invalid`, `:already_claimed`, `:valid`). Ce pattern est clair et extensible si de nouveaux cas de validation sont ajoutés plus tard.
- Chaque branche d'erreur se contente d'afficher un message. Seule la branche `:valid` déclenche la logique de récupération du cadeau.

## Dialogue Oui/Non

`display_message_and_wait` avec des arguments supplémentaires affiche un dialogue avec des choix.

```ruby
# Claim a valid gift after confirmation
# @param code [String] the valid code
# @param mystery_data [PFM::MysteryGift] the data object
def claim_gift(code, mystery_data)
  choice = display_message_and_wait(gift_text(TEXT_CONFIRM), 1, gift_text(TEXT_YES), gift_text(TEXT_NO))
  return unless choice == 0

  gift_name = mystery_data.claim(code)
  display_message_and_wait(format(gift_text(TEXT_RECEIVED), gift_name))
  @composition.refresh
end
```

- `display_message_and_wait(message, default, choice1, choice2)` : le premier argument est le texte du message, le deuxième est l'index du choix sélectionné par défaut, les suivants sont les labels des choix.
- Avec `default = 1`, le curseur démarre sur Non. Le joueur doit volontairement bouger le curseur pour sélectionner Oui. C'est la convention pour les actions potentiellement destructives.
- La valeur de retour est l'index du choix sélectionné : 0 pour le premier label (Oui), 1 pour le second (Non).
- `return unless choice == 0` annule l'opération si le joueur a choisi Non ou a annulé le dialogue.
- Après récupération du cadeau, `format(gift_text(TEXT_RECEIVED), gift_name)` insère le nom du cadeau dans le message de confirmation via `%s`.
- `@composition.refresh` reconstruit les éléments visuels pour refléter le nouvel état des données.

## Conclusion

- Utiliser `display_message_and_wait(message)` pour les messages simples que le joueur valide avec A -- la game loop est bloquée pendant l'affichage.
- Utiliser `display_message_and_wait(message, default, choice1, choice2)` pour les dialogues Oui/Non -- retourne 0 pour le premier choix, 1 pour le second.
- Toujours définir le choix par défaut sur l'option sûre (généralement Non = index 1) pour les actions destructives.
- Stocker les textes Oui/Non dans le CSV du plugin plutôt que de dépendre d'un CSV externe.
- Utiliser `call_scene` avec un bloc pour ouvrir une sous-scène et récupérer sa valeur de retour.
- Utiliser `format` pour insérer des paramètres dynamiques (`%s`, `%d`) dans les textes traduits.
- Appeler `@composition.refresh` après un changement d'état pour mettre à jour l'affichage.
