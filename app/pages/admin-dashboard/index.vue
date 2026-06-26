<script setup lang="ts">
import { 
  Store, 
  Users, 
  Activity, 
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Calendar,
  PieChart as PieIcon,
  ShoppingBag
} from 'lucide-vue-next'

const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

definePageMeta({
  layout: 'admin'
})

const { t, locale } = useI18n()
const client = useSupabaseClient()

const stats = computed(() => [
  { label: t('dashboard.admin_stats.shops'), value: '0', icon: Store, color: 'bg-indigo-500 shadow-indigo-500/20' },
  { label: t('dashboard.admin_stats.customers'), value: '0', icon: Users, color: 'bg-emerald-500 shadow-emerald-500/20' },
  { label: t('dashboard.admin_stats.volume'), value: '0', icon: Activity, color: 'bg-amber-500 shadow-amber-500/20' },
  { label: t('dashboard.admin_stats.total_transactions'), value: '0', icon: ShieldCheck, color: 'bg-blue-500 shadow-blue-500/20' },
])

const displayStats = ref([
  { label: '', value: '0', icon: Store, color: 'bg-indigo-500 shadow-indigo-500/20' },
  { label: '', value: '0', icon: Users, color: 'bg-emerald-500 shadow-emerald-500/20' },
  { label: '', value: '0', icon: Activity, color: 'bg-amber-500 shadow-amber-500/20' },
  { label: '', value: '0', icon: ShieldCheck, color: 'bg-blue-500 shadow-blue-500/20' },
])

const recentShops = ref([])
const loading = ref(true)

const dateFilter = ref('all') // today, week, month, custom, all
const customRange = ref({ start: '', end: '' })

