export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  const config = useRuntimeConfig()
  
  // 1. On server, skip redirection for dashboard routes
  if (process.server) {
    const dashboardRoutes = ['/merchant', '/customers', '/transactions', '/admin-dashboard']
    if (dashboardRoutes.some(route => to.path.startsWith(route))) {
      return
    }
  }

  let activeUser = user.value

  // 2. On client, if user is null, check if we have a supabase cookie at all
  // This prevents premature redirection during hydration
  if (process.client && !activeUser) {
    const hasCookie = document.cookie.includes('sb-') // Check for any supabase related cookie
    
    if (hasCookie) {
      // Wait for session to hydrate
      const { data: { session } } = await client.auth.getSession()
      if (session?.user) {
        activeUser = session.user
      }
    }
  }

  // 3. Final check for non-auth users
  if (!activeUser && to.path !== '/login' && to.path !== '/' && !to.path.startsWith('/my')) {
    return navigateTo('/login')
  }

  // 4. If user exists, check their role from profiles table
  if (activeUser && activeUser.id && String(activeUser.id) !== 'undefined') {
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', activeUser.id)
      .maybeSingle()

    const role = profile?.role

    // Admin Protection
    if (to.path.startsWith('/admin-dashboard') && role !== 'admin') {
      return navigateTo('/')
    }

    // Merchant Protection
    if ((to.path.startsWith('/merchant') || to.path === '/customers' || to.path === '/transactions') && role !== 'shop_owner') {
      if (role === 'admin') return navigateTo('/admin-dashboard')
      return navigateTo('/')
    }
  }
})
