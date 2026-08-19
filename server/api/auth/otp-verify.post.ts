import { serverSupabaseServiceRole } from '#supabase/server'
import { timingSafeEqual } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)
  const { phone, code } = body

  if (!phone || !code) {
    throw createError({ statusCode: 400, message: 'Phone and code are required' })
  }

  // 1. Sanitize Phone
  let cleanPhone = phone.toString().replace(/\D/g, '')
  if (cleanPhone.startsWith('05')) {
    cleanPhone = '966' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
    cleanPhone = '966' + cleanPhone
  }

  // Test bypass — مفعّل فقط عند ضبط NUXT_ENABLE_TEST_OTP=true صراحةً في البيئة.
  // لم يعد يُستنتج من NODE_ENV حتى لا يبقى التجاوز حياً في الإنتاج.
  const isTestBypass =
    process.env.NUXT_ENABLE_TEST_OTP === 'true'
    && (cleanPhone === '966566293256' || cleanPhone.startsWith('966500000'))
    && code.toString() === '111111'

  if (!isTestBypass) {
    // 2. Load latest valid OTP for this phone
    const { data: otpRecord } = await client
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpRecord) {
      throw createError({ statusCode: 400, message: 'كود التحقق غير صحيح أو انتهت صلاحيته.' })
    }

    // 3. Attempt limit: 5 محاولات فاشلة تبطل الكود
    if ((otpRecord.attempts || 0) >= 5) {
      await client.from('otp_codes').delete().eq('phone', cleanPhone)
      throw createError({ statusCode: 429, message: 'تم تجاوز عدد المحاولات المسموح. اطلب كود تحقق جديد.' })
    }

    // 4. مقارنة ثابتة الزمن لمنع التسريب الزمني البسيط
    const submitted = code.toString()
    let valid = false
    if (submitted.length === otpRecord.code.length) {
      valid = timingSafeEqual(Buffer.from(submitted), Buffer.from(otpRecord.code))
    }

    if (!valid) {
      // best-effort: زيادة العدّاد (يتطلب تشغيل supabase_security_fixes.sql أولاً)
      try {
        await client.from('otp_codes').update({ attempts: (otpRecord.attempts || 0) + 1 }).eq('phone', cleanPhone)
      } catch { /* ignore */ }
      throw createError({ statusCode: 400, message: 'كود التحقق غير صحيح أو انتهت صلاحيته.' })
    }
  }

  // 5. Get Customer ID using direct indexed query
  const shortPhone = cleanPhone.startsWith('966') ? cleanPhone.substring(3) : cleanPhone
  const shortPhoneWithZero = '0' + shortPhone

  const { data: customer } = await client
    .from('customers')
    .select('id')
    .or(`mobile_number.eq.${cleanPhone},mobile_number.eq.${shortPhone},mobile_number.eq.${shortPhoneWithZero}`)
    .limit(1)
    .maybeSingle()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'العميل غير موجود.' })
  }

  // 6. Cleanup all OTPs for this phone
  await client.from('otp_codes').delete().eq('phone', cleanPhone)

  // 7. Issue secure signed session cookie — fail closed إذا غاب السر
  const secret = getCustomerSessionSecret(event)
  if (!secret) {
    throw createError({ statusCode: 500, message: 'Server configuration error: session secret is missing.' })
  }
  const token = signCustomerToken(event, cleanPhone)

  setCookie(event, 'customer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })

  return {
    success: true,
    customerId: customer.id,
    phone: cleanPhone
  }
})
