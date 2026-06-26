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

  // 2. On client, if user is null, check if we have a supabase cookie at all
  // This prevents premature redirection during hydration
  if (process.client && !user.value) {
    const cookieName = 'sb-access-token' // Default Supabase cookie name pattern
    const hasCookie = document.cookie.includes('sb-') // Check for any supabase related cookie
    
    if (hasCookie) {
      // Wait for session to hydrate
      const { data: { session } } = await client.auth.getSession()
      if (session) return // Session exists, allow access
    }

    if (to.path !== '/login' && to.path !== '/' && !to.path.startsWith('/my')) {
      return navigateTo('/login')
    }

  }

  // 3. Final check for non-auth users (if we're still here and no user/session)
  if (!user.value && to.path !== '/login' && to.path !== '/') {
    // Check session one last time
    if (process.client) {
      const { data: { session } } = await client.auth.getSession()
      if (!session && !to.path.startsWith('/my')) return navigateTo('/login')
    } else {

      // On server, we already skipped dashboard routes, 
      // but for other protected routes we might need a redirect
      // However, usually we want to be careful here
    }
  }

  // 3. If user exists, check their role from profiles table
  if (user.value && user.value.id && String(user.value.id) !== 'undefined') {
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
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
