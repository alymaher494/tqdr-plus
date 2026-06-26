<script setup lang="ts">
// Define the layout for the landing page
definePageMeta({
  layout: 'landing'
})

onMounted(() => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active')
      }
    })
  }, observerOptions)

  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el)
  })
})
</script>

<template>
  <div>
    <SectionsTheHero />
    <div class="reveal"><SectionsTheHowItWorks /></div>
    <div class="reveal"><SectionsTheShopBenefits /></div>
    <div class="reveal"><SectionsTheCustomerFeatures /></div>
    <div class="reveal"><SectionsTheShopFeatures /></div>
    <div class="reveal"><SectionsThePricing /></div>

    <div class="reveal"><SectionsTheContact /></div>
  </div>
</template>
