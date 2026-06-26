<script setup lang="ts">
import { 
  Users, 
  Search, 
  Download,
  Filter,
  ArrowUpRight,
  User,
  Smartphone,
  Wallet,
  Activity,
  Trash2,
  Edit2,
  X,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { t, locale } = useI18n()
const client = useSupabaseClient()

const customers = ref([])
const shops = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedShopId = ref('all')
const subFilter = ref('all') // all, subscribed, prepaid
const showDeleteModal = ref(false)
const customerToDelete = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 6
const totalCustomers = ref(0)
const totalPages = computed(() => Math.ceil(totalCustomers.value / pageSize))

const displayedPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchShops = async () => {
  const { data } = await client
    .from('profiles')
    .select('id, shop_name')
    .eq('role', 'shop_owner')
    .order('shop_name')
  shops.value = data || []
}

const fetchAllCustomers = async () => {
  try {
    loading.value = true
    let query = client
      .from('customers')
      .select('*, shop:profiles!customers_shop_owner_id_fkey(shop_name, email)')
      .order('created_at', { ascending: false })

    if (selectedShopId.value !== 'all') {
      query = query.eq('shop_owner_id', selectedShopId.value)
    }

    if (searchQuery.value) {
      query = query.or(`name.ilike.%${searchQuery.value}%,mobile_number.ilike.%${searchQuery.value}%`)
    }

    // Subscription Filter
    if (subFilter.value !== 'all') {
      // Use transactions with offer_id as the primary source for admin
      const { data: txSubData } = await client
        .from('transactions')
        .select('customer_id')
        .not('offer_id', 'is', null)
      
      const subCustIds = [...new Set((txSubData || []).map(s => s.customer_id))]
      
      if (subFilter.value === 'subscribed') {
        if (subCustIds.length > 0) {
          query = query.in('id', subCustIds)
        } else {
          query = query.eq('id', '00000000-0000-0000-0000-000000000000')
        }
      } else if (subFilter.value === 'prepaid') {
        if (subCustIds.length > 0) {
          query = query.not('id', 'in', `(${subCustIds.join(',')})`)
        }
      }
    }

    const { data, count, error } = await query
      .select('*, shop:profiles!customers_shop_owner_id_fkey(shop_name, email)', { count: 'exact' })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)

    if (error) throw error
    customers.value = data || []
    totalCustomers.value = count || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const confirmDeleteCustomer = (id: string) => {
  customerToDelete.value = id
  showDeleteModal.value = true
}

const handleDeleteCustomer = async () => {
  if (!customerToDelete.value) return
  
  try {
    loading.value = true
    const { error } = await client.from('customers').delete().eq('id', customerToDelete.value)
    
    if (error) throw error
    
    showDeleteModal.value = false
    customerToDelete.value = null
    await fetchAllCustomers()
  } catch (e: any) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

const showEditModal = ref(false)
const editingCustomer = ref<any>(null)
const editForm = ref({
  name: '',
  mobile_number: ''
})

const handleEditCustomer = (customer: any) => {
  editingCustomer.value = customer
  editForm.value = {
    name: customer.name,
    mobile_number: customer.mobile_number
  }
  showEditModal.value = true
}

const handleUpdateCustomer = async () => {
  if (!editingCustomer.value) return
  
  try {
    loading.value = true
    const { error } = await client
      .from('customers')
      .update({
        name: editForm.value.name,
        mobile_number: editForm.value.mobile_number
      })
      .eq('id', editingCustomer.value.id)
    
    if (error) throw error
    
    showEditModal.value = false
    editingCustomer.value = null
    await fetchAllCustomers()
  } catch (e: any) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllCustomers()
  fetchShops()
})
watch([searchQuery, selectedShopId, subFilter], () => {
  currentPage.value = 1
  fetchAllCustomers()
})
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.manage_all_customers') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('dashboard.admin_stats.manage_all_customers_desc') }}</p>
      </div>
      
      <button class="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm">
        <Download class="w-5 h-5 text-emerald-500" />
        <span>{{ $t('dashboard.admin_stats.export_customers') }}</span>
      </button>
    </div>

    <!-- Search & Filters -->
    <BaseCard>
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative group">
          <Search :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <input 
            v-model="searchQuery"
            type="text" 
            :placeholder="$t('dashboard.admin_stats.search_placeholder')"
            :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
            class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white font-medium"
          />
        </div>
        
        <div class="md:w-64 relative group">
          <Filter :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <select 
            v-model="subFilter"
            :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
            class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white font-bold appearance-none"
          >
            <option value="all">{{ $t('dashboard.admin_stats.all_subscribers') }}</option>
            <option value="subscribed">{{ $t('dashboard.admin_stats.subscribed_only') }}</option>
            <option value="prepaid">{{ $t('dashboard.admin_stats.prepaid_only_filter') }}</option>
          </select>
        </div>

        <div class="md:w-64 relative group">
          <Store :class="locale === 'ar' ? 'right-4' : 'left-4'" class="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
          <select 
            v-model="selectedShopId"
            :class="locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'"
            class="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white font-bold appearance-none"
          >
            <option value="all">{{ $t('dashboard.admin_stats.all_shops') }}</option>
            <option v-for="shop in shops" :key="shop.id" :value="shop.id">{{ shop.shop_name }}</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <!-- Global Customers Table -->
    <BaseCard class="!p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full" :class="locale === 'ar' ? 'text-right' : 'text-left'">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.table.customer') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.table.shop') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.table.balance') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500">{{ $t('dashboard.admin_stats.table.registered_at') }}</th>
              <th class="px-6 py-4 text-sm font-bold text-slate-500 text-center">{{ $t('dashboard.admin_stats.table.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <template v-if="loading">
              <tr v-for="i in 6" :key="i">
                <td class="px-6 py-4"><Skeleton roundedClass="rounded w-32 h-6" /></td>
                <td class="px-6 py-4"><Skeleton roundedClass="rounded w-24 h-6" /></td>
                <td class="px-6 py-4"><Skeleton roundedClass="rounded w-28 h-6" /></td>
                <td class="px-6 py-4"><Skeleton roundedClass="rounded-full w-16 h-6" /></td>
                <td class="px-6 py-4"><Skeleton roundedClass="rounded-xl w-20 h-8 mx-auto" /></td>
              </tr>
            </template>
            <template v-else>
              <tr 
                v-for="customer in customers" :key="customer.id" 
                class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center font-bold text-emerald-600">
                      {{ customer.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-900 dark:text-white">{{ customer.name }}</div>
                      <div class="text-[10px] text-slate-500">{{ customer.mobile_number }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-700 dark:text-slate-300 text-sm">
                    {{ customer.shop?.shop_name || $t('dashboard.admin_stats.table.undefined_shop') }}
                  </div>
                  <div class="text-[10px] text-slate-400">{{ customer.shop?.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1 font-black text-emerald-500">
                    <Wallet class="w-4 h-4" />
                    <span>{{ customer.balance }} {{ $t('common.currency') }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-500">
                  {{ new Date(customer.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="handleEditCustomer(customer)"
                      class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                    >
                      <Edit2 class="w-5 h-5" />
                    </button>
                    <button 
                      @click="confirmDeleteCustomer(customer.id)"
                      class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="customers.length === 0 && !loading">
                <td colspan="5" class="px-6 py-20 text-center text-slate-500">
                  {{ $t('dashboard.admin_stats.no_customers_found') }}
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
          -
          <span class="text-slate-900 dark:text-white">{{ Math.min(currentPage * pageSize, totalCustomers) }}</span>
          {{ $t('common.of') }}
          <span class="text-slate-900 dark:text-white">{{ totalCustomers }}</span>
        </p>
        
        <div class="flex items-center gap-1">
          <!-- First -->
          <button @click="currentPage = 1; fetchAllCustomers()" :disabled="currentPage === 1" 
            class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronsRight v-if="locale === 'ar'" class="w-5 h-5" />
            <ChevronsLeft v-else class="w-5 h-5" />
          </button>
          
          <!-- Prev -->
          <button @click="currentPage--; fetchAllCustomers()" :disabled="currentPage === 1" 
            class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronRight v-if="locale === 'ar'" class="w-5 h-5" />
            <ChevronLeft v-else class="w-5 h-5" />
          </button>

          <!-- Numbers -->
          <div class="flex items-center gap-1 mx-2">
            <button v-for="p in displayedPages" :key="p" 
              @click="currentPage = p; fetchAllCustomers()"
              class="w-10 h-10 rounded-xl font-black text-sm transition-all"
              :class="currentPage === p ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'"
            >
              {{ p }}
            </button>
          </div>

          <!-- Next -->
          <button @click="currentPage++; fetchAllCustomers()" :disabled="currentPage === totalPages" 
            class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronLeft v-if="locale === 'ar'" class="w-5 h-5" />
            <ChevronRight v-else class="w-5 h-5" />
          </button>

          <!-- Last -->
          <button @click="currentPage = totalPages; fetchAllCustomers()" :disabled="currentPage === totalPages" 
            class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all">
            <ChevronsLeft v-if="locale === 'ar'" class="w-5 h-5" />
            <ChevronsRight v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Edit Customer Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div @click="showEditModal = false" class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>
      <BaseCard class="w-full max-w-lg relative z-10 animate-slide-up !p-10 rounded-[40px]">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ $t('dashboard.admin_stats.edit_customer_title') }}</h3>
          <button @click="showEditModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X class="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateCustomer" class="space-y-6">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('customers.table.name') }}</label>
            <input 
              v-model="editForm.name"
              type="text" 
              required
              class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold"
            />
          </div>
          <div>
            <label class="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">{{ $t('customers.table.phone') }}</label>
            <input 
              v-model="editForm.mobile_number"
              type="tel" 
              required
              class="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div class="flex gap-4 pt-4">
            <button 
              type="submit"
              :disabled="loading"
              class="flex-1 bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
              <span>{{ $t('common.save') }}</span>
            </button>
            <button 
              type="button"
              @click="showEditModal = false"
              class="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </form>
      </BaseCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div @click="showDeleteModal = false" class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>
      <BaseCard class="w-full max-w-sm relative z-10 animate-in zoom-in duration-300 !p-10 rounded-[40px] text-center">
        <div class="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">{{ $t('dashboard.admin_stats.delete_customer_confirm') }}</h3>
        <p class="text-slate-500 mb-8 font-medium">{{ $t('dashboard.admin_stats.delete_customer_desc') }}</p>
        <div class="space-y-3">
          <button 
            @click="handleDeleteCustomer"
            :disabled="loading"
            class="w-full bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ $t('dashboard.admin_stats.confirm_delete_btn') }}</span>
          </button>
          <button 
            @click="showDeleteModal = false"
            class="w-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
          >
            {{ $t('common.cancel') }}
          </button>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

