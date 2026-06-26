<script setup lang="ts">
import { Menu, X, LogIn, ChevronDown, Store, Users } from 'lucide-vue-next'


const isMenuOpen = ref(false)
const { locale } = useI18n()

const navLinks = [
  { nameKey: 'landing.nav.home', to: '/' },
  { nameKey: 'landing.nav.how_it_works', to: '/#features' },
  { nameKey: 'landing.nav.features', to: '/#shops' },
  { nameKey: 'landing.nav.pricing', to: '/#pricing' },
  { nameKey: 'landing.nav.faq', to: '/faq' },
  { nameKey: 'landing.nav.contact', to: '/#contact' },
]

const showLoginDropdown = ref(false)
const dropdownRef = ref(null)

// Close dropdown when clicking outside
if (import.meta.client) {
  window.addEventListener('click', (e) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
      showLoginDropdown.value = false
    }
  })
}

</script>

<template>
  <div class="min-h-screen bg-white dark:bg-[#020c02] font-['Tajawal']" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-[#020c02]/80 backdrop-blur-lg border-b border-gray-100 dark:border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center h-20">
          <NuxtLink to="/" class="flex items-center gap-3">
            <img src="/logo.png" alt="Tqdr Plus Logo" class="h-16 w-auto" />
          </NuxtLink>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-8">
            <NuxtLink 
              v-for="link in navLinks" 
              :key="link.to" 
              :to="link.to"
              class="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
            >
              {{ $t(link.nameKey) }}
            </NuxtLink>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-4">
            <ThemeLangSwitcher />
            
            <!-- Desktop Login Dropdown -->
            <div class="hidden sm:block relative" ref="dropdownRef">
              <button 
                @click="showLoginDropdown = !showLoginDropdown"
                class="flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-black text-sm transition-all shadow-lg shadow-green-500/20"
              >
                <LogIn class="w-4 h-4" />
                <span>{{ $t('landing.nav.login') }}</span>
                <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': showLoginDropdown }" />
              </button>

              <!-- Dropdown Menu -->
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div v-if="showLoginDropdown" class="absolute top-full mt-3 w-64 bg-white dark:bg-[#0a1a0a] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden z-[110]" :class="locale === 'ar' ? 'left-0' : 'right-0'">
                  <NuxtLink 
                    to="/login" 
                    @click="showLoginDropdown = false"
                    class="flex items-center gap-4 px-6 py-5 hover:bg-green-500/5 transition-colors group border-b border-gray-50 dark:border-white/5"
                  >
                    <div class="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all">
                      <Store class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm font-black text-gray-900 dark:text-white">دخول التجار</p>
                      <p class="text-[10px] text-gray-500">إدارة متجرك وعملائك</p>
                    </div>
                  </NuxtLink>
                  
                  <NuxtLink 
                    to="/my/login" 
                    @click="showLoginDropdown = false"
                    class="flex items-center gap-4 px-6 py-5 hover:bg-green-500/5 transition-colors group"
                  >
                    <div class="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all">
                      <Users class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm font-black text-gray-900 dark:text-white">دخول العملاء</p>
                      <p class="text-[10px] text-gray-500">متابعة رصيدك وتوفيرك</p>
                    </div>
                  </NuxtLink>
                </div>
              </transition>
            </div>

            
            <button @click="isMenuOpen = !isMenuOpen" class="md:hidden p-2 text-gray-600 dark:text-gray-400">
              <Menu v-if="!isMenuOpen" class="w-6 h-6" />
              <X v-else class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="isMenuOpen" class="md:hidden bg-white dark:bg-[#020c02] border-t border-gray-100 dark:border-white/5 p-4 space-y-4 animate-fade-in">
        <NuxtLink 
          v-for="link in navLinks" 
          :key="link.to" 
          :to="link.to"
          @click="isMenuOpen = false"
          class="block px-4 py-2 text-lg font-bold text-gray-700 dark:text-gray-300"
        >
          {{ $t(link.nameKey) }}
        </NuxtLink>
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <NuxtLink 
            to="/login"
            @click="isMenuOpen = false"
            class="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm"
          >
            <Store class="w-6 h-6 text-green-500" />
            <span>دخول التجار</span>
          </NuxtLink>
          <NuxtLink 
            to="/my/login"
            @click="isMenuOpen = false"
            class="flex flex-col items-center gap-2 py-4 rounded-2xl bg-green-500 text-black font-bold text-sm"
          >
            <Users class="w-6 h-6" />
            <span>دخول العملاء</span>
          </NuxtLink>
        </div>

      </div>
    </nav>

    <!-- Page Content -->
    <main class="pt-20">
      <slot />
    </main>

    <TheFooter />
    <WhatsAppFloat />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
