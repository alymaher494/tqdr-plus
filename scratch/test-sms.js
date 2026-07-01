async function testSMS() {
  const SMS_TOKEN = 'LADO3MqA1RdEaeS8SMVL';
  const testMessage = 'رسالة تجريبية من نظام تقدر بلس - إذا وصلتك فإن خدمة SMS تعمل بنجاح!';
  const testPhone = '966566293256';

  // Test with different sender names
  const senders = ['TQDR', 'TqdrPlus', 'Tqdr plus', 'tqdr'];

  for (const sender of senders) {
    console.log(`\nTesting sender: "${sender}"...`);
    try {
      const response = await fetch('https://api.oursms.com/msgs/sms', {
        method: 'POST',
        body: JSON.stringify({
          src: sender,
          dests: [testPhone],
          body: testMessage,
          priority: 0, delay: 0, validity: 0, maxParts: 0, dlr: 0, prevDups: 0
        }),
        headers: {
          'Authorization': `Bearer ${SMS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`  Status: ${response.status}`);
      const text = await response.text();
      console.log(`  Response: ${text}`);
      if (response.status === 200) {
        console.log(`  ✅ SUCCESS with sender: "${sender}"`);
        break;
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

testSMS();
