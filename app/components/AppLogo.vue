<script setup lang="ts">
const isDark = useDark()

defineProps<{
  class?: string
  alt?: string
}>()

const logoSrc = computed(() => {
  return isDark.value ? '/logo-dark.png' : '/logo-light.png'
})
</script>

<template>
  <ClientOnly>
    <img :src="logoSrc" :alt="alt || 'تقدر بلس'" :class="$props.class" />
    <template #fallback>
      <img src="/logo-light.png" :alt="alt || 'تقدر بلس'" :class="$props.class" />
    </template>
  </ClientOnly>
</template>
