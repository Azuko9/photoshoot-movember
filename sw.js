/* Service worker : l'appli (page, styles, script, polices, images) est mise en cache dès la première visite ;
   les fichiers lourds de vendor/ (détourage, visage) le sont à leur premier usage, donc après la première ouverture de la caméra.
   Stratégie « cache d'abord ». POUR PUBLIER UNE MISE À JOUR : changer VERSION (sinon les visiteurs gardent l'ancienne). */
const VERSION = 'v32';
const CACHE = 'movember-' + VERSION;
const COEUR = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "confidentialite.html",
  "manifest.webmanifest",
  "assets/favicon-32.png",
  "assets/apple-touch-icon.png",
  "assets/icon-192.png",
  "fonts/fredoka-latin-500.woff2",
  "fonts/fredoka-latin-600.woff2",
  "fonts/fredoka-latin-700.woff2",
  "fonts/geist-latin-400.woff2",
  "fonts/geist-latin-600.woff2",
  "assets/affiche.webp",
  "assets/empreinte.webp",
  "assets/explications.webp",
  "assets/fond.webp",
  "assets/infos.webp",
  "assets/logo.webp",
  "assets/m_bearnaise.webp",
  "assets/m_classique.webp",
  "assets/logo42.webp",
  "assets/m_fluours.webp",
  "assets/m_mourstache.webp",
  "assets/m_oursonne.webp",
  "assets/m_pintxours.webp",
  "assets/m_rainbow.webp",
  "assets/m_resina.webp",
  "assets/m_shebear.webp",
  "assets/s1.webp",
  "assets/s2.webp",
  "assets/s3.webp",
  "assets/s4.webp",
  "assets/s5.webp",
  "assets/titre.webp"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COEUR)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('movember-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if(r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(rep => {
    if(rep.ok && rep.status === 200 && u.pathname.includes('/vendor/')) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(r, copie)); }
    return rep;
  })));
});
