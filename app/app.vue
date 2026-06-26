<script setup lang="ts">
const { locale } = useI18n()
const isDark = useDark({
  initialValue: 'dark'
})


useHead({
  htmlAttrs: {
    lang: computed(() => locale.value),
    dir: computed(() => locale.value === 'ar' ? 'rtl' : 'ltr'),
  },
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
