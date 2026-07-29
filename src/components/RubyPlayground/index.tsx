import { translate } from "@docusaurus/Translate";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { type Status, useRubyRunner } from "./useRubyRunner";

interface Props {
  code: string;
}

function runButtonLabel(status: Status): string {
  if (status === "loading") {
    return translate({
      id: "rubyPlayground.button.loading",
      message: "Loading...",
      description: "Run button label while the Ruby VM is loading",
    });
  }
  if (status === "running") {
    return translate({
      id: "rubyPlayground.button.running",
      message: "Running...",
      description: "Run button label while user code is executing",
    });
  }
  return translate({
    id: "rubyPlayground.button.run",
    message: "Run",
    description: "Run button label in its idle state",
  });
}

function RubyPlaygroundInner({ code: initialCode }: Props) {
  const [code, setCode] = useState(initialCode);
  const { output, status, run, clear } = useRubyRunner();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === "loading" || status === "running";
  const isEdited = code !== initialCode;

  // `code` is never read inside the effect, but it is what must re-trigger the
  // resize on every keystroke: dropping it would resize on mount only.
  // biome-ignore lint/correctness/useExhaustiveDependencies: code re-triggers the resize
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [code]);

  const handleRun = useCallback(() => {
    run(code);
  }, [code, run]);

  // Keeping the output would leave the result of code the reader can no longer
  // see.
  const handleReset = useCallback(() => {
    setCode(initialCode);
    clear();
  }, [initialCode, clear]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab indents instead of leaving the editor.
      if (event.key === "Tab") {
        event.preventDefault();
        const textarea = event.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        setCode(`${code.slice(0, start)}  ${code.slice(end)}`);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleRun();
      }
    },
    [code, handleRun],
  );

  const outputClass = [
    styles.output,
    status === "error" ? styles.error : "",
    status === "loading" || status === "running" ? styles.loading : "",
    status === "idle" && !output ? styles.empty : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.playground}>
      <div className={styles.header}>
        <span className={styles.lang}>Ruby</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            disabled={isBusy || !isEdited}
            title={translate({
              id: "rubyPlayground.resetHint",
              message: "Restore the original snippet",
              description: "Tooltip on the reset button",
            })}
          >
            {translate({
              id: "rubyPlayground.button.reset",
              message: "Reset",
              description: "Label of the button restoring the original snippet",
            })}
          </button>
          <button
            type="button"
            className={styles.runButton}
            onClick={handleRun}
            disabled={isBusy}
            title={translate({
              id: "rubyPlayground.runHint",
              message: "Ctrl+Enter to run",
              description:
                "Tooltip on the run button explaining the keyboard shortcut",
            })}
          >
            {runButtonLabel(status)}
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      <div className={styles.outputSection}>
        <div className={styles.outputHeader}>
          {translate({
            id: "rubyPlayground.outputHeader",
            message: "Output",
            description: "Header above the Ruby playground output area",
          })}
        </div>
        <div className={outputClass}>
          {output ||
            translate({
              id: "rubyPlayground.placeholder",
              message: "Click Run or press Ctrl+Enter",
              description:
                "Placeholder shown in the output area before any run",
            })}
        </div>
      </div>
    </div>
  );
}

export default function RubyPlayground(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <RubyPlaygroundInner {...props} />;
}
