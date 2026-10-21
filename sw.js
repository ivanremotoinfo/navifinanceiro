// Service Worker do NAVI — versão SOMENTE VISUALIZAÇÃO.
// Objetivo: trocar o código que o navegador já tem em cache pela versão com bloqueio.
// Este arquivo mexe APENAS no cache de arquivos (Cache Storage). Ele não tem acesso ao
// localStorage, então os dados do cliente (clientes, cheques, lembretes) e os backups .json não são afetados.

const CACHE_NOME = 'navi-cache-v2-leitura';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './navi-icone-192.png',
  './navi-icone-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME)
      // cache:'reload' ignora o cache HTTP do navegador e busca a versão nova direto do servidor
      .then((cache) => cache.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' }))))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    // apaga os caches antigos do NAVI (ex.: navi-cache-v1) — só caches de arquivos, nunca dados
    const nomes = await caches.keys();
    await Promise.all(
      nomes.filter((n) => /^navi/i.test(n) && n !== CACHE_NOME).map((n) => caches.delete(n))
    );
    await self.clients.claim();
    // abas que ainda estão rodando o código antigo recarregam sozinhas, uma vez, para pegar a versão com bloqueio
    try {
      const abas = await self.clients.matchAll({ type: 'window' });
      abas.forEach((aba) => { try { aba.navigate(aba.url); } catch (e) {} });
    } catch (e) {}
  })());
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;
  const mesmaOrigem = new URL(req.url).origin === self.location.origin;
  // Rede primeiro (sempre revalidando, para nunca servir HTML velho); cai para o cache só se estiver offline.
  const busca = mesmaOrigem ? fetch(req.url, { cache: 'no-cache' }) : fetch(req);
  evento.respondWith(
    busca
      .then((resposta) => {
        if (mesmaOrigem && resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE_NOME).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return resposta;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
