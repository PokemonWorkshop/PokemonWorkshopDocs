/**
 * Wraps a response body in a counting stream so a caller can report how much
 * has arrived.
 *
 * The Ruby runtime is about 31 MB and the CDN serves it chunked, with no
 * `Content-Length`, so only the downloaded amount is knowable — never a
 * percentage. Streaming is preserved on purpose: bytes are piped straight
 * through so `WebAssembly.compileStreaming` can keep compiling as they arrive,
 * instead of buffering the whole module first.
 *
 * Kept out of the component file so it can be exercised without React.
 */
export function withDownloadProgress(
  response: Response,
  onProgress: (bytes: number) => void,
): Response {
  if (!response.body) return response;

  const reader = response.body.getReader();
  let loaded = 0;

  const counted = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      loaded += value.byteLength;
      onProgress(loaded);
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  // compileStreaming insists on the wasm MIME type.
  return new Response(counted, {
    headers: { "content-type": "application/wasm" },
  });
}
