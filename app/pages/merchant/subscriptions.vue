<script setup lang="ts">
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CreditCard, 
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  UserPlus,
  Users,
  Search,
  User
} from 'lucide-vue-next'


definePageMeta({
  layout: 'merchant'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const { t, locale } = useI18n()

const offers = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingOffer = ref(null)

const form = ref({
  name: '',
  price: '',
  usage_limit: '',
  discount: '',
  duration: 30
})

const showCustomerModal = ref(false)
const selectedOffer = ref(null)
const allCustomers = ref([])
const subscribedCustomers = ref([])
const customerSearch = ref('')
const subLoading = ref(false)
const showDeleteModal = ref(false)
const offerToDelete = ref(null)
const showErrorModal = ref(false)
const errorMsg = ref('')
const showUnsubConfirm = ref(false)
const subToUnsub = ref(null)





const fetchOffers = async () => {
  const { data: { user: authUser } } = await client.auth.getUser()
  const userId = authUser?.id
  
  if (!userId) return

  try {
    loading.value = true
    console.log('Fetching offers for:', userId)
    const { data, error } = await client
      .from('subscription_offers')
      .select('*')
      .eq('shop_owner_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    console.log('Offers fetched successfully:', data)
    offers.value = data || []
  } catch (e: any) {
    console.error('Error fetching offers:', e)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const { data: { user: authUser } } = await client.auth.getUser()
    if (!authUser) throw new Error(t('auth.no_profile_error'))

    const payload = {
      name: form.value.name,
      price: parseFloat(form.value.price),
      usage_limit: parseInt(form.value.usage_limit),
      discount: parseFloat(form.value.discount),
      duration: parseInt(form.value.duration),
      shop_owner_id: authUser.id
    }

    console.log('Inserting subscription offer with payload:', payload)

    if (editingOffer.value) {
      const { error } = await client
        .from('subscription_offers')
        .update(payload)
        .eq('id', editingOffer.value.id)
      if (error) throw error
    } else {
      const { error } = await client
        .from('subscription_offers')
        .insert(payload)
      if (error) throw error
    }

    showModal.value = false
    editingOffer.value = null
    form.value = { name: '', price: '', usage_limit: '', discount: '', duration: 30 }
    await fetchOffers()
  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}


const handleEdit = (offer: any) => {
  editingOffer.value = offer
  form.value = {
    name: offer.name,
    price: offer.price.toString(),
    usage_limit: offer.usage_limit.toString(),
    discount: offer.discount.toString(),
    duration: offer.duration
  }
  showModal.value = true
}

const confirmDelete = async () => {
  if (!offerToDelete.value) return
  try {
    loading.value = true
    const { error } = await client
      .from('subscription_offers')
      .delete()
      .eq('id', offerToDelete.value.id)
    if (error) throw error
    
    showDeleteModal.value = false
    offerToDelete.value = null
    await fetchOffers()
  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}


const handleDelete = (offer: any) => {
  offerToDelete.value = offer
  showDeleteModal.value = true
}


const fetchAllCustomers = async () => {
  const { data: { user: authUser } } = await client.auth.getUser()
  if (!authUser) return

  const { data } = await client.from('customers')
    .select('id, name, mobile_number')
    .eq('shop_owner_id', authUser.id)
  allCustomers.value = data || []
}


const fetchSubscribers = async (offerId: string) => {
  try {
    subLoading.value = true
    const { data, error } = await client
      .from('customer_subscriptions')
      .select('*, customer:customers(name, mobile_number)')
      .eq('offer_id', offerId)
    
    if (error) throw error
    subscribedCustomers.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    subLoading.value = false
  }
}

const openManageCustomers = async (offer: any) => {
  selectedOffer.value = offer
  showCustomerModal.value = true
  await fetchAllCustomers()
  await fetchSubscribers(offer.id)
}

const handleAddSubscriber = async (customerId: string) => {
  try {
    subLoading.value = true
    const { data: { user: authUser } } = await client.auth.getUser()
    if (!authUser) throw new Error(t('auth.errors.login_required', 'Please login first'))

    const offer = selectedOffer.value
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + offer.duration)

    const { error } = await client.from('customer_subscriptions').insert({
      customer_id: customerId,
      offer_id: offer.id,
      shop_owner_id: authUser.id,
      expires_at: expiresAt.toISOString()
    })


    if (error) throw error

    // 3. Create Transaction for tracking (even if free)
    const { data: custProfile } = await client.from('customers').select('balance').eq('id', customerId).single()
    await client.from('transactions').insert({
      customer_id: customerId,
      shop_owner_id: authUser.id,
      offer_id: offer.id,
      type: 'deposit',
      amount: 0,
      balance_before: custProfile?.balance || 0,
      balance_after: custProfile?.balance || 0,
      note: `${t('nav.subscriptions_nav')}: ${offer.name}`
    })

    await fetchSubscribers(offer.id)
    
    // Optional: Send SMS
    const customer = allCustomers.value.find(c => c.id === customerId)
    if (customer) {
      const { data: profile } = await client.from('profiles').select('shop_name').eq('id', authUser.id).single()
      const shopName = profile?.shop_name || t('brand.name')
      const smsMessage = t('customers.sms.subscription_activated', { 
        offer: offer.name, 
        shop: shopName, 
        price: offer.price,
        uses: offer.usage_limit,
        duration: offer.duration
      })
      await $fetch('/api/sms/send', {
        method: 'POST',
        body: { phone: customer.mobile_number, message: smsMessage }
      })
    }
  } catch (e: any) {

    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    subLoading.value = false
  }
}


const confirmUnsubscribe = async () => {
  if (!subToUnsub.value) return
  try {
    subLoading.value = true
    const { error } = await client.from('customer_subscriptions').delete().eq('id', subToUnsub.value)
    if (error) throw error
    showUnsubConfirm.value = false
    subToUnsub.value = null
    await fetchSubscribers(selectedOffer.value.id)
  } catch (e: any) {
    errorMsg.value = e.message
    showErrorModal.value = true
  } finally {
    subLoading.value = false
  }
}

const handleRemoveSubscriber = (subId: string) => {
  subToUnsub.value = subId
  showUnsubConfirm.value = true
}


const filteredCustomers = computed(() => {
  if (!customerSearch.value) return allCustomers.value.slice(0, 5)
  return allCustomers.value.filter(c => 
    c.name?.toLowerCase().includes(customerSearch.value.toLowerCase()) || 
    c.mobile_number?.includes(customerSearch.value)
  ).slice(0, 5)
})


watch(() => user.value?.id, (newId) => {
  if (newId) fetchOffers()
}, { immediate: true })

onMounted(() => {
  fetchOffers()
})
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('subscriptions.offers') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('subscriptions.subtitle') }}</p>
      </div>
      
      <button 
        @click="showModal = true"
        class="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
      >
        <Plus class="w-5 h-5" />
        <span>{{ $t('subscriptions.add_offer') }}</span>
      </button>
    </div>

    <!-- Offers Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard 
        v-for="offer in offers" :key="offer.id"
        class="group relative overflow-hidden !p-0 hover:scale-[1.02] transition-all duration-300"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <CreditCard class="w-6 h-6" />
            </div>
            <div class="flex gap-2">
              <button @click="openManageCustomers(offer)" class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all" :title="$t('subscriptions.manage_subscribers')">
                <UserPlus class="w-4 h-4" />
              </button>
              <button @click="handleEdit(offer)" class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all">
                <Edit2 class="w-4 h-4" />
              </button>
              <button @click="handleDelete(offer)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                <Trash2 class="w-4 h-4" />
              </button>

            </div>

          </div>

          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">{{ offer.name }}</h3>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <Clock class="w-4 h-4" />
              <span>{{ $t('subscriptions.duration_days', { days: offer.duration }) }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ $t('subscriptions.usage_times', { count: offer.usage_limit }) }}</span>
            </div>
          </div>

          <div class="flex items-end justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ $t('subscriptions.price') }}</p>
              <p class="text-2xl font-black text-emerald-500">{{ offer.price }} <span class="text-xs">{{ $t('common.currency') }}</span></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ $t('subscriptions.discount') }}</p>
              <p class="text-lg font-bold text-amber-500">{{ offer.discount }} <span class="text-xs">{{ $t('common.currency') }}</span></p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Empty State -->
      <div v-if="offers.length === 0 && !loading" class="md:col-span-2 lg:col-span-3">
        <BaseCard class="!p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 bg-transparent">
          <div class="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <CreditCard class="w-10 h-10" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">{{ $t('subscriptions.no_offers') }}</h3>
          <p class="text-slate-500 mb-8 max-w-sm mx-auto">{{ $t('subscriptions.no_offers_desc') }}</p>
          <button 
            @click="showModal = true"
            class="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:shadow-xl transition-all"
          >
            <Plus class="w-5 h-5" />
            <span>{{ $t('subscriptions.add_first') }}</span>
          </button>
        </BaseCard>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div @click="showModal = false" class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>
      <BaseCard class="w-full max-w-lg relative z-10 animate-slide-up !p-8 rounded-[40px]">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">
            {{ editingOffer ? $t('subscriptions.edit_offer') : $t('subscriptions.add_offer') }}
          </h3>
          <button @click="showModal = false; editingOffer = null" class="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('subscriptions.offer_name') }}</label>
            <input 
              v-model="form.name"
              type="text" 
              required
              class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white"
              :placeholder="$t('subscriptions.offer_name')"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('subscriptions.price') }}</label>
              <input 
                v-model="form.price"
                type="number" 
                required
                class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white"
                placeholder="100"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('subscriptions.discount') }}</label>
              <input 
                v-model="form.discount"
                type="number" 
                required
                class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white"
                placeholder="10"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('subscriptions.usage_limit') }}</label>
              <input 
                v-model="form.usage_limit"
                type="number" 
                required
                class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white"
                placeholder="5"
              />
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('subscriptions.duration') }}</label>
              <select 
                v-model="form.duration"
                required
                class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white appearance-none"
              >
                <option :value="30">30 {{ $t('subscriptions.duration_unit') }}</option>
                <option :value="60">60 {{ $t('subscriptions.duration_unit') }}</option>
                <option :value="90">90 {{ $t('subscriptions.duration_unit') }}</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
            <span>{{ editingOffer ? $t('subscriptions.save_changes') : $t('subscriptions.add_offer') }}</span>
          </button>
        </form>
      </BaseCard>
    </div>

    <!-- Modal: Manage Subscribers -->
    <div v-if="showCustomerModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div @click="showCustomerModal = false" class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>
      <BaseCard class="w-full max-w-2xl relative z-10 animate-slide-up !p-0 rounded-[40px] overflow-hidden">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-emerald-500/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Users class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('subscriptions.manage_subscribers') }}</h3>
              <p class="text-sm text-slate-500">{{ $t('nav.subscriptions_nav') }}: {{ selectedOffer?.name }}</p>
            </div>
          </div>
          <button @click="showCustomerModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div class="p-8 space-y-8">
          <!-- Add New Subscriber -->
          <div class="space-y-4">
            <label class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ $t('subscriptions.add_customer_to_offer') }}</label>
            <div class="relative">
              <Search class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                v-model="customerSearch"
                type="text" 
                :placeholder="$t('subscriptions.search_customer')"
                class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl pr-12 pl-4 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div v-if="customerSearch" class="grid grid-cols-1 gap-2 mt-2 p-2 bg-slate-50 dark:bg-white/5 rounded-2xl">
              <div 
                v-for="customer in filteredCustomers" 
                :key="customer.id"
                class="flex items-center justify-between p-3 hover:bg-emerald-500/10 rounded-xl transition-all group"
              >
                <div>
                  <p class="font-bold text-slate-900 dark:text-white text-sm">{{ customer.name }}</p>
                  <p class="text-[10px] text-slate-500">{{ customer.mobile_number }}</p>
                </div>
                <button 
                  @click="handleAddSubscriber(customer.id)"
                  :disabled="subLoading"
                  class="bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-black hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <span v-if="subLoading" class="w-3 h-3 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  <span>{{ $t('subscriptions.add_btn') }}</span>
                </button>

              </div>
            </div>
          </div>

          <!-- Current Subscribers List -->
          <div class="space-y-4">
            <h4 class="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Users class="w-4 h-4" /> {{ $t('subscriptions.current_subscribers', { count: subscribedCustomers.length }) }}
            </h4>
            
            <div class="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar pr-2">
              <div v-if="subscribedCustomers.length === 0" class="text-center py-10 opacity-40">
                {{ $t('subscriptions.no_subscribers') }}
              </div>
              <div 
                v-for="sub in subscribedCustomers" 
                :key="sub.id"
                class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group border border-transparent hover:border-emerald-500/20 transition-all"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500">
                    <User class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 dark:text-white text-sm">{{ sub.customer?.name }}</p>
                    <p class="text-[10px] text-slate-500">{{ $t('transactions.date') }}: {{ new Date(sub.expires_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') }}</p>
                  </div>
                </div>
                <button 
                  @click="handleRemoveSubscriber(sub.id)"
                  class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  :title="$t('subscriptions.remove_from_offer')"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Modal: Delete Confirmation -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showDeleteModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 text-center space-y-6">
          <div class="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-red-500/5">
            <Trash2 class="w-10 h-10" />
          </div>
          
          <div class="space-y-2">
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('common.delete_confirm') }}</h3>
            <p class="text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              {{ $t('subscriptions.delete_offer_confirm', { name: offerToDelete?.name }) }}
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
    <div v-if="showErrorModal" class="fixed inset-0 z-[130] flex items-center justify-center p-4">
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

    <!-- Modal: Unsubscribe Confirmation -->
    <div v-if="showUnsubConfirm" class="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" @click="showUnsubConfirm = false"></div>
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-8 text-center space-y-6">
          <div class="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
            <Users class="w-10 h-10" />
          </div>
          <div class="space-y-2">
            <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('subscriptions.unsubscribe_confirm_title') }}</h3>
            <p class="text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              {{ $t('subscriptions.unsubscribe_confirm_desc') }}
            </p>
          </div>
          <div class="flex flex-col gap-3 pt-4">
            <button 
              @click="confirmUnsubscribe"
              :disabled="subLoading"
              class="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3"
            >
              <span v-if="subLoading" class="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
              <span>{{ $t('subscriptions.confirm_remove') }}</span>
            </button>
            <button 
              @click="showUnsubConfirm = false"
              :disabled="subLoading"
              class="w-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>



