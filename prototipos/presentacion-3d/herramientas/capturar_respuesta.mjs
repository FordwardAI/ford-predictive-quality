// Captura de Selección con la respuesta a un código ya elegida (flujo-3b-respuesta.png).
//
//   node capturar_respuesta.mjs <puerto de depuración de Chrome> <url de la plataforma> <archivo .png>
//
// La respuesta depende de lo que se escribe en el campo, así que Chrome sin interfaz no la saca con
// --screenshot: este script se conecta a un Chrome abierto con --remote-debugging-port (protocolo de
// DevTools, sin dependencias: WebSocket nativo de Node ≥ 22), toca el primer código de «Qué buscar»
// y captura 1440×900. Lo llama capturar_flujo.sh.
import { writeFileSync } from 'node:fs';

const [puerto, url, salida] = process.argv.slice(2);
const pestana = await (await fetch(`http://127.0.0.1:${puerto}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(pestana.webSocketDebuggerUrl);
await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });

let id = 0;
const pendientes = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pendientes.has(m.id)) {
    const { ok, mal } = pendientes.get(m.id);
    pendientes.delete(m.id);
    m.error ? mal(new Error(m.error.message)) : ok(m.result);
  }
};
const cdp = (method, params = {}) => new Promise((ok, mal) => {
  id += 1;
  pendientes.set(id, { ok, mal });
  ws.send(JSON.stringify({ id, method, params }));
});
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluar = async (expression) => (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result.value;

await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp('Page.navigate', { url });
// Espera a que aparezcan los códigos de «Qué buscar» (la vista lee la API al cargar).
let codigo = null;
for (let i = 0; i < 40 && !codigo; i += 1) {
  await esperar(250);
  codigo = await evaluar(`(() => {
    const b = document.querySelector('section[aria-label="Qué buscar en la playa"] button');
    if (!b) return null;
    b.click();
    return b.textContent;
  })()`);
}
if (!codigo) throw new Error('No hay códigos en «Qué buscar»: ¿la hoja del día está armada y con cupo pendiente?');
await esperar(1500);
const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
writeFileSync(salida, Buffer.from(data, 'base64'));
console.log(`${salida} (${codigo.trim()})`);
ws.close();
