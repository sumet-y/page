// worker.js — Classic Web Worker (ไม่ใช้ ES modules รองรับทุก browser รวม iOS Safari)

let engine = null;
let engineReady = false;

async function loadEngine() {
try {
const base = self.location.href.replace(/worker.js.*$/, ‘’);

```
// โหลด glue JS ด้วย importScripts (ไม่ใช้ ES import)
importScripts(base + 'thai_checkers_engine.js');

// wasm_bindgen จะอยู่ใน global scope หลัง importScripts
if(typeof wasm_bindgen === 'undefined') {
  throw new Error('wasm_bindgen not found');
}

await wasm_bindgen(base + 'thai_checkers_engine_bg.wasm');

engine = wasm_bindgen;
engineReady = true;
postMessage({ type: 'ready' });
```

} catch (e) {
postMessage({ type: ‘error’, message: ’โหลดไม่สำเร็จ: ’ + e.message });
}
}

loadEngine();

onmessage = function(e) {
const msg = e.data;
if(msg.type === ‘ping’){
postMessage({ type:‘pong’, ready:engineReady });
return;
}
if(msg.type === ‘analyze’){
if(!engineReady){
postMessage({ type:‘result’, id:msg.id, results:[], error:‘Engine not ready’ });
return;
}
try{
const {white, black, isBlackTurn, maxDepth, timeLimitMs} = msg.data;
const start = Date.now();
const raw = engine.analyze(white, black, isBlackTurn, maxDepth, timeLimitMs);
const results = Array.isArray(raw) ? raw : Array.from(raw);
postMessage({ type:‘result’, id:msg.id, results, elapsed:Date.now()-start });
} catch(err){
postMessage({ type:‘result’, id:msg.id, results:[], error:err.message });
}
}
};
