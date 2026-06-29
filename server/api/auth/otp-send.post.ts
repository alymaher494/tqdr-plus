import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)
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

  // 2. Check if customer exists (exact match with multiple formats)
  const shortPhone = cleanPhone.startsWith('966') ? cleanPhone.substring(3) : cleanPhone

  const { data: customer } = await client
    .from('customers')
    .select('id')
    .or(`mobile_number.eq.${cleanPhone},mobile_number.eq.0${shortPhone},mobile_number.eq.${shortPhone}`)
    .limit(1)
    .maybeSingle()

  if (!customer) {
    throw createError({
      statusCode: 404,
      message: `عذراً، الرقم ${phone} غير مسجل كعميل في النظام.`
    })
  }

  // 3. Delete old OTPs for this phone before creating new one
  await client.from('otp_codes').delete().eq('phone', cleanPhone)

  // 4. Generate 6-digit OTP (more secure than 4-digit)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity

  // 5. Save OTP to DB
  const { error: otpError } = await client
    .from('otp_codes')
    .insert({
      phone: cleanPhone,
      code: otpCode,
      expires_at: expiresAt.toISOString()
    })

  if (otpError) {
    throw createError({
      statusCode: 500,
      message: 'فشل حفظ كود التحقق. حاول مرة أخرى.'
    })
  }

  // 6. Send SMS via internal API
  try {
    const smsMessage = `كود التحقق الخاص بك في تقدر بلس هو: ${otpCode}. صالح لمدة 5 دقائق.`

    await $fetch('/api/sms/send', {
      method: 'POST',
      body: { phone: cleanPhone, message: smsMessage },
      headers: { 'x-internal-api': 'true' }
    })

    return { success: true, message: 'تم إرسال كود التحقق بنجاح.' }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'فشل في إرسال رسالة الـ OTP.' })
  }
})
