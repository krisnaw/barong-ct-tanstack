import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

function cloudflareWorkersClientStub(): Plugin {
  const stubId = '\0cloudflare-workers-client-stub'
  return {
    name: 'cloudflare-workers-client-stub',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (source !== 'cloudflare:workers') return
      if (options.ssr || this.environment?.name === 'ssr') return
      return stubId
    },
    load(id) {
      if (id !== stubId) return
      return `
export const env = new Proxy({}, {
  get() {
    throw new Error('cloudflare:workers env is only available on the server')
  },
})
export function waitUntil() {
  throw new Error('cloudflare:workers waitUntil is only available on the server')
}
`
    },
  }
}

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    cloudflareWorkersClientStub(),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    cloudflare({
      viteEnvironment: {
        name: "ssr"
      }
    }),
  ],
})