import React, { useCallback, useEffect, useRef, useState } from "react";
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
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
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
    setOutput("Chargement de Ruby WebAssembly...");

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

      setOutput(display || "(pas de sortie)");
      setStatus(display ? "done" : "idle");
    } catch (e) {
      setOutput("Erreur de chargement: " + String(e));
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
          title="Ctrl+Enter pour exécuter"
        >
          {status === "loading"
            ? "Chargement..."
            : status === "running"
              ? "Exécution..."
              : "Exécuter"}
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
        <div className={styles.outputHeader}>Sortie</div>
        <div className={outputClass}>
          {output || "Clique sur Exécuter ou appuie sur Ctrl+Enter"}
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
