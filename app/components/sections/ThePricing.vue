<script setup lang="ts">
import { Zap, Rocket, Crown, Building2, Star } from 'lucide-vue-next'

const { t } = useI18n()
const isYearly = ref(true)

const plans = computed(() => [
  {
    name: t('landing.pricing.plans.starter.name'),
    icon: Star,
    monthlyPrice: 70,
    yearlyPrice: 670,
    limit: t('landing.pricing.plans.starter.limit'),
    description: t('landing.pricing.plans.starter.description'),
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    name: t('landing.pricing.plans.growth.name'),
    icon: Zap,
    monthlyPrice: 199,
    yearlyPrice: 1900,
    limit: t('landing.pricing.plans.growth.limit'),
    description: t('landing.pricing.plans.growth.description'),
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    name: t('landing.pricing.plans.pro.name'),
    icon: Rocket,
    monthlyPrice: 399,
    yearlyPrice: 3800,
    limit: t('landing.pricing.plans.pro.limit'),
    description: t('landing.pricing.plans.pro.description'),
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    name: t('landing.pricing.plans.expansion.name'),
    icon: Crown,
    monthlyPrice: 899,
    yearlyPrice: 8649,
    limit: t('landing.pricing.plans.expansion.limit'),
    description: t('landing.pricing.plans.expansion.description'),
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  {
    name: t('landing.pricing.plans.enterprise.name'),
    icon: Building2,
    monthlyPrice: 1800,
    yearlyPrice: null,
    limit: t('landing.pricing.plans.enterprise.limit'),
    description: t('landing.pricing.plans.enterprise.description'),
    color: 'bg-slate-900',
    lightColor: 'bg-slate-100',
    textColor: 'text-slate-900',
    custom: true
  }
])
</script>

<template>
  <section id="pricing" class="py-24 bg-slate-50 dark:bg-[#020c02] relative overflow-hidden transition-colors duration-300">
    <!-- Decorative background elements -->
    <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-green-100/40 dark:bg-green-900/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="inline-block px-4 py-1.5 mb-4 text-sm font-bold tracking-wider text-green-600 dark:text-green-400 uppercase bg-green-100/50 dark:bg-green-500/10 rounded-full">
          {{ $t('landing.pricing.badge') }}
        </span>
        <h2 class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
          {{ $t('landing.pricing.title') }}
        </h2>
        <p class="text-lg text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
          {{ $t('landing.pricing.subtitle') }}
        </p>

        <!-- Toggle -->
        <div class="mt-12 flex items-center justify-center gap-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm p-2 rounded-2xl border border-white dark:border-white/10 w-fit mx-auto transition-colors">
          <button 
            @click="isYearly = false"
            :class="!isYearly ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'"
            class="px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300"
          >
            {{ $t('landing.pricing.monthly') }}
          </button>
          <button 
            @click="isYearly = true"
            :class="isYearly ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'"
            class="px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2"
          >
            {{ $t('landing.pricing.yearly') }}
            <span class="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">{{ $t('landing.pricing.save') }}</span>
          </button>
        </div>
      </div>

      <!-- Pricing Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div 
          v-for="(plan, index) in plans" 
          :key="plan.name"
          class="relative flex flex-col bg-white dark:bg-[#0a1a0a] rounded-[2rem] border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group"
          :class="plan.popular ? 'border-green-500 shadow-xl shadow-green-500/10 scale-105 z-20' : 'border-transparent dark:border-white/5 shadow-sm'"
        >
          <!-- Popular Badge -->
          <div v-if="plan.popular" class="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-slate-950 text-[11px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">
            {{ $t('landing.pricing.popular') }}
          </div>

          <div class="p-8 flex-1 flex flex-col">
            <!-- Icon & Name -->
            <div class="mb-8 flex items-center justify-between">
              <div :class="[plan.lightColor, plan.textColor]" class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner dark:bg-white/5">
                <component :is="plan.icon" class="w-7 h-7" />
              </div>
              <span class="text-[11px] font-black text-slate-300 dark:text-gray-600 uppercase tracking-widest">TQDR {{ index + 1 }}</span>
            </div>

            <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{{ plan.name }}</h3>
            
            <!-- Price -->
            <div class="mb-8 min-h-[80px] flex flex-col justify-end">
              <template v-if="plan.custom">
                <div class="flex items-baseline gap-1">
                  <span class="text-xl font-black text-slate-900 dark:text-white leading-tight">{{ $t('landing.pricing.starts_from') }} {{ plan.monthlyPrice }}</span>
                  <span class="text-xs font-bold text-slate-500 dark:text-gray-400">{{ $t('landing.pricing.per_month') }}</span>
                </div>
                <p class="text-xs text-slate-400 dark:text-gray-500 mt-2 font-bold">{{ $t('landing.pricing.custom_pricing') }}</p>
              </template>
              <template v-else>
                <div class="flex items-baseline gap-1">
                  <span class="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {{ isYearly ? plan.yearlyPrice.toLocaleString() : plan.monthlyPrice }}
                  </span>
                  <span class="text-sm font-bold text-slate-500 dark:text-gray-400">
                    {{ isYearly ? $t('landing.pricing.per_year') : $t('landing.pricing.per_month') }}
                  </span>
                </div>
                <p v-if="isYearly" class="text-xs text-green-600 dark:text-green-400 mt-2 font-black bg-green-50 dark:bg-green-500/10 w-fit px-2 py-1 rounded-lg">
                  {{ $t('landing.pricing.equivalent_to_monthly', { price: Math.floor(plan.yearlyPrice / 12) }) }}
                </p>
              </template>
            </div>

            <!-- Limit -->
            <div class="mb-6 py-4 px-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-colors">
              <p class="text-[14px] font-black text-slate-800 dark:text-gray-200 text-center">{{ plan.limit }}</p>
            </div>

            <!-- Description -->
            <p class="text-[14px] text-slate-500 dark:text-gray-400 leading-relaxed font-bold opacity-80">
              {{ plan.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-20 text-center bg-white/40 dark:bg-[#0a1a0a]/40 backdrop-blur-md p-8 rounded-[2rem] border border-white dark:border-white/5 max-w-2xl mx-auto shadow-sm">
        <p class="text-slate-600 dark:text-gray-400 text-sm font-bold flex items-center justify-center gap-2">
          <Building2 class="w-5 h-5 text-slate-400 dark:text-gray-500" />
          {{ $t('landing.pricing.need_help') }}
          <a href="#contact" class="text-green-600 dark:text-green-400 font-black hover:underline underline-offset-4 decoration-2">
            {{ $t('landing.pricing.contact_us') }}
          </a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Smooth transition for toggle */
.transform {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