const volumeChart = computed(() => ({
  series: [{ name: t('dashboard.admin_stats.trading_volume'), data: volData.value }],
  options: {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Tajawal, sans-serif' },
    colors: ['#10b981'],
    stroke: { curve: 'smooth', width: 4 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
    dataLabels: { enabled: false },
    xaxis: { categories: chartDays.value, labels: { style: { colors: '#94a3b8' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
  }
}))

const growthChart = computed(() => ({
  series: [
    { name: t('dashboard.admin_stats.shops'), data: shopsData.value },
    { name: t('dashboard.admin_stats.customers'), data: custData.value }
  ],
  options: {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false, fontFamily: 'Tajawal, sans-serif' },
    colors: ['#6366f1', '#10b981'],
    plotOptions: { bar: { borderRadius: 8, columnWidth: '50%' } },
    xaxis: { categories: chartDays.value, labels: { style: { colors: '#94a3b8' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    legend: { position: 'top', labels: { colors: '#94a3b8' } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
  }
}))

const customersByType = computed(() => ({
  series: customerTypeSeries.value,
  options: {
    chart: { type: 'donut', fontFamily: 'Tajawal, sans-serif' },
    labels: [t('dashboard.admin_stats.prepaid_customers'), t('dashboard.admin_stats.subscribed_customers')],
    colors: ['#6366f1', '#10b981'],
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '75%' } } }
  }
}))

const volData = ref([])
const shopsData = ref([])
const custData = ref([])
const chartDays = ref([])
const customerTypeSeries = ref([0, 0])

const getDateRange = () => {
  if (dateFilter.value === 'all') return null
  
  const now = new Date()
  let start = new Date()
  start.setHours(0, 0, 0, 0)
  
  if (dateFilter.value === 'today') {
    // start is already today 00:00
  } else if (dateFilter.value === 'week') {
    start.setDate(now.getDate() - 7)
  } else if (dateFilter.value === 'month') {
    start.setMonth(now.getMonth() - 1)
  } else if (dateFilter.value === 'custom' && customRange.value.start) {
    const s = new Date(customRange.value.start)
    s.setHours(0,0,0,0)
    const e = customRange.value.end ? new Date(customRange.value.end) : now
    e.setHours(23,59,59,999)
    return { start: s.toISOString(), end: e.toISOString() }
  }
  
  return { start: start.toISOString(), end: now.toISOString() }
}

const fetchStats = async () => {
  try {
    loading.value = true
    const range = getDateRange()
    
    // 1. Fetch Global Totals (Always show global for boxes unless range is specified)
    let shopsQuery = client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'shop_owner')
    let customersQuery = client.from('customers').select('*', { count: 'exact', head: true })
    let txQuery = client.from('transactions').select('amount, type, created_at')
    
    if (range) {
      shopsQuery = shopsQuery.gte('created_at', range.start).lte('created_at', range.end)
      customersQuery = customersQuery.gte('created_at', range.start).lte('created_at', range.end)
      txQuery = txQuery.gte('created_at', range.start).lte('created_at', range.end)
    }

    const [shopsRes, customersRes, txRes] = await Promise.all([
      shopsQuery,
      customersQuery,
      txQuery
    ])

    const totalVolume = txRes.data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    const txCount = txRes.data?.length || 0

    displayStats.value[0].value = shopsRes.count?.toString() || '0'
    displayStats.value[1].value = customersRes.count?.toString() || '0'
    displayStats.value[2].value = `${totalVolume.toLocaleString()} ${t('common.currency')}`
    displayStats.value[3].value = txCount.toLocaleString()

    // 2. Charts Data (Last 7 Days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0,0,0,0)

    const [histTx, histShops, histCust] = await Promise.all([
      client.from('transactions').select('amount, created_at').gte('created_at', sevenDaysAgo.toISOString()).order('created_at'),
      client.from('profiles').select('created_at').eq('role', 'shop_owner').gte('created_at', sevenDaysAgo.toISOString()).order('created_at'),
      client.from('customers').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).order('created_at')
    ])

    const days = []
    const vData = []
    const sData = []
    const cData = []

    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric' })
      days.push(dateStr)

      const dayTxs = histTx.data?.filter(t => new Date(t.created_at).toDateString() === d.toDateString())
      vData.push(dayTxs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0)

      const dayShops = histShops.data?.filter(s => new Date(s.created_at).toDateString() === d.toDateString())
      sData.push(dayShops?.length || 0)

      const dayCust = histCust.data?.filter(c => new Date(c.created_at).toDateString() === d.toDateString())
      cData.push(dayCust?.length || 0)
    }

    volData.value = vData
    shopsData.value = sData
    custData.value = cData
    chartDays.value = days

    // 3. Detailed Customer Breakdown
    const { data: allCust } = await client.from('customers').select('id')
    
    const { data: txSubs } = await client
      .from('transactions')
      .select('customer_id')
      .not('offer_id', 'is', null)
    
    const subCustIds = new Set((txSubs || []).map(t => t.customer_id))
    const subCount = subCustIds.size
    const prepaidCount = Math.max(0, (allCust?.length || 0) - subCount)
    
    customerTypeSeries.value = [prepaidCount, subCount]

    // 4. Shop Performance
    const { data: txWithShops } = await client
      .from('transactions')
      .select('amount, type, shop:profiles!inner(shop_name, email)')
    
    const perfMap: Record<string, any> = {}
    txWithShops?.forEach(tx => {
      const name = tx.shop.shop_name || tx.shop.email.split('@')[0]
      if (!perfMap[name]) perfMap[name] = { name, count: 0, volume: 0 }
      perfMap[name].count++
      perfMap[name].volume += Number(tx.amount)
    })
    shopsPerformance.value = Object.values(perfMap).sort((a, b) => b.volume - a.volume).slice(0, 10)

    // 5. Recent Shops
    const { data: shops } = await client
      .from('profiles')
      .select('*')
      .eq('role', 'shop_owner')
      .order('created_at', { ascending: false })
      .limit(6)
    recentShops.value = shops || []

  } catch (e) {
    console.error('Admin Stats error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
watch([dateFilter, customRange], fetchStats)
</script>

<template>
  <div class="space-y-12 animate-fade-in pb-20">
    <!-- Header & Date Filter -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ $t('dashboard.welcome_back') }}, {{ $t('nav.admin_panel') }} 🛡️
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium text-lg">{{ $t('dashboard.admin_stats.welcome_title') }}</p>
      </div>
      
      <div class="flex flex-col md:flex-row items-end md:items-center gap-4">
        <!-- Date Selector -->
        <div class="relative group min-w-[220px]">
          <Calendar class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 z-10" />
          <select 
            v-model="dateFilter"
            class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm hover:border-emerald-500/30"
          >
            <option value="all">{{ $t('dashboard.all_time') }}</option>
            <option value="today">{{ $t('dashboard.today_stats') }}</option>
            <option value="week">{{ $t('dashboard.last_week') }}</option>
            <option value="month">{{ $t('dashboard.last_month') }}</option>
            <option value="custom">{{ $t('dashboard.custom_range') }}</option>
          </select>
        </div>

        <!-- Custom Range -->
        <div v-if="dateFilter === 'custom'" class="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <input v-model="customRange.start" type="date" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300" />
          <span class="text-slate-400 font-bold">{{ $t('dashboard.to') }}</span>
          <input v-model="customRange.end" type="date" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300" />
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <template v-if="loading">
        <BaseCard v-for="i in 4" :key="i" class="!p-8 rounded-[48px]">
          <Skeleton roundedClass="rounded-[24px] w-14 h-14 mb-8" />
          <div class="space-y-2">
            <Skeleton roundedClass="rounded w-24 h-4" />
            <Skeleton roundedClass="rounded w-32 h-10" />
          </div>
        </BaseCard>
      </template>
      <template v-else>
        <BaseCard v-for="(stat, index) in displayStats" :key="index" class="relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border-white/5 shadow-xl !p-8 rounded-[48px]">

          <div class="flex items-center justify-between relative z-10">
            <div :class="`p-4 ${stat.color} text-white rounded-[24px] shadow-2xl`">
              <component :is="stat.icon" class="w-7 h-7" />
            </div>
            <div class="p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
              <TrendingUp class="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div class="mt-8 relative z-10">
            <p class="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">{{ stats[index].label }}</p>

            <h3 class="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{{ stat.value }}</h3>
          </div>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
        </BaseCard>
      </template>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Volume Area Chart -->
      <BaseCard class="border-white/5 shadow-2xl !p-10 rounded-[48px]">
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-emerald-500/10 rounded-[24px]">
              <Activity class="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.daily_volume') }}</h3>
              <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.admin_stats.daily_volume_desc') }}</p>
            </div>
          </div>
        </div>
        <div class="h-[350px]">
          <Skeleton v-if="loading" roundedClass="rounded-3xl h-full w-full" />
          <ClientOnly v-else>
            <ApexChart height="100%" width="100%" type="area" :options="volumeChart.options" :series="volumeChart.series" />
          </ClientOnly>
        </div>
      </BaseCard>

      <!-- Growth Bar Chart -->
      <BaseCard class="border-white/5 shadow-2xl !p-10 rounded-[48px]">
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center gap-4">
            <div class="p-4 bg-indigo-500/10 rounded-[24px]">
              <Users class="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.platform_growth') }}</h3>
              <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.admin_stats.platform_growth_desc') }}</p>
            </div>
          </div>
        </div>
        <div class="h-[350px]">
          <Skeleton v-if="loading" roundedClass="rounded-3xl h-full w-full" />
          <ClientOnly v-else>
            <ApexChart height="100%" width="100%" type="bar" :options="growthChart.options" :series="growthChart.series" />
          </ClientOnly>
        </div>
      </BaseCard>
    </div>

    <!-- Detailed Analysis Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Customers Breakdown -->
      <BaseCard class="border-white/5 shadow-2xl !p-10 rounded-[48px] flex flex-col items-center justify-center text-center">
        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">{{ $t('dashboard.admin_stats.customer_distribution') }}</h3>
        <p class="text-sm text-slate-500 font-medium mb-8">{{ $t('dashboard.admin_stats.customer_distribution_desc') }}</p>
        <div class="w-full max-w-[280px]">
          <template v-if="loading">
            <div class="flex items-center justify-center h-[200px]">
              <Skeleton roundedClass="rounded-full w-40 h-40" />
            </div>
          </template>
          <ClientOnly v-else>
            <ApexChart type="donut" width="100%" :options="customersByType.options" :series="customersByType.series" />
          </ClientOnly>
        </div>
      </BaseCard>

      <!-- Shop Performance Table -->
      <BaseCard class="lg:col-span-2 border-white/5 shadow-2xl !p-10 rounded-[48px] overflow-hidden">
        <div class="flex items-center gap-4 mb-8">
          <div class="p-4 bg-indigo-500/10 rounded-[24px]">
            <Store class="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.shop_performance') }}</h3>
            <p class="text-sm text-slate-500 font-medium">{{ $t('dashboard.admin_stats.shop_performance_desc') }}</p>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead>
              <tr class="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                <th class="pb-4 pr-2">{{ $t('dashboard.admin_stats.shop_name') }}</th>
                <th class="pb-4 text-center">{{ $t('dashboard.admin_stats.transactions_count') }}</th>
                <th class="pb-4 text-left pl-2">{{ $t('dashboard.admin_stats.trading_volume') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-white/5">
              <template v-if="loading">
                <tr v-for="i in 5" :key="i">
                  <td class="py-5 pr-2"><Skeleton roundedClass="rounded w-32 h-6" /></td>
                  <td class="py-5 text-center"><Skeleton roundedClass="rounded w-20 h-6 mx-auto" /></td>
                  <td class="py-5 text-left pl-2"><Skeleton roundedClass="rounded w-24 h-6 ml-auto" /></td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="shop in shopsPerformance" :key="shop.name" class="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td class="py-5 font-black text-slate-900 dark:text-white pr-2">{{ shop.name }}</td>
                  <td class="py-5 text-center font-bold text-slate-500">{{ shop.count }} {{ $t('dashboard.admin_stats.transactions_count') }}</td>
                  <td class="py-5 text-left font-black text-emerald-500 pl-2">{{ shop.volume.toLocaleString() }} {{ $t('common.currency') }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- Recent Shops -->
    <div class="space-y-8">
      <div class="flex items-center justify-between px-4">
        <h3 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <ShoppingBag class="w-7 h-7 text-emerald-500" />
          {{ $t('dashboard.admin_stats.recent_shops') }}
        </h3>
        <NuxtLink to="/admin-dashboard/shops" class="flex items-center gap-2 text-emerald-500 font-black hover:translate-x-[-4px] transition-transform">
          <span>{{ $t('dashboard.admin_stats.all_shops') }}</span>
          <ChevronRight class="w-5 h-5 rtl:rotate-0 rotate-180" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-if="loading">
          <Skeleton v-for="i in 6" :key="i" roundedClass="rounded-[32px] h-[100px]" />
        </template>
        <template v-else>
          <BaseCard v-for="shop in recentShops" :key="shop.id" 
            @click="navigateTo(`/admin-dashboard/shops/${shop.id}`)"
            class="!p-6 hover:border-emerald-500/50 transition-all group cursor-pointer border-white/5 shadow-lg rounded-[32px] bg-white dark:bg-slate-900"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-500">
                  {{ shop.shop_name?.charAt(0).toUpperCase() || shop.email.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h4 class="font-black text-lg text-slate-900 dark:text-white leading-tight group-hover:text-emerald-500 transition-colors">{{ shop.shop_name || shop.email.split('@')[0] }}</h4>
                  <p class="text-xs text-slate-500 mt-1 font-bold">{{ new Date(shop.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
                </div>
              </div>
              <div class="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                <ChevronRight class="w-5 h-5 text-slate-300 group-hover:text-emerald-500 rotate-180" />
              </div>
            </div>
          </BaseCard>
        </template>
        
        <div v-if="recentShops.length === 0 && !loading" class="col-span-full text-center py-24 text-slate-500 font-bold bg-slate-50 dark:bg-white/5 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-white/5">
          {{ $t('dashboard.admin_stats.no_new_shops') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.apexcharts-canvas) {
  margin: 0 auto;
}
:deep(.apexcharts-tooltip) {
  @apply !bg-slate-900 !border-slate-800 !text-white !rounded-[24px] !shadow-2xl;
  padding: 10px;
}
:deep(.apexcharts-legend-text) {
  @apply !text-slate-400 !font-bold !text-xs;
}
</style>
