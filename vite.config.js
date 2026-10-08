import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Register the service worker with auto-update strategy
      registerType: 'autoUpdate',

      // Include all built assets in the precache manifest
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],

      manifest: {
        name: 'FixMyDelhi',
        short_name: 'FixMyDelhi',
        description: 'Report civic issues in Delhi — potholes, garbage, waterlogging.',
        theme_color: '#FF9F1C',
        background_color: '#FFF7EC',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // ── Precache ────────────────────────────────
        // All build output (JS, CSS, HTML) is precached automatically.
        // Glob patterns below are relative to the dist directory.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // ── Runtime caching ─────────────────────────
        runtimeCaching: [
          // Teachable Machine model files (model.json, weights.bin, metadata.json)
          {
            urlPattern: /^https:\/\/teachablemachine\.withgoogle\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'teachable-machine-model',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // jsDelivr CDN scripts (TF.js + Teachable Machine image library)
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jsdelivr-scripts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // OpenStreetMap tiles — stale-while-revalidate, capped to avoid storage bloat
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Leaflet CSS from unpkg
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'leaflet-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // NOTE: photos are NEVER cached — the app never stores or uploads them,
          // so there is intentionally no cache rule for blob: or data: URLs.
        ],
      },
    }),
  ],
})
