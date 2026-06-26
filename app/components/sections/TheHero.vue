<script setup lang="ts">
import { ChevronRight, ChevronLeft, Plus } from 'lucide-vue-next'

const { t } = useI18n()

const slides = computed(() => {
  const items = []
  for (let i = 0; i < 5; i++) {
    items.push({
      image: `/hero_${(i % 4) + 1}.png`, // Cycle through available hero images
      badge: t(`landing.hero.slides[${i}].badge`),
      title: t(`landing.hero.slides[${i}].title`),
      subtitle: t(`landing.hero.slides[${i}].subtitle`),
      ctaPrimary: t(`landing.hero.slides[${i}].cta_primary`),
      ctaSecondary: t(`landing.hero.slides[${i}].cta_secondary`)
    })
  }
  return items
})

const currentSlide = ref(0)

let timer: any = null

const startTimer = () => {
  timer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.value.length
  }, 3000)
}

const stopTimer = () => {
  if (timer) clearInterval(timer)
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <section id="home" class="relative min-h-[90vh] sm:min-h-screen flex items-center overflow-hidden bg-slate-900">
    
    <!-- Carousel Backgrounds -->
    <div class="absolute inset-0 z-0">
      <transition name="fade">
        <div 
          :key="currentSlide"
          class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          :style="{ backgroundImage: `url(${slides[currentSlide].image})` }"
        >
          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/70 dark:from-black/70 dark:via-black/50 dark:to-black/80 backdrop-blur-[2px]"></div>
        </div>
      </transition>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 w-full">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        <!-- ══ Content Side ══ -->
        <div class="flex flex-col gap-6 lg:gap-8 text-white">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentSlide" class="space-y-6">
              <!-- Badge -->
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold backdrop-blur-md">
                {{ slides[currentSlide].badge }}
              </div>

              <!-- Heading -->
              <h1 class="text-4xl sm:text-6xl font-black leading-snug sm:leading-normal drop-shadow-2xl">
                {{ slides[currentSlide].title }}
              </h1>

              <!-- Subtitle -->
              <p class="text-white/80 text-lg leading-relaxed max-w-lg font-medium">
                {{ slides[currentSlide].subtitle }}
              </p>

              <!-- CTAs Removed -->
            </div>
          </transition>

          <!-- Slide Indicators -->
          <div class="flex gap-2 mt-8">
            <button 
              v-for="(_, index) in slides" 
              :key="index"
              @click="currentSlide = index; stopTimer(); startTimer()"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="currentSlide === index ? 'w-8 bg-green-500' : 'w-2 bg-white/30 hover:bg-white/50'"
            ></button>
          </div>
        </div>

        <!-- ══ Phone Mockup (Retained from original) ══ -->
        <div class="flex justify-center items-center animate-float">
          <div class="relative scale-90 sm:scale-100">
            <!-- Glow -->
            <div class="absolute inset-10 rounded-[44px] bg-green-500/30 blur-[100px]" />

            <!-- Phone Frame -->
            <div class="relative w-72 h-[580px] bg-white rounded-[44px] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
              
              <!-- Screen Content -->
              <div class="absolute inset-0 pt-10 bg-slate-50 flex flex-col p-4 gap-4">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1">
                    <img src="/logo.png" alt="Logo" class="w-full h-auto" />
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-900">{{ $t('landing.hero.tqdr_plus') }}</p>
                    <p class="text-[8px] text-slate-500">{{ $t('landing.hero.smart_discount_system') }}</p>
                  </div>
                </div>
                
                <div class="bg-slate-900 rounded-3xl p-5 text-white space-y-4">
                  <p class="text-[10px] opacity-60">{{ $t('landing.hero.current_balance') }}</p>
                  <p class="text-3xl font-black">120.00 <span class="text-sm font-bold opacity-60">SAR</span></p>
                  <div class="pt-4 border-t border-white/10 flex justify-between">
                    <div>
                      <p class="text-[8px] opacity-60">{{ $t('landing.hero.total_savings') }}</p>
                      <p class="font-bold text-green-400 text-sm">40.80 SAR</p>
                    </div>
                    <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <ChevronRight class="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>

                <div class="flex-1 space-y-3">
                  <div v-for="n in 3" :key="n" class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <Plus class="w-4 h-4 text-green-500" />
                      </div>
                      <div class="space-y-1">
                        <div class="w-12 h-2 bg-slate-100 rounded-full"></div>
                        <div class="w-8 h-1.5 bg-slate-50 rounded-full"></div>
                      </div>
                    </div>
                    <span class="text-xs font-black text-green-600">+5.00</span>
                  </div>
                </div>

                <button class="w-full py-4 bg-green-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg shadow-green-500/20">
                  {{ $t('landing.hero.subscribe_now') }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.6s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
</style>
