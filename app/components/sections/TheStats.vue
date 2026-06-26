<script setup lang="ts">
import { defineComponent, h } from 'vue'

const sectionRef = ref<HTMLElement | null>(null)
const started = ref(false)

const targets = { shops: 250, customers: 10000, savings: 1000000, cities: 5 }
const counts = reactive({ shops: 0, customers: 0, savings: 0, cities: 0 })

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

function animateNumber(key: keyof typeof targets, duration = 2200) {
  const target = targets[key]
  const start = Date.now()
  const timer = setInterval(() => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    counts[key] = Math.round(target * easeOutCubic(progress))
    if (progress >= 1) clearInterval(timer)
  }, 16)
}

useIntersectionObserver(sectionRef, ([entry]) => {
  if (entry.isIntersecting && !started.value) {
    started.value = true
    ;(Object.keys(targets) as (keyof typeof targets)[]).forEach(k => animateNumber(k))
  }
})

function fmt(key: keyof typeof targets): string {
  const v = counts[key]
  if (key === 'savings') return (v / 1000).toFixed(0) + 'K'
  if (key === 'customers') return v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(v)
  return String(v)
}

function svgIcon(d: string) {
  return defineComponent({
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' },
      [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d })])
  })
}

const { t } = useI18n()

const statsCards = computed(() => [
  { key: 'shops', label: t('landing.stats.partners'), icon: svgIcon('M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z') },
  { key: 'customers', label: t('landing.stats.customers'), icon: svgIcon('M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z') },
  { key: 'savings', label: t('landing.stats.savings'), icon: svgIcon('M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z') },
  { key: 'cities', label: t('landing.stats.cities'), icon: svgIcon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z') },
])
</script>

<template>
  <section ref="sectionRef" class="py-20 sm:py-28 bg-gray-50 dark:bg-[#020c02] relative overflow-hidden">

    <!-- Glow -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-60 rounded-full bg-green-500/8 dark:bg-green-500/6 blur-[80px]" />
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6">

      <!-- Header -->
      <div class="text-center mb-14">
        <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
          {{ $t('landing.stats.badge') }}
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{{ $t('landing.stats.title') }}</h2>
        <p class="text-gray-500 dark:text-gray-400 text-base mt-3">{{ $t('landing.stats.subtitle') }}</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="stat in statsCards"
          :key="stat.key"
          class="flex flex-col items-center gap-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 shadow-sm hover:shadow-md dark:hover:shadow-green-900/10 transition-all duration-300"
        >
          <div class="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-1">
            <component :is="stat.icon" class="w-6 h-6 text-green-500 dark:text-green-400" />
          </div>
          <div class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
            {{ fmt(stat.key as keyof typeof targets) }}+
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium text-center">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
