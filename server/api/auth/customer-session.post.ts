import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { customerId } = body

  if (!customerId) {
    throw createError({ statusCode: 400, message: 'Customer ID is required' })
  }

  // Create signed token: customerId.signature
  const secret = process.env.NUXT_SUPABASE_SERVICE_KEY || ''
  const signature = createHmac('sha256', secret).update(customerId).digest('hex').substring(0, 16)
  const token = `${customerId}.${signature}`

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
