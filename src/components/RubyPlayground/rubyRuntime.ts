/**
 * What the main thread and the worker must agree on. Kept apart from both so
 * neither imports the other: reaching into `rubyWorker.ts` for a constant would
 * drag the Ruby bootstrap into the main bundle. The two URLs must stay on the
 * same version, hence a single declaration.
 */

const RUBY_WASM_VERSION = "2.8.1";

/** The interpreter and its standard library, about 31 MB. */
export const WASM_CDN = `https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@${RUBY_WASM_VERSION}/dist/ruby+stdlib.wasm`;

/** The glue that instantiates the module and exposes the VM. */
export const UMD_CDN = `https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@${RUBY_WASM_VERSION}/dist/browser.umd.js`;

export const OUTPUT_LINE_LIMIT = 50;

/** Main thread to worker. */
export type WorkerRequest =
  | { type: "init"; module: WebAssembly.Module }
  | { type: "run"; code: string };

/** Worker to main thread. */
export type WorkerResponse =
  | { type: "ready" }
  | { type: "result"; stdout: string; value: string; truncated: boolean }
  | { type: "error"; message: string };
