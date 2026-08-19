import { createHmac, timingSafeEqual } from 'crypto'

/**
 * قراءة سر توقيع جلسة العميل بطريقة موثوقة:
 * 1) runtimeConfig (الطريقة الموصى بها في Nitro — تعمل حتى لو لم يُضبط وقت البناء)
 * 2) fallback لأسامي المتغيرات القديمة والجديدة التي تدعمها @nuxtjs/supabase
 * يعيد string دائماً (فارغاً إذا غاب السر) — يجب أن يرفض المتصل الإصدار عند الفراغ.
 */
export function getCustomerSessionSecret(event: any): string {
  try {
    const rt = useRuntimeConfig(event)
    const sc: any = rt?.supabase
    if (sc?.serviceKey) return sc.serviceKey
    if (sc?.secretKey) return sc.secretKey
  } catch { /* ignore */ }

  return (
    process.env.NUXT_SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.NUXT_SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || ''
  )
}

export function signCustomerToken(event: any, payload: string): string {
  const secret = getCustomerSessionSecret(event)
  const signature = createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16)
  return `${payload}.${signature}`
}

export function verifyCustomerToken(event: any, token: string): string | null {
  try {
    const secret = getCustomerSessionSecret(event)
    if (!secret) return null
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payload, signature] = parts
    const expected = createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16)
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return payload
  } catch {
    return null
  }
}
