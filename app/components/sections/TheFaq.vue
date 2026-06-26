<script setup lang="ts">
const { t, tm, rt } = useI18n()
const openIndex = ref<number | null>(0)

const faqs = computed(() => {
  const questions = tm('landing.faq.questions')
  if (Array.isArray(questions)) {
    return questions.map((q: any) => ({
      q: typeof q.q === 'string' ? q.q : rt(q.q),
      a: typeof q.a === 'string' ? q.a : rt(q.a)
    }))
  }
  return []
})

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}
</script>

<template>
  <section id="faq" class="py-20 sm:py-28 bg-white dark:bg-[#030f03]">
    <div class="max-w-3xl mx-auto px-4 sm:px-6">

      <!-- Header -->
      <div class="text-center mb-12">
        <span class="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
          {{ $t('landing.faq.title') }}
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{{ $t('landing.faq.subtitle') }}</h2>
      </div>

      <!-- Accordion -->
      <div class="flex flex-col gap-3">
        <div
          v-for="(faq, i) in faqs"
          :key="i"
          class="rounded-2xl border overflow-hidden transition-all duration-200"
          :class="openIndex === i
            ? 'border-green-300 dark:border-green-700/50 shadow-md dark:shadow-green-900/10'
            : 'border-gray-100 dark:border-green-900/20'"
        >
          <!-- Question -->
          <button
            @click="toggle(i)"
            class="w-full flex items-center justify-between gap-4 px-6 py-4 text-start transition-colors duration-200"
            :class="openIndex === i
              ? 'bg-green-50 dark:bg-green-500/10'
              : 'bg-white dark:bg-[#0a1a0a] hover:bg-gray-50 dark:hover:bg-[#0d200d]'"
          >
            <span class="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{{ faq.q }}</span>
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
              :class="openIndex === i ? 'bg-green-500 rotate-45' : 'bg-gray-100 dark:bg-gray-800'"
            >
              <svg class="w-3.5 h-3.5 transition-colors" :class="openIndex === i ? 'text-black' : 'text-gray-500 dark:text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </button>

          <!-- Answer -->
          <Transition name="faq-slide">
            <div
              v-if="openIndex === i"
              class="px-6 pb-5 pt-1 bg-white dark:bg-[#0a1a0a] text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
            >
              {{ faq.a }}
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-slide-enter-active,
.faq-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.faq-slide-enter-from,
.faq-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.faq-slide-enter-to,
.faq-slide-leave-from {
  max-height: 200px;
  opacity: 1;
}
</style>
