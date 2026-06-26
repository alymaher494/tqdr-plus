<template>
  <section id="shops" class="py-20 sm:py-28 bg-white dark:bg-[#030f03] relative overflow-hidden">

    <!-- Background accent -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -bottom-20 -start-20 w-80 h-80 rounded-full bg-green-500/6 dark:bg-green-500/5 blur-[80px]" />
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6">

      <!-- Header -->
      <div class="text-center mb-14">
        <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
          {{ $t('landing.shop_features.badge') }}
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">{{ $t('landing.shop_features.title') }}</h2>
        <p class="text-gray-500 dark:text-gray-400 text-base max-w-lg mx-auto">
          {{ $t('landing.shop_features.subtitle') }}
        </p>
      </div>

      <!-- Two-column layout: features list + visual card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        <!-- Features List -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="feat in features"
            :key="feat.title"
            class="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 hover:border-green-300 dark:hover:border-green-700/40 transition-all duration-200 group"
          >
            <div class="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <component :is="feat.icon" class="w-4 h-4 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <h3 class="font-black text-sm text-gray-900 dark:text-white mb-0.5">{{ feat.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ feat.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Card / Dashboard mockup -->
        <div class="flex justify-center">
          <div class="w-full max-w-sm rounded-3xl bg-gray-50 dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 p-6 shadow-xl">
            <div class="flex items-center justify-between mb-6">
              <h4 class="font-black text-gray-900 dark:text-white text-sm">{{ $t('landing.shop_features.dashboard') }}</h4>
              <span class="text-xs text-green-500 font-bold">● {{ $t('landing.shop_features.live') }}</span>
            </div>

            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-3 mb-5">
              <div v-for="stat in dashStats" :key="stat.label" class="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-black/30 border border-gray-100 dark:border-green-900/20">
                <span class="text-lg font-black text-green-500 dark:text-green-400">{{ stat.val }}</span>
                <span class="text-[10px] text-gray-400 text-center mt-0.5 leading-tight">{{ stat.label }}</span>
              </div>
            </div>

            <!-- Chart bars -->
            <div class="flex flex-col gap-2">
              <p class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{{ $t('landing.shop_features.revenue') }}</p>
              <div v-for="bar in chartBars" :key="bar.label" class="flex items-center gap-3">
                <span class="text-[10px] text-gray-400 w-6">{{ bar.label }}</span>
                <div class="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div class="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all duration-700" :style="{ width: bar.pct + '%' }" />
                </div>
                <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8">{{ bar.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

const { t, locale } = useI18n()

function svgIcon(paths: string[]) {
  return defineComponent({
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.5' },
      paths.map(d => h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d }))
    ),
  })
}

const features = computed(() => [
  { title: t('landing.shop_features.features[0].title'), desc: t('landing.shop_features.features[0].desc'), icon: svgIcon(['M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z']) },
  { title: t('landing.shop_features.features[1].title'), desc: t('landing.shop_features.features[1].desc'), icon: svgIcon(['M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6']) },
  { title: t('landing.shop_features.features[2].title'), desc: t('landing.shop_features.features[2].desc'), icon: svgIcon(['M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z']) },
  { title: t('landing.shop_features.features[3].title'), desc: t('landing.shop_features.features[3].desc'), icon: svgIcon(['M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z']) },
  { title: t('landing.shop_features.features[4].title'), desc: t('landing.shop_features.features[4].desc'), icon: svgIcon(['M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z']) },
  { title: t('landing.shop_features.features[5].title'), desc: t('landing.shop_features.features[5].desc'), icon: svgIcon(['M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3']) },
])

const dashStats = computed(() => [
  { val: '87', label: t('landing.stats.customers') },
  { val: '23%', label: locale.value === 'ar' ? 'نمو الشهر' : 'Month Growth' },
  { val: '4.8★', label: locale.value === 'ar' ? 'التقييم' : 'Rating' },
])

const chartBars = computed(() => [
  { label: locale.value === 'ar' ? 'يناير' : 'Jan', pct: 60 },
  { label: locale.value === 'ar' ? 'فبراير' : 'Feb', pct: 75 },
  { label: locale.value === 'ar' ? 'مارس' : 'Mar', pct: 90 },
  { label: locale.value === 'ar' ? 'أبريل' : 'Apr', pct: 85 },
])
</script>
