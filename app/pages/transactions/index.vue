<script setup lang="ts">
import { 
  History, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter,
  Plus,
  X,
  User,
  Wallet,
  DollarSign,
  Smartphone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Activity
} from 'lucide-vue-next'


definePageMeta({
  layout: 'merchant'
})

const user = useSupabaseUser()
const client = useSupabaseClient()
const { t, locale } = useI18n()

const transactions = ref([])
const customers = ref([])
const availableOffers = ref([])
const loading = ref(true)
const showAddModal = ref(false)
const searchQuery = ref('')
const filterType = ref('all')
const dateRange = ref('all') // today, week, month, custom, all
const offerFilter = ref('all') // all, prepaid, or offer_id
const customDateStart = ref('')
const customDateEnd = ref('')
const showDateDropdown = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = 6
const totalTransactions = ref(0)
const totalPages = computed(() => {
  const total = totalTransactions.value || 0
  return Math.max(1, Math.ceil(total / pageSize))
})

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

// Stats
const totalDeposits = ref(0)
const totalWithdrawals = ref(0)

// Form state
const form = ref({
  customer_id: '',
  type: 'deposit',
  amount: '' as any,
  paid_amount: '' as any,
  note: '',
  offer_id: ''
})
const submittng = ref(false)
const showErrorModal = ref(false)
const showSuccessModal = ref(false)
const errorMsg = ref('')
const successMsg = ref('')


const getDateRangeParams = () => {
  if (dateRange.value === 'all') return null
  
  const now = new Date()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  
  if (dateRange.value === 'today') {
    return { start: start.toISOString(), end: now.toISOString() }
  } else if (dateRange.value === 'week') {
    start.setDate(now.getDate() - 7)
    return { start: start.toISOString(), end: now.toISOString() }
  } else if (dateRange.value === 'month') {
    start.setMonth(now.getMonth() - 1)
    return { start: start.toISOString(), end: now.toISOString() }
  } else if (dateRange.value === 'custom' && customDateStart.value && customDateEnd.value) {
    const s = new Date(customDateStart.value)
    s.setHours(0,0,0,0)
    const e = new Date(customDateEnd.value)
    e.setHours(23,59,59,999)
    return { start: s.toISOString(), end: e.toISOString() }
  }
  return null
}

