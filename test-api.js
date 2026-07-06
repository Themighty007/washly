const http = require('http');

async function testApi() {
  const baseUrl = 'http://localhost:3000';
  let customerToken = '';
  let cleanerToken = '';

  console.log('Testing APIs...');

  try {
    // 1. Test Customer Login
    const customerLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@gmail.com', password: 'customer123' })
    });
    const customerData = await customerLogin.json();
    if (!customerLogin.ok) throw new Error(`Customer login failed: ${customerData.error}`);
    console.log('✅ Customer Login successful');
    customerToken = customerData.token;

    // 2. Test Customer Dashboard
    const customerDash = await fetch(`${baseUrl}/api/customer/dashboard`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    if (!customerDash.ok) throw new Error('Customer dashboard failed');
    console.log('✅ Customer Dashboard fetch successful');

    // 3. Test Cleaner Login
    const cleanerLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rajesh@washly.com', password: 'cleaner123' })
    });
    const cleanerData = await cleanerLogin.json();
    if (!cleanerLogin.ok) throw new Error(`Cleaner login failed: ${cleanerData.error}`);
    console.log('✅ Cleaner Login successful');
    cleanerToken = cleanerData.token;

    // 4. Test Cleaner Dashboard
    const cleanerDash = await fetch(`${baseUrl}/api/cleaner/dashboard`, {
      headers: { 'Authorization': `Bearer ${cleanerToken}` }
    });
    if (!cleanerDash.ok) throw new Error('Cleaner dashboard failed');
    console.log('✅ Cleaner Dashboard fetch successful');

    console.log('All API tests passed! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    process.exit(1);
  }
}

testApi();
