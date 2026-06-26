<script setup lang="ts">
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  History,
  X,
  Phone,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  User,
  Smartphone,
  Save,
  DollarSign
} from 'lucide-vue-next'



definePageMeta({
  layout: 'merchant'
})

const { t, locale } = useI18n()
const user = useSupabaseUser()
const client = useSupabaseClient()

const customers = ref([])
const profile = ref(null)
const loading = ref(true)
const searchQuery = ref('')
const showAddModal = ref(false)
const showHistoryModal = ref(false)
const selectedCustomer = ref(null)
const customerHistory = ref([])
const availableOffers = ref([])
const showDeleteModal = ref(false)
const customerToDelete = ref(null)
const showErrorModal = ref(false)
const errorMsg = ref('')

const isSuspended = computed(() => profile.value?.status === 'suspended')




// Pagination
const currentPage = ref(1)
const pageSize = 10
const totalCustomers = ref(0)
const totalPages = computed(() => {
  const total = totalCustomers.value || 0
  return Math.max(1, Math.ceil(total / pageSize))
})

// Form state
const form = ref({
  name: '',
  mobile_number: '',
  paid_amount: '' as any,
  added_balance: '' as any,
  offer_id: ''
})




const txForm = ref({
  type: 'deposit' as 'deposit' | 'withdrawal',
  amount: '' as any,
  paid_amount: '' as any,
  saved_amount: '' as any,
  note: '',
  offer_id: '',
  service_type: 'prepaid' as 'prepaid' | 'offer' // NEW: to distinguish deduction type
})


const showTxModal = ref(false)

const fetchCustomers = async () => {

  try {
    loading.value = true
    
    // Explicitly get user
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) {
      console.log('No user found in fetchCustomers')
      return
    }

    let query = client
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('shop_owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)

    if (searchQuery.value) {
      query = query.or(`name.ilike.%${searchQuery.value}%,mobile_number.ilike.%${searchQuery.value}%`)
    }

    const { data, count, error } = await query
    if (error) throw error
    
    customers.value = data || []
    totalCustomers.value = count || 0
  } catch (e) {
    console.error('Error fetching customers:', e)
  } finally {
    loading.value = false
  }
}

const fetchOffers = async () => {
  try {
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) return

    const { data, error } = await client
      .from('subscription_offers')
      .select('*')
      .eq('shop_owner_id', currentUser.id)
    
    if (error) throw error
    availableOffers.value = data || []
  } catch (e) {
    console.error('Error fetching offers:', e)
  }
}


const handleAddCustomer = async () => {
  try {
    if (isSuspended.value) throw new Error(t('customers.errors.suspended'))
    loading.value = true
    
    // Explicitly get user to avoid null shop_owner_id
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) throw new Error(t('customers.errors.login_required'))

    // 1. Create Customer
    const addedBalance = Number(form.value.added_balance || 0)
    const { data: customer, error: custError } = await client.from('customers').insert({
      name: form.value.name || t('dashboard.merchant_stats.new_customer'),
      mobile_number: form.value.mobile_number,
      balance: addedBalance,
      shop_owner_id: currentUser.id,
      total_saved: form.value.offer_id ? (availableOffers.value.find(o => o.id === form.value.offer_id)?.discount || 0) : 0
    }).select().single()



    if (custError) throw custError

    // 2. Create Initial Transaction (if balance > 0)
    if (addedBalance > 0) {
      await client.from('transactions').insert({
        customer_id: customer.id,
        shop_owner_id: currentUser.id,
        type: 'deposit',
        amount: addedBalance,
        balance_before: 0,
        balance_after: addedBalance,
        note: t('customers.opening_balance'),
        offer_id: form.value.offer_id || null
      })
    }

    // 3. Handle Subscription (if selected)
    let duration = 0
    if (form.value.offer_id) {
      const offer = availableOffers.value.find(o => o.id === form.value.offer_id)
      if (offer) {
        duration = offer.duration
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + offer.duration)

        const { error: subError } = await client.from('customer_subscriptions').insert({
          customer_id: customer.id,
          offer_id: offer.id,
          shop_owner_id: currentUser.id,
          expires_at: expiresAt.toISOString()
        })
        if (subError) throw subError
      }
    }
    
    // 4. Send Welcome SMS
    try {
      const shopName = profile.value?.shop_name || 'Tqdr'
      const smsMessage = t('customers.sms.welcome', { shop: shopName, balance: addedBalance })
      await $fetch('/api/sms/send', {
        method: 'POST',
        body: {
          phone: form.value.mobile_number,
          message: smsMessage
        }
      })
    } catch (smsErr) {
      console.error('Failed to send welcome SMS:', smsErr)
    }

    showAddModal.value = false
    form.value = { name: '', mobile_number: '', paid_amount: '' as any, added_balance: '' as any, offer_id: '' }
    await fetchCustomers()


  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}



