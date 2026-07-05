import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  future: {
    compatibilityVersion: 4,
  },

  srcDir: 'app/',

  devtools: { enabled: true },
  devServer: {
    port: 3005
  },
  runtimeConfig: {
    smsUsername: process.env.SMS_USERNAME,
    smsPassword: process.env.SMS_PASSWORD,
    smsSender: process.env.SMS_SENDER,
    smsToken: process.env.SMS_TOKEN
  },

  routeRules: {
    '/merchant/**': { ssr: false },
    '/customers': { ssr: false },
    '/transactions': { ssr: false },
    '/admin-dashboard/**': { ssr: false }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    '@nuxtjs/supabase',
  ],

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ar', language: 'ar-SA', file: 'ar.json', name: 'العربية', dir: 'rtl' },
    ],
    defaultLocale: 'ar',
    langDir: 'locales',
    strategy: 'no_prefix',
    lazy: true,
  },

  supabase: {
    redirect: false
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      title: 'تقدر بلس | نظام الولاء والدفع المقدم للمتاجر السعودية',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'description', content: 'تقدر بلس هو أول نظام ولاء سعودي متكامل يتيح للمتاجر تقديم خدمة الدفع مقدماً والعروض والاشتراكات لعملائها. وفّر أكثر واكسب ثقة عملائك مع تقدر بلس.' },
        { name: 'theme-color', content: '#10b981' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'تقدر بلس | نظام الولاء والدفع المقدم للمتاجر السعودية' },
        { property: 'og:description', content: 'تقدر بلس هو أول نظام ولاء سعودي متكامل يتيح للمتاجر تقديم خدمة الدفع مقدماً والعروض والاشتراكات لعملائها.' },
        { property: 'og:locale', content: 'ar_SA' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'تقدر بلس | نظام الولاء والدفع المقدم' },
        { name: 'twitter:description', content: 'وفّر أكثر واكسب ثقة عملائك مع تقدر بلس - نظام الولاء السعودي المتكامل.' },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
        },
      ],
    },
  },
})