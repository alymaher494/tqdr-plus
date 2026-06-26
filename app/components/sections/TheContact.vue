<script setup lang="ts">
const form = reactive({ name: '', email: '', phone: '', message: '' })
const submitted = ref(false)
const loading = ref(false)

function handleSubmit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    submitted.value = true
  }, 1200)
}
</script>

<template>
  <section id="contact" class="py-20 sm:py-28 bg-gray-50 dark:bg-[#020c02] relative overflow-hidden">

    <!-- Glow -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -bottom-40 end-0 w-[500px] h-[500px] rounded-full bg-green-500/8 dark:bg-green-500/5 blur-[100px]" />
    </div>

    <div class="relative max-w-6xl mx-auto px-4 sm:px-6">

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

        <!-- Left: Info Panel (second in DOM → left in RTL) -->
        <div class="order-last lg:order-first">
          <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-5">
            {{ $t('landing.shop_features.badge') }}
          </span>
          <h2 class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
            {{ $t('landing.contact.title') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8">
            {{ $t('landing.contact.subtitle') }}
          </p>

          <div class="flex flex-col gap-4">
            <a
              href="tel:+966550570751"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 hover:border-green-300 dark:hover:border-green-700/50 transition-all group"
            >
              <div class="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-0.5">{{ $t('landing.contact.call_us') }}</p>
                <p class="font-bold text-gray-900 dark:text-white text-sm" dir="ltr">+966 55 057 0751</p>
              </div>
            </a>

            <a
              href="mailto:info@tqdr.com.sa"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 hover:border-green-300 dark:hover:border-green-700/50 transition-all group"
            >
              <div class="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-0.5">{{ $t('landing.contact.email_us') }}</p>
                <p class="font-bold text-gray-900 dark:text-white text-sm">info@tqdr.com.sa</p>
              </div>
            </a>

            <a
              href="https://wa.me/966550570751"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 hover:border-green-300 dark:hover:border-green-700/50 transition-all group"
            >
              <div class="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-0.5">{{ $t('landing.contact.whatsapp') }}</p>
                <p class="font-bold text-gray-900 dark:text-white text-sm" dir="ltr">+966 55 057 0751</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Right: Form (first in DOM → right in RTL) -->
        <div class="bg-white dark:bg-[#0a1a0a] rounded-3xl border border-gray-100 dark:border-green-900/20 p-6 sm:p-8 shadow-lg">

          <Transition name="fade" mode="out-in">
            <!-- Success State -->
            <div v-if="submitted" class="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div class="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 border-2 border-green-300 dark:border-green-500/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white">{{ $t('landing.contact.form.success') }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ $t('landing.contact.subtitle') }}</p>
              <button @click="submitted = false" class="mt-2 text-green-500 text-sm font-bold hover:text-green-400">
                {{ $t('landing.contact.form.send') }}
              </button>
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-4">
              <h3 class="text-xl font-black text-gray-900 dark:text-white mb-1">{{ $t('landing.contact.title') }}</h3>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ $t('landing.contact.form.name') }}</label>
                <input
                  v-model="form.name"
                  required
                  type="text"
                  :placeholder="$t('landing.contact.form.name')"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#030f03] border border-gray-200 dark:border-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:border-green-400 dark:focus:border-green-500 transition-colors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ $t('landing.contact.form.email') }}</label>
                <input
                  v-model="form.email"
                  required
                  type="email"
                  placeholder="example@domain.com"
                  dir="ltr"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#030f03] border border-gray-200 dark:border-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:border-green-400 dark:focus:border-green-500 transition-colors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ $t('customers.table.phone') }}</label>
                <input
                  v-model="form.phone"
                  required
                  type="tel"
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#030f03] border border-gray-200 dark:border-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:border-green-400 dark:focus:border-green-500 transition-colors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ $t('landing.contact.form.message') }}</label>
                <textarea
                  v-model="form.message"
                  rows="3"
                  :placeholder="$t('landing.contact.form.message')"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#030f03] border border-gray-200 dark:border-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:border-green-400 dark:focus:border-green-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-black text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-green-900/20 mt-1"
              >
                <span v-if="loading" class="flex items-center justify-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ $t('auth.logging_in') }}
                </span>
                <span v-else>{{ $t('landing.contact.form.send') }}</span>
              </button>
            </form>
          </Transition>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
