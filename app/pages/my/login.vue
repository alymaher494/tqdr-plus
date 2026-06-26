<script setup lang="ts">
import { Smartphone, Lock, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const phone = ref('')
const otpCode = ref('')
const step = ref(1) // 1: Phone, 2: OTP
const loading = ref(false)
const errorMsg = ref('')

const customerSession = useCookie('customer_id', { maxAge: 60 * 60 * 24 * 30 })

const handleSendOTP = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    await $fetch('/api/auth/otp-send', {
      method: 'POST',
      body: { phone: phone.value }
    })

    step.value = 2
  } catch (e: any) {
    errorMsg.value = e.data?.message || t('auth.customer_otp.error_send')

  } finally {
    loading.value = false
  }
}

const handleVerifyOTP = async () => {
  try {
    loading.value = true
    errorMsg.value = ''

    const res = await $fetch('/api/auth/otp-verify', {
      method: 'POST',
      body: { phone: phone.value, code: otpCode.value }
    })

    if (res.success) {
      customerSession.value = res.customerId
      navigateTo('/my', { replace: true })
    }
  } catch (e: any) {
    errorMsg.value = e.data?.message || t('auth.customer_otp.error_invalid')

  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Tajawal'] transition-colors duration-500">
    <!-- Decorative Elements -->
    <div class="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

    <div class="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div class="text-center mb-10">
        <div class="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
          <img src="/logo.png" alt="Logo" class="w-12 h-12 object-contain" />
        </div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-2">{{ $t('auth.customer_otp.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm">{{ $t('auth.customer_otp.subtitle') }}</p>
      </div>

      <div class="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-white/5">
        
        <!-- Step 1: Phone Entry -->
        <form v-if="step === 1" @submit.prevent="handleSendOTP" class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{{ $t('auth.customer_otp.phone_label') }}</label>
            <div class="relative group">
              <Smartphone class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                v-model="phone"
                type="tel" 
                required
                placeholder="05xxxxxxxx"
                class="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-2xl pr-12 pl-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
            </div>
          </div>

          <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl text-center">
            {{ errorMsg }}
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black py-5 rounded-[24px] text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            <span>{{ loading ? $t('auth.customer_otp.sending_code') : $t('auth.customer_otp.send_code') }}</span>
            <ArrowRight v-if="!loading" class="w-5 h-5" />
          </button>
        </form>

        <!-- Step 2: OTP Entry -->
        <form v-else @submit.prevent="handleVerifyOTP" class="space-y-6">
          <div class="space-y-2 text-center mb-4">
            <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare class="w-6 h-6" />
            </div>
            <p class="text-sm text-slate-500">{{ $t('auth.customer_otp.code_sent_to') }} <br/> <strong class="text-slate-900 dark:text-white">{{ phone }}</strong></p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 text-center block">{{ $t('auth.customer_otp.enter_code') }}</label>
            <input 
              v-model="otpCode"
              type="text" 
              required
              maxlength="4"
              placeholder="0000"
              class="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-2xl px-4 py-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-center text-4xl font-black tracking-[0.5em]"
            />
          </div>

          <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl text-center">
            {{ errorMsg }}
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-[24px] text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
            <span>{{ loading ? $t('auth.customer_otp.verifying') : $t('auth.customer_otp.confirm_login') }}</span>
          </button>

          <button 
            type="button"
            @click="step = 1; errorMsg = ''"
            class="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
          >
            {{ $t('auth.customer_otp.edit_phone') }}
          </button>
        </form>
      </div>

      <div class="mt-8 text-center flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
        <CheckCircle2 class="w-4 h-4 text-emerald-500" />
        {{ $t('auth.customer_otp.secure_system') }}
      </div>
    </div>
  </div>
</template>
