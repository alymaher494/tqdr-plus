export async function sendSMS(phone: string | number, message: string) {
  const config = useRuntimeConfig()
  
  // Format phone number (ensure it starts with 966 and contains only digits)
  let formattedPhone = phone.toString().replace(/\D/g, '')

  if (formattedPhone.startsWith('05')) {
    formattedPhone = '966' + formattedPhone.substring(1)
  } else if (formattedPhone.startsWith('5') && formattedPhone.length === 9) {
    formattedPhone = '966' + formattedPhone
  }

  const username = config.smsUsername || process.env.SMS_USERNAME || process.env.NUXT_SMS_USERNAME
  const password = config.smsPassword || process.env.SMS_PASSWORD || process.env.NUXT_SMS_PASSWORD
  const sender = config.smsSender || process.env.SMS_SENDER || process.env.NUXT_SMS_SENDER || 'TQDR'
  const token = config.smsToken || process.env.SMS_TOKEN || process.env.NUXT_SMS_TOKEN

  console.log(`[SMS] Initiating send to: ${formattedPhone} | Sender: ${sender} | Auth: ${token ? 'Token' : (username ? 'User/Pass' : 'NONE')}`)

  if (!token && !username) {
    const errMsg = '[SMS ERROR] SMS_TOKEN is missing! Please configure SMS_TOKEN in the server .env file.'
    console.error(errMsg)
    throw new Error(errMsg)
  }

  // If token is available, use the modern REST API
  if (token) {
    try {
      const result: any = await $fetch('https://api.oursms.com/msgs/sms', {
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
      console.log(`[SMS SUCCESS] Response for ${formattedPhone}:`, JSON.stringify(result))
      return result
    } catch (err: any) {
      console.error(`[SMS FAILED] OurSMS API Error for ${formattedPhone}:`, err?.data || err?.message || err)
      throw err
    }
  } else {
    // Fallback to old username/password API
    try {
      const result: any = await $fetch('https://api.oursms.com/api-a/msgs', {
        method: 'POST',
        body: `username=${username}&password=${password}&src=${sender}&dests=${formattedPhone}&body=${encodeURIComponent(message)}&priority=0&delay=0&validity=0&maxParts=0&dlr=0&prevDups=0&msgClass=transactional`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      console.log(`[SMS Legacy SUCCESS] Response for ${formattedPhone}:`, JSON.stringify(result))
      return result
    } catch (err: any) {
      console.error(`[SMS Legacy FAILED] Error for ${formattedPhone}:`, err?.data || err?.message || err)
      throw err
    }
  }
}
