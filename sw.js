/* KMZrev · funcionamiento sin conexión */
const VERSION = 'kmzrev-app-v6';
const TESELAS = 'kmzrev-teselas';      // mapas descargados a propósito (no se borran solos)
const VISTAS  = 'kmzrev-vistas';       // trozos de mapa ya vistos (se van renovando)
const MAX_VISTAS = 4000;

const APP = [
  './', 'index.html', 'defectos.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];
const EXTERNOS = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&display=swap'
];
const HOSTS_MAPA = /(^|\.)(tile\.openstreetmap\.org|ign\.es|arcgisonline\.com)$/i;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(APP);
    // Las librerías externas se intentan guardar una a una: si alguna falla no bloquea la instalación
    await Promise.all(EXTERNOS.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('kmzrev-app-') && k !== VERSION) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

async function recortarVistas() {
  const c = await caches.open(VISTAS);
  const ks = await c.keys();
  if (ks.length > MAX_VISTAS) for (const k of ks.slice(0, ks.length - MAX_VISTAS)) await c.delete(k);
}
let contadorVistas = 0;

async function teselaMapa(req) {
  const url = req.url;
  const guardada = (await caches.match(url, { cacheName: TESELAS })) || (await caches.match(url, { cacheName: VISTAS }));
  if (guardada) return guardada;
  try {
    let r;
    try { r = await fetch(url, { mode: 'cors', credentials: 'omit' }); }
    catch (err) { r = null; }
    if (r && r.ok) {
      const c = await caches.open(VISTAS);
      c.put(url, r.clone());
      if (++contadorVistas % 200 === 0) recortarVistas();
      return r;
    }
    return await fetch(req); // el servidor no admite CORS: se muestra pero no se guarda
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Sin conexión' });
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Trozos de mapa
  if (HOSTS_MAPA.test(url.hostname)) { e.respondWith(teselaMapa(req)); return; }

  // La propia app: primero la red (para recibir actualizaciones) y, si no hay, lo guardado
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
        const r = await fetch(req, { signal: ctl.signal }); clearTimeout(t);
        if (r.ok && (req.mode === 'navigate' || APP.some(a => url.pathname.endsWith('/' + a.replace('./', ''))))) {
          const c = await caches.open(VERSION); c.put(req.mode === 'navigate' ? 'index.html' : req, r.clone());
        }
        return r;
      } catch (err) {
        const c = await caches.open(VERSION);
        return (req.mode === 'navigate' ? await c.match('index.html') : await c.match(req, { ignoreSearch: true })) ||
               new Response('', { status: 504, statusText: 'Sin conexión' });
      }
    })());
    return;
  }

  // Librerías y fuentes: lo guardado primero
  if (/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      const g = await c.match(req.url);
      if (g) return g;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req.url, r.clone()); return r; }
      catch (err) { return new Response('', { status: 504 }); }
    })());
  }
});
