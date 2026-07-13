import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ferring-app/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        // Include font files in the precache so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,png,webmanifest,woff2}'],
      },
      manifest: {
        name: 'IVF Wheel',
        short_name: 'IVF Wheel',
        description: 'IVF gestational calculator',
        display: 'standalone',
        start_url: '/ferring-app/',
        scope: '/ferring-app/',
        theme_color: '#800020',
        background_color: '#f5f5f7',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
