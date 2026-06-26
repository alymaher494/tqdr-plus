<script setup lang="ts">
import { 
  LayoutDashboard, 
  Store, 
  Users,
  History, 
  LogOut,
  Menu,
  X,
  ShieldCheck,
  CreditCard
} from 'lucide-vue-next'

const client = useSupabaseClient()
const user = useSupabaseUser()
const isSidebarOpen = ref(false)
const { t, locale } = useI18n()

const navItems = computed(() => [
  { label: 'nav.overview', icon: LayoutDashboard, path: '/admin-dashboard' },
  { label: 'nav.shops', icon: Store, path: '/admin-dashboard/shops' },
  { label: 'nav.customers', icon: Users, path: '/admin-dashboard/customers' },
  { label: 'nav.subscriptions_nav', icon: CreditCard, path: '/admin-dashboard/subscriptions' },
  { label: 'nav.reports', icon: History, path: '/admin-dashboard/reports' },
])

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
          <NuxtLink to="/admin-dashboard" class="flex items-center">
            <img src="/logo.png" alt="Logo" class="h-16 w-auto object-contain dark:invert" />
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
            active-class="bg-emerald-500 text-slate-950"
            :class="[
              $route.path === item.path 
                ? '' 
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-bold">{{ $t(item.label) }}</span>
          </NuxtLink>
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-white/10">
          <button 
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors group"
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
            <ShieldCheck class="w-5 h-5 text-emerald-500" />
            <h2 class="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">
              {{ $t('nav.admin_panel') }}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <ThemeLangSwitcher />

          <div class="flex items-center gap-3">
            <div class="hidden sm:block text-right">
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('dashboard.user_status.admin') }}</p>
              <p class="text-[10px] text-emerald-500 font-medium">{{ $t('dashboard.user_status.online') }}</p>
            </div>
            <div class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/30">
              AD
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6 flex-1 animate-fade-in">
        <slot />
      </main>
    </div>
    <WhatsAppFloat />
  </div>
</template>
