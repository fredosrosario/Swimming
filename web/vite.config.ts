/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base so assets resolve under any GitHub Pages path
  // (user.github.io OR user.github.io/<repo>/).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'KaPok Swim Club',
        short_name: 'KaPok',
        description: 'Attendance & payment tracker for Macau KaPok Swimming Club',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        // Relative, like `base`: the app lives under /<repo>/ on GitHub Pages.
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
  },
})
