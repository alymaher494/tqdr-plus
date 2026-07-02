export async function sendSMS(phone: string | number, message: string) {
  const config = useRuntimeConfig()
  
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

  // If token is available, use the new REST API
  if (token) {
    return await $fetch('https://api.oursms.com/msgs/sms', {
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
    return await $fetch('https://api.oursms.com/api-a/msgs', {
      method: 'POST',
      body: `username=${username}&password=${password}&src=${sender}&dests=${formattedPhone}&body=${encodeURIComponent(message)}&priority=0&delay=0&validity=0&maxParts=0&dlr=0&prevDups=0&msgClass=transactional`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}
