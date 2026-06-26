<template>
  <div class="animate-pulse bg-slate-200 dark:bg-white/10" :class="roundedClass"></div>
</template>

<script setup lang="ts">
defineProps({
  roundedClass: {
    type: String,
    default: 'rounded-2xl'
  }
})
</script>
