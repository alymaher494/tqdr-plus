export default defineEventHandler(async (event) => {
  // الكوكي httpOnly لا يمكن مسحه من المتصفح (document.cookie)
  // لذلك يجب أن يكون مسحه من جهة الخادم بنفس attributes وقت الإنشاء
  deleteCookie(event, 'customer_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })

  return { success: true }
})
