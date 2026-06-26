<script setup lang="ts">
const { locale } = useI18n()
</script>

<template>
  <footer class="bg-black border-t border-gray-900 text-gray-400">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

        <!-- Logo + Description -->
        <div class="lg:col-span-2 flex flex-col gap-5 max-w-sm">
          <div class="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" class="h-12 w-auto object-contain invert" />
          </div>
          <p class="text-sm leading-relaxed text-gray-500">
            {{ $t('landing.footer.description') }}
          </p>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <a
                href="https://wa.me/966550570751"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-[#25D366] hover:bg-green-500/20 text-xs font-bold transition-all"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {{ $t('landing.contact.form.send') }}
              </a>
            </div>

            <!-- Social Media Icons -->
            <div class="flex items-center gap-3">
              <a href="https://x.com/tqdrplus" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white/10 hover:border-gray-700 transition-colors" title="X">
                <svg class="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://instagram.com/tqdrplus" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-[#E1306C]/10 hover:border-gray-700 transition-colors" title="Instagram">
                <svg class="w-4 h-4 text-gray-400 hover:text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@tqdrplus" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-white/10 hover:border-gray-700 transition-colors" title="TikTok">
                <svg class="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.94-1.69-.22-.19-.42-.38-.62-.59v8.02c.01 2.22-.84 4.39-2.38 5.96-1.54 1.58-3.77 2.38-5.96 2.25-2.19-.13-4.24-1.11-5.55-2.82-1.31-1.71-1.74-3.93-1.38-6.09.36-2.16 1.71-4.04 3.62-5.02 1.91-.98 4.24-.98 6.15 0v4.23c-1.1-.56-2.43-.56-3.53 0-.74.38-1.27.97-1.43 1.74-.16.77.01 1.58.46 2.2.45.62 1.17.97 1.94 1.01.77.04 1.53-.24 2.05-.81.52-.57.81-1.31.81-2.07v-13.6zm0 0"/>
                </svg>
              </a>
              <a href="https://snapchat.com/add/tqdrplus" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-[#FFFC00]/10 hover:border-gray-700 transition-colors" title="Snapchat">
                <svg class="w-4 h-4 text-gray-400 hover:text-[#FFFC00]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4a3.5 3.5 0 0 0-3.5 3.5c0 .7.1 1.2.4 1.7-.1.4-.4.8-.8 1.1-.5.4-.8.9-.8 1.6 0 .9.7 1.6 1.6 1.6h.4c.2 0 .4.1.5.3.1.2 0 .5-.2.7-.3.6-.5 1.4-.5 2.2 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-.8-.2-1.6-.5-2.2-.2-.2-.3-.5-.2-.7.1-.2.3-.3.5-.3h.4c.9 0 1.6-.7 1.6-1.6 0-.7-.3-1.2-.8-1.6-.4-.3-.7-.7-.8-1.1.3-.5.4-1 .4-1.7A3.5 3.5 0 0 0 12 4z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="flex flex-col gap-5">
          <h3 class="text-white font-black text-sm">{{ $t('landing.footer.quick_links') }}</h3>
          <ul class="flex flex-col gap-3 text-sm">
            <li><NuxtLink to="/" class="hover:text-green-400 transition-colors">{{ $t('landing.nav.home') }}</NuxtLink></li>
            <li><NuxtLink to="/#features" class="hover:text-green-400 transition-colors">{{ $t('landing.nav.how_it_works') }}</NuxtLink></li>
            <li><NuxtLink to="/#shops" class="hover:text-green-400 transition-colors">{{ $t('landing.nav.features') }}</NuxtLink></li>
            <li><NuxtLink to="/faq" class="hover:text-green-400 transition-colors">{{ $t('landing.nav.faq') }}</NuxtLink></li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="flex flex-col gap-5">
          <h3 class="text-white font-black text-sm">{{ $t('landing.footer.contact_info') }}</h3>
          <ul class="flex flex-col gap-4 text-sm">
            <li>
              <a href="tel:+966550570751" class="group flex items-center gap-3 hover:text-green-400 transition-colors">
                <div class="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg class="w-4 h-4 text-gray-500 group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                  </svg>
                </div>
                <span dir="ltr" class="font-bold">+966 55 057 0751</span>
              </a>
            </li>
            <li>
              <a href="mailto:info@tqdr.com.sa" class="group flex items-center gap-3 hover:text-green-400 transition-colors">
                <div class="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg class="w-4 h-4 text-gray-500 group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                </div>
                <span class="font-bold">info@tqdr.com.sa</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
        <p>© 2026 {{ $t('landing.footer.rights') }}</p>
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{{ $t('landing.footer.status') }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
