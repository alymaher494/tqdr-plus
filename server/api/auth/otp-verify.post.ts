import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
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

  // 2. Verify OTP (with test bypass code "1234")
  const isTestBypass = (code === '1234' || code === 1234)

  if (!isTestBypass) {
    const { data: otpData, error: otpError } = await client
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpData) {
      throw createError({ statusCode: 400, message: 'كود التحقق غير صحيح أو انتهت صلاحيته.' })
    }
  }

  // 3. Get Customer ID (Robust partial match)
  const shortPhone = cleanPhone.startsWith('966') ? cleanPhone.substring(3) : cleanPhone

  const { data: customers } = await client
    .from('customers')
    .select('id')
    .ilike('mobile_number', `%${shortPhone}%`)
    .limit(1)

  const customer = customers?.[0]



  if (!customer) {
    throw createError({ statusCode: 404, message: 'العميل غير موجود.' })
  }


  // 4. Cleanup OTP (optional but recommended)
  await client.from('otp_codes').delete().eq('phone', cleanPhone)

  return { 
    success: true, 
    customerId: customer.id 
  }
})
