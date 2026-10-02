/*
 * Офлайн для «Структуры». Данные и так живут в localStorage — здесь кэшируется
 * сама оболочка: страница, скрипты, стили, шрифты, иконки.
 * - навигация: сеть, при её отсутствии — сохранённая страница;
 * - /_next/static/*: имена с хэшем, не меняются — сначала кэш;
 * - остальное своё (иконки, манифест): кэш сразу, обновление в фоне.
 */
const CACHE = "structura-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icons/day-dark-180.png", "/icons/day-light-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = (req, res) => {
  if (res && res.ok && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => put("/", res))
        .catch(() => caches.match("/", { ignoreSearch: true })),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }

  // RSC-запросы Next не кэшируем — у приложения одна страница
  if (url.searchParams.has("_rsc")) return;

  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => put(req, res))
        .catch(() => hit);
      return hit || net;
    }),
  );
});
