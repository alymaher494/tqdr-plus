import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, message } = body

  if (!phone || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone and message are required',
    })
  }

  // Security: Strictly verify that the request comes from an authenticated user session (merchant or admin)
  // Internal server-to-server calls should invoke the sendSMS utility directly instead of calling this API route.
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }
  } catch {
    throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
  }

  try {
    const response = await sendSMS(phone, message)
    return { success: true, response }
  } catch (error: any) {
    return { success: false, error: error.data || error.message }
  }
})

