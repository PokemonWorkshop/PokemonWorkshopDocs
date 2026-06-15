import React, { useCallback, useEffect, useRef, useState } from "react";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

// Singleton: shared Ruby VM across all playgrounds on the page
let vmPromise: Promise<RubyVM> | null = null;

interface RubyVM {
  eval(code: string): { toString(): string };
}

const RUBY_WASM_VERSION = "2.8.1";
const WASM_CDN = `https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@${RUBY_WASM_VERSION}/dist/ruby+stdlib.wasm`;
const UMD_CDN = `https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@${RUBY_WASM_VERSION}/dist/browser.umd.js`;

const STDOUT_INIT = `
$__output = []

module Kernel
  alias_method :__original_puts, :puts
  alias_method :__original_print, :print
  alias_method :__original_p, :p

  def puts(*args)
    if args.empty?
      $__output << ""
    else
      args.each { |a| $__output << a.to_s }
    end
    nil
  end

  def print(*args)
    $__output << args.map(&:to_s).join
    nil
  end

  def p(*args)
    args.each { |a| $__output << a.inspect }
    args.length <= 1 ? args.first : args
  end
end
`;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          translate(
            {
              id: "rubyPlayground.scriptLoadError",
              message: "Unable to load {src}",
              description: "Error thrown when a Ruby WebAssembly CDN script fails to load",
            },
            { src },
          ),
        ),
      );
    document.head.appendChild(script);
  });
}

async function initVM(): Promise<RubyVM> {
  // Load the UMD bundle which exposes window["ruby-wasm-wasi"]
  await loadScript(UMD_CDN);
  const { DefaultRubyVM } = (window as any)["ruby-wasm-wasi"];

  const response = await fetch(WASM_CDN);
  const wasmModule = await WebAssembly.compileStreaming(response);
  const { vm } = await DefaultRubyVM(wasmModule);
  vm.eval(STDOUT_INIT);
  return vm;
}

function getVM(): Promise<RubyVM> {
  if (!vmPromise) {
    vmPromise = initVM();
  }
  return vmPromise;
}

type Status = "idle" | "loading" | "running" | "done" | "error";

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
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [code]);

  const run = useCallback(async () => {
    setStatus("loading");
    setOutput(
      translate({
        id: "rubyPlayground.loadingWasm",
        message: "Loading Ruby WebAssembly...",
        description: "Status message shown while the Ruby WebAssembly runtime loads",
      }),
    );

    try {
      const vm = await getVM();
      setStatus("running");
      setOutput("");

      // Clear previous output buffer
      vm.eval("$__output.clear");

      // Run user code
      let result: string;
      try {
        const evalResult = vm.eval(code);
        result = evalResult.toString();
      } catch (e) {
        setOutput(String(e));
        setStatus("error");
        return;
      }

      // Collect captured stdout
      const stdout = vm.eval('$__output.join("\n")').toString();

      // Show stdout, and append the return value if it's meaningful
      let display = stdout;
      if (
        result &&
        result !== "nil" &&
        result !== "" &&
        result !== stdout.trim()
      ) {
        display += (display ? "\n" : "") + "=> " + result;
      }

      setOutput(
        display ||
          translate({
            id: "rubyPlayground.noOutput",
            message: "(no output)",
            description: "Placeholder shown when executed code produced no output",
          }),
      );
      setStatus(display ? "done" : "idle");
    } catch (e) {
      setOutput(
        translate(
          {
            id: "rubyPlayground.loadError",
            message: "Loading error: {error}",
            description: "Status message shown when the Ruby runtime fails to load",
          },
          { error: String(e) },
        ),
      );
      setStatus("error");
    }
  }, [code]);

  // Handle Tab key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newValue = code.slice(0, start) + "  " + code.slice(end);
        setCode(newValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        run();
      }
    },
    [code, run],
  );

  const outputClass = [
    styles.output,
    status === "error" ? styles.error : "",
    status === "loading" ? styles.loading : "",
    status === "idle" && !output ? styles.empty : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.playground}>
      <div className={styles.header}>
        <span className={styles.lang}>Ruby</span>
        <button
          className={styles.runButton}
          onClick={run}
          disabled={status === "loading" || status === "running"}
          title={translate({
            id: "rubyPlayground.runHint",
            message: "Ctrl+Enter to run",
            description: "Tooltip on the run button explaining the keyboard shortcut",
          })}
        >
          {runButtonLabel(status)}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
              description: "Placeholder shown in the output area before any run",
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
