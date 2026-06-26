<script setup lang="ts">
import { 
  LayoutDashboard, 
  Users, 
  History, 
  LogOut,
  Menu,
  X,
  Store,
  Wallet,
  CreditCard
} from 'lucide-vue-next'

const client = useSupabaseClient()
const user = useSupabaseUser()
const isSidebarOpen = ref(false)
const { t, locale } = useI18n()
const route = useRoute()

const profile = ref(null)

const fetchProfile = async () => {
  // Try to get user directly from client if user.value is not ready
  let userId = user.value?.id
  if (!userId) {
    const { data: { user: authUser } } = await client.auth.getUser()
    userId = authUser?.id
  }

  if (!userId) {
    console.log('Merchant Layout: No user ID found yet')
    return
  }
  
  console.log('Merchant Layout: Fetching profile for', userId)
  try {
    const { data, error } = await client
      .from('profiles')
      .select('subscriptions_enabled, shop_name')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Merchant Layout: Error fetching profile:', error)
      return
    }
    console.log('Merchant Layout: Profile fetched successfully:', data)
    profile.value = data
  } catch (err) {
    console.error('Merchant Layout: Unexpected error:', err)
  }
}

// Watch for user changes
watch(user, (newUser) => {
  if (newUser?.id) fetchProfile()
}, { immediate: true })

onMounted(() => {
  fetchProfile()
})

const navItems = computed(() => {
  const items = [
    { label: 'الرئيسية', icon: LayoutDashboard, path: '/merchant' },
    { label: 'إدارة العملاء', icon: Users, path: '/customers' },
    { label: 'سجل العمليات', icon: History, path: '/transactions' },
  ]

  // Debug log to see if subscriptions are enabled
  console.log('Merchant Profile:', profile.value)

  if (profile.value?.subscriptions_enabled) {
    items.push({ label: 'عروض الاشتراكات', icon: CreditCard, path: '/merchant/subscriptions' })
  }

  return items
})

const handleLogout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Tajawal']" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 z-50 w-72 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 transition-transform duration-300 transform lg:translate-x-0"
      :class="[
        locale === 'ar' ? 'right-0 border-l' : 'left-0 border-r',
        isSidebarOpen ? 'translate-x-0' : (locale === 'ar' ? 'translate-x-full' : '-translate-x-full')
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Sidebar Header -->
        <div class="p-6 flex items-center justify-between">
          <NuxtLink to="/merchant" class="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" class="h-12 w-auto object-contain dark:invert" />
          </NuxtLink>
          <button @click="isSidebarOpen = false" class="lg:hidden text-slate-500">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 space-y-2 py-4">
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group"
            active-class="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            :class="[
              route.path === item.path 
                ? '' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-400'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-bold">{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-slate-200 dark:border-white/10">
          <button 
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors group"
          >
            <LogOut class="w-5 h-5" />
            <span class="font-bold">{{ $t('auth.logout') }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay -->
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-40 lg:hidden"
    ></div>

    <!-- Main Content -->
    <div :class="locale === 'ar' ? 'lg:pr-72' : 'lg:pl-72'" class="flex flex-col min-h-screen">
      <!-- Top Bar -->
      <header class="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = true" class="lg:hidden p-2 text-slate-500">
            <Menu class="w-6 h-6" />
          </button>
          <div class="flex items-center gap-2">
            <Wallet class="w-5 h-5 text-emerald-500" />
            <h2 class="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">
              {{ $t('nav.merchant_dashboard') }}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <ThemeLangSwitcher />
          
          <div class="flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            <div class="w-8 h-8 bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center font-bold text-sm">
              {{ user?.email?.charAt(0).toUpperCase() }}
            </div>
            <div class="hidden sm:block text-right">
              <span class="text-sm font-bold text-slate-700 dark:text-slate-300 block leading-tight">
                {{ user?.email?.split('@')[0] }}
              </span>
              <span class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{{ $t('dashboard.user_status.online') }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6 flex-1">
        <slot />
      </main>
    </div>
    <WhatsAppFloat />
  </div>
</template>
