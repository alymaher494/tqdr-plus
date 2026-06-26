<script setup lang="ts">
import { 
  Users, 
  Wallet, 
  Activity, 
  ArrowUpRight,
  Plus,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-vue-next'

const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

definePageMeta({
  layout: 'merchant'
})

const { t, locale } = useI18n()
const client = useSupabaseClient()
const user = useSupabaseUser()

// Basic Stats
const stats = computed(() => [
  { label: t('dashboard.merchant_stats.total_customers'), value: '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: t('dashboard.merchant_stats.total_balances'), value: '0', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: t('dashboard.merchant_stats.today_deposits'), value: '0', icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: t('dashboard.merchant_stats.today_withdrawals'), value: '0', icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
])

const displayStats = ref([
  { value: '0' },
  { value: '0' },
  { value: '0' },
  { value: '0' },
])

const recentTransactions = ref([])
const availableOffers = ref([])
const profile = ref(null)
const txFilter = ref('all')
const offerStats = ref([])
const loading = ref(true)

const isSuspended = computed(() => profile.value?.status === 'suspended')

const filteredTransactions = computed(() => {
  // Only show prepaid withdrawals (no offer_id) and deposits - never subscription-related deductions
  const prepaidOnly = recentTransactions.value.filter(tx => !tx.offer_id)
  if (txFilter.value === 'all') return prepaidOnly.slice(0, 4)
  if (txFilter.value === 'prepaid') return prepaidOnly.slice(0, 4)
  return prepaidOnly.slice(0, 4)
})

// Chart Data
const customerChart = computed(() => ({
  series: customerSeries.value,
  options: {
    labels: [t('dashboard.merchant_stats.prepaid_only'), ...offerNames.value],
    colors: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'],
    chart: { type: 'donut', fontFamily: 'Tajawal, sans-serif' },
    plotOptions: { pie: { donut: { size: '75%' } } },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
    dataLabels: { enabled: false },
    stroke: { show: false }
  }
}))

const customerSeries = ref([])
const offerNames = ref([])

const balanceChart = computed(() => ({
  series: [{ name: t('dashboard.merchant_stats.balance'), data: balanceSeries.value }],
  options: {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Tajawal, sans-serif' },
    colors: ['#10b981'],
    plotOptions: { bar: { borderRadius: 12, columnWidth: '50%', distributed: true } },
    xaxis: { 
      categories: [t('dashboard.merchant_stats.prepaid_only'), ...offerNames.value],
      labels: { style: { colors: '#94a3b8', fontWeight: 600 } }
    },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    legend: { show: false },
    dataLabels: { 
      enabled: true,
      formatter: (val) => val.toLocaleString() + ' ' + t('common.currency'),
      offsetY: -20,
      style: { fontSize: '12px', colors: ["#304758"] }
    }
  }
}))

const balanceSeries = ref([])

const activityChart = computed(() => ({
  series: [
    { name: t('dashboard.merchant_stats.deposit'), data: depositData.value },
    { name: t('dashboard.merchant_stats.withdrawal'), data: withdrawalData.value }
  ],
  options: {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Tajawal, sans-serif' },
    colors: ['#10b981', '#ef4444'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 4 },
    xaxis: { 
      categories: chartDays.value,
      labels: { style: { colors: '#94a3b8' } }
    },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    legend: { position: 'top', labels: { colors: '#94a3b8' } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1 } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
  }
}))

const depositData = ref([])
const withdrawalData = ref([])
const chartDays = ref([])

const fetchDashboardData = async () => {
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return
  
  try {
    loading.value = true
    
    // 0. Fetch Profile
    const { data: profileData } = await client
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()
    profile.value = profileData

    // 1. Fetch Basic Totals
    const { count: customersCount } = await client
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('shop_owner_id', currentUser.id)

    const { data: balanceData } = await client
      .from('customers')
      .select('balance')
      .eq('shop_owner_id', currentUser.id)
    const totalBalance = balanceData?.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0) || 0

    // 2. Fetch Offers & Detailed Data
    const { data: offers } = await client.from('subscription_offers').select('*').eq('shop_owner_id', currentUser.id)
    const { data: subData } = await client.from('customer_subscriptions').select('offer_id, customer_id').eq('shop_owner_id', currentUser.id)
    const { data: txData } = await client.from('transactions').select('amount, type, offer_id, created_at').eq('shop_owner_id', currentUser.id)

    // Calculate Offer Statistics
    const statsByOffer = offers?.map(offer => {
      const subCount = new Set(subData?.filter(s => s.offer_id === offer.id).map(s => s.customer_id)).size
      const balance = txData?.filter(t => t.offer_id === offer.id).reduce((acc, tx) => acc + (tx.type === 'deposit' ? Number(tx.amount) : -Number(tx.amount)), 0) || 0
      return { ...offer, subCount, balance }
    }) || []
    offerStats.value = statsByOffer

    // Calculate Prepaid Data (Ensure it matches the total balance card)
    const subBalancesTotal = statsByOffer.reduce((acc, o) => acc + o.balance, 0)
    const prepaidBalance = totalBalance - subBalancesTotal

    const subCustomerIds = new Set(subData?.map(s => s.customer_id) || [])
    const prepaidCount = (customersCount || 0) - subCustomerIds.size

    // 3. Update Charts
    offerNames.value = statsByOffer.map(o => o.name)
    customerSeries.value = [prepaidCount, ...statsByOffer.map(o => o.subCount)]
    balanceSeries.value = [prepaidBalance, ...statsByOffer.map(o => o.balance)]

    // 4. Today's Precise Stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTxs = txData?.filter(tx => new Date(tx.created_at) >= todayStart)
    const todayDeposits = todayTxs?.filter(t => t.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    const todayWithdrawals = todayTxs?.filter(t => t.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    displayStats.value[0].value = (customersCount || 0).toString()
    displayStats.value[1].value = `${totalBalance.toLocaleString()} ${t('common.currency')}`
    displayStats.value[2].value = `${todayDeposits.toLocaleString()} ${t('common.currency')}`
    displayStats.value[3].value = `${todayWithdrawals.toLocaleString()} ${t('common.currency')}`

    // 5. Weekly Activity
    const days = []
    const deps = []
    const withs = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      days.push(d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric' }))
      const dayTxs = txData?.filter(tx => new Date(tx.created_at).toDateString() === d.toDateString())
      deps.push(dayTxs?.filter(t => t.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0)
      withs.push(dayTxs?.filter(t => t.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0)
    }
    depositData.value = deps
    withdrawalData.value = withs
    chartDays.value = days

    // 6. Recent Transactions (Fetch a bit more to allow local filtering)
    const { data: recentTxs } = await client
      .from('transactions')
      .select('*, customer:customers(name)')
      .eq('shop_owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20)
    recentTransactions.value = recentTxs || []
    availableOffers.value = offers || []

  } catch (e) {
    console.error('Dashboard Fetch Error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboardData)
</script>

<template>
  <div class="space-y-12 animate-fade-in pb-20">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
          <span>{{ $t('dashboard.welcome') }}، {{ profile?.shop_name || user?.email?.split('@')[0] }}</span>
          <span class="animate-bounce">👋</span>
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-3 font-medium text-lg">{{ $t('dashboard.merchant_stats.welcome_desc') }}</p>
      </div>
      
      <div v-if="!isSuspended" class="flex items-center gap-3">
        <NuxtLink to="/customers" class="flex items-center gap-4 px-10 py-5 bg-emerald-500 text-slate-950 rounded-[32px] font-black hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 group">
          <Plus class="w-7 h-7 group-hover:rotate-90 transition-transform" />
          <span>{{ $t('dashboard.merchant_stats.new_customer') }}</span>
        </NuxtLink>
      </div>
      <div v-else class="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <p class="text-red-500 font-bold text-sm">{{ $t('dashboard.merchant_stats.suspended_alert') }}</p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <template v-if="loading">
        <BaseCard v-for="i in 4" :key="i" class="relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <Skeleton roundedClass="rounded-2xl w-12 h-12" />
            <Skeleton roundedClass="rounded-lg w-5 h-5" />
          </div>
          <div class="mt-4 space-y-2">
            <Skeleton roundedClass="rounded w-24 h-4" />
            <Skeleton roundedClass="rounded w-32 h-8" />
          </div>
        </BaseCard>
      </template>
      <template v-else>
        <BaseCard v-for="stat in stats" :key="stat.label" class="relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div class="flex items-center justify-between">
            <div :class="`p-3 ${stat.bg} ${stat.color} rounded-2xl`">
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
            <ArrowUpRight class="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div class="mt-4">
            <p class="text-slate-500 dark:text-slate-400 font-medium text-sm">{{ stat.label }}</p>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-1">{{ displayStats[stats.indexOf(stat)].value }}</h3>
          </div>
        </BaseCard>
      </template>
    </div>

    <!-- Active Offers Details -->
    <div class="space-y-6">
      <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles class="w-6 h-6 text-amber-500" />
        {{ $t('dashboard.merchant_stats.active_subscriptions') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-if="loading">
          <Skeleton v-for="i in 3" :key="i" roundedClass="rounded-[40px] h-[200px]" />
        </template>
        <template v-else>
          <div v-for="offer in offerStats" :key="offer.id" class="relative group cursor-pointer">
            <div class="absolute inset-0 bg-slate-900 rounded-[40px] shadow-2xl transition-transform group-hover:scale-[1.02]"></div>
            <div class="relative p-8 text-white space-y-6">
              <div class="flex justify-between items-start">
                <div class="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <Layers class="w-8 h-8" />
                </div>
                <div class="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-emerald-500/50">{{ $t('dashboard.merchant_stats.active_now') }}</div>
              </div>
              <div>
                <h3 class="text-2xl font-black mb-1">{{ offer.name }}</h3>
              </div>
              <div class="grid grid-cols-2 gap-4 pt-4">
                <div class="bg-white/5 p-4 rounded-3xl border border-white/5">
                  <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">{{ $t('dashboard.merchant_stats.subscribers') }}</p>
                  <div class="text-2xl font-black">{{ offer.subCount }}</div>
                </div>
                <div class="bg-white/5 p-4 rounded-3xl border border-white/5">
                  <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">{{ $t('dashboard.merchant_stats.balance') }}</p>
                  <div class="text-2xl font-black text-emerald-400">{{ offer.balance }} <span class="text-xs opacity-60">{{ $t('common.currency') }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Activity History - Main Chart -->
      <BaseCard class="lg:col-span-8 border-white/5 shadow-2xl !p-10">
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-amber-500/10 rounded-[24px]">
              <TrendingUp class="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.merchant_stats.store_activity') }}</h3>
              <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.merchant_stats.store_activity_desc') }}</p>
            </div>
          </div>
        </div>
        <div class="h-[400px]">
          <Skeleton v-if="loading" roundedClass="rounded-3xl h-full w-full" />
          <ClientOnly v-else>
            <ApexChart 
              height="100%" 
              width="100%"
              type="area"
              :options="activityChart.options" 
              :series="activityChart.series" 
            />
          </ClientOnly>
        </div>
      </BaseCard>

      <!-- Customer Breakdown -->
      <BaseCard class="lg:col-span-4 border-white/5 shadow-2xl !p-10">
        <div class="flex items-center gap-4 mb-10">
          <div class="p-4 bg-blue-500/10 rounded-[24px]">
            <PieIcon class="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.merchant_stats.customer_segmentation') }}</h3>
            <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.merchant_stats.by_subscription_type') }}</p>
          </div>
        </div>
        <div class="h-[300px]">
          <template v-if="loading">
             <Skeleton roundedClass="rounded-full w-48 h-48 mx-auto" />
             <div class="flex justify-center gap-4 mt-6">
                <Skeleton roundedClass="rounded w-16 h-4" />
                <Skeleton roundedClass="rounded w-16 h-4" />
             </div>
          </template>
          <ClientOnly v-else>
            <ApexChart 
              height="100%" 
              width="100%"
              type="donut"
              :options="customerChart.options" 
              :series="customerChart.series" 
            />
          </ClientOnly>
        </div>
        <div class="mt-8 space-y-4">
          <div v-for="(val, idx) in customerChart.series" :key="idx" class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: customerChart.options.colors[idx] }"></div>
              <span class="text-sm font-bold text-slate-600 dark:text-slate-300">{{ customerChart.options.labels[idx] }}</span>
            </div>
            <span class="font-black text-slate-900 dark:text-white">{{ val }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Balance Breakdown - Full Width Bar -->
      <BaseCard class="lg:col-span-12 border-white/5 shadow-2xl !p-10">
        <div class="flex items-center gap-4 mb-10">
          <div class="p-4 bg-emerald-500/10 rounded-[24px]">
            <BarChart3 class="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.merchant_stats.balance_analysis') }}</h3>
            <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.merchant_stats.balance_analysis_desc') }}</p>
          </div>
        </div>
        <div class="h-[350px]">
          <ClientOnly>
            <ApexChart 
              height="100%" 
              width="100%"
              type="bar"
              :options="balanceChart.options" 
              :series="balanceChart.series" 
            />
          </ClientOnly>
        </div>
      </BaseCard>
    </div>

    <!-- Recent Transactions Section -->
    <BaseCard class="!p-0 overflow-hidden border-white/5 shadow-2xl">
      <div class="p-10 border-b border-slate-100 dark:border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8 bg-slate-50/50 dark:bg-white/5">
        <div class="flex items-center gap-5">
          <div class="p-4 bg-emerald-500/10 rounded-[24px]">
            <Activity class="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h3 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.merchant_stats.recent_activity') }}</h3>
            <p class="text-base text-slate-500 font-medium">{{ $t('dashboard.merchant_stats.recent_activity_desc') }}</p>
            <p class="text-xs text-amber-500 font-bold mt-1">{{ $t('dashboard.merchant_stats.prepaid_only') }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Offer Filter Dropdown -->
          <div class="relative min-w-[200px]">
            <select 
              v-model="txFilter"
              class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[18px] px-6 py-4 text-sm font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer shadow-sm"
            >
              <option value="all">{{ $t('dashboard.merchant_stats.all_transactions') }}</option>
              <option value="prepaid">{{ $t('dashboard.merchant_stats.prepaid_only') }}</option>
              <option v-for="offer in availableOffers" :key="offer.id" :value="offer.id">
                {{ offer.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <ChevronDown class="w-5 h-5" />
            </div>
          </div>

          <NuxtLink to="/transactions" class="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-sm rounded-[20px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
            {{ $t('dashboard.merchant_stats.view_full_history') }}
          </NuxtLink>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <div v-if="loading" class="p-24 text-center text-slate-400">
          <div class="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <p class="font-black text-xl">{{ $t('dashboard.merchant_stats.syncing_data') }}</p>
        </div>
        <div v-else-if="filteredTransactions.length === 0" class="p-24 text-center text-slate-500">
          <div class="flex flex-col items-center gap-6 opacity-30">
            <Activity class="w-24 h-24" />
            <p class="text-2xl font-bold">{{ $t('dashboard.merchant_stats.no_transactions_filter') }}</p>
          </div>
        </div>
        <div v-else class="min-w-[1000px]">
          <table class="w-full text-right">
            <thead>
              <tr class="bg-slate-50 dark:bg-white/5 text-slate-500 text-sm font-bold border-b border-slate-100 dark:border-white/5">
                <th class="px-10 py-6">{{ $t('dashboard.merchant_stats.customer') }}</th>
                <th class="px-10 py-6">{{ $t('dashboard.merchant_stats.type') }}</th>
                <th class="px-10 py-6">{{ $t('dashboard.merchant_stats.amount') }}</th>
                <th class="px-10 py-6">{{ $t('dashboard.merchant_stats.time') }}</th>
                <th class="px-10 py-6 text-center">{{ $t('dashboard.merchant_stats.status') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              <tr v-for="tx in filteredTransactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                <td class="px-10 py-8">
                  <p class="font-black text-slate-900 dark:text-white text-lg">{{ tx.customer?.name || $t('dashboard.merchant_stats.customer') }}</p>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-3">
                    <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="w-10 h-10 rounded-[14px] flex items-center justify-center">
                      <component :is="tx.type === 'deposit' ? Plus : Activity" class="w-5 h-5" />
                    </div>
                    <span class="font-black text-sm" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                      {{ tx.type === 'deposit' ? $t('dashboard.merchant_stats.deposit') : $t('dashboard.merchant_stats.withdrawal') }}
                    </span>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <p class="font-black text-2xl" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                    {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }} <span class="text-xs opacity-60 font-bold">{{ $t('common.currency') }}</span>
                  </p>
                  <p v-if="tx.offer_id" class="text-[10px] text-amber-500 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles class="w-3 h-3" /> {{ $t('dashboard.merchant_stats.special_subscription') }}
                  </p>
                </td>
                <td class="px-10 py-8">
                  <p class="text-sm text-slate-700 dark:text-slate-300 font-black">{{ new Date(tx.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}</p>
                  <p class="text-xs text-slate-400 mt-1">{{ new Date(tx.created_at).toLocaleDateString('ar-EG') }}</p>
                </td>
                <td class="px-10 py-8">
                  <div class="flex justify-center">
                    <span class="px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black ring-1 ring-emerald-500/20">{{ $t('dashboard.merchant_stats.completed') }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
:deep(.apexcharts-canvas) {
  margin: 0 auto;
}
:deep(.apexcharts-tooltip) {
  @apply !bg-slate-900 !border-slate-800 !text-white !rounded-[20px] !shadow-2xl;
  padding: 10px;
}
:deep(.apexcharts-tooltip-title) {
  @apply !bg-slate-800 !border-slate-700 !font-black;
  margin-bottom: 5px;
}
:deep(.apexcharts-legend-text) {
  @apply !text-slate-400 !font-bold !text-xs;
}
</style>
