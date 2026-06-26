import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Authenticate user
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: userError } = await client.auth.getUser()

  if (userError || !user) {
    console.error('Delete Shop: Auth check failed:', userError)
    throw createError({
      statusCode: 401,
      message: 'غير مصرح لك بالوصول.'
    })
  }

  console.log('Delete Shop: Authenticated user ID:', user.id)

  // 2. Verify admin role using admin client (bypasses RLS)
  const adminClient = serverSupabaseServiceRole(event)
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Delete Shop: Profile query result:', profile, 'Error:', profileError)

  if (profileError || profile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'غير مصرح لك بالوصول كمدير نظام.'
    })
  }

  // 3. Read target shop ID from body
  const body = await readBody(event)
  const { id: shopId } = body

  if (!shopId) {
    throw createError({
      statusCode: 400,
      message: 'معرف المحل مطلوب.'
    })
  }

  // 4. Verify target is indeed a shop_owner using admin client (bypasses RLS)
  const { data: targetProfile, error: targetError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', shopId)
    .single()

  if (targetError || !targetProfile) {
    throw createError({
      statusCode: 404,
      message: 'الحساب المطلوب حذفه غير موجود.'
    })
  }

  if (targetProfile.role !== 'shop_owner') {
    throw createError({
      statusCode: 400,
      message: 'لا يمكن حذف حساب مدير نظام من هنا.'
    })
  }

  // 5. Delete user from auth
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(shopId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      message: `فشل حذف الحساب: ${deleteError.message}`
    })
  }

  return { success: true }
})
