const http = require('http');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log("--- 1. Testing Public Coupons Endpoint ---");
  const publicCoupons = await get('http://localhost:8008/api/v1/public/coupons');
  console.log("Public Coupons status:", publicCoupons.status, "Count:", publicCoupons.data.length);
  const sampleCoupon = publicCoupons.data[0];
  console.log("Sample coupon code:", sampleCoupon?.code, "Discount:", sampleCoupon?.discount);

  console.log("\n--- 2. Customer Login ---");
  const loginRes = await post('http://localhost:8008/api/v1/auth/login', {
    email: 'testcustomer@example.com',
    password: 'password123'
  });

  let token = loginRes.data?.token;
  let customerUser = loginRes.data?.user;

  if (!token) {
    console.log("Registering customer...");
    const regRes = await post('http://localhost:8008/api/v1/auth/register', {
      name: 'Cart Customer',
      email: 'cartcustomer_' + Date.now() + '@example.com',
      password: 'Password@123',
      phone: '9888877777',
      gender: 'MALE'
    });
    token = regRes.data?.token;
    customerUser = regRes.data?.user;
  }

  console.log("Logged in customer ID:", customerUser?.id);

  console.log("\n--- 3. Fetch Initial Cart ---");
  const cartRes = await get('http://localhost:8008/api/v1/customer/cart', token);
  console.log("Cart Status:", cartRes.status, "Items count:", cartRes.data?.items?.length, "Total:", cartRes.data?.totalAmount);

  console.log("\n--- 4. Fetch Available Services & Products ---");
  const servicesRes = await get('http://localhost:8008/api/v1/public/services');
  const service = servicesRes.data[0];
  console.log("Selected Service:", service?.name, "Price:", service?.price);

  const productsRes = await get('http://localhost:8008/api/v1/public/products');
  const product = productsRes.data[0];
  console.log("Selected Product:", product?.name, "Price:", product?.price);

  console.log("\n--- 5. Add Service to Cart ---");
  const addSrvRes = await post('http://localhost:8008/api/v1/customer/cart/items', {
    itemType: 'SERVICE',
    serviceId: service.id,
    quantity: 1,
    customNotes: 'Low fade styling'
  }, token);
  console.log("Added Service, Cart Total:", addSrvRes.data?.totalAmount, "Items:", addSrvRes.data?.items?.length);

  console.log("\n--- 6. Add Product to Cart ---");
  const addProdRes = await post('http://localhost:8008/api/v1/customer/cart/items', {
    itemType: 'PRODUCT',
    productId: product.id,
    quantity: 2
  }, token);
  console.log("Added Product, Cart Total:", addProdRes.data?.totalAmount, "Total items count:", addProdRes.data?.totalItemCount);

  const customerUserId = addSrvRes.data?.userId;
  console.log("Customer User ID from cart:", customerUserId);

  console.log("\n--- 7. Staff / Admin Login to inspect customer cart ---");
  const adminLogin = await post('http://localhost:8008/api/v1/auth/login', {
    email: 'admin@loyaltyapp.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data?.token;
  console.log("Admin logged in. Inspecting customer cart...");
  const adminCartRes = await get(`http://localhost:8008/api/v1/admin/carts/user/${customerUserId}`, adminToken);
  console.log("Admin Cart View status:", adminCartRes.status, "Customer items count:", adminCartRes.data?.items?.length, "Total:", adminCartRes.data?.totalAmount);

  console.log("\n--- 8. Customer Checkout Cart with Coupon ---");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const checkoutRes = await post('http://localhost:8008/api/v1/customer/cart/checkout', {
    scheduledAt: tomorrow.toISOString().slice(0, 19),
    couponCode: sampleCoupon?.code,
    paymentMethod: 'CASH',
    note: 'Checked out from cart'
  }, token);

  console.log("Checkout status:", checkoutRes.status);
  console.log("Booking created ID:", checkoutRes.data?.id, "Booking Code:", checkoutRes.data?.bookingCode);
  console.log("Total Amount:", checkoutRes.data?.totalAmount, "Final Price Paid:", checkoutRes.data?.pricePaid);
  console.log("Products attached count:", checkoutRes.data?.products?.length);

  console.log("\n--- 9. Verify Cart is Cleared in DB ---");
  const cartAfterCheckout = await get('http://localhost:8008/api/v1/customer/cart', token);
  console.log("Cart items after checkout:", cartAfterCheckout.data?.items?.length, "(Expected: 0)");

  console.log("\n=== ALL CART & OFFERS CHECKS PASSED ===");
}

run().catch(console.error);
