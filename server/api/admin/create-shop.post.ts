import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Authenticate user
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: userError } = await client.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      message: 'غير مصرح لك بالوصول.'
    })
  }

  // 2. Verify admin role using admin client (bypasses RLS)
  const adminClient = serverSupabaseServiceRole(event)
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'غير مصرح لك بالوصول كمدير نظام.'
    })
  }

  // 3. Read body
  const body = await readBody(event)
  const { email, password, shop_name } = body

  if (!email || !password || !shop_name) {
    throw createError({
      statusCode: 400,
      message: 'جميع الحقول مطلوبة.'
    })
  }

  // 4. Create user via admin API (does not sign in/change active session)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'shop_owner',
      shop_name
    }
  })

  if (authError) {
    throw createError({
      statusCode: 500,
      message: `فشل إنشاء الحساب: ${authError.message}`
    })
  }

  return { success: true, user: authData.user }
})
