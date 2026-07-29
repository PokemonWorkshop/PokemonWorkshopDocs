import { withDownloadProgress } from "./downloadProgress";
import { WASM_CDN, type WorkerResponse } from "./rubyRuntime";

/**
 * The Ruby runtime as the main thread sees it: download, worker lifecycle, and
 * one snippet at a time under a timeout. Free of React and of translations, so
 * callers get raw data and typed failures and decide what to display.
 */

// Well above what any snippet in the course needs, low enough that a reader who
// typed an endless loop gets the tab back straight away.
const EXECUTION_TIMEOUT_MS = 5000;

export interface RunResult {
  /** Everything the snippet printed, newline separated. */
  stdout: string;
  /** What the last expression evaluated to. */
  value: string;
  /** Whether output was dropped once the line cap was reached. */
  truncated: boolean;
}

export interface RunOptions {
  onProgress: (bytes: number) => void;
  /** Called once the runtime is ready and the snippet actually starts. */
  onExecutionStart: () => void;
}

/** The runtime could not be downloaded or instantiated. */
export class RuntimeLoadError extends Error {}

/** The snippet raised a Ruby exception. */
export class RubyError extends Error {}

/** Carries the budget so callers can word the message without knowing it. */
export class ExecutionTimeout extends Error {
  constructor(readonly seconds: number) {
    super(`Execution exceeded ${seconds}s`);
  }
}

// Every playground on the page shares one module and one worker. Each VM owns
// its own WebAssembly memory, so a worker per block would multiply memory use
// on pages that embed several of them.
let modulePromise: Promise<WebAssembly.Module> | null = null;
let workerPromise: Promise<Worker> | null = null;

// The worker handles one request at a time; overlapping runs would race for the
// same reply. They queue up instead.
let queue: Promise<void> = Promise.resolve();

async function compileModule(
  onProgress: (bytes: number) => void,
): Promise<WebAssembly.Module> {
  const response = await fetch(WASM_CDN);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${WASM_CDN}`);
  }
  return WebAssembly.compileStreaming(
    withDownloadProgress(response, onProgress),
  );
}

function getModule(
  onProgress: (bytes: number) => void,
): Promise<WebAssembly.Module> {
  if (!modulePromise) {
    // Drop the memoised promise when it rejects. Keeping it would turn one
    // interrupted download into a permanent failure: every later click would
    // replay the same rejection without ever retrying the fetch.
    modulePromise = compileModule(onProgress).catch((error) => {
      modulePromise = null;
      throw error;
    });
  }
  return modulePromise;
}

/**
 * Compiling on this side and handing the module over means a respawn after a
 * kill costs one instantiation, not another 31 MB download.
 */
async function spawnWorker(
  onProgress: (bytes: number) => void,
): Promise<Worker> {
  const module = await getModule(onProgress);
  const worker = new Worker(new URL("./rubyWorker.ts", import.meta.url));

  await new Promise<void>((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === "ready") {
          resolve();
          return;
        }
        reject(
          new Error(
            event.data.type === "error"
              ? event.data.message
              : "Unexpected reply during initialisation",
          ),
        );
      },
      { once: true },
    );
    worker.addEventListener("error", () => reject(new Error("Worker failed")), {
      once: true,
    });
    worker.postMessage({ type: "init", module });
  });

  return worker;
}

function getWorker(onProgress: (bytes: number) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = spawnWorker(onProgress).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/**
 * Kills the worker and forgets it, so the next run spawns a fresh one from the
 * already compiled module. Sole owner of `workerPromise` alongside `getWorker`:
 * callers ask for the discard rather than reaching into the cache.
 */
function discardWorker(worker: Worker): void {
  worker.terminate();
  workerPromise = null;
}

/**
 * Posts one run and resolves with the worker's reply, killing the thread if it
 * overruns. A tight loop inside WebAssembly yields to nothing, so terminating
 * is the only way out.
 */
function postRun(worker: Worker, code: string): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      resolve(event.data);
    };

    const timer = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      discardWorker(worker);
      reject(new ExecutionTimeout(EXECUTION_TIMEOUT_MS / 1000));
    }, EXECUTION_TIMEOUT_MS);

    worker.addEventListener("message", onMessage);
    worker.postMessage({ type: "run", code });
  });
}

async function execute(
  code: string,
  { onProgress, onExecutionStart }: RunOptions,
): Promise<RunResult> {
  let worker: Worker;
  try {
    worker = await getWorker(onProgress);
  } catch (error) {
    throw new RuntimeLoadError(String(error));
  }

  onExecutionStart();
  const reply = await postRun(worker, code);

  if (reply.type !== "result") {
    throw new RubyError(
      reply.type === "error" ? reply.message : "Unexpected worker reply",
    );
  }

  return {
    stdout: reply.stdout,
    value: reply.value,
    truncated: reply.truncated,
  };
}

/**
 * Runs one snippet, waiting its turn if another block is already using the
 * worker. Rejects with `RuntimeLoadError`, `ExecutionTimeout` or `RubyError`.
 */
export function runRuby(code: string, options: RunOptions): Promise<RunResult> {
  const turn = queue.then(() => execute(code, options));
  queue = turn.then(
    () => undefined,
    () => undefined,
  );
  return turn;
}
