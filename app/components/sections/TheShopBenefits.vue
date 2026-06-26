<template>
  <section id="shops" class="py-20 sm:py-28 bg-gray-50 dark:bg-[#020c02] relative overflow-hidden">
    <!-- Glow -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-60 rounded-full bg-green-500/8 dark:bg-green-500/6 blur-[80px]" />
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="text-center mb-16 sm:mb-24">
        <h2 class="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
          {{ $t('landing.shop_benefits.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-lg font-bold">
          {{ $t('landing.shop_benefits.subtitle') }}
        </p>
      </div>

      <!-- Benefits Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div 
          v-for="(point, index) in points" 
          :key="index"
          class="flex items-start gap-5 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a1a0a] border border-gray-100 dark:border-green-900/20 shadow-sm hover:shadow-md dark:hover:shadow-green-900/10 transition-all duration-300 group"
        >
          <div class="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <component :is="point.icon" class="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-200 leading-relaxed pt-2">
            {{ point.text }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Users, Wallet, LayoutDashboard, CircleDollarSign } from 'lucide-vue-next'

const { t } = useI18n()

const points = computed(() => [
  {
    text: t('landing.shop_benefits.points[0]'),
    icon: Users
  },
  {
    text: t('landing.shop_benefits.points[1]'),
    icon: Wallet
  },
  {
    text: t('landing.shop_benefits.points[2]'),
    icon: LayoutDashboard
  },
  {
    text: t('landing.shop_benefits.points[3]'),
    icon: CircleDollarSign
  }
])
</script>
