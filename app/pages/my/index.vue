<script setup lang="ts">
import { 
  Wallet, 
  TrendingUp, 
  History, 
  LogOut, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Star,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Activity,
  RefreshCw
} from 'lucide-vue-next'

const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

definePageMeta({
  layout: false
})

const client = useSupabaseClient()
const customerId = useCookie('customer_id')

if (!customerId.value) {
  navigateTo('/my/login')
}

const customer = ref(null)
const shop = ref(null)
const transactions = ref([])
const subscriptions = ref([])
const loading = ref(true)
const currentTab = ref('home') // 'home', 'transactions', 'offers'

const fetchData = async () => {
  try {
    loading.value = true
    
    const res = await $fetch('/api/customer/data')
    customer.value = res.customer
    shop.value = res.shop
    transactions.value = res.transactions
    subscriptions.value = res.subscriptions

  } catch (e) {
    console.error(e)
    customerId.value = null
    navigateTo('/my/login')
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  customerId.value = null
  navigateTo('/my/login')
}

// Computed: active subscriptions only
const activeSubscriptions = computed(() => 
  subscriptions.value.filter(s => s.is_active)
)

// Computed: savings chart data (from prepaid transactions)
const savingsChartData = computed(() => {
  const last7 = [...transactions.value]
    .filter(tx => tx.type === 'withdrawal')
    .slice(0, 7)
    .reverse()
  return {
    categories: last7.map(tx => 
      new Date(tx.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
    ),
    data: last7.map(tx => Number(tx.amount) || 0)
  }
})

const savingsChart = computed(() => ({
  series: [{ name: 'المسحوبات', data: savingsChartData.value.data }],
  options: {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Tajawal, sans-serif' },
    colors: ['#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: savingsChartData.value.categories,
      labels: { style: { colors: '#94a3b8', fontSize: '10px' } }
    },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' }
  }
}))

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Tajawal'] text-slate-900 dark:text-white pb-24" dir="rtl">
    <div v-if="loading" class="space-y-8 pb-20">
      <!-- Skeleton Header -->
      <div class="bg-slate-900 px-6 pt-16 pb-12 rounded-b-[60px] space-y-10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-5">
            <Skeleton roundedClass="rounded-2xl w-16 h-16" />
            <div class="space-y-2">
              <Skeleton roundedClass="rounded w-24 h-4" />
              <Skeleton roundedClass="rounded w-48 h-8" />
            </div>
          </div>
          <Skeleton roundedClass="rounded-2xl w-12 h-12" />
        </div>
        <Skeleton roundedClass="rounded-[40px] w-full h-48" />
      </div>
      
      <!-- Skeleton Content -->
      <div class="px-6 space-y-8">
        <Skeleton roundedClass="rounded-[40px] w-full h-32" />
        <Skeleton roundedClass="rounded-[32px] w-full h-20" />
        <div class="space-y-4">
          <Skeleton roundedClass="rounded w-32 h-6" />
          <div class="space-y-4">
            <Skeleton v-for="i in 3" :key="i" roundedClass="rounded-[35px] w-full h-24" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Header / Profile Section -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 px-6 pt-16 pb-12 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute top-1/2 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 flex items-center justify-between mb-10">
          <div class="flex items-center gap-5">
            <div class="relative">
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 rotate-3">
                <Star class="w-8 h-8 fill-white/20" />
              </div>
              <div class="absolute -bottom-1 -left-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-950 border-2 border-slate-900 shadow-lg">
                <Sparkles class="w-3 h-3" />
              </div>
            </div>
            <div>
              <p class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">{{ $t('dashboard.customer_stats.welcome_back') }}</p>
              <h1 class="text-3xl font-black text-white leading-tight">{{ customer?.name }}</h1>
            </div>
          </div>
          <button @click="handleLogout" class="w-12 h-12 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all duration-300 backdrop-blur-md">
            <LogOut class="w-6 h-6" />
          </button>
        </div>

        <!-- Featured Savings Card (Prominent) - HOME TAB -->
        <div v-if="currentTab === 'home'" class="bg-white/10 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp class="w-32 h-32 text-white -mr-8 -mt-8 rotate-12" />
          </div>
          
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp class="w-4 h-4 text-slate-950" />
              </div>
              <p class="text-sm font-bold text-emerald-400">{{ $t('dashboard.customer_stats.total_saved') }}</p>
            </div>
            <div class="flex items-baseline gap-2">
              <h2 class="text-6xl font-black text-white tracking-tighter">{{ customer?.total_saved || 0 }}</h2>
              <span class="text-2xl font-bold text-white/50">{{ $t('common.currency') }}</span>
            </div>
            <p class="text-xs text-white/40 mt-4 font-medium">{{ $t('dashboard.customer_stats.savings_desc') }}</p>
          </div>
        </div>
      </div>

      <div class="px-6 -mt-8 space-y-8">
        <!-- HOME TAB -->
        <template v-if="currentTab === 'home'">
          <!-- Balance Card -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:scale-[1.02] transition-all duration-500">
            <div>
              <div class="flex items-center gap-2 mb-2 text-slate-400">
                <Wallet class="w-4 h-4" />
                <p class="text-xs font-black uppercase tracking-widest">{{ $t('dashboard.customer_stats.current_balance') }}</p>
              </div>
              <div class="flex items-baseline gap-2">
                <h3 class="text-5xl font-black text-emerald-500 tracking-tighter">{{ customer?.balance }}</h3>
                <span class="text-xl font-bold text-slate-300">{{ $t('common.currency') }}</span>
              </div>
            </div>
            <div class="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform duration-500">
              <Wallet class="w-10 h-10" />
            </div>
          </div>

          <!-- Shop Info -->
          <div class="bg-slate-100 dark:bg-white/5 p-6 rounded-[32px] flex items-center justify-between border border-transparent hover:border-emerald-500/20 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                <ShoppingBag class="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ $t('dashboard.customer_stats.current_shop') }}</p>
                <h4 class="text-lg font-black text-slate-900 dark:text-white">{{ shop?.shop_name || 'Tqdr Plus' }}</h4>
              </div>
            </div>
            <div class="text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full text-[10px] font-black">{{ $t('dashboard.customer_stats.premium_customer') }}</div>
          </div>

          <!-- Active Subscriptions Summary -->
          <div v-if="activeSubscriptions.length > 0" class="space-y-3">
            <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard class="w-5 h-5 text-amber-500" />
              {{ $t('dashboard.customer_stats.active_subscriptions') }}
              <span class="bg-amber-500/10 text-amber-500 text-xs font-black px-2 py-0.5 rounded-full">{{ activeSubscriptions.length }}</span>
            </h3>
            <div v-for="sub in activeSubscriptions.slice(0, 2)" :key="sub.id" 
              class="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles class="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p class="font-black text-slate-900 dark:text-white text-sm">{{ sub.offer?.name }}</p>
                  <p class="text-[10px] text-slate-400">{{ sub.shop?.shop_name }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-black text-emerald-500">{{ sub.remaining_uses }} مرة</p>
                <p class="text-[10px] text-slate-400">{{ sub.days_left }} يوم</p>
              </div>
            </div>
          </div>

          <!-- Recent Transactions (last 3) -->
          <div v-if="transactions.length > 0" class="space-y-3">
            <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History class="w-5 h-5 text-slate-400" />
              {{ $t('dashboard.customer_stats.recent_transactions') }}
            </h3>
            <div v-for="tx in transactions.slice(0, 3)" :key="tx.id"
              class="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-3">
                <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                  <component :is="tx.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-5 h-5" />
                </div>
                <div>
                  <p class="font-black text-slate-900 dark:text-white text-sm">
                    {{ tx.type === 'deposit' ? $t('dashboard.customer_stats.deposit') : $t('dashboard.customer_stats.withdraw') }}
                  </p>
                  <p class="text-[10px] text-slate-400">{{ tx.shop?.shop_name || shop?.shop_name }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-black text-sm" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                  {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }} {{ $t('common.currency') }}
                </p>
                <p class="text-[10px] text-slate-400">{{ tx.balance_after }} {{ $t('common.currency') }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- TRANSACTIONS TAB - Detailed Table -->
        <div v-if="currentTab === 'transactions'" class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <History class="w-6 h-6 text-slate-400" /> {{ $t('dashboard.customer_stats.recent_transactions') }}
            </h3>
          </div>
          
          <div v-if="transactions.length === 0" class="bg-white dark:bg-slate-900 p-12 rounded-[40px] text-center border border-dashed border-slate-200 dark:border-white/10">
            <p class="text-slate-400 font-bold italic">{{ $t('dashboard.customer_stats.no_transactions') }}</p>
          </div>

          <!-- Detailed Transaction Table -->
          <div v-else class="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
            <div class="overflow-x-auto">
              <table class="w-full text-right">
                <thead>
                  <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <th class="px-4 py-4 text-xs font-black text-slate-500 uppercase">النوع</th>
                    <th class="px-4 py-4 text-xs font-black text-slate-500 uppercase">المبلغ</th>
                    <th class="px-4 py-4 text-xs font-black text-slate-500 uppercase">الرصيد</th>
                    <th class="px-4 py-4 text-xs font-black text-slate-500 uppercase">المحل</th>
                    <th class="px-4 py-4 text-xs font-black text-slate-500 uppercase">التاريخ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                  <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="w-8 h-8 rounded-xl flex items-center justify-center">
                          <component :is="tx.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-4 h-4" />
                        </div>
                        <div>
                          <p class="text-xs font-black" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                            {{ tx.type === 'deposit' ? $t('dashboard.customer_stats.deposit') : $t('dashboard.customer_stats.withdraw') }}
                          </p>
                          <p class="text-[9px] text-slate-400">{{ $t('dashboard.customer_stats.prepaid_service') }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <p class="font-black text-sm" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                        {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }}
                      </p>
                      <p class="text-[9px] text-slate-400">{{ $t('common.currency') }}</p>
                    </td>
                    <td class="px-4 py-4">
                      <p class="font-black text-slate-900 dark:text-white text-sm">{{ tx.balance_after }}</p>
                      <p class="text-[9px] text-slate-400">{{ $t('common.currency') }}</p>
                    </td>
                    <td class="px-4 py-4">
                      <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ tx.shop?.shop_name || shop?.shop_name || '-' }}</p>
                    </td>
                    <td class="px-4 py-4">
                      <p class="text-xs text-slate-500">{{ new Date(tx.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) }}</p>
                      <p class="text-[9px] text-slate-400">{{ new Date(tx.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- OFFERS TAB - Enhanced Subscriptions -->
        <div v-if="currentTab === 'offers'" class="space-y-6">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <CreditCard class="w-6 h-6 text-amber-500" /> {{ $t('dashboard.customer_stats.active_subscriptions') }}
            </h3>
            <span class="text-xs font-bold text-slate-400">{{ $t('dashboard.customer_stats.subscription_count', { count: activeSubscriptions.length }) }}</span>
          </div>
          
          <div v-if="subscriptions.length === 0" class="bg-white dark:bg-slate-900 p-12 rounded-[40px] text-center border border-dashed border-slate-200 dark:border-white/10">
            <p class="text-slate-400 font-bold italic">{{ $t('dashboard.customer_stats.no_subscriptions') }}</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="sub in subscriptions" :key="sub.id" 
              class="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-lg overflow-hidden">
              
              <!-- Status Bar -->
              <div class="h-1.5 w-full" :class="sub.is_active ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-slate-200 dark:bg-white/10'"></div>
              
              <div class="p-6">
                <!-- Header -->
                <div class="flex justify-between items-start mb-5">
                  <div class="flex items-center gap-3">
                    <div :class="sub.is_active ? 'bg-amber-500/10' : 'bg-slate-100 dark:bg-white/5'" class="w-12 h-12 rounded-2xl flex items-center justify-center">
                      <Sparkles class="w-6 h-6" :class="sub.is_active ? 'text-amber-500' : 'text-slate-400'" />
                    </div>
                    <div>
                      <h4 class="text-lg font-black text-slate-900 dark:text-white">{{ sub.offer?.name }}</h4>
                      <div class="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Building2 class="w-3 h-3" />
                        <span>{{ sub.shop?.shop_name }}</span>
                      </div>
                    </div>
                  </div>
                  <div :class="sub.is_active ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 ring-slate-200'"
                    class="px-3 py-1.5 rounded-full text-[10px] font-black ring-1">
                    {{ sub.is_active ? $t('dashboard.customer_stats.active_now') : $t('dashboard.customer_stats.offer_expired') }}
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-3 mb-4">
                  <!-- Remaining Uses -->
                  <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">{{ $t('dashboard.customer_stats.remaining_uses') }}</p>
                    <p class="text-2xl font-black" :class="sub.remaining_uses > 0 ? 'text-emerald-500' : 'text-red-500'">{{ sub.remaining_uses }}</p>
                    <p class="text-[9px] text-slate-400">/ {{ sub.offer?.usage_limit }}</p>
                  </div>
                  <!-- Days Left -->
                  <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">{{ $t('dashboard.customer_stats.remaining_days') }}</p>
                    <p class="text-2xl font-black" :class="sub.days_left > 7 ? 'text-blue-500' : sub.days_left > 0 ? 'text-amber-500' : 'text-red-500'">{{ sub.days_left }}</p>
                    <p class="text-[9px] text-slate-400">يوم</p>
                  </div>
                  <!-- Used Count -->
                  <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">المستخدمة</p>
                    <p class="text-2xl font-black text-slate-700 dark:text-slate-300">{{ sub.used_count || 0 }}</p>
                    <p class="text-[9px] text-slate-400">مرة</p>
                  </div>
                </div>

                <!-- Progress Bar for remaining uses -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>الاستخدام</span>
                    <span>{{ sub.used_count || 0 }} / {{ sub.offer?.usage_limit }}</span>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all duration-500"
                      :class="sub.remaining_uses > 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-red-400'"
                      :style="{ width: `${Math.min(100, ((sub.used_count || 0) / (sub.offer?.usage_limit || 1)) * 100)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Expiry Date -->
                <div class="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Calendar class="w-3.5 h-3.5 text-amber-500" />
                  <span>{{ $t('transactions.date') }}: {{ new Date(sub.expires_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <div class="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div class="max-w-md mx-auto bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-2xl p-3 rounded-[35px] border border-white/10 flex items-center justify-around shadow-2xl pointer-events-auto">
          <button 
            @click="currentTab = 'home'"
            :class="currentTab === 'home' ? 'text-emerald-500' : 'text-slate-400 hover:text-white'"
            class="flex flex-col items-center gap-1.5 p-2 min-w-[70px] relative transition-colors"
          >
            <div v-if="currentTab === 'home'" class="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full"></div>
            <Star class="w-6 h-6" :class="currentTab === 'home' ? 'fill-emerald-500/20' : ''" />
            <span class="text-[9px] font-black uppercase tracking-widest">{{ $t('dashboard.customer_stats.home') }}</span>
          </button>
          <button 
            @click="currentTab = 'transactions'"
            :class="currentTab === 'transactions' ? 'text-emerald-500' : 'text-slate-400 hover:text-white'"
            class="flex flex-col items-center gap-1.5 p-2 min-w-[70px] relative transition-colors"
          >
            <div v-if="currentTab === 'transactions'" class="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full"></div>
            <History class="w-6 h-6" />
            <span class="text-[9px] font-black uppercase tracking-widest">{{ $t('dashboard.customer_stats.transactions') }}</span>
          </button>
          <button 
            @click="currentTab = 'offers'"
            :class="currentTab === 'offers' ? 'text-emerald-500' : 'text-slate-400 hover:text-white'"
            class="flex flex-col items-center gap-1.5 p-2 min-w-[70px] relative transition-colors"
          >
            <div v-if="currentTab === 'offers'" class="absolute -top-1 w-1 h-1 bg-emerald-500 rounded-full"></div>
            <CreditCard class="w-6 h-6" />
            <span class="text-[9px] font-black uppercase tracking-widest">{{ $t('dashboard.customer_stats.offers') }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.6s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
