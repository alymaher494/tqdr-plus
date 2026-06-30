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

  const customerId = verifyCustomerToken(customerToken)
  if (!customerId) {
    throw createError({ statusCode: 401, message: 'Invalid or tampered session' })
  }

  // 2. Initialize service role client
  const client = serverSupabaseServiceRole(event)

  try {
    // 3. Fetch Customer Data (select specific columns instead of *)
    const { data: customer, error: custError } = await client
      .from('customers')
      .select('id, name, mobile_number, balance, total_saved, status, shop_owner_id, created_at')
      .eq('id', customerId)
      .single()

    if (custError || !customer) {
      deleteCookie(event, 'customer_token')
      throw createError({ statusCode: 401, message: 'Customer session invalid or expired' })
    }

    // 4. Fetch Shop Profile
    const { data: shop } = await client
      .from('profiles')
      .select('id, shop_name, email')
      .eq('id', customer.shop_owner_id)
      .single()

    // 5. Fetch Transactions (prepaid only - no offer_id for real balance moves)
    const { data: allTransactions } = await client
      .from('transactions')
      .select('id, type, amount, paid_amount, saved_amount, balance_before, balance_after, note, offer_id, created_at, shop_owner_id, shop:profiles!transactions_shop_owner_id_fkey(shop_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(30)

    // Filter to only show prepaid transactions (deposits and withdrawals without offer_id)
    const transactions = (allTransactions || []).filter(tx => !tx.offer_id)

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
      transactions,
      subscriptions: enrichedSubscriptions
    }
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode || 500, message: e.message })
  }
})
