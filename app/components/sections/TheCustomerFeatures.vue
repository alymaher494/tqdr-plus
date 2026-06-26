<template>
  <section id="features" class="py-20 sm:py-28 bg-gray-50 dark:bg-[#020c02]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">

      <!-- Header -->
      <div class="text-center mb-14">
        <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
          {{ $t('landing.customer_features.badge') }}
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">{{ $t('landing.customer_features.title') }}</h2>
        <p class="text-gray-500 dark:text-gray-400 text-base max-w-lg mx-auto">
          {{ $t('landing.customer_features.subtitle') }}
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="feat in features"
          :key="feat.title"
          class="flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 hover:border-green-300 dark:hover:border-green-700/40 hover:shadow-lg dark:hover:shadow-green-900/10 transition-all duration-300 group"
        >
          <div class="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <component :is="feat.icon" class="w-6 h-6 text-green-500 dark:text-green-400" />
          </div>
          <div>
            <h3 class="text-lg font-black text-gray-900 dark:text-white mb-1.5">{{ feat.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{{ feat.desc }}</p>
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
  {
    title: t('landing.customer_features.features[0].title'),
    desc: t('landing.customer_features.features[0].desc'),
    icon: svgIcon(['M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z']),
  },
  {
    title: t('landing.customer_features.features[1].title'),
    desc: t('landing.customer_features.features[1].desc'),
    icon: svgIcon(['M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z']),
  },
  {
    title: t('landing.customer_features.features[2].title'),
    desc: t('landing.customer_features.features[2].desc'),
    icon: svgIcon(['M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z']),
  },
  {
    title: t('landing.customer_features.features[3].title'),
    desc: t('landing.customer_features.features[3].desc'),
    icon: svgIcon(['M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3']),
  },
])
</script>
