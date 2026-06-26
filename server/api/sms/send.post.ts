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

  // Format phone number (ensure it starts with 966 and contains only digits)
  let formattedPhone = phone.toString().replace(/\D/g, '')
  
  if (formattedPhone.startsWith('05')) {
    formattedPhone = '966' + formattedPhone.substring(1)
  } else if (formattedPhone.startsWith('5') && formattedPhone.length === 9) {
    formattedPhone = '966' + formattedPhone
  }


  const username = process.env.SMS_USERNAME || config.smsUsername
  const password = process.env.SMS_PASSWORD || config.smsPassword
  const sender = process.env.SMS_SENDER || config.smsSender
  const token = process.env.SMS_TOKEN || config.smsToken

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

    console.log('--- SMS Service Report ---')
    console.log('To:', formattedPhone)
    console.log('Method:', token ? 'Token-based' : 'Credentials-based')
    console.log('Status:', response)
    console.log('--------------------------')

    return { success: true, response }
  } catch (error: any) {
    console.error('--- SMS Service Error ---')
    console.error('To:', phone)
    console.error('Error Status:', error.statusCode)
    console.error('Error Message:', error.data || error.message)
    console.log('--------------------------')
    return { success: false, error: error.data || error.message }
  }
})
