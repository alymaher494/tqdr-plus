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
  CreditCard,
  Lock
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

const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

const handlePasswordChange = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'كلمة المرور الجديدة غير مطابقة لتأكيد كلمة المرور.'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.'
    return
  }

  try {
    passwordLoading.value = true

    // 1. Re-authenticate to verify current password
    const { error: authError } = await client.auth.signInWithPassword({
      email: user.value?.email || '',
      password: passwordForm.value.currentPassword
    })

    if (authError) {
      passwordError.value = 'كلمة المرور الحالية غير صحيحة.'
      return
    }

    // 2. Update password
    const { error: updateError } = await client.auth.updateUser({
      password: passwordForm.value.newPassword
    })

    if (updateError) {
      passwordError.value = updateError.message
      return
    }

    passwordSuccess.value = 'تم تغيير كلمة المرور بنجاح!'
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    setTimeout(() => {
      showPasswordModal.value = false
      passwordSuccess.value = ''
    }, 1500)
  } catch (err: any) {
    passwordError.value = err.message
  } finally {
    passwordLoading.value = false
  }
}

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
          <NuxtLink to="/" class="flex items-center gap-3">
            <AppLogo class="h-12 w-auto object-contain" />
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
        <div class="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          <button 
            @click="showPasswordModal = true"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
          >
            <Lock class="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span class="font-bold">تغيير كلمة المرور</span>
          </button>

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

    <!-- Modal: Change Password -->
    <div v-if="showPasswordModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showPasswordModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-105 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Lock class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">تغيير كلمة المرور</h3>
          </div>
          <button @click="showPasswordModal = false" class="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handlePasswordChange" class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 block">كلمة المرور الحالية</label>
            <input 
              v-model="passwordForm.currentPassword" 
              type="password" 
              required
              class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 block">كلمة المرور الجديدة</label>
            <input 
              v-model="passwordForm.newPassword" 
              type="password" 
              required
              class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 block">تأكيد كلمة المرور الجديدة</label>
            <input 
              v-model="passwordForm.confirmPassword" 
              type="password" 
              required
              class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div v-if="passwordError" class="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-2xl text-center font-bold">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs p-3 rounded-2xl text-center font-bold">
            {{ passwordSuccess }}
          </div>

          <button 
            type="submit" 
            :disabled="passwordLoading"
            class="w-full bg-emerald-500 text-slate-950 font-bold py-4 rounded-2xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span v-if="passwordLoading" class="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
            <span>تحديث كلمة المرور</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