const handleQuickTx = async () => {
  try {
    loading.value = true
    
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (!currentUser) throw new Error(t('customers.errors.login_required'))

    const customer = selectedCustomer.value
    const balanceBefore = Number(customer.balance)
    let balanceAfter = balanceBefore

    if (txForm.value.type === 'deposit') {
      balanceAfter += Number(txForm.value.amount)
    } else {
      balanceAfter -= Number(txForm.value.amount)
    }

    if (balanceAfter < 0) throw new Error(t('customers.errors.insufficient_balance'))

    // 1. Calculate Saving
    let savingAmount = 0
    if (txForm.value.type === 'deposit' && txForm.value.offer_id) {
      const offer = availableOffers.value.find(o => o.id === txForm.value.offer_id)
      if (offer) {
        savingAmount = Number(offer.discount || 0)
      }
    } else if (txForm.value.type === 'withdrawal') {
      if (txForm.value.service_type === 'prepaid') {
        // Check if customer has an active subscription for discount calculation
        const { data: activeSubs } = await client
          .from('customer_subscriptions')
          .select('*, offer:subscription_offers(*)')
          .eq('customer_id', customer.id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .limit(1)
        
        const activeSub = activeSubs?.[0]
        if (activeSub && activeSub.offer) {
          savingAmount = Number(activeSub.offer.discount || 0)
        }
      } else if (txForm.value.service_type === 'offer') {
        const offer = availableOffers.value.find(o => o.id === txForm.value.offer_id)
        if (offer) {
          savingAmount = Number(offer.discount || 0)
        }
      }
    }

    // 2. Update Customer Balance and Total Saved
    const isPrepaidWithdrawal = txForm.value.type === 'withdrawal' && txForm.value.service_type === 'prepaid'
    const isOfferWithdrawal = txForm.value.type === 'withdrawal' && txForm.value.service_type === 'offer'
    const isDeposit = txForm.value.type === 'deposit'
    const newTotalSaved = (isPrepaidWithdrawal || isOfferWithdrawal || (isDeposit && txForm.value.offer_id))
      ? (Number(customer.total_saved) || 0) + savingAmount
      : (Number(customer.total_saved) || 0)
    
    if (isDeposit || isPrepaidWithdrawal || isOfferWithdrawal) {
      const { error: custError } = await client.from('customers').update({
        balance: isOfferWithdrawal ? balanceBefore : balanceAfter,
        total_saved: newTotalSaved
      }).eq('id', customer.id)
      if (custError) throw custError
    }

    // 3. Create Transaction
    await client.from('transactions').insert({
      customer_id: customer.id,
      shop_owner_id: currentUser.id,
      type: txForm.value.type,
      amount: txForm.value.type === 'withdrawal' && txForm.value.service_type === 'offer' ? 0 : txForm.value.amount,
      balance_before: balanceBefore,
      balance_after: isDeposit || isPrepaidWithdrawal ? balanceAfter : balanceBefore,
      note: txForm.value.service_type === 'offer' ? `استخدام عرض: ${txForm.value.note}` : txForm.value.note,
      offer_id: (txForm.value.type === 'deposit' && txForm.value.offer_id) ? txForm.value.offer_id : (txForm.value.service_type === 'offer' ? txForm.value.offer_id || null : null)
    })

    showTxModal.value = false
    
    // 4. Handle Subscription (if selected during deposit)
    if (txForm.value.type === 'deposit' && txForm.value.offer_id) {
      const offer = availableOffers.value.find(o => o.id === txForm.value.offer_id)
      if (offer) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + offer.duration)

        await client.from('customer_subscriptions').insert({
          customer_id: customer.id,
          offer_id: offer.id,
          shop_owner_id: currentUser.id,
          expires_at: expiresAt.toISOString()
        })
      }
    }

    // 5. Send SMS to Customer
    try {
      const shopName = profile.value?.shop_name || 'Tqdr Plus'
      let smsMessage = ''

      if (txForm.value.type === 'deposit') {
        if (txForm.value.offer_id) {
          const offer = availableOffers.value.find(o => o.id === txForm.value.offer_id)
          if (offer) {
            smsMessage = t('customers.sms.subscription_success', {
              offer: offer.name,
              shop: shopName,
              balance: balanceAfter,
              savings: savingAmount,
              total: newTotalSaved
            })
          }
        } else {
          smsMessage = t('customers.sms.welcome', { shop: shopName, balance: balanceAfter })
        }
      } else if (txForm.value.type === 'withdrawal' && txForm.value.service_type === 'prepaid') {
        // Prepaid withdrawal: deduction message with savings
        if (savingAmount > 0) {
          smsMessage = t('customers.sms.withdrawal_success_saved', {
            amount: txForm.value.amount,
            shop: shopName,
            balance: balanceAfter,
            savings: savingAmount,
            total: newTotalSaved
          })
        } else {
          smsMessage = t('customers.sms.withdrawal_success_no_savings', {
            amount: txForm.value.amount,
            shop: shopName,
            balance: balanceAfter
          })
        }
      } else if (txForm.value.service_type === 'offer') {
        // Offer usage: remaining uses message
        const { data: subData } = await client
          .from('customer_subscriptions')
          .select('*, offer:subscription_offers(*)')
          .eq('customer_id', customer.id)
          .eq('offer_id', txForm.value.offer_id)
          .gte('expires_at', new Date().toISOString())
          .single()
        
        if (subData) {
          const expiresDate = new Date(subData.expires_at)
          const now = new Date()
          const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          const usedCount = (subData.used_count || 0) + 1
          const remaining = Math.max(0, (subData.offer?.usage_limit || 0) - usedCount)
          smsMessage = t('customers.sms.offer_used', {
            offer: subData.offer?.name || '',
            shop: shopName,
            remaining,
            days: daysLeft
          })
        }
      }

      if (smsMessage) {
        await $fetch('/api/sms/send', {
          method: 'POST',
          body: { phone: customer.mobile_number, message: smsMessage }
        })
      }
    } catch (smsErr) {
      console.error('Failed to send transaction SMS:', smsErr)
    }

    showTxModal.value = false
    txForm.value = { type: 'deposit', amount: '' as any, paid_amount: '' as any, saved_amount: '' as any, note: '', offer_id: '', service_type: 'prepaid' }
    await fetchCustomers()

  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}


