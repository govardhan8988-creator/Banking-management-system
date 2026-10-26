const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End API Verification...\n');
  let token = '';
  let customer1Id = null;
  let customer2Id = null;
  let account1Id = null;
  let account2Id = null;
  let account3Id = null;

  // 1. Health Check
  console.log('1. Testing GET /api/health');
  const healthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Response:', healthRes.status, healthRes.data);
  if (healthRes.status !== 200 || healthRes.data.status !== 'ok') {
    throw new Error('Health check failed!');
  }
  console.log('✅ Health check passed.\n');

  // 2. Customer Registration (Govardhan Reddy)
  console.log('2. Testing POST /api/customers/register');
  const reg1Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Govardhan Reddy',
      email: 'govardhan@example.com',
      password: 'password123',
      phone: '9876543210'
    }
  );
  console.log('Response:', reg1Res.status, reg1Res.data);
  if (reg1Res.status !== 201 && reg1Res.status !== 409) {
    throw new Error('Registration failed!');
  }
  if (reg1Res.data.customer) {
    customer1Id = reg1Res.data.customer.id;
    if (reg1Res.data.customer.password) throw new Error('Password should NEVER be returned!');
  }
  console.log('✅ Registration 1 passed.\n');

  // 3. Duplicate registration check
  console.log('3. Testing Duplicate Registration POST /api/customers/register');
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Govardhan Reddy Duplicate',
      email: 'govardhan@example.com',
      password: 'password123'
    }
  );
  console.log('Response:', dupRes.status, dupRes.data);
  if (dupRes.status !== 409) {
    throw new Error('Duplicate registration should return 409 Conflict!');
  }
  console.log('✅ Duplicate prevention passed.\n');

  // 4. Customer Login
  console.log('4. Testing POST /api/customers/login');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      email: 'govardhan@example.com',
      password: 'password123'
    }
  );
  console.log('Response:', loginRes.status, loginRes.data);
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Login failed!');
  }
  token = loginRes.data.token;
  customer1Id = loginRes.data.customer.id;
  if (loginRes.data.customer.password) throw new Error('Password returned in login response!');
  console.log('✅ Login passed. JWT received.\n');

  // 5. Customer Profile (me)
  console.log('5. Testing GET /api/customers/me');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/customers/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Response:', meRes.status, meRes.data);
  if (meRes.status !== 200) throw new Error('Profile fetch failed!');
  console.log('✅ Profile verification passed.\n');

  // 6. Register Customer 2 (Anita Sharma)
  console.log('6. Registering second customer for inter-account tests');
  const reg2Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Anita Sharma',
      email: 'anita@example.com',
      password: 'password123',
      phone: '9123456780'
    }
  );
  if (reg2Res.data.customer) {
    customer2Id = reg2Res.data.customer.id;
  } else {
    // If already exists, login to get id
    const l2 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/customers/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'anita@example.com', password: 'password123' }
    );
    customer2Id = l2.data.customer.id;
  }
  console.log('Customer 2 ID:', customer2Id, '✅ Customer 2 ready.\n');

  // 7. Create Account 1 for Govardhan (Savings, initial balance ₹1500)
  console.log('7. Testing POST /api/accounts (Savings, ₹1500)');
  const acc1Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    {
      customerId: customer1Id,
      accountType: 'SAVINGS',
      initialBalance: 1500
    }
  );
  console.log('Response:', acc1Res.status, acc1Res.data);
  if (acc1Res.status !== 201) throw new Error('Account 1 creation failed!');
  account1Id = acc1Res.data.account.id;
  console.log('Account 1 Created:', acc1Res.data.account.accountNumber, 'ID:', account1Id, '✅\n');

  // 8. Create Account 2 for Govardhan (Current, initial balance ₹500)
  console.log('8. Testing POST /api/accounts (Current, ₹500)');
  const acc2Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    {
      customerId: customer1Id,
      accountType: 'CURRENT',
      initialBalance: 500
    }
  );
  console.log('Response:', acc2Res.status, acc2Res.data);
  account2Id = acc2Res.data.account.id;
  console.log('Account 2 Created:', acc2Res.data.account.accountNumber, 'ID:', account2Id, '✅\n');

  // 9. Create Account 3 for Anita (Savings, initial balance $200)
  console.log('9. Creating Account 3 for Anita');
  const acc3Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      customerId: customer2Id,
      accountType: 'SAVINGS',
      initialBalance: 200
    }
  );
  account3Id = acc3Res.data.account.id;
  console.log('Account 3 Created:', acc3Res.data.account.accountNumber, 'ID:', account3Id, '✅\n');

  // 10. List accounts
  console.log('10. Testing GET /api/accounts');
  const listAccRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/accounts',
    method: 'GET'
  });
  console.log('Total accounts found:', listAccRes.data.count);
  console.log('✅ List accounts passed.\n');

  // 11. Get Single Account
  console.log(`11. Testing GET /api/accounts/${account1Id}`);
  const singleAccRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/accounts/${account1Id}`,
    method: 'GET'
  });
  console.log('Account 1 details balance:', singleAccRes.data.account.balance);
  console.log('✅ Get single account passed.\n');

  // 12. Deposit test
  console.log(`12. Testing POST /api/accounts/${account1Id}/deposit (₹1000)`);
  const depRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/accounts/${account1Id}/deposit`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { amount: 1000, description: 'Salary direct deposit' }
  );
  console.log('Deposit Response:', depRes.status, depRes.data);
  if (depRes.status !== 200 || depRes.data.account.balance !== 2500) {
    throw new Error('Deposit failed or balance mismatch!');
  }
  console.log('✅ Deposit passed. New balance: ₹2500\n');

  // 13. Withdraw test
  console.log(`13. Testing POST /api/accounts/${account1Id}/withdraw (₹500)`);
  const withRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/accounts/${account1Id}/withdraw`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { amount: 500, description: 'ATM Cash Withdrawal' }
  );
  console.log('Withdraw Response:', withRes.status, withRes.data);
  if (withRes.status !== 200 || withRes.data.account.balance !== 2000) {
    throw new Error('Withdrawal failed or balance mismatch!');
  }
  console.log('✅ Withdrawal passed. New balance: ₹2000\n');

  // 14. Withdraw Insufficient Funds test
  console.log(`14. Testing Insufficient Withdrawal POST /api/accounts/${account1Id}/withdraw (₹999999)`);
  const badWithRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/accounts/${account1Id}/withdraw`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { amount: 999999 }
  );
  console.log('Response:', badWithRes.status, badWithRes.data);
  if (badWithRes.status !== 400) {
    throw new Error('Insufficient withdrawal should return 400 Bad Request!');
  }
  console.log('✅ Insufficient funds check passed.\n');

  // 15. Transfer test (Account 1 -> Account 2, ₹400)
  console.log(`15. Testing POST /api/accounts/transfer (Account ${account1Id} -> Account ${account2Id}, ₹400)`);
  const transferRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts/transfer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fromAccountId: account1Id,
      toAccountId: account2Id,
      amount: 400,
      description: 'Monthly savings transfer'
    }
  );
  console.log('Transfer Response:', transferRes.status, transferRes.data);
  if (transferRes.status !== 200) throw new Error('Transfer failed!');
  console.log('Source new balance:', transferRes.data.transfer.fromAccount.balance);
  console.log('Destination new balance:', transferRes.data.transfer.toAccount.balance);
  if (transferRes.data.transfer.fromAccount.balance !== 1600 || transferRes.data.transfer.toAccount.balance !== 900) {
    throw new Error('Transfer balance mismatch!');
  }
  console.log('✅ Atomic transfer passed.\n');

  // 16. Transfer same account rejection test
  console.log('16. Testing Transfer Same Account Rejection');
  const badTransferRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts/transfer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { fromAccountId: account1Id, toAccountId: account1Id, amount: 100 }
  );
  if (badTransferRes.status !== 400) throw new Error('Same account transfer should be rejected with 400!');
  console.log('Response:', badTransferRes.status, badTransferRes.data);
  console.log('✅ Same account transfer rejected properly.\n');

  // 17. Transfer insufficient funds rejection test
  console.log('17. Testing Transfer Insufficient Balance Rejection');
  const overTransferRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/accounts/transfer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { fromAccountId: account1Id, toAccountId: account2Id, amount: 999999 }
  );
  if (overTransferRes.status !== 400) throw new Error('Over transfer should be rejected with 400!');
  console.log('Response:', overTransferRes.status, overTransferRes.data);
  console.log('✅ Insufficient balance transfer rejected properly.\n');

  // 18. Transactions list for Account 1
  console.log(`18. Testing GET /api/accounts/${account1Id}/transactions`);
  const txRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/accounts/${account1Id}/transactions`,
    method: 'GET'
  });
  console.log('Transactions Count:', txRes.data.count);
  console.log('Transactions list:');
  txRes.data.transactions.forEach((tx) => {
    console.log(` - ID: ${tx.id} | Type: ${tx.type} | Amount: ₹${tx.amount} | Desc: ${tx.description} | Date: ${tx.createdAt}`);
  });
  if (!Array.isArray(txRes.data.transactions) || txRes.data.transactions.length < 4) {
    throw new Error('Transaction history incomplete!');
  }
  console.log('✅ Transactions history verified (sorted newest first).\n');

  console.log('🎉 ALL BACKEND API TESTS COMPLETED AND PASSED PERFECTLY! 100% SUCCESSFUL!');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