const fetchData = async () => {
  try {
    loading.value = true
    
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) return

    const range = getDateRangeParams()

    // 1. Build shared filters for both stats and transactions queries
    let statsQuery = client
      .from('transactions')
      .select('type, amount, offer_id, customer:customers!inner(name, mobile_number)')
      .eq('shop_owner_id', currentUser.id)
    
    if (range) {
      statsQuery = statsQuery.gte('created_at', range.start).lte('created_at', range.end)
    }

    if (searchQuery.value) {
      statsQuery = statsQuery.or(`name.ilike.%${searchQuery.value}%,mobile_number.ilike.%${searchQuery.value}%`, { foreignTable: 'customers' })
    }

    // Apply offer filter BEFORE executing stats query
    if (offerFilter.value !== 'all') {
      if (offerFilter.value === 'prepaid') {
        statsQuery = statsQuery.is('offer_id', null)
      } else {
        statsQuery = statsQuery.eq('offer_id', offerFilter.value)
      }
    }

    const { data: statsData } = await statsQuery
    
    // Calculate stats - for prepaid filter, only count prepaid withdrawals
    totalDeposits.value = statsData?.filter(t => t.type === 'deposit').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    totalWithdrawals.value = statsData?.filter(t => t.type === 'withdrawal').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 2. Fetch Transactions
    let txQuery = client
      .from('transactions')
      .select('*, customer:customers!inner(name, mobile_number)', { count: 'exact' })
      .eq('shop_owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)

    if (range) {
      txQuery = txQuery.gte('created_at', range.start).lte('created_at', range.end)
    }

    if (filterType.value !== 'all') {
      txQuery = txQuery.eq('type', filterType.value)
    }

    // Apply same offer filter to transaction query
    if (offerFilter.value !== 'all') {
      if (offerFilter.value === 'prepaid') {
        txQuery = txQuery.is('offer_id', null)
      } else {
        txQuery = txQuery.eq('offer_id', offerFilter.value)
      }
    }

    if (searchQuery.value) {
      txQuery = txQuery.or(`name.ilike.%${searchQuery.value}%,mobile_number.ilike.%${searchQuery.value}%`, { foreignTable: 'customers' })
    }

    const { data: txData, count } = await txQuery
    transactions.value = txData || []
    totalTransactions.value = count || 0

    // 3. Fetch Customers for the dropdown
    const { data: custData } = await client
      .from('customers')
      .select('id, name, mobile_number')
      .eq('shop_owner_id', currentUser.id)
    customers.value = custData || []

    // 4. Fetch Offers for the dropdown
    const { data: offerData } = await client
      .from('subscription_offers')
      .select('id, name, price, discount, duration')
      .eq('shop_owner_id', currentUser.id)
    availableOffers.value = offerData || []

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const setRange = (range: string) => {
  dateRange.value = range
  if (range !== 'custom') {
    showDateDropdown.value = false
    fetchData()
  }
}

const applyCustomRange = () => {
  if (customDateStart.value && customDateEnd.value) {
    showDateDropdown.value = false
    fetchData()
  }
}

const handleAddTransaction = async () => {
  try {
    submittng.value = true
    
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) throw new Error(t('customers.errors.login_required'))

    // 1. Get current customer balance
    const { data: customer } = await client
      .from('customers')
      .select('id, balance, total_saved, mobile_number')
      .eq('id', form.value.customer_id)
      .single()

    if (!customer) throw new Error(t('common.no_data'))

    const balance_before = Number(customer.balance)
    const amount = Number(form.value.amount)
    let balance_after = balance_before

    if (form.value.type === 'deposit') {
      balance_after += amount
    } else {
      if (balance_before < amount) throw new Error(t('customers.errors.insufficient_balance'))
      balance_after -= amount
    }

    // 1b. Calculate Saving
    let savingAmount = 0
    if (form.value.type === 'deposit') {
      if (form.value.offer_id) {
        const offer = availableOffers.value.find(o => o.id === form.value.offer_id)
        if (offer) {
          savingAmount = Number(offer.discount || 0)
        }
      } else {
        savingAmount = Math.max(0, Number(form.value.amount || 0) - Number(form.value.paid_amount || 0))
      }
    } else if (form.value.type === 'withdrawal') {
      // Calculate saving ratio from the last prepaid deposit
      const { data: lastDeposit } = await client
        .from('transactions')
        .select('amount, paid_amount, saved_amount')
        .eq('customer_id', customer.id)
        .eq('type', 'deposit')
        .is('offer_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (lastDeposit && Number(lastDeposit.amount) > 0) {
        const amt = Number(lastDeposit.amount)
        const paid = Number(lastDeposit.paid_amount || 0)
        if (paid > 0 && paid < amt) {
          const ratio = (amt - paid) / amt
          savingAmount = Number((Number(form.value.amount) * ratio).toFixed(2))
        } else {
          savingAmount = 0
        }
      }
    }

    const newTotalSaved = (Number(customer.total_saved) || 0) + savingAmount

    // 2. Insert transaction
    const { error: txError } = await client.from('transactions').insert({
      customer_id: form.value.customer_id,
      type: form.value.type,
      amount: Number(form.value.amount || 0),
      paid_amount: form.value.type === 'deposit' ? Number(form.value.paid_amount || form.value.amount || 0) : 0,
      saved_amount: savingAmount,
      note: form.value.note,
      offer_id: form.value.offer_id || null,
      shop_owner_id: currentUser.id,
      balance_before,
      balance_after
    })

    if (txError) throw txError

    // 3. Update customer balance and total saved
    const { error: custError } = await client
      .from('customers')
      .update({
        balance: balance_after,
        total_saved: newTotalSaved
      })
      .eq('id', customer.id)

    if (custError) throw custError

    // 4. Handle Subscription (if selected during deposit)
    if (form.value.type === 'deposit' && form.value.offer_id) {
      const offer = availableOffers.value.find(o => o.id === form.value.offer_id)
      if (offer) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (offer.duration || 30))
        
        await client.from('customer_subscriptions').insert({
          customer_id: customer.id,
          offer_id: offer.id,
          shop_owner_id: currentUser.id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
      }
    }

    // 5. Send SMS to Customer
    try {
      // Fetch shop name
      const { data: profile } = await client.from('profiles').select('shop_name').eq('id', currentUser.id).single()
      
      if (customer.mobile_number) {
        let smsMessage = ''
        const shopName = profile?.shop_name || 'Tqdr'
        
        if (form.value.type === 'deposit') {
          if (form.value.offer_id) {
            const offer = availableOffers.value.find(o => o.id === form.value.offer_id)
            if (offer) {
              smsMessage = t('customers.sms.subscription_success', { 
                offer: offer.name, 
                shop: shopName, 
                balance: balance_after, 
                savings: savingAmount, 
                total: newTotalSaved 
              })
            }
          } else {
            smsMessage = t('customers.sms.deposit_success', { shop: shopName, amount: form.value.amount, balance: balance_after }) + 
                         t('customers.sms.footer', { total: newTotalSaved })
          }
        } else {
          // Withdrawal SMS
          if (savingAmount > 0) {
            smsMessage = t('customers.sms.withdrawal_success_saved', {
              amount: amount,
              shop: shopName,
              balance: balance_after,
              savings: savingAmount,
              total: newTotalSaved
            })
          } else {
            smsMessage = t('customers.sms.withdrawal_success_no_savings', {
              amount: amount,
              shop: shopName,
              balance: balance_after
            })
          }
        }

        if (smsMessage) {
          await $fetch('/api/sms/send', {
            method: 'POST',
            body: {
              phone: customer.mobile_number,
              message: smsMessage
            }
          })
        }
      }
    } catch (smsErr) {
      console.error('Failed to send customer SMS:', smsErr)
    }

    showAddModal.value = false
    form.value = { customer_id: '', type: 'deposit', amount: '' as any, note: '', offer_id: '' }
    fetchData()
    successMsg.value = t('transactions.success_notified')
    showSuccessModal.value = true

  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    submittng.value = false
  }
}


onMounted(async () => {
  await fetchData()
})
  watch([filterType, dateRange, searchQuery, offerFilter], () => {
    currentPage.value = 1
    fetchData()
  })
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div class="p-2 bg-emerald-500/10 rounded-2xl">
            <History class="w-8 h-8 text-emerald-500" />
          </div>
          {{ $t('nav.transactions') }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">{{ $t('transactions.subtitle') }}</p>
      </div>
      
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-slate-950 rounded-[24px] font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 premium-btn"
      >
        <Plus class="w-6 h-6" />
        <span>{{ $t('transactions.new_transaction') }}</span>
      </button>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
      <div class="flex-1 relative group">
        <Search class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
        <input 
          v-model="searchQuery"
          type="text" 
          :placeholder="$t('customers.search_placeholder')"
          :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
          class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white"
        />
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Range Selector -->
        <div class="relative">
          <button 
            @click="showDateDropdown = !showDateDropdown"
            class="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 rounded-2xl font-bold text-slate-700 dark:text-slate-300 transition-all whitespace-nowrap"
          >
            <Calendar class="w-5 h-5 text-emerald-500" />
            <span>{{ dateRange === 'custom' ? (customDateStart || $t('common.from')) + ' - ' + (customDateEnd || $t('common.to')) : dateRange === 'today' ? $t('dashboard.today_stats') : dateRange === 'week' ? $t('dashboard.last_week') : dateRange === 'month' ? $t('dashboard.last_month') : $t('transactions.filters.all') }}</span>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="showDateDropdown" class="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2">
            <div class="space-y-1">
              <button @click="setRange('all')" class="w-full text-right px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-bold transition-colors" :class="dateRange === 'all' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600'">{{ $t('transactions.filters.all') }}</button>
              <button @click="setRange('today')" class="w-full text-right px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-bold transition-colors" :class="dateRange === 'today' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600'">{{ $t('dashboard.today_stats') }}</button>
              <button @click="setRange('week')" class="w-full text-right px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-bold transition-colors" :class="dateRange === 'week' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600'">{{ $t('dashboard.last_week') }}</button>
              <button @click="setRange('month')" class="w-full text-right px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-bold transition-colors" :class="dateRange === 'month' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600'">{{ $t('dashboard.last_month') }}</button>
              <button @click="dateRange = 'custom'" class="w-full text-right px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-bold transition-colors" :class="dateRange === 'custom' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600'">{{ $t('dashboard.custom_range') }}</button>
            </div>

            <!-- Custom Range Inputs -->
            <div v-if="dateRange === 'custom'" class="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <input v-model="customDateStart" type="date" class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl p-2 text-xs font-bold text-slate-700 dark:text-white" />
                <input v-model="customDateEnd" type="date" class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl p-2 text-xs font-bold text-slate-700 dark:text-white" />
              </div>
              <button @click="applyCustomRange" class="w-full bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20">{{ $t('common.confirm') }}</button>
            </div>
          </div>
        </div>

        <!-- Offer Filter Dropdown -->
        <div class="relative min-w-[200px]">
          <select 
            v-model="offerFilter"
            class="w-full bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-slate-300 focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="all">{{ $t('transactions.filters.all_offers') }}</option>
            <option value="prepaid">{{ $t('customers.no_offer_prepaid') }}</option>
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
          <option value="all">{{ $t('transactions.filters.all_types') }}</option>
          <option value="deposit">{{ $t('transactions.types.deposit') }}</option>
          <option value="withdrawal">{{ $t('transactions.types.withdrawal') }}</option>
        </select>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[40px] text-slate-950 relative overflow-hidden shadow-2xl shadow-emerald-500/20 group hover:scale-[1.02] transition-all duration-500">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div class="relative z-10 flex items-center justify-between">
          <div>
            <p class="text-slate-950/60 font-bold uppercase tracking-wider text-sm mb-1">{{ $t('dashboard.merchant_stats.today_deposits') }}</p>
            <h3 class="text-4xl font-black">+{{ totalDeposits.toLocaleString() }} <span class="text-xl opacity-80">{{ $t('common.currency') }}</span></h3>
          </div>
          <div class="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-md">
            <ArrowUpCircle class="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-sm group hover:scale-[1.02] transition-all duration-500">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div class="relative z-10 flex items-center justify-between">
          <div>
            <p class="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">{{ $t('dashboard.merchant_stats.today_withdrawals') }}</p>
            <h3 class="text-4xl font-black text-red-500">-{{ totalWithdrawals.toLocaleString() }} <span class="text-xl opacity-60">{{ $t('common.currency') }}</span></h3>
          </div>
          <div class="w-16 h-16 bg-red-500/10 rounded-[24px] flex items-center justify-center">
            <ArrowDownCircle class="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <BaseCard class="!p-0 overflow-hidden border-white/5 shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full" :class="locale === 'ar' ? 'text-right' : 'text-left'">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <th class="px-8 py-5 text-sm font-bold text-slate-500">{{ $t('transactions.table.customer') }}</th>
              <th class="px-8 py-5 text-sm font-bold text-slate-500">{{ $t('transactions.table.type') }}</th>
              <th class="px-8 py-5 text-sm font-bold text-slate-500">{{ $t('transactions.table.amount') }}</th>
              <th class="px-8 py-5 text-sm font-bold text-slate-500">{{ $t('transactions.table.time') }}</th>
              <th class="px-8 py-5 text-sm font-bold text-slate-500 text-center">{{ $t('transactions.table.status') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <template v-if="loading">
              <tr v-for="i in 6" :key="i">
                <td class="px-8 py-5"><Skeleton roundedClass="rounded w-32 h-6" /></td>
                <td class="px-8 py-5"><Skeleton roundedClass="rounded w-24 h-6" /></td>
                <td class="px-8 py-5"><Skeleton roundedClass="rounded w-20 h-6" /></td>
                <td class="px-8 py-5"><Skeleton roundedClass="rounded w-28 h-6" /></td>
                <td class="px-8 py-5"><Skeleton roundedClass="rounded-full w-16 h-6 mx-auto" /></td>
              </tr>
            </template>
            <template v-else>
              <tr 
                v-for="tx in transactions" :key="tx.id" 
                class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="px-8 py-5">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-900 dark:text-white">{{ tx.customer?.name }}</span>
                    <span class="text-[10px] text-slate-400 font-medium">{{ tx.customer?.mobile_number }}</span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex flex-col">
                    <span 
                      class="inline-flex items-center gap-1.5 font-bold text-sm"
                      :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'"
                    >
                      <Plus v-if="tx.type === 'deposit'" class="w-4 h-4" />
                      <Activity v-else class="w-4 h-4" />
                      {{ tx.offer_id 
                         ? (tx.type === 'deposit' ? 'شحن باقة عرض' : 'استهلاك من عرض') 
                         : (tx.type === 'deposit' ? t('transactions.types.deposit') : t('transactions.types.withdrawal')) }}
                    </span>
                    <span v-if="tx.offer_id" class="text-[10px] text-slate-400 font-bold mt-1">
                      ({{ $t('nav.subscriptions_nav') }}: {{ offerMap[tx.offer_id] || '...' }})
                    </span>
                    <span v-else class="text-[10px] text-slate-400 font-bold mt-1">
                      ({{ $t('customers.no_offer_prepaid') }})
                    </span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex flex-col">
                    <span class="text-lg font-black" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                      <template v-if="tx.offer_id && tx.type === 'withdrawal'">
                        1 زيارة
                      </template>
                      <template v-else>
                        {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }}
                        <span class="text-xs font-bold opacity-50">{{ t('common.currency') }}</span>
                      </template>
                    </span>
                    <span class="text-[10px] text-slate-400 font-bold mt-1">
                      <template v-if="tx.offer_id">
                        باقة عرض
                      </template>
                      <template v-else>
                        {{ $t('dashboard.customer_stats.balance_after', { balance: tx.balance_after }) }}
                      </template>
                    </span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                      <Calendar class="w-3.5 h-3.5 text-emerald-500" />
                      <span>{{ new Date(tx.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold mt-1 mr-5">
                      {{ new Date(tx.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5 text-center">
                  <span class="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black shadow-sm ring-1 ring-emerald-500/20">
                    {{ t('transactions.status_labels.completed') }}
                  </span>
                </td>
              </tr>
              <tr v-if="transactions.length === 0 && !loading">
                <td colspan="5" class="px-8 py-20 text-center">
                  <div class="flex flex-col items-center justify-center space-y-4">
                    <div class="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center">
                      <AlertCircle class="w-8 h-8 text-slate-300" />
                    </div>
                    <p class="text-slate-500 font-bold">{{ t('common.no_data') }}</p>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p class="text-sm text-slate-500 font-bold">
          {{ $t('common.showing') }} 
          <span class="text-slate-900 dark:text-white">{{ (currentPage - 1) * pageSize + 1 }}</span>
          {{ $t('common.to') }}
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
    </BaseCard>

    <!-- New Transaction Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" :class="form.type === 'deposit' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent' : 'bg-gradient-to-r from-red-500/10 to-transparent'">
          <div class="flex items-center gap-3">
            <div :class="form.type === 'deposit' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'" class="w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
              <component :is="form.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">{{ form.type === 'deposit' ? $t('customers.deposit_new') : $t('customers.withdraw_balance') }}</h3>
              <p class="text-xs text-slate-500">{{ $t('transactions.new_transaction') }}</p>
            </div>
          </div>
          <button @click="showAddModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleAddTransaction" class="p-5 space-y-3.5">
          <!-- Row 1: Customer Selection & Tx Type Selection -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Customer Selection -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User class="w-3.5 h-3.5 text-emerald-500" />
                <span>{{ $t('transactions.select_customer') }}</span>
              </label>
              <div class="relative">
                <select 
                  v-model="form.customer_id" 
                  required 
                  class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" disabled>{{ $t('transactions.select_customer_placeholder') }}</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.mobile_number }})
                  </option>
                </select>
                <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>
            </div>

            <!-- Type Selection (Compact Pill Toggle) -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity class="w-3.5 h-3.5 text-emerald-500" />
                <span>نوع العملية</span>
              </label>
              <div class="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button 
                  type="button"
                  @click="form.type = 'deposit'"
                  class="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  :class="form.type === 'deposit' ? 'bg-emerald-500 text-slate-950 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                >
                  <ArrowUpCircle class="w-3.5 h-3.5" />
                  <span>{{ $t('transactions.types.deposit') }}</span>
                </button>
                <button 
                  type="button"
                  @click="form.type = 'withdrawal'"
                  class="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  :class="form.type === 'withdrawal' ? 'bg-red-500 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                >
                  <ArrowDownCircle class="w-3.5 h-3.5" />
                  <span>{{ $t('transactions.types.withdrawal') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Subscription Selection in Tx Modal (for deposit) -->
          <div v-if="form.type === 'deposit' && availableOffers.length > 0" class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign class="w-3.5 h-3.5 text-emerald-500" />
              <span>{{ $t('customers.select_offer') }}</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                @click="form.offer_id = ''; form.amount = ''; form.paid_amount = '';"
                :class="form.offer_id === '' ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent'"
                class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all text-center"
              >
                {{ $t('customers.no_offer_prepaid') }}
              </button>
              <button 
                type="button"
                v-for="offer in availableOffers" 
                :key="offer.id"
                @click="form.offer_id = offer.id; form.amount = offer.price; form.paid_amount = offer.price;"
                :class="form.offer_id === offer.id ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent'"
                class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5"
              >
                <span>{{ offer.name }}</span>
                <span class="text-[9px] opacity-75">{{ offer.price }} {{ $t('common.currency') }}</span>
              </button>
            </div>
          </div>

          <!-- Interactive Input Fields based on Tx Type -->
          <!-- Deposit (Prepaid) with Paid Amount & Added Balance -->
          <div v-if="form.type === 'deposit' && form.offer_id === ''" class="bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/10 space-y-2.5">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-slate-500">المبلغ المدفوع كاش</label>
                <input 
                  v-model="form.paid_amount" 
                  type="number" 
                  required
                  step="0.01" 
                  placeholder="0.00"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-slate-500">الرصيد المضاف</label>
                <input 
                  v-model="form.amount" 
                  type="number" 
                  required
                  step="0.01" 
                  placeholder="0.00"
                  class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 font-bold text-sm text-emerald-500 focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
            </div>

            <!-- Savings Feedback -->
            <div class="flex items-center justify-between pt-1 border-t border-emerald-500/10 text-xs font-bold">
              <span class="text-slate-500">المبلغ الموفر للعميل:</span>
              <span class="font-black text-emerald-500">
                {{ Math.max(0, Number(form.amount || 0) - Number(form.paid_amount || 0)) }} {{ $t('common.currency') }}
              </span>
            </div>
          </div>

          <!-- Simple Amount Input for Withdrawal or Offer Deposit -->
          <div v-else class="space-y-1">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wallet class="w-3.5 h-3.5 text-emerald-500" />
              <span>{{ $t('transactions.table.amount') }}</span>
            </label>
            <input 
              v-model="form.amount" 
              type="number" 
              required
              step="0.01" 
              placeholder="0.00"
              class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 font-bold text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" 
              :readonly="form.type === 'deposit' && form.offer_id !== ''"
              :class="(form.type === 'deposit' && form.offer_id !== '') ? 'opacity-50 cursor-not-allowed' : ''"
            />
          </div>

          <!-- Optional Note -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 block">{{ $t('common.optional') }}</label>
            <input 
              v-model="form.note" 
              type="text"
              class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              :placeholder="$t('transactions.note_placeholder')"
            />
          </div>

          <button 
            type="submit" 
            :disabled="submittng"
            class="w-full bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black py-3 rounded-xl text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            <span v-if="submittng" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            <span>{{ form.type === 'deposit' ? $t('customers.deposit_new') : $t('customers.withdraw_balance') }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Modal: Success Notification -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="showSuccessModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-emerald-500/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8 text-center space-y-4">
          <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ $t('transactions.success_title') }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ successMsg }}</p>
          <button 
            @click="showSuccessModal = false"
            class="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl mt-4 transition-all active:scale-95"
          >
            {{ $t('common.ok_got_it') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Error Notification -->
    <div v-if="showErrorModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="showErrorModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-red-500/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-8 text-center space-y-4">
          <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ $t('common.error_occurred') }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ errorMsg }}</p>
          <button 
            @click="showErrorModal = false"
            class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl mt-4 transition-all active:scale-95"
          >
            {{ $t('common.ok_got_it') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

