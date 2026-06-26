<script setup lang="ts">
import { 
  Wallet, 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Bell,
  LogOut,
  CreditCard
} from 'lucide-vue-next'

definePageMeta({
})

const { t, locale } = useI18n()
const user = useSupabaseUser()
const client = useSupabaseClient()

const customerData = ref(null)
const transactions = ref([])
const loading = ref(true)

const fetchData = async () => {
  try {
    loading.value = true
    
    // Fetch customer profile/balance
    // In our schema, a 'customer' is an entry in the 'customers' table.
    // However, if a user logs in as a 'customer' role, they might not be in the 'customers' table 
    // unless the shop owner added them as a user.
    // For now, let's assume 'customer' users are linked by their email/id if they exist in customers table.
    
    const { data: customer } = await client
      .from('customers')
      .select('*')
      .eq('mobile_number', user.value.email.split('@')[0]) // Assuming mobile number is used as part of email for now
      .single()
    
    if (customer) {
      customerData.value = customer
      const { data: txs } = await client
        .from('transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
      transactions.value = txs || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-['Tajawal']" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            {{ user.email.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.customer_stats.welcome_guest') }}</h1>
            <p class="text-xs text-slate-500">{{ user.email }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="p-3 bg-white dark:bg-white/5 text-red-500 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <LogOut class="w-5 h-5" />
        </button>
      </div>

      <!-- Balance Card -->
      <div class="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[40px] p-8 text-white shadow-2xl shadow-emerald-500/20">
        <div class="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-2 text-emerald-100 font-bold mb-2">
            <Wallet class="w-5 h-5" />
            <span>{{ $t('dashboard.customer_stats.current_balance') }}</span>
          </div>
          <div class="flex items-end gap-2">
            <span class="text-5xl font-black">{{ customerData?.balance || 0 }}</span>
            <span class="text-xl font-bold mb-1 opacity-80">{{ $t('common.currency') }}</span>
          </div>
          
          <div class="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="text-center">
                <p class="text-[10px] text-emerald-100 uppercase tracking-widest font-bold">{{ $t('dashboard.customer_stats.last_deposit') }}</p>
                <p class="font-bold text-lg">+0 {{ $t('common.currency') }}</p>
              </div>
            </div>
            <button class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-2xl font-bold text-sm transition-all backdrop-blur-md">
              {{ $t('dashboard.customer_stats.request_deposit') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History class="w-5 h-5 text-emerald-500" />
            {{ $t('dashboard.customer_stats.your_transactions') }}
          </h3>
          <button class="text-sm font-bold text-slate-400">{{ $t('dashboard.customer_stats.filter') }}</button>
        </div>

        <div class="space-y-4">
          <div 
            v-for="tx in transactions" 
            :key="tx.id"
            class="glass-card !p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all cursor-pointer group"
          >
            <div class="flex items-center gap-4">
              <div :class="tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'" class="w-12 h-12 rounded-2xl flex items-center justify-center">
                <component :is="tx.type === 'deposit' ? ArrowUpCircle : ArrowDownCircle" class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white">{{ tx.type === 'deposit' ? $t('dashboard.customer_stats.deposit') : $t('dashboard.customer_stats.withdraw') }}</h4>
                <p class="text-[10px] text-slate-500">{{ new Date(tx.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-black text-lg" :class="tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'">
                {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount }}
              </p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ $t('common.currency') }}</p>
            </div>
          </div>

          <div v-if="transactions.length === 0" class="py-20 text-center space-y-4">
            <History class="w-16 h-16 mx-auto opacity-10" />
            <p class="text-slate-500 font-medium italic">{{ $t('dashboard.customer_stats.no_transactions') }}</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-4">
        <button class="p-6 bg-white dark:bg-white/5 rounded-[32px] flex flex-col items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all group shadow-sm">
          <CreditCard class="w-8 h-8 text-emerald-500 group-hover:text-white" />
          <span class="font-bold">{{ $t('dashboard.customer_stats.my_cards') }}</span>
        </button>
        <button class="p-6 bg-white dark:bg-white/5 rounded-[32px] flex flex-col items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all group shadow-sm">
          <Bell class="w-8 h-8 text-emerald-500 group-hover:text-white" />
          <span class="font-bold">{{ $t('dashboard.customer_stats.notifications') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  @apply bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px];
}
</style>
