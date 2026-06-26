<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

// SEO
const { t } = useI18n()
useHead({
  title: t('landing.faq.title') + ' | Tqdr Plus',
  meta: [
    { name: 'description', content: t('landing.faq.subtitle') }
  ]
})
</script>

<template>
  <div class="pt-10">
    <!-- Hero Header -->
    <section class="relative py-20 overflow-hidden bg-white dark:bg-[#020c02]">
      <!-- Background elements -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-green-500/5 rounded-full blur-[120px]" />
        <div class="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-green-500/10 rounded-full blur-[100px]" />
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-6 animate-fade-in">
          {{ $t('landing.faq.title') }}
        </span>
        <h1 class="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight animate-slide-up">
          {{ $t('landing.faq.subtitle') }}
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slide-up delay-100">
          {{ $t('landing.footer.description') }}
        </p>
      </div>
    </section>

    <!-- FAQ Component -->
    <SectionsTheFaq />

    <!-- CTA Section -->
    <section class="py-20 bg-gray-50 dark:bg-[#051105]">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-black text-gray-900 dark:text-white mb-6">{{ $t('landing.pricing.need_help') }}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-10 text-lg">
          {{ $t('landing.contact.subtitle') }}
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a
            href="https://wa.me/966550570751"
            target="_blank"
            class="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-green-500/20"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>{{ $t('landing.contact.whatsapp') }}</span>
          </a>
          <NuxtLink
            to="/#contact"
            class="px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-black rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-white/10"
          >
            {{ $t('landing.nav.contact') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
.animate-slide-up {
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.8s ease-out forwards;
}
.delay-100 {
  animation-delay: 0.1s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
