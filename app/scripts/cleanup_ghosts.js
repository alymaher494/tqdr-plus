import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const client = createClient(supabaseUrl, supabaseKey)

async function cleanupGhostTransactions() {
  console.log('Cleaning up ghost transactions (Subscribers who are no longer active)...')
  
  // 1. Fetch all transactions with offer_id
  const { data: txs } = await client.from('transactions').select('id, customer_id, offer_id').not('offer_id', 'is', null)
  
  // 2. Fetch all active subscriptions
  const { data: subs } = await client.from('customer_subscriptions').select('customer_id, offer_id')
  
  const activePairs = new Set((subs || []).map(s => `${s.customer_id}_${s.offer_id}`))
  
  let cleanedCount = 0
  for (const tx of (txs || [])) {
    if (!activePairs.has(`${tx.customer_id}_${tx.offer_id}`)) {
      console.log(`Found ghost transaction ${tx.id} for customer ${tx.customer_id}. Clearing offer_id...`)
      await client.from('transactions').update({ offer_id: null }).eq('id', tx.id)
      cleanedCount++
    }
  }

  console.log(`Cleanup complete! Cleared ${cleanedCount} ghost transactions.`)
}

cleanupGhostTransactions()
