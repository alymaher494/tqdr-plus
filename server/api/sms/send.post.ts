import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { phone, message } = body

  if (!phone || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone and message are required',
    })
  }

  // Security: Verify the request comes from an authenticated user or internal server call
  // Internal calls from other server routes ($fetch) will pass through
  // External browser calls must have a valid Supabase session
  const isInternalCall = event.node.req.headers['x-internal-api'] === 'true'

  if (!isInternalCall) {
    try {
      const user = await serverSupabaseUser(event)
      if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
      }
    } catch {
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }
  }

  // Format phone number (ensure it starts with 966 and contains only digits)
  let formattedPhone = phone.toString().replace(/\D/g, '')

  if (formattedPhone.startsWith('05')) {
    formattedPhone = '966' + formattedPhone.substring(1)
  } else if (formattedPhone.startsWith('5') && formattedPhone.length === 9) {
    formattedPhone = '966' + formattedPhone
  }

  const username = config.smsUsername
  const password = config.smsPassword
  const sender = config.smsSender
  const token = config.smsToken

  try {
    let response: any;

    // If token is available, use the new REST API
    if (token) {
      response = await $fetch('https://api.oursms.com/msgs/sms', {
        method: 'POST',
        body: {
          src: sender,
          dests: [formattedPhone],
          body: message,
          priority: 0,
          delay: 0,
          validity: 0,
          maxParts: 0,
          dlr: 0,
          prevDups: 0
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } else {
      // Fallback to old username/password API
      response = await $fetch('https://api.oursms.com/api-a/msgs', {
        method: 'POST',
        body: `username=${username}&password=${password}&src=${sender}&dests=${formattedPhone}&body=${encodeURIComponent(message)}&priority=0&delay=0&validity=0&maxParts=0&dlr=0&prevDups=0&msgClass=transactional`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    }

    return { success: true, response }
  } catch (error: any) {
    return { success: false, error: error.data || error.message }
  }
})
