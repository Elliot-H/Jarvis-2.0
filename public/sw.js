// Minimal service worker so Chrome treats Jarvis as an installable app.
// It does not cache anything: Jarvis always loads live from the server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
