export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  
  // 1. On server, skip redirection for dashboard routes
  if (process.server) {
    const dashboardRoutes = ['/merchant', '/customers', '/transactions', '/admin-dashboard']
    if (dashboardRoutes.some(route => to.path.startsWith(route))) {
      return
    }
  }

  let activeUser = user.value

  // 2. On client, if user is null, check if we have a supabase cookie at all
  if (process.client && !activeUser) {
    const hasCookie = document.cookie.includes('sb-')
    
    if (hasCookie) {
      const { data: { session } } = await client.auth.getSession()
      if (session?.user) {
        activeUser = session.user
      }
    }
  }

  // 3. Final check for non-auth users
  if (!activeUser && to.path !== '/login' && to.path !== '/' && !to.path.startsWith('/my') && to.path !== '/faq') {
    return navigateTo('/login')
  }

  // 4. If user exists, check their role (cached in useState to avoid repeated DB queries)
  if (activeUser && activeUser.id && String(activeUser.id) !== 'undefined') {
    const cachedRole = useState<string | null>('user-role', () => null)
    const cachedUserId = useState<string | null>('user-role-id', () => null)
    
    let role = cachedRole.value

    // Only fetch from DB if role is not cached or if the user changed
    if (!role || cachedUserId.value !== activeUser.id) {
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', activeUser.id)
        .maybeSingle()

      role = profile?.role || null
      cachedRole.value = role
      cachedUserId.value = activeUser.id
    }

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
