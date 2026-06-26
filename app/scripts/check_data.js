import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const client = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const shopId = '35a49d95-85be-4366-a20e-79918a14d316' // From URL in screenshot
  
  console.log('--- Subscriptions ---')
  const { data: subs } = await client.from('customer_subscriptions').select('id, customer_id, offer_id').eq('shop_owner_id', shopId)
  console.log(`Active subscriptions: ${subs?.length || 0}`)
  
  console.log('--- Transactions with Offer ID ---')
  const { data: txs } = await client.from('transactions').select('customer_id').eq('shop_owner_id', shopId).not('offer_id', 'is', null)
  const uniqueTxCusts = new Set((txs || []).map(t => t.customer_id))
  console.log(`Unique customers from transactions: ${uniqueTxCusts.size}`)
  
  console.log('--- Offers ---')
  const { data: offers } = await client.from('subscription_offers').select('id, name').eq('shop_owner_id', shopId)
  console.log('Offers:', offers)
}

checkData()
