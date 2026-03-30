---
title: "How to use confirmation dialogs in PSDK?"
slug: use-confirmation-dialogs
sidebar_position: 7
description: "This guide explains how to add business logic to a UI scene using confirmation dialogs and blocking messages."
---

This guide explains how to add business logic to a UI scene using confirmation dialogs and blocking messages. It builds on guides 001 to 007: the reader has a complete Mystery Gift scene with Composition, keyboard and mouse inputs, GenericBase, and i18n text. Here, we add the Logic.rb file to the plugin to handle code validation, confirmation dialogs, and gift claiming.

## Principle

PSDK provides two mechanisms for communicating with the player:

- `display_message_and_wait` blocks the game loop and waits for the player's response. It serves both for simple messages (the player dismisses with A) and for Yes/No dialogs.
- `show_win_text` / `hide_win_text` display a message in the bottom bar without blocking the game loop.

The business logic is placed in a separate file (Logic.rb) that reopens the scene class. The logic methods are called from the action methods defined in Input.rb.

## Complete Logic file

The Logic.rb file reopens the scene class to add the business logic. It handles three responsibilities: opening the code input, validating the entered code, and claiming the gift after confirmation.

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

- `open_code_input` uses `call_scene` to open the `GamePlay::NameInput` scene on top of the current scene. The block captures the entered code via `scene.return_name`. If the player cancels or leaves the field empty, the method returns early.
- `call_scene` pushes a sub-scene on top of the current scene. The block is executed when the sub-scene closes, which allows retrieving the return value.
- `process_code` retrieves the persistence data and validates the entered code. The `case` dispatches to three branches: invalid code, already claimed code, or valid code.
- For the `:invalid` and `:already_claimed` branches, `display_message_and_wait(message)` shows a simple message that the player dismisses by pressing A. The game loop is blocked during display.
- `claim_gift` shows a Yes/No dialog with `display_message_and_wait(message, default, choice1, choice2)`. The first argument is the message, the second is the default choice index, and the remaining are the choice labels.
- The second argument `1` sets the default choice to No (index 1). This is the convention for destructive actions: the player must actively choose Yes to confirm.
- The method returns the index of the selected choice: 0 for the first choice (Yes), 1 for the second (No). We only continue if `choice == 0`.
- The Yes/No texts are stored in the plugin's own CSV (`gift_text(TEXT_YES)`, `gift_text(TEXT_NO)`). Do not rely on an external CSV that may not exist in the player's project.
- `format(gift_text(TEXT_RECEIVED), gift_name)` replaces `%s` in the string with the gift name. Ruby's `format` method works like `sprintf`.
- `@composition.refresh` updates the display after the state change to reflect the freshly claimed gift in the list.

## Sub-scene with call_scene

`call_scene` opens a scene on top of the current scene. The block is executed when the sub-scene closes.

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

- The `code` variable is declared before `call_scene` so it remains accessible after the block. The block assigns the sub-scene's return value to this variable.
- The arguments to `call_scene` after the scene class are passed directly to the `GamePlay::NameInput` constructor. Here: empty string (initial value), maximum code length, `nil` (no Pokemon), and `phrase:` for the prompt message.
- The guard clause `return if code.nil? || code.empty?` handles the case where the player cancelled the input by pressing B in the NameInput scene.

## Simple message

`display_message_and_wait` called with a single argument shows a message that the player dismisses with A.

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

- `display_message_and_wait(gift_text(TEXT_INVALID))` shows the error message and blocks the game loop. The player presses A to close the message, then the method returns and the scene resumes normally.
- The `case/when` uses Ruby symbols (`:invalid`, `:already_claimed`, `:valid`). This pattern is clear and extensible if new validation cases are added later.
- Each error branch simply shows a message. Only the `:valid` branch triggers the gift claiming logic.

## Yes/No dialog

`display_message_and_wait` with additional arguments shows a dialog with choices.

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

- `display_message_and_wait(message, default, choice1, choice2)`: the first argument is the message text, the second is the default selected choice index, and the remaining are the choice labels.
- With `default = 1`, the cursor starts on No. The player must deliberately move the cursor to select Yes. This is the convention for potentially destructive actions.
- The return value is the index of the selected choice: 0 for the first label (Yes), 1 for the second (No).
- `return unless choice == 0` cancels the operation if the player chose No or dismissed the dialog.
- After claiming the gift, `format(gift_text(TEXT_RECEIVED), gift_name)` inserts the gift name into the confirmation message via `%s`.
- `@composition.refresh` rebuilds the visual elements to reflect the new data state.

## Conclusion

- Use `display_message_and_wait(message)` for simple messages the player dismisses with A -- the game loop is blocked during display.
- Use `display_message_and_wait(message, default, choice1, choice2)` for Yes/No dialogs -- returns 0 for the first choice, 1 for the second.
- Always set the default choice to the safe option (usually No = index 1) for destructive actions.
- Store Yes/No texts in the plugin's own CSV rather than relying on an external CSV.
- Use `call_scene` with a block to open a sub-scene and retrieve its return value.
- Use `format` to insert dynamic parameters (`%s`, `%d`) into translated texts.
- Call `@composition.refresh` after a state change to update the display.
