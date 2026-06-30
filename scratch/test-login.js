import fetch from 'node-fetch';

async function testLogin() {
  const phone = '0566293256';
  const code = '111111';
  const baseUrl = 'https://tqdr-pluss.vercel.app';

  console.log('1. Testing otp-send...');
  const resSend = await fetch(`${baseUrl}/api/auth/otp-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  console.log('otp-send status:', resSend.status);
  const jsonSend = await resSend.json();
  console.log('otp-send body:', jsonSend);

  if (resSend.status !== 200) return;

  console.log('\n2. Testing otp-verify...');
  const resVerify = await fetch(`${baseUrl}/api/auth/otp-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  });
  console.log('otp-verify status:', resVerify.status);
  const jsonVerify = await resVerify.json();
  console.log('otp-verify body:', jsonVerify);

  if (resVerify.status !== 200) return;

  const customerId = jsonVerify.customerId;

  console.log('\n3. Testing customer-session...');
  const resSession = await fetch(`${baseUrl}/api/auth/customer-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId })
  });
  console.log('customer-session status:', resSession.status);
  const sessionHeaders = Object.fromEntries(resSession.headers.entries());
  console.log('customer-session headers:', sessionHeaders);
  const jsonSession = await resSession.json();
  console.log('customer-session body:', jsonSession);

  // Extract set-cookie
  const setCookieHeader = resSession.headers.get('set-cookie');
  console.log('Set-Cookie Header:', setCookieHeader);

  if (!setCookieHeader) {
    console.log('No Set-Cookie header returned!');
    return;
  }

  // Extract customer_token value
  const cookiePart = setCookieHeader.split(';')[0];
  console.log('Cookie to send:', cookiePart);

  console.log('\n4. Testing customer/data...');
  const resData = await fetch(`${baseUrl}/api/customer/data`, {
    method: 'GET',
    headers: {
      'Cookie': cookiePart
    }
  });
  console.log('customer/data status:', resData.status);
  const textData = await resData.text();
  console.log('customer/data raw response:', textData);
}

testLogin().catch(err => console.error('Error during testing:', err));