const handleUpdateCustomer = async () => {
  try {
    loading.value = true
    const { error } = await client.from('customers').update({
      name: form.value.name,
      mobile_number: form.value.mobile_number
    }).eq('id', selectedCustomer.value.id)


    if (error) throw error
    
    showEditModal.value = false
    form.value = { name: '', mobile_number: '', paid_amount: '' as any, added_balance: '' as any, offer_id: '' }
    await fetchCustomers()
  } catch (e: any) {

    if (import.meta.client) alert(e.message)
  } finally {
    loading.value = false
  }
}

const confirmDelete = async () => {
  if (!customerToDelete.value) return
  
  try {
    loading.value = true
    const id = customerToDelete.value.id
    
    await client.from('transactions').delete().eq('customer_id', id)
    
    const { error } = await client.from('customers').delete().eq('id', id)
    if (error) throw error
    
    showDeleteModal.value = false
    customerToDelete.value = null
    await fetchCustomers()
  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}


const handleDeleteCustomer = (customer: any) => {
  customerToDelete.value = customer
  showDeleteModal.value = true
}


const openEditModal = (customer: any) => {
  selectedCustomer.value = customer
  form.value = {
    name: customer.name,
    mobile_number: customer.mobile_number,
    login_password: '',
    paid_amount: '' as any,

    added_balance: '' as any,
    offer_id: ''
  }
  showEditModal.value = true
}

const openTxModal = (customer: any, type: 'deposit' | 'withdrawal') => {
  selectedCustomer.value = customer
  txForm.value.type = type
  showTxModal.value = true
}

const viewHistory = async (customer: any) => {
  selectedCustomer.value = customer
  showHistoryModal.value = true
  const { data } = await client
    .from('transactions')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
  customerHistory.value = data || []
}

onMounted(async () => {
  await fetchCustomers()
  await fetchOffers()

  const { data: { user: currentUser } } = await client.auth.getUser()
  if (currentUser) {
    const { data } = await client.from('profiles').select('*').eq('id', currentUser.id).maybeSingle()
    profile.value = data
  }
})
watch(searchQuery, fetchCustomers)
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('customers.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('customers.subtitle') }}</p>
      </div>
      
      <button 
        v-if="!isSuspended"
        @click="showAddModal = true"
        class="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 premium-btn"
      >
        <Plus class="w-5 h-5" />
        <span>{{ $t('customers.add_new') }}</span>
      </button>
      <div v-else class="flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <p class="text-red-500 font-bold text-xs">{{ $t('customers.account_suspended') }}</p>
      </div>
    </div>

    <!-- Filters & Search -->
    <BaseCard>
      <div class="relative">
        <Search :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          v-model="searchQuery"
          type="text" 
          :placeholder="$t('customers.search_placeholder')"
          :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
          class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white"
        />
      </div>
    </BaseCard>

    <!-- Customers Table -->
    <BaseCard class="!p-0 overflow-hidden shadow-xl border-white/5">
      <div class="overflow-x-auto">
        <table class="w-full" :class="locale === 'ar' ? 'text-right' : 'text-left'">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <th class="px-6 py-5 text-sm font-bold text-slate-500">{{ $t('customers.table.name') }}</th>
              <th class="px-6 py-5 text-sm font-bold text-slate-500">{{ $t('customers.table.phone') }}</th>
              <th class="px-6 py-5 text-sm font-bold text-slate-500">{{ $t('customers.table.balance') }}</th>
              <th class="px-6 py-5 text-sm font-bold text-slate-500 text-center">{{ $t('customers.quick_actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="customer in customers" :key="customer.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
              <td class="px-6 py-5">
                <div class="font-black text-slate-900 dark:text-white text-lg">{{ customer.name }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ $t('customers.since') }} {{ new Date(customer.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') }}</div>
              </td>

              <td class="px-6 py-5">
                <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Smartphone class="w-4 h-4 text-emerald-500" />
                  <span class="font-mono">{{ customer.mobile_number }}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <span class="text-xl font-black text-emerald-500">{{ customer.balance }} {{ $t('common.currency') }}</span>
                  <span class="text-[10px] text-slate-400">{{ $t('customers.available_balance') }}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center justify-center gap-3">
                  <div class="flex items-center gap-1">
                    <button 
                      @click="openTxModal(customer, 'deposit')" 
                      class="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                      :title="$t('customers.deposit_new')"
                    >
                      <PlusCircle class="w-5 h-5" />
                    </button>
                    <button 
                      @click="openTxModal(customer, 'withdrawal')" 
                      class="p-2 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                      :title="$t('customers.withdraw_balance')"
                    >
                      <MinusCircle class="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div class="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-1"></div>
                  
                  <div class="flex items-center gap-1">
                    <button @click="viewHistory(customer)" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all active:scale-90" :title="$t('customers.history')">
                      <History class="w-5 h-5" />
                    </button>
                    <button @click="openEditModal(customer)" class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all active:scale-90" :title="$t('common.edit')">
                      <Edit2 class="w-5 h-5" />
                    </button>
                    <button @click="handleDeleteCustomer(customer)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all active:scale-90" :title="$t('common.delete')">
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="customers.length === 0 && !loading">
              <td colspan="4" class="px-6 py-20 text-center text-slate-500">
                <div class="flex flex-col items-center gap-4 opacity-40">
                  <Users class="w-20 h-20 text-slate-300" />
                  <p class="text-xl font-bold">{{ $t('customers.no_customers') }}</p>
                  <p class="text-sm">{{ $t('customers.start_adding') }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <p class="text-sm text-slate-500 font-medium">
          {{ $t('common.showing') }} 
          <span class="font-bold text-slate-900 dark:text-white">{{ (currentPage - 1) * pageSize + 1 }}</span>
          {{ $t('common.to') }}
          <span class="font-bold text-slate-900 dark:text-white">{{ Math.min(currentPage * pageSize, totalCustomers) }}</span>
          {{ $t('common.of') }}
          <span class="font-bold text-slate-900 dark:text-white">{{ totalCustomers }}</span>
        </p>
        
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--; fetchCustomers()"
            :disabled="currentPage === 1"
            class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
          >
            {{ locale === 'ar' ? '←' : '→' }}
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="page in totalPages" 
              :key="page"
              @click="currentPage = page; fetchCustomers()"
              class="w-10 h-10 rounded-xl font-bold transition-all shadow-sm"
              :class="currentPage === page ? 'bg-emerald-500 text-slate-950 scale-110 z-10' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50'"
            >
              {{ page }}
            </button>
          </div>

          <button 
            @click="currentPage++; fetchCustomers()"
            :disabled="currentPage === totalPages"
            class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
          >
            {{ locale === 'ar' ? '→' : '←' }}
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Modal: Edit Customer -->
    <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showEditModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Edit2 class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('customers.edit_customer') }}</h3>
              <p class="text-sm text-slate-500">{{ $t('customers.update_data') }}</p>
            </div>
          </div>
          <button @click="showEditModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateCustomer" class="p-10 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User class="w-4 h-4 text-amber-500" /> {{ $t('customers.table.name') }}
              </label>
              <input v-model="form.name" type="text" required placeholder="Ex: Mohammed..." class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-amber-500" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Smartphone class="w-4 h-4 text-amber-500" /> {{ $t('customers.table.phone') }}
              </label>
              <input v-model="form.mobile_number" type="tel" required placeholder="05xxxxxxxx" class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>



          <button type="submit" class="w-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black py-5 rounded-[24px] text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10">
            {{ $t('customers.update_data') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Modal: Add New Customer -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showAddModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Plus class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('customers.add_new') }}</h3>
              <p class="text-sm text-slate-500">{{ $t('customers.subtitle') }}</p>
            </div>
          </div>
          <button @click="showAddModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleAddCustomer" class="p-10 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User class="w-4 h-4 text-emerald-500" /> {{ $t('customers.table.name') }} ({{ $t('common.optional') }})
              </label>
              <input v-model="form.name" type="text" placeholder="Ex: Mohammed..." class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Smartphone class="w-4 h-4 text-emerald-500" /> {{ $t('customers.table.phone') }}
              </label>
              <input v-model="form.mobile_number" type="tel" required placeholder="05xxxxxxxx" class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>



          <!-- Subscription Offers -->
          <div class="space-y-4">
            <label class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <DollarSign class="w-4 h-4 text-emerald-500" /> {{ $t('customers.select_offer') }}
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                type="button"
                @click="form.offer_id = ''"
                :class="form.offer_id === '' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent'"
                class="px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all text-center"
              >
                {{ $t('customers.no_offer_prepaid') }}
              </button>
              <button 
                v-for="offer in availableOffers" 
                :key="offer.id"
                type="button"
                @click="form.offer_id = offer.id; form.added_balance = offer.price; form.paid_amount = offer.price"
                :class="form.offer_id === offer.id ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent'"
                class="px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1"
              >
                <span>{{ offer.name }}</span>
                <span class="text-[10px] opacity-70">{{ offer.price }} {{ $t('common.currency') }} - {{ offer.duration }} {{ $t('subscriptions.duration_unit') }}</span>
              </button>
            </div>
          </div>


          <div class="bg-emerald-500/5 p-8 rounded-[32px] border border-emerald-500/10 space-y-6">
            <div class="flex items-center gap-2 text-emerald-600 font-black mb-2">
              <Wallet class="w-5 h-5" />
              <span>{{ $t('customers.opening_balance') }}</span>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold text-slate-500">{{ $t('customers.paid_amount') }}</label>
                <input v-model="form.paid_amount" type="number" step="0.01" :readonly="form.offer_id !== ''" :class="form.offer_id !== '' ? 'opacity-50 cursor-not-allowed' : ''" class="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold text-slate-500">{{ $t('customers.added_balance') }}</label>
                <input v-model="form.added_balance" type="number" step="0.01" :readonly="form.offer_id !== ''" :class="form.offer_id !== '' ? 'opacity-50 cursor-not-allowed' : ''" class="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-4 py-3 font-bold text-lg text-emerald-500 focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black py-5 rounded-[24px] text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            <span>{{ $t('customers.save_customer_sub') }}</span>
          </button>

        </form>
      </div>
    </div>

    <!-- Modal: Quick Transaction (Deposit/Withdrawal) -->
    <div v-if="showTxModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showTxModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" :class="txForm.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-red-500/10'">
          <div class="flex items-center gap-4">
            <div :class="txForm.type === 'deposit' ? 'bg-emerald-500' : 'bg-red-500'" class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <component :is="txForm.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ txForm.type === 'deposit' ? $t('customers.deposit_new') : $t('customers.withdraw_balance') }}</h3>
              <p class="text-sm text-slate-500">{{ selectedCustomer?.name }}</p>
            </div>
          </div>
          <button @click="showTxModal = false" class="p-2 hover:bg-black/5 rounded-xl transition-all">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleQuickTx" class="p-10 space-y-8">
          <div class="space-y-4">
            <label class="text-center block text-sm font-bold text-slate-500 uppercase tracking-widest">{{ $t('transactions.amount') }}</label>
            <input 
              v-model="txForm.amount" 
              type="number" 
              :required="txForm.service_type !== 'offer'"
              autofocus
              step="0.01" 
              placeholder="0.00"
              class="w-full bg-transparent border-none text-center text-6xl font-black text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-800" 
              :readonly="(txForm.type === 'deposit' && txForm.offer_id !== '') || (txForm.type === 'withdrawal' && txForm.service_type === 'offer')"
              :class="((txForm.type === 'deposit' && txForm.offer_id !== '') || (txForm.type === 'withdrawal' && txForm.service_type === 'offer')) ? 'opacity-50 cursor-not-allowed' : ''"
            />
          </div>

          <!-- Subscription Selection in Tx Modal (for deposit) -->
          <div v-if="txForm.type === 'deposit' && availableOffers.length > 0" class="space-y-4">
            <label class="text-center block text-sm font-bold text-slate-500 uppercase tracking-widest">{{ $t('customers.select_offer') }}</label>
            <div class="grid grid-cols-1 gap-3">
              <button 
                type="button"
                @click="txForm.offer_id = ''; txForm.amount = ''; txForm.paid_amount = '';"
                :class="txForm.offer_id === '' ? 'bg-emerald-500 text-slate-950 border-emerald-500 scale-105 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:bg-slate-200'"
                class="px-6 py-4 rounded-[24px] border-2 text-base font-black transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-4">
                  <div :class="txForm.offer_id === '' ? 'bg-white/20' : 'bg-emerald-500/10'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                    <Wallet class="w-5 h-5" :class="txForm.offer_id === '' ? 'text-slate-950' : 'text-emerald-500'" />
                  </div>
                  <span>{{ $t('customers.no_offer_prepaid') }}</span>
                </div>
              </button>

              <button 
                type="button"
                v-for="offer in availableOffers" 
                :key="offer.id"
                @click="txForm.offer_id = offer.id; txForm.amount = offer.price; txForm.paid_amount = offer.price;"
                :class="txForm.offer_id === offer.id ? 'bg-emerald-500 text-slate-950 border-emerald-500 scale-105 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:bg-slate-200'"
                class="px-6 py-5 rounded-[24px] border-2 text-base font-black transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-4">
                  <div :class="txForm.offer_id === offer.id ? 'bg-white/20' : 'bg-emerald-500/10'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                    <Sparkles class="w-5 h-5 text-emerald-500" />
                  </div>
                  <span>{{ offer.name }}</span>
                </div>
                <div class="text-lg font-black">{{ offer.price }} {{ $t('common.currency') }}</div>
              </button>
            </div>
          </div>

          <!-- Withdrawal Type Selector -->
          <div v-if="txForm.type === 'withdrawal'" class="space-y-4">
            <label class="text-center block text-sm font-bold text-slate-500 uppercase tracking-widest">{{ $t('customers.withdrawal_type_title') }}</label>
            <div class="grid grid-cols-1 gap-3">
              <button
                type="button"
                @click="txForm.service_type = 'prepaid'; txForm.offer_id = ''"
                :class="txForm.service_type === 'prepaid' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-transparent'"
                class="px-6 py-4 rounded-[20px] border-2 text-sm font-black transition-all flex items-center gap-4"
              >
                <div :class="txForm.service_type === 'prepaid' ? 'bg-white/20' : 'bg-red-500/10'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Wallet class="w-5 h-5" :class="txForm.service_type === 'prepaid' ? 'text-white' : 'text-red-500'" />
                </div>
                <div class="text-right flex-1">
                  <p class="font-black">{{ $t('customers.withdrawal_type_prepaid') }}</p>
                  <p class="text-xs opacity-70">{{ $t('common.currency') }} {{ selectedCustomer?.balance }}</p>
                </div>
              </button>

              <button
                v-for="offer in availableOffers"
                :key="offer.id"
                type="button"
                @click="txForm.service_type = 'offer'; txForm.offer_id = offer.id; txForm.amount = 0"
                :class="txForm.service_type === 'offer' && txForm.offer_id === offer.id ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-transparent'"
                class="px-6 py-4 rounded-[20px] border-2 text-sm font-black transition-all flex items-center gap-4"
              >
                <div :class="txForm.service_type === 'offer' && txForm.offer_id === offer.id ? 'bg-white/20' : 'bg-amber-500/10'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Sparkles class="w-5 h-5" :class="txForm.service_type === 'offer' && txForm.offer_id === offer.id ? 'text-slate-950' : 'text-amber-500'" />
                </div>
                <div class="text-right flex-1">
                  <p class="font-black">{{ $t('customers.withdrawal_type_offer') }}</p>
                  <p class="text-xs opacity-70">{{ offer.name }} - {{ $t('customers.remaining_uses_label') }}</p>
                </div>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            :class="txForm.type === 'deposit' ? 'bg-emerald-500 shadow-emerald-500/20' : txForm.service_type === 'offer' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'"
            class="w-full text-slate-950 font-black py-6 rounded-[28px] text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            <span>{{ txForm.type === 'withdrawal' && txForm.service_type === 'offer' ? $t('customers.remaining_uses_label') : $t('common.confirm') }}</span>
          </button>

        </form>
      </div>
    </div>

    <!-- Modal: Transaction History (Simple Version) -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showHistoryModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <History class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('customers.history') }}</h3>
              <p class="text-sm text-slate-500">{{ selectedCustomer?.name }}</p>
            </div>
          </div>
          <button @click="showHistoryModal = false" class="p-2 hover:bg-black/5 rounded-xl transition-all">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          <div v-if="customerHistory.length === 0" class="p-20 text-center text-slate-400">{{ $t('dashboard.customer_stats.no_transactions') }}</div>
          <div v-for="tx in customerHistory" :key="tx.id" class="mb-4 p-5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="w-12 h-12 rounded-2xl flex items-center justify-center font-black">
                {{ tx.type === 'deposit' ? '+' : '-' }}
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-white">{{ tx.type === 'deposit' ? $t('customers.deposit_new') : $t('customers.withdraw_balance') }}</p>
                <p class="text-[10px] text-slate-500">{{ new Date(tx.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') }}</p>
                <p v-if="tx.note" class="text-xs text-slate-400 mt-1 italic">"{{ tx.note }}"</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-black text-lg" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                {{ tx.amount }} {{ $t('common.currency') }}
              </p>
              <p class="text-[10px] text-slate-400">{{ $t('dashboard.customer_stats.balance_after', { balance: tx.balance_after }) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Modal: Delete Confirmation -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showDeleteModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 text-center space-y-6">
          <div class="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-red-500/5">
            <Trash2 class="w-10 h-10" />
          </div>
          
          <div class="space-y-2">
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('common.delete_confirm', 'Delete?') }}</h3>
            <p class="text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              {{ $t('common.delete_warning', { name: customerToDelete?.name }) }}
              <br/>
              <span class="text-red-500 text-xs font-bold">{{ $t('common.delete_irreversible') }}</span>
            </p>
          </div>

          <div class="flex flex-col gap-3 pt-4">
            <button 
              @click="confirmDelete"
              :disabled="loading"
              class="w-full bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3"
            >
              <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ $t('common.confirm_delete') }}</span>
            </button>
            <button 
              @click="showDeleteModal = false"
              :disabled="loading"
              class="w-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Error Notification -->
    <div v-if="showErrorModal" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
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



<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #10b981;
  border-radius: 10px;
}
</style>
