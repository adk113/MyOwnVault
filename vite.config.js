import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Strict CSP for zero-network enforcement
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

const injectCsp = () => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
    ),
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    injectCsp(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'pwa-512x512.svg', 'pwa-512x512.png', 'app-icon.png'],
      manifest: {
        name: 'MyOwnVault · Personal Wealth Ledger',
        short_name: 'MyOwnVault',
        description: 'Zero-knowledge, completely offline personal wealth ledger and credential vault.',
        theme_color: '#060913',
        background_color: '#060913',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml',
          },
          {
            src: 'favicon.png',
            sizes: '64x64',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
