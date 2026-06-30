import { serverSupabaseServiceRole } from '#supabase/server'

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

  // 2. Verify OTP against database (with simulation bypass for testing numbers)
  const isTestNumber = cleanPhone === '966566293256' || cleanPhone.startsWith('966500000');
  const isTestBypass = isTestNumber && code.toString() === '111111';

  if (!isTestBypass) {
    const { data: otpData, error: otpError } = await client
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code.toString())
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpData) {
      throw createError({ statusCode: 400, message: 'كود التحقق غير صحيح أو انتهت صلاحيته.' })
    }
  }

  // 3. Get Customer ID (exact match using sanitized short phone)
  const shortPhone = cleanPhone.startsWith('966') ? cleanPhone.substring(3) : cleanPhone

  const { data: customer } = await client
    .from('customers')
    .select('id')
    .or(`mobile_number.eq.${cleanPhone},mobile_number.eq.0${shortPhone},mobile_number.eq.${shortPhone}`)
    .limit(1)
    .maybeSingle()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'العميل غير موجود.' })
  }

  // 4. Cleanup all OTPs for this phone
  await client.from('otp_codes').delete().eq('phone', cleanPhone)

  return {
    success: true,
    customerId: customer.id
  }
})
