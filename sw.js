const CACHE_NAME = 'fastpv-v1.1-cache';

const ASSETS_TO_CACHE = [

  './index.html',

  './styles.min.css',

  './manifest.json',

  // Librerías externas (CDNs) vitales para que funcione offline

  'https://cdn.tailwindcss.com',

  'https://unpkg.com/lucide@latest',

  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',

  'https://unpkg.com/html5-qrcode',

  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',

  'https://unpkg.com/react@18/umd/react.development.js',

  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',

  'https://unpkg.com/@babel/standalone/babel.min.js',

  './icon-192.png',
  './icon-512.png'

];

  

// 1. Instalación: Cachear recursos estáticos

self.addEventListener('install', (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME).then((cache) => {

      console.log('[Service Worker] Cacheando archivos del sistema...');

      return cache.addAll(ASSETS_TO_CACHE);

    })

  );

});

  

// 2. Activación: Limpiar cachés antiguas

self.addEventListener('activate', (event) => {

  event.waitUntil(

    caches.keys().then((cacheNames) => {

      return Promise.all(

        cacheNames.map((cache) => {

          if (cache !== CACHE_NAME) {

            console.log('[Service Worker] Borrando caché antigua');

            return caches.delete(cache);

          }

        })

      );

    })

  );

});

  

// 3. Fetch: Servir desde caché, si falla, ir a red

self.addEventListener('fetch', (event) => {

  event.respondWith(

    caches.match(event.request).then((response) => {

      // Si está en caché, devolverlo

      if (response) {

        return response;

      }

      // Si no, hacer la petición a internet

      return fetch(event.request).then((networkResponse) => {

        // Opcional: Podríamos cachear dinámicamente nuevas peticiones aquí

        return networkResponse;

      });

    })

  );

});