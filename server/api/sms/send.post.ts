import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, message } = body

  if (!phone || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone and message are required',
    })
  }

  // Security: التحقق من أن الطلب وارد من جلسة مصادقة لتاجر أو أدمن
  try {
    let user = await serverSupabaseUser(event)
    let userClient: any = null

    try {
      userClient = await serverSupabaseClient(event)
      if (!user) {
        const { data: { user: authUser } } = await userClient.auth.getUser()
        user = authUser
      }
    } catch (clientErr) {
      console.warn('[SMS Auth] Notice on serverSupabaseClient:', clientErr)
    }

    if (!user) {
      console.error('[SMS Auth] No authenticated user session found in request cookies')
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }

    // 1. Resolve role from user metadata
    let role: string | null = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role || null

    // 2. Resolve role from profiles table using authenticated user client (passes RLS)
    if (!role && userClient) {
      try {
        const { data: profile } = await userClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.role) {
          role = profile.role
        }
      } catch (err) {
        console.warn('[SMS Auth] userClient profile query notice:', err)
      }
    }

    // 3. Fallback: try service role client if configured
    if (!role) {
      try {
        const serviceClient = serverSupabaseServiceRole(event)
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.role) {
          role = profile.role
        }
      } catch (err) {
        console.warn('[SMS Auth] serviceClient profile query notice:', err)
      }
    }

    console.log(`[SMS Auth] Request by user ${user.id} | Resolved Role: "${role || 'authenticated_merchant'}"`)

    // If an explicit role is found and it is not authorized
    if (role && !['shop_owner', 'admin'].includes(role)) {
      console.error(`[SMS Auth] Forbidden: user ${user.id} has unauthorized role: ${role}`)
      throw createError({ statusCode: 403, message: 'Forbidden: Insufficient role' })
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('[SMS Auth Error]:', e)
    throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
  }

  try {
    const response = await sendSMS(phone, message)
    return { success: true, response }
  } catch (error: any) {
    console.error('[API /api/sms/send Failed]:', error.data || error.message || error)
    return { success: false, error: error.data || error.message }
  }
})
