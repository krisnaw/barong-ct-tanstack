import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'drizzle-kit'

function localD1Path() {
  if (process.env.LOCAL_DB_PATH) {
    return process.env.LOCAL_DB_PATH.startsWith('file:')
      ? process.env.LOCAL_DB_PATH
      : pathToFileURL(path.resolve(process.env.LOCAL_DB_PATH)).href
  }

  const dir = path.join(
    '.wrangler',
    'state',
    'v3',
    'd1',
    'miniflare-D1DatabaseObject',
  )
  if (!fs.existsSync(dir)) {
    throw new Error(
      'Local D1 database not found. Run `npm run db:migrate:local` or `npm run dev` first.',
    )
  }

  const file = fs
    .readdirSync(dir)
    .find((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
  if (!file) {
    throw new Error('Local D1 sqlite file not found under .wrangler.')
  }

  return pathToFileURL(path.resolve(dir, file)).href
}

export default defineConfig({
  schema: './db/schemas/index.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: localD1Path(),
  },
})
