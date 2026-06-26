<script setup lang="ts">
import { 
  ArrowLeft,
  Store,
  Users,
  Activity,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Smartphone,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const client = useSupabaseClient()
const { t, locale } = useI18n()

const shop = ref(null)
const customers = ref([])
const transactions = ref([])
const subscriptionOffers = ref([])
const loading = ref(true)
const updatingSubscriptions = ref(false)

// Pagination State
const txPage = ref(1)
const totalTx = ref(0)
const custPage = ref(1)
const totalCust = ref(0)
const pageSize = 10

const stats = ref([
  { label: t('dashboard.admin_stats.shop_details.stats.total_customers'), value: '0', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { label: t('dashboard.admin_stats.shop_details.stats.total_balances'), value: '0', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: t('dashboard.admin_stats.shop_details.stats.total_transactions'), value: '0', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
])

const fetchData = async () => {
  try {
    loading.value = true
    const shopId = route.params.id
    console.log('Fetching data for shop:', shopId)

    if (!shopId) throw new Error('Shop ID is missing')

    // 1. Fetch Shop Info
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('*')
      .eq('id', shopId)
      .single()
    
    if (profileErr) throw profileErr
    shop.value = profile

    // 2. Fetch Customers
    const { data: custData, count: custCount, error: custErr } = await client
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('shop_owner_id', shopId)
      .range((custPage.value - 1) * pageSize, custPage.value * pageSize - 1)
    
    if (custErr) throw custErr
    customers.value = custData || []
    totalCust.value = custCount || 0
    
    // 3. Fetch Transactions
    const { data: txData, count: txCount, error: txErr } = await client
      .from('transactions')
      .select('*, customer:customers(name, mobile_number)', { count: 'exact' })
      .eq('shop_owner_id', shopId)
      .order('created_at', { ascending: false })
      .range((txPage.value - 1) * pageSize, txPage.value * pageSize - 1)
    
    if (txErr) throw txErr
    transactions.value = txData || []
    totalTx.value = txCount || 0

    // 4. Fetch Subscription Offers
    const { data: offersData, error: offersErr } = await client
      .from('subscription_offers')
      .select('*')
      .eq('shop_owner_id', shopId)
    
    if (offersErr) throw offersErr
    subscriptionOffers.value = offersData || []

    // 5. Calculate Stats
    const totalBalance = customers.value.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)
    
    stats.value[0].value = totalCust.value.toString()
    stats.value[1].value = `${totalBalance.toLocaleString()} ${t('common.currency')}`
    stats.value[2].value = totalTx.value.toString()

    console.log('Shop data loaded successfully')
  } catch (e: any) {
    console.error('Error fetching shop data:', e.message)
  } finally {
    loading.value = false
  }
}

// Partial fetchers for pagination
const fetchTx = async () => {
  const shopId = route.params.id
  const { data } = await client
    .from('transactions')
    .select('*, customer:customers(name, mobile_number)')
    .eq('shop_owner_id', shopId)
    .order('created_at', { ascending: false })
    .range((txPage.value - 1) * pageSize, txPage.value * pageSize - 1)
  transactions.value = data || []
}

const fetchCust = async () => {
  const shopId = route.params.id
  const { data } = await client
    .from('customers')
    .select('*')
    .eq('shop_owner_id', shopId)
    .range((custPage.value - 1) * pageSize, custPage.value * pageSize - 1)
  customers.value = data || []
}

const toggleSubscriptions = async () => {
  try {
    updatingSubscriptions.value = true
    const { error } = await client
      .from('profiles')
      .update({ subscriptions_enabled: !shop.value.subscriptions_enabled })
      .eq('id', shop.value.id)
    
    if (error) throw error
    shop.value.subscriptions_enabled = !shop.value.subscriptions_enabled
  } catch (e: any) {
    alert(e.message)
  } finally {
    updatingSubscriptions.value = false
  }
}

const displayEmailOrPhone = (email?: string) => {
  if (!email) return ''
  return email.endsWith('@tqdr.com') ? email.split('@')[0] : email
}

onMounted(fetchData)
</script>

<template>
    <div v-if="loading" class="space-y-8 animate-fade-in pb-12">
      <!-- Skeleton Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Skeleton roundedClass="rounded-3xl w-16 h-16" />
          <div class="space-y-2">
            <Skeleton roundedClass="rounded w-48 h-8" />
            <Skeleton roundedClass="rounded w-32 h-4" />
          </div>
        </div>
      </div>
      <!-- Skeleton Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BaseCard v-for="i in 3" :key="i" class="!p-6">
          <div class="flex items-center gap-4">
            <Skeleton roundedClass="rounded-2xl w-12 h-12" />
            <div class="space-y-2">
              <Skeleton roundedClass="rounded w-24 h-4" />
              <Skeleton roundedClass="rounded w-32 h-6" />
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <div v-else class="space-y-8 animate-fade-in pb-12">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-4">
        <button @click="navigateTo('/admin-dashboard/shops')" class="flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors w-fit font-bold">
          <ArrowLeft class="w-4 h-4" />
          {{ $t('dashboard.admin_stats.shop_details.back_btn') }}
        </button>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Store class="w-8 h-8" />
            </div>
            <div>
              <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ shop?.shop_name || $t('dashboard.admin_stats.shop_details.loading') }}</h1>
              <p class="text-slate-500 dark:text-slate-400 font-medium">{{ displayEmailOrPhone(shop?.email) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="toggleSubscriptions"
              :disabled="updatingSubscriptions"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="shop?.subscriptions_enabled 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'"
            >
              <CreditCard class="w-4 h-4" />
              <span>{{ shop?.subscriptions_enabled ? $t('dashboard.admin_stats.shop_details.disable_subscriptions') : $t('dashboard.admin_stats.shop_details.enable_subscriptions') }}</span>
            </button>
            <div class="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm font-bold border border-emerald-500/20">
              {{ $t('dashboard.admin_stats.shop_details.active_account') }}
            </div>
          </div>
        </div>
      </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BaseCard v-for="stat in stats" :key="stat.label" class="!p-6 group hover:scale-[1.02] transition-all">
        <div class="flex items-center gap-4">
          <div :class="`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-bold">{{ stat.label }}</p>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ stat.value }}</h3>
          </div>
        </div>
      </BaseCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Transactions Log -->
      <div class="lg:col-span-2 space-y-6">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity class="w-5 h-5 text-emerald-500" />
          {{ $t('dashboard.admin_stats.shop_details.transactions_log') }}
        </h3>
        
        <BaseCard class="!p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{{ $t('dashboard.admin_stats.reports.table.customer') }}</th>
                  <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">{{ $t('dashboard.admin_stats.reports.table.type') }}</th>
                  <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{{ $t('dashboard.admin_stats.reports.table.amount') }}</th>
                  <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{{ $t('dashboard.admin_stats.reports.table.date') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 dark:text-white text-sm">{{ tx.customer?.name }}</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <Smartphone class="w-3 h-3" /> {{ tx.customer?.mobile_number }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex justify-center">
                      <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black" :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'">
                        <component :is="tx.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-3 h-3" />
                        {{ tx.type === 'deposit' ? $t('dashboard.merchant_stats.deposit') : $t('dashboard.merchant_stats.withdrawal') }}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="font-black text-sm" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                      {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ new Date(tx.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') }}
                    </div>
                  </td>
                </tr>
                <tr v-if="transactions.length === 0">
                  <td colspan="4" class="px-6 py-12 text-center text-slate-400 text-sm">
                    {{ $t('dashboard.admin_stats.shop_details.no_transactions') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Transactions Pagination -->
          <div v-if="totalTx > pageSize" class="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <button 
              @click="txPage--; fetchTx()" 
              :disabled="txPage === 1" 
              class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center hover:text-emerald-500"
            >
              <ChevronRight v-if="locale === 'ar'" class="w-5 h-5" />
              <ChevronLeft v-else class="w-5 h-5" />
            </button>
            
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-slate-400">{{ $t('dashboard.admin_stats.shop_details.page') }}</span>
              <span class="w-8 h-8 bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center text-sm font-black shadow-lg shadow-emerald-500/20">
                {{ txPage }}
              </span>
              <span class="text-xs font-black text-slate-400">{{ $t('dashboard.admin_stats.shop_details.of') }} {{ Math.ceil(totalTx / pageSize) }}</span>
            </div>

            <button 
              @click="txPage++; fetchTx()" 
              :disabled="txPage >= Math.ceil(totalTx / pageSize)" 
              class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30 transition-all shadow-sm flex items-center justify-center hover:text-emerald-500"
            >
              <ChevronLeft v-if="locale === 'ar'" class="w-5 h-5" />
              <ChevronRight v-else class="w-5 h-5" />
            </button>
          </div>
        </BaseCard>
      </div>

      <!-- Shop Customers List -->
      <div class="space-y-8">
        <!-- Subscriptions Section -->
        <div v-if="shop?.subscriptions_enabled" class="space-y-6">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-amber-500" />
            {{ $t('dashboard.admin_stats.shop_details.no_offers') }}
          </h3>
          <div class="space-y-3">
            <BaseCard v-for="offer in subscriptionOffers" :key="offer.id" class="!p-4 border-l-4 border-amber-500">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-slate-900 dark:text-white">{{ offer.name }}</h4>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ offer.usage_limit }} {{ $t('dashboard.admin_stats.shop_details.usage_times') }} | {{ offer.duration }} {{ $t('dashboard.admin_stats.subscriptions_management.days') }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-black text-amber-500">{{ offer.price }} {{ $t('common.currency') }}</p>
                  <p class="text-[10px] text-emerald-500 font-bold">{{ $t('dashboard.admin_stats.subscriptions_management.discount') }} {{ offer.discount }} {{ $t('common.currency') }}</p>
                </div>
              </div>
            </BaseCard>
            <div v-if="subscriptionOffers.length === 0" class="text-center py-6 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
              <p class="text-slate-400 text-sm">{{ $t('dashboard.admin_stats.shop_details.no_offers') }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users class="w-5 h-5 text-indigo-500" />
            {{ $t('dashboard.admin_stats.shop_details.customers_list') }}
          </h3>
          
          <div class="space-y-3">
            <BaseCard v-for="customer in customers" :key="customer.id" class="!p-4 group hover:border-indigo-500/30 transition-all">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    {{ customer.name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">{{ customer.name }}</h4>
                    <p class="text-[10px] text-slate-500">{{ customer.mobile_number }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-black text-emerald-500">{{ customer.balance }} {{ $t('common.currency') }}</p>
                </div>
              </div>
            </BaseCard>
            
            <!-- Customers Pagination -->
            <div v-if="totalCust > pageSize" class="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <button 
                @click="custPage--; fetchCust()" 
                :disabled="custPage === 1" 
                class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400 disabled:opacity-30 flex items-center justify-center hover:text-indigo-500"
              >
                <ChevronRight v-if="locale === 'ar'" class="w-4 h-4" />
                <ChevronLeft v-else class="w-4 h-4" />
              </button>
              
              <span class="text-[10px] font-black text-slate-500">{{ custPage }} / {{ Math.ceil(totalCust / pageSize) }}</span>

              <button 
                @click="custPage++; fetchCust()" 
                :disabled="custPage >= Math.ceil(totalCust / pageSize)" 
                class="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400 disabled:opacity-30 flex items-center justify-center hover:text-indigo-500"
              >
                <ChevronLeft v-if="locale === 'ar'" class="w-4 h-4" />
                <ChevronRight v-else class="w-4 h-4" />
              </button>
            </div>

            <div v-if="customers.length === 0" class="text-center py-8">
              <p class="text-slate-400 text-sm">{{ $t('dashboard.admin_stats.shop_details.no_customers') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
