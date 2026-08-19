import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  // Disallow direct session generation without verified server state
  throw createError({ 
    statusCode: 403, 
    message: 'Direct customer-session generation is forbidden. Authenticate via OTP.' 
  })
})

