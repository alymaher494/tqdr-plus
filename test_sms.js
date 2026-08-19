import dotenv from 'dotenv';
dotenv.config();

async function testSMS() {
  const token = process.env.SMS_TOKEN;
  const sender = process.env.SMS_SENDER;
  const testPhone = '966566293256'; // standard test phone

  console.log('Testing Oursms integration...');
  console.log('Token:', token ? `${token.substring(0, 10)}...` : 'Not Set');
  console.log('Sender:', sender);

  if (!token || !sender) {
    console.error('Error: SMS_TOKEN or SMS_SENDER is missing in env!');
    return;
  }

  try {
    const res = await fetch('https://api.oursms.com/msgs/sms', {
      method: 'POST',
      body: JSON.stringify({
        src: sender,
        dests: [testPhone],
        body: 'تجربة إرسال رسالة من نظام تقدر بلس',
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

    const data = await res.json();
    console.log('Oursms API Response Status:', res.status);
    console.log('Oursms API Response Body:', data);
  } catch (error) {
    console.error('Network Error occurred while calling Oursms API:', error.message);
  }
}

testSMS();
