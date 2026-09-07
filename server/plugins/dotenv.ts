import dotenv from 'dotenv'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export default defineNitroPlugin(() => {
  // Ensure .env is loaded in production if present in the project root
  try {
    const envPath = resolve(process.cwd(), '.env')
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath })
      console.log('[Nitro Plugin] Loaded .env from:', envPath)
    } else {
      dotenv.config()
    }
  } catch (err) {
    console.warn('[Nitro Plugin] Failed to load .env:', err)
  }
})
