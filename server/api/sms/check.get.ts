import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const token = config.smsToken || process.env.SMS_TOKEN || process.env.NUXT_SMS_TOKEN
  const sender = config.smsSender || process.env.SMS_SENDER || process.env.NUXT_SMS_SENDER || 'TQDR'
  const envPath = resolve(process.cwd(), '.env')
  const envExists = existsSync(envPath)

  const tokenMasked = token ? `${token.substring(0, 4)}...${token.slice(-4)}` : null

  return {
    status: token ? 'CONFIGURED' : 'MISSING_CONFIGURATION',
    hasEnvFile: envExists,
    configuredSender: sender,
    tokenMasked,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
})
