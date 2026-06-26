<script setup lang="ts">
import { Languages, Sun, Moon } from 'lucide-vue-next'

const { locale, setLocale } = useI18n()
const isDark = useDark()
const toggleDark = useToggle(isDark)


const currentThemeIcon = computed(() => isDark.value ? Sun : Moon)

const toggleLanguage = () => {
  const nextLocale = locale.value === 'ar' ? 'en' : 'ar'
  setLocale(nextLocale)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Language Switcher -->
    <button 
      @click="toggleLanguage"
      class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all font-bold text-sm"
    >
      <Languages class="w-4 h-4" />
      <span>{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
    </button>

    <!-- Theme Switcher -->
    <ClientOnly>
      <button 
        @click="toggleDark()"
        class="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all flex items-center justify-center min-w-[40px] min-h-[40px]"
      >
        <component :is="currentThemeIcon" class="w-5 h-5" />
      </button>
      <template #fallback>
        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </template>
    </ClientOnly>
  </div>
</template>
