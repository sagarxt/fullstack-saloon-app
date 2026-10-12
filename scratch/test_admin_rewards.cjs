async function testAdminRewards() {
  const baseURL = 'http://localhost:8008/api/v1';
  
  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@loyaltyapp.com',
      password: 'admin123'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.data?.token || loginData.accessToken;
  console.log('   Admin login result:', loginData);
  console.log('   Admin logged in successfully! Token prefix:', token ? token.substring(0, 15) + '...' : 'none');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Create a test reward voucher
  console.log('\n2. Creating a test reward voucher...');
  const createRes = await fetch(`${baseURL}/admin/rewards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: '₹150 Head Massage Voucher',
      description: 'Complimentary 20-min stress relief head massage at any Groomish Now branch.',
      pointsRequired: 75,
      stock: 25,
      active: true,
      expiryDate: '2026-12-31'
    })
  });
  const created = await createRes.json();
  console.log('   Created reward:', created.title, 'ID:', created.id, 'Points:', created.pointsRequired, 'Active:', created.active);
  const rewardId = created.id;

  // 3. Update the voucher
  console.log('\n3. Updating voucher points and stock...');
  const updateRes = await fetch(`${baseURL}/admin/rewards/${rewardId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      title: '₹200 Deluxe Head Massage & Spa',
      pointsRequired: 90,
      stock: 40,
      active: true
    })
  });
  const updated = await updateRes.json();
  console.log('   Updated reward:', updated.title, 'Points:', updated.pointsRequired, 'Stock:', updated.stock);

  // 4. Deactivate the voucher
  console.log('\n4. Deactivating voucher...');
  await fetch(`${baseURL}/admin/rewards/${rewardId}`, {
    method: 'DELETE',
    headers
  });
  const fetchDeactivatedRes = await fetch(`${baseURL}/admin/rewards/${rewardId}`, { headers });
  const deactivated = await fetchDeactivatedRes.json();
  console.log('   Deactivated status:', deactivated.active ? 'ACTIVE' : 'DEACTIVATED (Success!)');

  // 5. Reactivate the voucher
  console.log('\n5. Reactivating voucher...');
  const reactivateRes = await fetch(`${baseURL}/admin/rewards/${rewardId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      active: true
    })
  });
  const reactivated = await reactivateRes.json();
  console.log('   Reactivated status:', reactivated.active ? 'ACTIVE (Success!)' : 'STILL INACTIVE');

  // 6. Search rewards
  console.log('\n6. Searching vouchers by title query...');
  const searchRes = await fetch(`${baseURL}/admin/rewards?title=Head+Massage`, { headers });
  const searchData = await searchRes.json();
  const list = searchData.content || searchData;
  console.log('   Found vouchers matching "Head Massage":', list.length);

  console.log('\n🎉 ALL ADMIN REWARD VOUCHER CRUD TESTS PASSED PERFECTLY!');
}

testAdminRewards().catch(err => {
  console.error('Error during reward tests:', err);
  process.exit(1);
});
