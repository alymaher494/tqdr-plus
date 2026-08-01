import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { customerId, phone } = body

  const payload = phone || customerId

  if (!payload) {
    throw createError({ statusCode: 400, message: 'Customer ID or Phone is required' })
  }

  // Create signed token: payload.signature
  const secret = process.env.NUXT_SUPABASE_SERVICE_KEY || ''
  const signature = createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16)
  const token = `${payload}.${signature}`

  // Set secure cookie (accessible by client-side Nuxt useCookie)
  setCookie(event, 'customer_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })

  return { success: true }
})
