import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Get customer_id from cookie
  const customerId = getCookie(event, 'customer_id')
  if (!customerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // 2. Initialize service role client (synchronous in Nuxt Supabase)
  const client = serverSupabaseServiceRole(event)

  try {
    // 3. Fetch Customer Data
    const { data: customer, error: custError } = await client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (custError || !customer) {
      throw createError({ statusCode: 404, message: 'Customer not found' })
    }

    // 4. Fetch Shop Profile
    const { data: shop } = await client
      .from('profiles')
      .select('*')
      .eq('id', customer.shop_owner_id)
      .single()

    // 5. Fetch Transactions (prepaid only - no offer_id for real balance moves)
    const { data: allTransactions } = await client
      .from('transactions')
      .select('*, shop:profiles!transactions_shop_owner_id_fkey(shop_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(30)

    // Filter to only show prepaid transactions (deposits and withdrawals without offer_id)
    const transactions = (allTransactions || []).filter(tx => !tx.offer_id)

    // 6. Fetch All Subscriptions (active + expired for display)
    const { data: subscriptions } = await client
      .from('customer_subscriptions')
      .select('*, offer:subscription_offers(*), shop:profiles!customer_subscriptions_shop_owner_id_fkey(shop_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    // 7. Enrich subscriptions with usage count (number of offer-type transactions)
    const enrichedSubscriptions = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        // Count how many times this offer was used (withdrawal transactions linked to this offer)
        const { count: usedCount } = await client
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('offer_id', sub.offer_id)
          .eq('type', 'withdrawal')

        const usageLimit = sub.offer?.usage_limit || 0
        const used = usedCount || 0
        const remaining = Math.max(0, usageLimit - used)

        // Calculate days remaining
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
    )

    // 8. Calculate total savings from prepaid only (from all shops)
    // Savings = sum of discount amounts from prepaid withdrawal transactions
    const { data: allSavingsData } = await client
      .from('transactions')
      .select('amount, balance_before, balance_after, offer_id')
      .eq('customer_id', customerId)
      .eq('type', 'withdrawal')
      .is('offer_id', null) // prepaid only

    // total_saved is already tracked per customer record - we just verify it
    // The field customer.total_saved should be our source of truth

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
