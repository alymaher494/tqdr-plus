import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const client = createClient(supabaseUrl, supabaseKey)

async function syncSubscriptions() {
  console.log('Starting subscription sync (ESM)...')
  
  const { data: subs, error: subErr } = await client
    .from('customer_subscriptions')
    .select('*')
  
  if (subErr) {
    console.error('Error fetching subscriptions:', subErr)
    return
  }

  console.log(`Found ${subs.length} subscriptions.`)

  for (const sub of subs) {
    const { data: tx } = await client
      .from('transactions')
      .select('id')
      .eq('customer_id', sub.customer_id)
      .eq('offer_id', sub.offer_id)
      .maybeSingle()

    if (!tx) {
      console.log(`Creating missing transaction for customer ${sub.customer_id}`)
      const { data: cust } = await client.from('customers').select('balance').eq('id', sub.customer_id).single()
      
      await client.from('transactions').insert({
        customer_id: sub.customer_id,
        shop_owner_id: sub.shop_owner_id,
        offer_id: sub.offer_id,
        type: 'deposit',
        amount: 0,
        balance_before: cust?.balance || 0,
        balance_after: cust?.balance || 0,
        note: 'تزامن تلقائي للبيانات'
      })
    }
  }

  console.log('Sync complete!')
}

syncSubscriptions()
