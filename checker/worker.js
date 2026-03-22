// worker.js — Web Worker that loads WASM engine and handles analysis requests

let engine = null;
let engineReady = false;

async function loadEngine() {
try {
// Import the wasm-bindgen generated JS glue
const { default: init, analyze } = await import(’./thai_checkers_engine.js’);
await init(’./thai_checkers_engine_bg.wasm’);
engine = { analyze };
engineReady = true;
postMessage({ type: ‘ready’ });
} catch (e) {
postMessage({ type: ‘error’, message: ’Failed to load engine: ’ + e.message });
}
}

loadEngine();

onmessage = function(e) {
const { type, id, data } = e.data;

if (type === ‘ping’) {
postMessage({ type: ‘pong’, ready: engineReady });
return;
}

if (type === ‘analyze’) {
if (!engineReady) {
postMessage({ type: ‘result’, id, results: [], error: ‘Engine not ready’ });
return;
}
try {
const { white, black, isBlackTurn, maxDepth, timeLimitMs } = data;
const start = Date.now();

```
  const results = engine.analyze(
    white,
    black,
    isBlackTurn,
    maxDepth,
    timeLimitMs
  );

  postMessage({
    type: 'result',
    id,
    results: Array.from(results),
    elapsed: Date.now() - start
  });
} catch (e) {
  postMessage({ type: 'result', id, results: [], error: e.message });
}
```

}
};
