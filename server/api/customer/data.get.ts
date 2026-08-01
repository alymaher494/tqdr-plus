import { serverSupabaseServiceRole } from '#supabase/server'
import { createHmac } from 'crypto'

// Verify signed customer cookie
function verifyCustomerToken(token: string): string | null {
  try {
    const secret = process.env.NUXT_SUPABASE_SERVICE_KEY || ''
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [customerId, signature] = parts
    const expectedSig = createHmac('sha256', secret).update(customerId).digest('hex').substring(0, 16)

    if (signature === expectedSig) {
      return customerId
    }
    return null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  // 1. Get and verify signed customer token from cookie
  const customerToken = getCookie(event, 'customer_token')
  if (!customerToken) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const payload = verifyCustomerToken(customerToken)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or tampered session' })
  }

  // 2. Initialize service role client
  const client = serverSupabaseServiceRole(event)

  // Get selected shop_id from query params if any
  const query = getQuery(event)
  const selectedShopId = query.shop_id as string

  try {
    let customerRecords: any[] = []
    let selectedCustomer: any = null

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload)

    if (isUUID) {
      // Backward compatibility: payload is a customer UUID
      const { data: firstCustomer } = await client
        .from('customers')
        .select('*')
        .eq('id', payload)
        .maybeSingle()

      if (firstCustomer) {
        const phone = firstCustomer.mobile_number
        const shortPhone = phone.startsWith('966') ? phone.substring(3) : phone
        const shortPhoneWithZero = '0' + shortPhone

        const { data: records } = await client
          .from('customers')
          .select('id, name, mobile_number, balance, total_saved, status, shop_owner_id, created_at')
          .or(`mobile_number.eq.${phone},mobile_number.eq.${shortPhone},mobile_number.eq.${shortPhoneWithZero}`)

        customerRecords = records || []
        
        if (selectedShopId) {
          selectedCustomer = customerRecords.find(r => r.shop_owner_id === selectedShopId) || firstCustomer
        } else {
          selectedCustomer = firstCustomer
        }
      }
    } else {
      // payload is phone number
      const phone = payload
      const shortPhone = phone.startsWith('966') ? phone.substring(3) : phone
      const shortPhoneWithZero = '0' + shortPhone

      const { data: records } = await client
        .from('customers')
        .select('id, name, mobile_number, balance, total_saved, status, shop_owner_id, created_at')
        .or(`mobile_number.eq.${phone},mobile_number.eq.${shortPhone},mobile_number.eq.${shortPhoneWithZero}`)

      customerRecords = records || []

      if (customerRecords.length > 0) {
        if (selectedShopId) {
          selectedCustomer = customerRecords.find(r => r.shop_owner_id === selectedShopId) || customerRecords[0]
        } else {
          selectedCustomer = customerRecords[0]
        }
      }
    }

    if (!selectedCustomer) {
      deleteCookie(event, 'customer_token')
      throw createError({ statusCode: 401, message: 'Customer session invalid or expired' })
    }

    const customer = selectedCustomer
    const customerId = customer.id

    // Fetch all shop profiles for store switcher
    const shopIds = customerRecords.map(r => r.shop_owner_id).filter(Boolean)
    let wallets: any[] = []
    if (shopIds.length > 0) {
      const { data: shopsData } = await client
        .from('profiles')
        .select('id, shop_name')
        .in('id', shopIds)

      wallets = customerRecords.map(r => {
        const s = (shopsData || []).find(sh => sh.id === r.shop_owner_id)
        return {
          customerId: r.id,
          shopId: r.shop_owner_id,
          shopName: s?.shop_name || 'متجر غير معروف',
          balance: r.balance
        }
      })
    }

    // 4. Fetch Shop Profile
    const { data: shop } = await client
      .from('profiles')
      .select('id, shop_name, email')
      .eq('id', customer.shop_owner_id)
      .single()

    // 5. Fetch All Transactions
    const { data: allTransactions } = await client
      .from('transactions')
      .select('id, type, amount, paid_amount, saved_amount, balance_before, balance_after, note, offer_id, created_at, shop_owner_id, shop:profiles!transactions_shop_owner_id_fkey(shop_name), offer:subscription_offers(name, duration, usage_limit)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    // Calculate running count of usages for each offer
    let runningUsages: Record<string, number> = {}
    const enrichedTransactions = (allTransactions || []).map((tx) => {
      if (tx.offer_id) {
        const usageLimit = tx.offer?.usage_limit || 0
        if (tx.type === 'withdrawal') {
          runningUsages[tx.offer_id] = (runningUsages[tx.offer_id] || 0) + 1
        }
        const used = runningUsages[tx.offer_id] || 0
        const remaining = Math.max(0, usageLimit - used)
        return {
          ...tx,
          remaining_uses: remaining,
          usage_limit: usageLimit
        }
      }
      return tx
    })

    // Sort back to descending (newest first)
    enrichedTransactions.reverse()

    // 6. Fetch All Subscriptions with offer details and shop name
    const { data: subscriptions } = await client
      .from('customer_subscriptions')
      .select('id, status, expires_at, created_at, offer_id, shop_owner_id, offer:subscription_offers(id, name, price, usage_limit, discount, duration), shop:profiles!customer_subscriptions_shop_owner_id_fkey(shop_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    // 7. Batch fetch usage counts for all subscriptions (solve N+1 problem)
    const offerIds = [...new Set((subscriptions || []).map(s => s.offer_id).filter(Boolean))]

    let usageCounts: Record<string, number> = {}
    if (offerIds.length > 0) {
      const { data: usageData } = await client
        .from('transactions')
        .select('offer_id')
        .eq('customer_id', customerId)
        .eq('type', 'withdrawal')
        .in('offer_id', offerIds)

      // Count per offer_id
      for (const tx of (usageData || [])) {
        usageCounts[tx.offer_id] = (usageCounts[tx.offer_id] || 0) + 1
      }
    }

    // Enrich subscriptions
    const enrichedSubscriptions = (subscriptions || []).map((sub) => {
      const usageLimit = sub.offer?.usage_limit || 0
      const used = usageCounts[sub.offer_id] || 0
      const remaining = Math.max(0, usageLimit - used)

      const expiresDate = new Date(sub.expires_at)
      const now = new Date()
      const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      const isActive = expiresDate > now && remaining > 0

      return {
        ...sub,
        used_count: used,
        remaining_uses: remaining,
        days_left: daysLeft,
        is_active: isActive
      }
    })

    return {
      customer,
      shop,
      transactions: enrichedTransactions,
      subscriptions: enrichedSubscriptions,
      wallets
    }
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode || 500, message: e.message })
  }
})
