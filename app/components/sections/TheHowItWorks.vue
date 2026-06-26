<template>
  <section id="how-it-works" class="py-20 sm:py-28 bg-white dark:bg-[#020c02] relative overflow-hidden">
    <!-- Glow Effect -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-60 rounded-full bg-green-500/5 dark:bg-green-500/5 blur-[100px]" />
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="text-center mb-16 sm:mb-24">
        <h2 class="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
          {{ $t('landing.how_it_works.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          {{ $t('landing.how_it_works.subtitle') }}
        </p>
      </div>

      <!-- Steps Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
        <!-- Connection Lines (Desktop) -->
        <div class="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-green-100 dark:via-green-900/30 to-transparent" />

        <div
          v-for="(step, index) in steps"
          :key="index"
          class="relative flex flex-col items-center text-center group"
        >
          <!-- Icon Container -->
          <div class="w-24 h-24 rounded-3xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-8 relative z-10 border border-green-100 dark:border-green-500/20 group-hover:scale-110 group-hover:bg-green-100 dark:group-hover:bg-green-500/20 transition-all duration-500">
            <component :is="step.icon" class="w-10 h-10 text-green-600 dark:text-green-400" />
            
            <!-- Step Number Badge -->
            <div class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
              {{ index + 1 }}
            </div>
          </div>

          <!-- Content -->
          <div class="px-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ step.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ step.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

function svgIcon(d: string) {
  return defineComponent({
    render: () => h('svg', { 
      xmlns: 'http://www.w3.org/2000/svg', 
      fill: 'none', 
      viewBox: '0 0 24 24', 
      stroke: 'currentColor', 
      'stroke-width': '1.5',
      class: 'w-full h-full'
    }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d })
    ])
  })
}

const { t } = useI18n()

const steps = computed(() => [
  {
    title: t('landing.how_it_works.steps[0].title'),
    desc: t('landing.how_it_works.steps[0].desc'),
    // Wallet/Payment icon
    icon: svgIcon('M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z')
  },
  {
    title: t('landing.how_it_works.steps[1].title'),
    desc: t('landing.how_it_works.steps[1].desc'),
    // Shop/Store icon
    icon: svgIcon('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z')
  },
  {
    title: t('landing.how_it_works.steps[2].title'),
    desc: t('landing.how_it_works.steps[2].desc'),
    // SMS/Message icon
    icon: svgIcon('M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z')
  }
])
</script>
