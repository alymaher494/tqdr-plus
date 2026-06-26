<script setup lang="ts">
import { 
  History, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { t, locale } = useI18n()
const client = useSupabaseClient()

const transactions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const filterType = ref('all') // all, deposit, withdrawal
const offerFilter = ref('all') // all, prepaid, or offer_id
const availableOffers = ref([])

// Pagination
const currentPage = ref(1)
const pageSize = 10
const totalTransactions = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalTransactions.value / pageSize)))

const displayedPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const offerMap = computed(() => {
  const map: Record<string, string> = {}
  availableOffers.value.forEach(o => {
    map[o.id] = o.name
  })
  return map
})

const fetchData = async () => {
  try {
    loading.value = true
    
    // 1. Fetch Offers for the filter
    const { data: offerData } = await client.from('subscription_offers').select('id, name')
    availableOffers.value = offerData || []

    // 2. Base Query
    let query = client
      .from('transactions')
      .select('*, customer:customers(name, mobile_number), shop:profiles!transactions_shop_owner_id_fkey(email, shop_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)

    // 3. Apply Filters
    if (filterType.value !== 'all') {
      query = query.eq('type', filterType.value)
    }

    if (offerFilter.value !== 'all') {
      if (offerFilter.value === 'prepaid') {
        query = query.is('offer_id', null)
      } else {
        query = query.eq('offer_id', offerFilter.value)
      }
    }

    if (searchQuery.value) {
      // Search in customer name or shop name
      // Note: Full-text search across joins is complex in Supabase, 
      // but for simplicity we'll search by note or customer name if possible
      query = query.or(`note.ilike.%${searchQuery.value}%`)
    }

    const { data, count } = await query
    transactions.value = data || []
    totalTransactions.value = count || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch([filterType, offerFilter, searchQuery], () => {
  currentPage.value = 1
  fetchData()
})
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <History class="w-8 h-8 text-emerald-500" />
          <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.reports.title') }}</h1>
        </div>
        <p class="text-slate-500 dark:text-slate-400">{{ $t('dashboard.admin_stats.reports.subtitle') }}</p>
      </div>
      
    </div>

    <!-- Filters Row -->
    <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
      <div class="flex-1 relative group">
        <Search :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
        <input 
          v-model="searchQuery"
          type="text" 
          :placeholder="$t('dashboard.admin_stats.reports.search_placeholder')"
          :class="locale === 'ar' ? 'pr-12' : 'pl-12'"
          class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white"
        />
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Offer Filter -->
        <div class="relative min-w-[200px]">
          <select 
            v-model="offerFilter"
            class="w-full bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-slate-300 focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="all">{{ $t('dashboard.admin_stats.reports.all_offers') }}</option>
            <option value="prepaid">{{ $t('dashboard.admin_stats.reports.prepaid_only') }}</option>
            <option v-for="offer in availableOffers" :key="offer.id" :value="offer.id">
              {{ offer.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <ChevronDown class="w-4 h-4" />
          </div>
        </div>

        <select 
          v-model="filterType"
          class="bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-slate-300 focus:ring-0 appearance-none min-w-[140px]"
        >
          <option value="all">{{ $t('dashboard.admin_stats.reports.all_types') }}</option>
          <option value="deposit">{{ $t('dashboard.admin_stats.reports.deposit_only') }}</option>
          <option value="withdrawal">{{ $t('dashboard.admin_stats.reports.withdrawal_only') }}</option>
        </select>
      </div>
    </div>

    <!-- Global Transactions Table -->
    <BaseCard class="!p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full" :class="locale === 'ar' ? 'text-right' : 'text-left'">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.reports.table.shop') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.reports.table.customer') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.reports.table.type') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.reports.table.amount') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.reports.table.date') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                <div class="font-bold text-slate-900 dark:text-white">{{ tx.shop?.shop_name || tx.shop?.email }}</div>
                <div class="text-[10px] text-slate-400">ID: {{ tx.shop_owner_id.split('-')[0] }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                {{ tx.customer?.name || $t('common.no_data') }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="p-1 rounded-lg">
                    <component :is="tx.type === 'deposit' ? ArrowUpRight : ArrowDownRight" class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                    {{ tx.type === 'deposit' ? $t('dashboard.merchant_stats.deposit') : $t('dashboard.merchant_stats.withdrawal') }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-lg font-black" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                    {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }}
                  </span>
                  <span v-if="tx.offer_id" class="text-[10px] text-slate-400 font-bold">
                    ({{ offerMap[tx.offer_id] || $t('common.loading') }})
                  </span>
                  <span v-else class="text-[10px] text-slate-400 font-bold">
                    ({{ $t('dashboard.admin_stats.reports.table.prepaid') }})
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ new Date(tx.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') }}
              </td>
            </tr>
            <tr v-if="transactions.length === 0 && !loading">
              <td colspan="5" class="px-6 py-20 text-center text-slate-500">
                <Activity class="w-16 h-16 mx-auto mb-4 opacity-10" />
                {{ $t('common.no_data') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
      <p class="text-sm text-slate-500 font-bold">
        {{ $t('common.showing') }} 
        <span class="text-slate-900 dark:text-white">{{ (currentPage - 1) * pageSize + 1 }}</span>
        -
        <span class="text-slate-900 dark:text-white">{{ Math.min(currentPage * pageSize, totalTransactions) }}</span>
        {{ $t('common.of') }}
        <span class="text-slate-900 dark:text-white">{{ totalTransactions }}</span>
      </p>
      
      <div class="flex items-center gap-1">
        <!-- First -->
        <button @click="currentPage = 1; fetchData()" :disabled="currentPage === 1" 
          class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
          <ChevronsRight v-if="locale === 'ar'" class="w-5 h-5" />
          <ChevronsLeft v-else class="w-5 h-5" />
        </button>
        
        <!-- Prev -->
        <button @click="currentPage--; fetchData()" :disabled="currentPage === 1" 
          class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
          <ChevronRight v-if="locale === 'ar'" class="w-5 h-5" />
          <ChevronLeft v-else class="w-5 h-5" />
        </button>

        <!-- Numbers -->
        <div class="flex items-center gap-1 mx-2">
          <button v-for="p in displayedPages" :key="p" 
            @click="currentPage = p; fetchData()"
            class="w-10 h-10 rounded-xl font-black text-sm transition-all"
            :class="currentPage === p ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'"
          >
            {{ p }}
          </button>
        </div>

        <!-- Next -->
        <button @click="currentPage++; fetchData()" :disabled="currentPage === totalPages" 
          class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
          <ChevronLeft v-if="locale === 'ar'" class="w-5 h-5" />
          <ChevronRight v-else class="w-5 h-5" />
        </button>

        <!-- Last -->
        <button @click="currentPage = totalPages; fetchData()" :disabled="currentPage === totalPages" 
          class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
          <ChevronsLeft v-if="locale === 'ar'" class="w-5 h-5" />
          <ChevronsRight v-else class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
