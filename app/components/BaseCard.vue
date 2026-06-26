<template>
  <div class="glass-card rounded-[32px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 animate-slide-up">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
      <slot name="header" />
    </div>
    <div class="p-6">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5">
      <slot name="footer" />
    </div>
  </div>
</template>
