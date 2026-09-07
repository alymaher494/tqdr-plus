import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env
const envPath = resolve(process.cwd(), '.env');
const hasEnvFile = existsSync(envPath);
dotenv.config();

async function testSMS() {
  console.log('==============================================');
  console.log('📱 Tqdr Plus - OurSMS Diagnostic Utility');
  console.log('==============================================');
  console.log(`.env file exists: ${hasEnvFile ? '✅ YES (' + envPath + ')' : '❌ NO (.env not found in current folder)'}`);

  const token = process.env.SMS_TOKEN || process.env.NUXT_SMS_TOKEN;
  const sender = process.env.SMS_SENDER || process.env.NUXT_SMS_SENDER || 'TQDR';
  const targetPhone = process.argv[2] || '966566293256';

  // Format phone
  let formattedPhone = targetPhone.toString().replace(/\D/g, '');
  if (formattedPhone.startsWith('05')) {
    formattedPhone = '966' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('5') && formattedPhone.length === 9) {
    formattedPhone = '966' + formattedPhone;
  }

  console.log(`Configured Token: ${token ? '✅ ' + token.substring(0, 6) + '...' + token.slice(-4) : '❌ NOT SET'}`);
  console.log(`Configured Sender: ${sender}`);
  console.log(`Target Phone: ${formattedPhone}`);
  console.log('----------------------------------------------');

  if (!token) {
    console.error('❌ ERROR: SMS_TOKEN is missing!');
    console.log('\n👉 To fix this, create or edit the .env file in the project folder with:');
    console.log('----------------------------------------------');
    console.log('SMS_TOKEN=LADO3MqA1RdEaeS8SMVL');
    console.log('SMS_SENDER=TQDR');
    console.log('----------------------------------------------');
    process.exit(1);
  }

  console.log('🚀 Sending test SMS via OurSMS REST API...');

  try {
    const response = await fetch('https://api.oursms.com/msgs/sms', {
      method: 'POST',
      body: JSON.stringify({
        src: sender,
        dests: [formattedPhone],
        body: 'رسالة اختبارية من منصة تقدر بلس - خدمة الرسائل تعمل بنجاح!',
        priority: 0,
        delay: 0,
        validity: 0,
        maxParts: 0,
        dlr: 0,
        prevDups: 0
      }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    const body = await response.json();

    console.log(`HTTP Status: ${status}`);
    console.log('API Response:', JSON.stringify(body, null, 2));

    if (status === 200 && body.accepted > 0) {
      console.log('==============================================');
      console.log('🎉 SUCCESS: SMS was accepted and sent by OurSMS!');
      console.log('==============================================');
    } else {
      console.log('==============================================');
      console.log('⚠️ WARNING: API responded but message might not be delivered.');
      console.log('Check the response above for errors.');
      console.log('==============================================');
    }
  } catch (error) {
    console.error('❌ Network Error while calling OurSMS API:', error.message);
  }
}

testSMS();
