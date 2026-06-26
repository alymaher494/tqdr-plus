import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
  const { phone } = body

  if (!phone) {
    throw createError({ statusCode: 400, message: 'Phone is required' })
  }

  // 1. Sanitize Phone
  let cleanPhone = phone.toString().replace(/\D/g, '')
  if (cleanPhone.startsWith('05')) {
    cleanPhone = '966' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
    cleanPhone = '966' + cleanPhone
  }

  // 2. Check if customer exists (Robust partial match)
  const shortPhone = cleanPhone.startsWith('966') ? cleanPhone.substring(3) : cleanPhone
  
  const { data: customers, error: custError } = await client
    .from('customers')
    .select('id')
    .ilike('mobile_number', `%${shortPhone}%`)
    .limit(1)

  const customer = customers?.[0]

  if (!customer) {
    throw createError({ 
      statusCode: 404, 
      message: `عذراً، الرقم ${phone} غير مسجل كعميل في النظام.` 
    })
  }



  // 3. Generate 4-digit OTP
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity

  // 4. Save OTP to DB
  const { error: otpError } = await client
    .from('otp_codes')
    .insert({
      phone: cleanPhone,
      code: otpCode,
      expires_at: expiresAt.toISOString()
    })

  if (otpError) {
    console.error('Supabase OTP Error:', otpError)
    throw createError({ 
      statusCode: 500, 
      message: `فشل حفظ كود التحقق: ${otpError.message}` 
    })
  }


  // 5. Send SMS via OurSMS (using existing logic)
  try {
    const config = useRuntimeConfig()
    // Note: In a real app, we'd call the internal /api/sms/send or duplicate logic
    // Since we are in the same server, we can call the SMS logic directly or fetch
    const smsMessage = `كود التحقق الخاص بك في تقدر هو: ${otpCode}. صالح لمدة 5 دقائق.`
    
    // Using $fetch to call our own API
    await $fetch('/api/sms/send', {
      method: 'POST',
      body: { phone: cleanPhone, message: smsMessage }
    })

    return { success: true, message: 'تم إرسال كود التحقق بنجاح.' }
  } catch (err) {
    console.error('OTP SMS Error:', err)
    throw createError({ statusCode: 500, message: 'فشل في إرسال رسالة الـ OTP.' })
  }
})
