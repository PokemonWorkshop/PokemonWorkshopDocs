import { translate } from "@docusaurus/Translate";
import { useCallback, useState } from "react";
import {
  ExecutionTimeout,
  RubyError,
  type RunResult,
  RuntimeLoadError,
  runRuby,
} from "./rubyClient";
import { OUTPUT_LINE_LIMIT } from "./rubyRuntime";

/**
 * Turns what `rubyClient` returns into the two things a block displays, a
 * status and a block of text. Holds every user-facing string, and nothing about
 * workers or WebAssembly.
 */

export type Status = "idle" | "loading" | "running" | "done" | "error";

function loadingMessage(): string {
  return translate({
    id: "rubyPlayground.loadingWasm",
    message: "Loading Ruby WebAssembly...",
    description:
      "Status message shown while the Ruby WebAssembly runtime loads",
  });
}

function downloadingMessage(bytes: number): string {
  return translate(
    {
      id: "rubyPlayground.downloading",
      message: "Downloading the Ruby runtime… {megabytes} MB",
      description:
        "Status message showing how much of the Ruby WebAssembly runtime has downloaded",
    },
    { megabytes: (bytes / 1024 / 1024).toFixed(1) },
  );
}

function executingMessage(): string {
  return translate({
    id: "rubyPlayground.executing",
    message: "Running…",
    description: "Status message shown in the output area while code runs",
  });
}

function failureMessage(error: unknown): string {
  if (error instanceof RuntimeLoadError) {
    return translate(
      {
        id: "rubyPlayground.loadError",
        message:
          "Loading error: {error}\n\nThe Ruby runtime is about 31 MB. On a slow connection the download can be interrupted — press Run again to retry.",
        description: "Status message shown when the Ruby runtime fails to load",
      },
      { error: error.message },
    );
  }

  if (error instanceof ExecutionTimeout) {
    return translate(
      {
        id: "rubyPlayground.timeout",
        message:
          "Execution stopped after {seconds} seconds. The code probably contains an endless loop.",
        description:
          "Status message shown when user code is killed for running too long",
      },
      { seconds: error.seconds },
    );
  }

  // A Ruby exception already reads as a message.
  if (error instanceof RubyError) return error.message;

  return String(error);
}

function formatResult({ stdout, value, truncated }: RunResult): string {
  let display = stdout;

  // Only worth showing when it adds to what the snippet already printed.
  if (value && value !== "nil" && value !== "" && value !== stdout.trim()) {
    display += `${display ? "\n" : ""}=> ${value}`;
  }

  if (!truncated) return display;

  return `${display}\n${translate(
    {
      id: "rubyPlayground.outputTruncated",
      message: "(output truncated after {lines} lines)",
      description:
        "Notice appended when a run printed more lines than the playground keeps",
    },
    { lines: OUTPUT_LINE_LIMIT },
  )}`;
}

/** Drives one playground block, and keeps the component to rendering only. */
export function useRubyRunner() {
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const run = useCallback(async (code: string) => {
    // Set before the client can queue this run behind another block's download.
    // Staying idle would leave the placeholder up with an active button, so the
    // click would look like it did nothing.
    setStatus("loading");
    setOutput(loadingMessage());

    let result: RunResult;
    try {
      result = await runRuby(code, {
        onProgress: (bytes) => setOutput(downloadingMessage(bytes)),
        onExecutionStart: () => {
          setStatus("running");
          // Output is only read back once the run returns, so nothing real can
          // be shown meanwhile. Clearing the area instead would hand it back to
          // its idle placeholder.
          setOutput(executingMessage());
        },
      });
    } catch (error) {
      setOutput(failureMessage(error));
      setStatus("error");
      return;
    }

    const display = formatResult(result);
    setOutput(
      display ||
        translate({
          id: "rubyPlayground.noOutput",
          message: "(no output)",
          description:
            "Placeholder shown when executed code produced no output",
        }),
    );
    setStatus(display ? "done" : "idle");
  }, []);

  // Only the display. The VM keeps whatever constants and classes earlier runs
  // defined, which is a separate concern.
  const clear = useCallback(() => {
    setOutput("");
    setStatus("idle");
  }, []);

  return { output, status, run, clear };
}
