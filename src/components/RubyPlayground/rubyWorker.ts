/**
 * Owns the Ruby VM. Living on a thread of its own is what makes the playground
 * safe: `while true; end` is a synchronous call into WebAssembly that nothing
 * can interrupt from the inside, so the only way out is for the main thread to
 * terminate the whole worker.
 */

import {
  OUTPUT_LINE_LIMIT,
  UMD_CDN,
  type WorkerRequest,
  type WorkerResponse,
} from "./rubyRuntime";

// Hand-declared: the project compiles against the DOM lib, which knows nothing
// about the worker globals.
declare function importScripts(...urls: string[]): void;

interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
  postMessage(message: WorkerResponse): void;
}

const workerScope = self as unknown as WorkerScope;

interface RubyVM {
  eval(code: string): { toString(): string };
}

/** The global the UMD bundle installs, which ships no types of its own. */
interface RubyWasmGlobal {
  DefaultRubyVM: (module: WebAssembly.Module) => Promise<{ vm: RubyVM }>;
}

// The cap is enforced here rather than on display so a runaway loop cannot grow
// the buffer without bound during the seconds before it is killed.
const STDOUT_INIT = `
$__output = []
$__truncated = false

module Kernel
  alias_method :__original_puts, :puts
  alias_method :__original_print, :print
  alias_method :__original_p, :p

  def __capture(text)
    if $__output.length >= ${OUTPUT_LINE_LIMIT}
      $__truncated = true
      return
    end
    $__output << text
  end

  def puts(*args)
    if args.empty?
      __capture("")
    else
      args.each { |a| __capture(a.to_s) }
    end
    nil
  end

  def print(*args)
    __capture(args.map(&:to_s).join)
    nil
  end

  def p(*args)
    args.each { |a| __capture(a.inspect) }
    args.length <= 1 ? args.first : args
  end
end
`;

let vm: RubyVM | null = null;

async function initialise(module: WebAssembly.Module): Promise<void> {
  importScripts(UMD_CDN);
  const { DefaultRubyVM } = (self as unknown as Record<string, RubyWasmGlobal>)[
    "ruby-wasm-wasi"
  ];
  const instance = await DefaultRubyVM(module);
  instance.vm.eval(STDOUT_INIT);
  vm = instance.vm;
}

function execute(code: string): WorkerResponse {
  if (!vm) {
    return { type: "error", message: "Ruby VM not initialised" };
  }

  vm.eval("$__output.clear; $__truncated = false");

  let value: string;
  try {
    value = vm.eval(code).toString();
  } catch (error) {
    return { type: "error", message: String(error) };
  }

  return {
    type: "result",
    stdout: vm.eval('$__output.join("\n")').toString(),
    value,
    truncated: vm.eval("$__truncated").toString() === "true",
  };
}

workerScope.addEventListener("message", (event) => {
  const request = event.data;

  if (request.type === "init") {
    initialise(request.module).then(
      () => workerScope.postMessage({ type: "ready" }),
      (error: unknown) =>
        workerScope.postMessage({ type: "error", message: String(error) }),
    );
    return;
  }

  workerScope.postMessage(execute(request.code));
});
