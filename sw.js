// Service Worker do NAVI — cache simples para uso offline quando instalado como app.
// Importante: só funciona quando o NAVI está hospedado em http/https (ex.: GitHub Pages).
// Ao abrir o arquivo direto do computador (file://) o navegador ignora este arquivo e o sistema funciona normalmente.

const CACHE_NOME = 'navi-cache-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './navi-icone-192.png',
  './navi-icone-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  // Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais nova), cai pro cache se estiver offline.
  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(evento.request, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
