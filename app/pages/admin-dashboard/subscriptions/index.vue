<script setup lang="ts">
import { 
  Store, 
  Search, 
  CreditCard, 
  ChevronDown, 
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  X,
  ExternalLink
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { t, locale } = useI18n()
const client = useSupabaseClient()

const shops = ref([])
const loading = ref(false)
const searchQuery = ref('')
const expandedShop = ref<string | null>(null)
const shopOffers = ref<Record<string, any[]>>({})

const fetchShops = async () => {
  try {
    loading.value = true
    let query = client
      .from('profiles')
      .select('*')
      .eq('role', 'shop_owner')
      .order('created_at', { ascending: false })

    if (searchQuery.value) {
      query = query.or(`email.ilike.%${searchQuery.value}%,shop_name.ilike.%${searchQuery.value}%`)
    }

    const { data } = await query
    shops.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const toggleExpand = async (shopId: string) => {
  if (expandedShop.value === shopId) {
    expandedShop.value = null
    return
  }

  expandedShop.value = shopId
  if (!shopOffers.value[shopId]) {
    await fetchOffers(shopId)
  }
}

const fetchOffers = async (shopId: string) => {
  const { data } = await client
    .from('subscription_offers')
    .select('*')
    .eq('shop_owner_id', shopId)
  shopOffers.value[shopId] = data || []
}

const toggleSubscriptions = async (shop: any) => {
  try {
    const { error } = await client
      .from('profiles')
      .update({ subscriptions_enabled: !shop.subscriptions_enabled })
      .eq('id', shop.id)
    
    if (error) throw error
    shop.subscriptions_enabled = !shop.subscriptions_enabled
  } catch (e: any) {
    alert(e.message)
  }
}

const handleDeleteOffer = async (shopId: string, offerId: string) => {
  if (!confirm(t('dashboard.admin_stats.subscriptions_management.delete_confirm'))) return
  try {
    const { error } = await client
      .from('subscription_offers')
      .delete()
      .eq('id', offerId)
    
    if (error) throw error
    await fetchOffers(shopId)
  } catch (e: any) {
    alert(e.message)
  }
}

onMounted(fetchShops)
watch(searchQuery, fetchShops)
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.subscriptions_management.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('dashboard.admin_stats.subscriptions_management.subtitle') }}</p>
      </div>
      </div>
    </div>

    <!-- Search -->
    <BaseCard>
      <div class="relative">
        <Search :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          v-model="searchQuery"
          type="text" 
          :placeholder="$t('dashboard.admin_stats.subscriptions_management.search_placeholder')"
          :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
          class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white"
        />
      </div>
    </BaseCard>

    <!-- Shops List -->
    <div class="space-y-4">
      <BaseCard v-for="shop in shops" :key="shop.id" class="!p-0 overflow-hidden">
        <div 
          class="p-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="toggleExpand(shop.id)"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Store class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white">{{ shop.shop_name || $t('dashboard.admin_stats.subscriptions_management.shop_name_placeholder') }}</h3>
              <p class="text-xs text-slate-500">{{ shop.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-slate-500">{{ $t('dashboard.admin_stats.subscriptions_management.feature_status') }}</span>
              <button 
                @click.stop="toggleSubscriptions(shop)"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                :class="shop.subscriptions_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
              >
                <span 
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="shop.subscriptions_enabled ? (locale === 'ar' ? '-translate-x-6' : 'translate-x-6') : (locale === 'ar' ? '-translate-x-1' : 'translate-x-1')"
                />
              </button>
            </div>

            <div class="h-8 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block"></div>

            <button class="text-slate-400 hover:text-emerald-500 transition-colors">
              <component :is="expandedShop === shop.id ? ChevronUp : ChevronDown" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Expanded Content: Offers -->
        <div v-if="expandedShop === shop.id" class="border-t border-slate-100 dark:border-white/5 p-6 bg-slate-50/50 dark:bg-white/[0.02] animate-slide-down">
          <div class="flex items-center justify-between mb-6">
            <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-amber-500" />
              {{ $t('dashboard.admin_stats.subscriptions_management.current_offers') }} ({{ shopOffers[shop.id]?.length || 0 }})
            </h4>
            <NuxtLink :to="`/admin-dashboard/shops/${shop.id}`" class="text-xs text-emerald-500 font-bold hover:underline flex items-center gap-1">
              {{ $t('dashboard.admin_stats.subscriptions_management.view_shop_details') }} <ExternalLink class="w-3 h-3" />
            </NuxtLink>
          </div>

          <div v-if="shopOffers[shop.id]?.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="offer in shopOffers[shop.id]" :key="offer.id" class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative group">
              <div class="flex justify-between items-start mb-2">
                <h5 class="font-bold text-sm text-slate-900 dark:text-white">{{ offer.name }}</h5>
                <button 
                  @click="handleDeleteOffer(shop.id, offer.id)"
                  class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div class="flex justify-between items-end mt-4">
                <div>
                  <p class="text-[10px] text-slate-500">{{ $t('dashboard.admin_stats.subscriptions_management.price') }}: {{ offer.price }} {{ $t('common.currency') }}</p>
                  <p class="text-[10px] text-emerald-500 font-bold">{{ $t('dashboard.admin_stats.subscriptions_management.discount') }}: {{ offer.discount }} {{ $t('common.currency') }}</p>
                </div>
                <div class="text-right">
                  <span class="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">
                    {{ offer.duration }} {{ $t('dashboard.admin_stats.subscriptions_management.days') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-slate-400 text-sm italic">
            {{ $t('dashboard.admin_stats.subscriptions_management.no_offers') }}
          </div>
        </div>
      </BaseCard>

      <div v-if="shops.length === 0 && !loading" class="text-center py-20 text-slate-500">
        {{ $t('common.no_data') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
