---
title: "How to use confirmation dialogs in PSDK?"
slug: use-confirmation-dialogs
sidebar_position: 8
description: "This guide adds the business logic of the scene: entering a code, validating it, and claiming a gift through confirmation dialogs and blocking messages."
---

This guide builds on the [i18n guide](./07-i18n.md). Until now the A button did nothing; here we make it work. We add the business logic file -- entering a code, validating it, and claiming a gift -- using PSDK's blocking messages and Yes/No dialogs, and we finally reveal the A button.

## Principle

PSDK provides two ways to talk to the player:

- `display_message_and_wait` blocks the game loop and waits for the player. It serves both for a simple message (dismissed with A) and for a Yes/No dialog (returns the chosen index).
- `show_win_text` / `hide_win_text` display a message in the bottom bar without blocking.

The business logic goes in its own file (`002 Logic.rb`) that reopens the scene class. Its methods are called from the action methods in `003 Input.rb`.

## The Logic file

Create `scripts/20 MysteryGift/003 GamePlay/002 Logic.rb`:

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

- `open_code_input` opens the built-in `GamePlay::NameInput` scene with `call_scene`. The block runs when that scene closes; `scene.return_name` is the typed code. The arguments after the class go to NameInput's constructor: initial value `''`, max length `CODE_MAX_LENGTH`, `nil` (no Pokémon), and `phrase:` for the prompt.
- The guard `return if code.nil? || code.empty?` handles the player cancelling the input (B in NameInput).
- `process_code` validates the code via the PFM layer and dispatches: `:invalid` and `:already_claimed` show a simple message; `:valid` proceeds to claim.
- `claim_gift` shows a Yes/No dialog: `display_message_and_wait(message, default, choice1, choice2)`. The default `1` puts the cursor on "No" -- the safe choice. The return value is the chosen index (0 = first label = Yes), so we continue only on `choice == 0`.
- On confirmation we `claim` the gift, announce it with `format(gift_text(TEXT_RECEIVED), gift_name)`, and call `@composition.refresh` to show it in the list. In the [animations guide](./09-animations.md) we replace this message + refresh with an animated banner.

## Wiring the A button

The logic is triggered by `action_a`. Add it to `scripts/20 MysteryGift/003 GamePlay/003 Input.rb` (next to `action_b`, under `private`):

```ruby
# Action triggered by the A button -- open code input
def action_a
  play_decision_se
  open_code_input
end
```

Now that `action_a` exists, reveal the A button. Update `button_texts` in `scripts/20 MysteryGift/003 GamePlay/001 Main.rb`:

```ruby
# Return the button texts for the ctrl buttons [A, X, Y, B]
# @return [Array<String, nil>]
def button_texts
  return [gift_text(TEXT_ENTER_CODE), nil, nil, gift_text(TEXT_QUIT)]
end
```

- The A button now shows "Enter Code" and, on press or click, opens the code input. The keyboard A was already mapped in the keyboard guide -- it starts working as soon as `action_a` exists.

## Sub-scene with call_scene

`call_scene` opens a scene on top of the current one and runs the block when it closes:

- The `code` variable is declared **before** `call_scene` so it survives the block; the block assigns the sub-scene's return value to it.
- Arguments after the scene class are forwarded to its constructor.
- The guard clause covers the player pressing B to cancel.

## Simple message vs Yes/No dialog

- `display_message_and_wait(message)` shows a message dismissed with A; the loop is blocked during display, then resumes.
- `display_message_and_wait(message, default, choice1, choice2)` shows a dialog and returns the selected index (0 for the first label, 1 for the second). Set the default to the safe option (usually "No" = 1) for actions that grant or destroy something.
- Store the Yes/No labels in your own CSV (`TEXT_YES`, `TEXT_NO`) rather than relying on an external file that may not exist in every project.

## Try it

Open the scene and press A (or click "Enter Code"):

```ruby
GamePlay.open_mystery_gift
```

Type `POTION50`, confirm with Yes -- you see "You received Potion x50!" and the row appears in the list. Try `POTION50` again ("Gift already claimed!") and a wrong code ("Invalid code!").

## Conclusion

- Use `display_message_and_wait(message)` for a simple message, and `display_message_and_wait(message, default, choice1, choice2)` for a Yes/No dialog (returns 0 or 1).
- Default the cursor to the safe option for actions that grant or destroy something.
- Put business logic in `002 Logic.rb`, reopening the scene class; call it from the `action_*` methods in `003 Input.rb`.
- Use `call_scene` with a block to open a sub-scene (like NameInput) and read its return value.
- Reveal a ctrl button only once its action exists.
- Call `@composition.refresh` after changing the data (we upgrade this to an animation next).
