import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, message } = body

  if (!phone || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone and message are required',
    })
  }

  // Security: فقط تاجر (shop_owner) أو أدمن (admin) يستطيع إرسال SMS.
  // أي حساب Supabase مصادق (حتى لو سُجّل ذاتياً) لا يكفي — يمنع إساءة
  // الاستخدام/التكلفة/التصيّد من حسابات دخيلة.
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }

    const client = serverSupabaseServiceRole(event)
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !['shop_owner', 'admin'].includes(profile.role)) {
      throw createError({ statusCode: 403, message: 'Forbidden: Insufficient role' })
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
  }

  try {
    const response = await sendSMS(phone, message)
    return { success: true, response }
  } catch (error: any) {
    return { success: false, error: error.data || error.message }
  }
})
