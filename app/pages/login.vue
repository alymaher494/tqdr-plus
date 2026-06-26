<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t, locale } = useI18n()
const client = useSupabaseClient()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const showForgotModal = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)
const resetSuccess = ref(false)
const resetError = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    let loginEmail = email.value.trim()
    if (!loginEmail.includes('@')) {
      const cleanPhone = loginEmail.replace(/\D/g, '')
      if (cleanPhone) {
        loginEmail = `${cleanPhone}@tqdr.com`
      }
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: loginEmail,
      password: password.value
    })

    if (error) throw error

    if (!data.user?.id) {
      throw new Error('Authentication failed: No user ID returned')
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) {
      await client.auth.signOut()
      throw new Error(t('auth.no_profile_error'))
    }

    const role = profile.role

    if (role === 'admin') {
      return navigateTo('/admin-dashboard', { replace: true })
    } else if (role === 'shop_owner') {
      return navigateTo('/merchant', { replace: true })
    } else if (role === 'customer') {
      return navigateTo('/customers', { replace: true })
    } else {
      return navigateTo('/', { replace: true })
    }
  } catch (e: any) {
    errorMsg.value = e.message || t('auth.error')
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  try {
    resetLoading.value = true
    resetError.value = ''
    
    let resetLoginEmail = resetEmail.value.trim()
    if (!resetLoginEmail.includes('@')) {
      const cleanPhone = resetLoginEmail.replace(/\D/g, '')
      if (cleanPhone) {
        resetLoginEmail = `${cleanPhone}@tqdr.com`
      }
    }

    const { error } = await client.auth.resetPasswordForEmail(resetLoginEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error
    resetSuccess.value = true
  } catch (e: any) {
    resetError.value = e.message || t('auth.error')
  } finally {
    resetLoading.value = false
  }
}

const closeForgotModal = () => {
  showForgotModal.value = false
  resetEmail.value = ''
  resetSuccess.value = false
  resetError.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-['Tajawal'] transition-colors duration-500" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Background Glow Effects -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>

    <div class="absolute top-6 right-6 z-20">
      <ThemeLangSwitcher />
    </div>

    <div class="w-full max-w-md relative z-10 animate-slide-up">
      <!-- Logo Section - same style as customer login -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
          <img src="/logo.png" alt="Logo" class="w-12 h-12 object-contain" />
        </div>
        <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          {{ $t('brand.name') }} <span class="text-emerald-500">{{ $t('brand.suffix') }}</span>
        </h1>
        <p class="text-slate-500 dark:text-slate-400">{{ $t('brand.description') }}</p>
      </div>

      <!-- Login Card -->
      <div class="glass-card p-8 rounded-[40px]">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">{{ $t('auth.login') }}</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('auth.email_or_phone') }}</label>
            <input 
              v-model="email"
              type="text" 
              required
              class="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              :placeholder="$t('auth.email_or_phone_placeholder')"
            />
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('auth.password') }}</label>
            <input 
              v-model="password"
              type="password" 
              required
              class="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              placeholder="••••••••"
            />
          </div>

          <!-- Forgot Password Link -->
          <div class="text-end">
            <button 
              type="button"
              @click="showForgotModal = true"
              class="text-emerald-500 hover:text-emerald-600 text-sm font-bold transition-colors"
            >
              {{ $t('auth.forgot_password') }}
            </button>
          </div>

          <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-2xl animate-fade-in">
            {{ errorMsg }}
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-5 rounded-2xl transition-all transform active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
            <span>{{ loading ? $t('auth.logging_in') : $t('auth.login_btn') }}</span>
          </button>
        </form>

        <div class="mt-8 text-center text-slate-400 text-xs font-medium">
          {{ $t('auth.rights') }} &copy; {{ new Date().getFullYear() }} {{ $t('brand.name') }} {{ $t('brand.suffix') }}
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <div @click="closeForgotModal" class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-slide-up">
        <div class="p-8">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">{{ $t('auth.reset_password') }}</h3>
          <p class="text-slate-500 text-sm mb-6">أدخل رقم جوالك أو بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>

          <!-- Success State -->
          <div v-if="resetSuccess" class="text-center space-y-4 py-4">
            <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-slate-700 dark:text-slate-300 font-bold">{{ $t('auth.reset_email_sent') }}</p>
            <button @click="closeForgotModal" class="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all">
              {{ $t('auth.back_to_login') }}
            </button>
          </div>

          <!-- Form State -->
          <form v-else @submit.prevent="handleForgotPassword" class="space-y-4">
            <input 
              v-model="resetEmail"
              type="text"
              required
              class="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              :placeholder="$t('auth.email_or_phone_placeholder')"
            />

            <div v-if="resetError" class="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-2xl">
              {{ resetError }}
            </div>

            <button 
              type="submit"
              :disabled="resetLoading"
              class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              <span v-if="resetLoading" class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
              <span>{{ resetLoading ? $t('auth.sending_reset') : $t('auth.reset_send_btn') }}</span>
            </button>

            <button 
              type="button"
              @click="closeForgotModal"
              class="w-full text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors py-2"
            >
              {{ $t('auth.back_to_login') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.1); }
}
.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
