import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Production builds get a strict CSP: no scripts from elsewhere and, crucially,
// connect-src 'none' – the browser itself will refuse any network request from the app.
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
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), injectCsp()],
})
