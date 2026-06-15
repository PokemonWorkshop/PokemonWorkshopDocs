---
title: "Utiliser les dialogues de confirmation"
slug: utiliser-les-dialogues-de-confirmation
sidebar_position: 8
description: "Ce guide ajoute la logique métier de la scène : entrer un code, le valider, et réclamer un cadeau via des dialogues de confirmation et des messages bloquants."
---

Ce guide s'appuie sur le [guide i18n](./07-i18n.md). Jusqu'ici le bouton A ne faisait rien ; ici, on le rend fonctionnel. On ajoute le fichier de logique métier -- entrer un code, le valider, réclamer un cadeau -- avec les messages bloquants et les dialogues Oui/Non de PSDK, et on révèle enfin le bouton A.

## Principe

PSDK offre deux façons de parler au joueur :

- `display_message_and_wait` bloque la boucle de jeu et attend le joueur. Elle sert à la fois pour un message simple (validé avec A) et pour un dialogue Oui/Non (renvoie l'index choisi).
- `show_win_text` / `hide_win_text` affichent un message dans la barre du bas sans bloquer.

La logique métier va dans son propre fichier (`002 Logic.rb`) qui rouvre la classe de scène. Ses méthodes sont appelées depuis les méthodes d'action de `003 Input.rb`.

## Le fichier Logic

Créez `scripts/20 MysteryGift/003 GamePlay/002 Logic.rb` :

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

- `open_code_input` ouvre la scène intégrée `GamePlay::NameInput` avec `call_scene`. Le bloc s'exécute quand cette scène se ferme ; `scene.return_name` est le code tapé. Les arguments après la classe vont au constructeur de NameInput : valeur initiale `''`, longueur max `CODE_MAX_LENGTH`, `nil` (pas de Pokémon), et `phrase:` pour l'invite.
- La garde `return if code.nil? || code.empty?` gère l'annulation de la saisie par le joueur (B dans NameInput).
- `process_code` valide le code via la couche PFM et aiguille : `:invalid` et `:already_claimed` affichent un message simple ; `:valid` passe à la réclamation.
- `claim_gift` affiche un dialogue Oui/Non : `display_message_and_wait(message, default, choice1, choice2)`. Le défaut `1` met le curseur sur « Non » -- le choix sûr. La valeur de retour est l'index choisi (0 = premier libellé = Oui), donc on ne continue que sur `choice == 0`.
- À la confirmation, on `claim` le cadeau, on l'annonce avec `format(gift_text(TEXT_RECEIVED), gift_name)`, et on appelle `@composition.refresh` pour l'afficher dans la liste. Dans le [guide animations](./09-animations.md), on remplace ce message + refresh par une bannière animée.

## Brancher le bouton A

La logique est déclenchée par `action_a`. Ajoutez-la à `scripts/20 MysteryGift/003 GamePlay/003 Input.rb` (à côté de `action_b`, sous `private`) :

```ruby
# Action triggered by the A button -- open code input
def action_a
  play_decision_se
  open_code_input
end
```

Maintenant que `action_a` existe, révélez le bouton A. Modifiez `button_texts` dans `scripts/20 MysteryGift/003 GamePlay/001 Main.rb` :

```ruby
# Return the button texts for the ctrl buttons [A, X, Y, B]
# @return [Array<String, nil>]
def button_texts
  return [gift_text(TEXT_ENTER_CODE), nil, nil, gift_text(TEXT_QUIT)]
end
```

- Le bouton A affiche maintenant « Enter Code » et, à l'appui ou au clic, ouvre la saisie de code. Le A clavier était déjà mappé dans le guide clavier -- il se met à fonctionner dès que `action_a` existe.

## Sous-scène avec call_scene

`call_scene` ouvre une scène par-dessus la scène courante et exécute le bloc quand elle se ferme :

- La variable `code` est déclarée **avant** `call_scene` pour survivre au bloc ; le bloc lui assigne la valeur de retour de la sous-scène.
- Les arguments après la classe de scène sont transmis à son constructeur.
- La garde couvre le cas où le joueur appuie sur B pour annuler.

## Message simple vs dialogue Oui/Non

- `display_message_and_wait(message)` affiche un message validé avec A ; la boucle est bloquée pendant l'affichage, puis reprend.
- `display_message_and_wait(message, default, choice1, choice2)` affiche un dialogue et renvoie l'index sélectionné (0 pour le premier libellé, 1 pour le second). Mettez le défaut sur l'option sûre (souvent « Non » = 1) pour les actions qui octroient ou détruisent quelque chose.
- Stockez les libellés Oui/Non dans votre propre CSV (`TEXT_YES`, `TEXT_NO`) plutôt que de dépendre d'un fichier externe qui pourrait ne pas exister dans tous les projets.

## Essayez

Ouvrez la scène et appuyez sur A (ou cliquez « Enter Code ») :

```ruby
GamePlay.open_mystery_gift
```

Tapez `POTION50`, confirmez avec Oui -- vous voyez « Vous avez recu Potion x50 ! » et la ligne apparaît dans la liste. Réessayez `POTION50` (« Cadeau deja reclame ! ») et un mauvais code (« Code invalide ! »).

## Conclusion

- Utilisez `display_message_and_wait(message)` pour un message simple, et `display_message_and_wait(message, default, choice1, choice2)` pour un dialogue Oui/Non (renvoie 0 ou 1).
- Mettez le curseur par défaut sur l'option sûre pour les actions qui octroient ou détruisent quelque chose.
- Mettez la logique métier dans `002 Logic.rb`, en rouvrant la classe de scène ; appelez-la depuis les méthodes `action_*` de `003 Input.rb`.
- Utilisez `call_scene` avec un bloc pour ouvrir une sous-scène (comme NameInput) et lire sa valeur de retour.
- Ne révélez un bouton ctrl qu'une fois son action existante.
- Appelez `@composition.refresh` après avoir changé les données (on remplace ça par une animation au guide suivant).
