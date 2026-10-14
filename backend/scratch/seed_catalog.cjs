const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      hostname: 'localhost',
      port: 8008,
      path: '/api/v1' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: respBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8008,
      path: '/api/v1' + path,
      method: 'GET',
      headers: {}
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(respBody) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: respBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function seed() {
  console.log('Seeding salon catalog via Admin API...');
  const loginRes = await post('/auth/login', {
    email: 'admin@loyaltyapp.com',
    password: 'admin123'
  });
  const token = loginRes.data.data?.token || loginRes.data.token;
  if (!token) throw new Error('Failed to login admin: ' + JSON.stringify(loginRes));
  console.log('Admin login successful.');

  // 1. Categories
  const existingCatsRes = await get('/public/categories');
  const existingCats = Array.isArray(existingCatsRes.data) ? existingCatsRes.data : [];
  console.log('Existing categories:', existingCats.map(c => c.name));

  let hairCat = existingCats.find(c => c.name && c.name.toLowerCase().includes('hair'));
  let skinCat = existingCats.find(c => c.name && c.name.toLowerCase().includes('skin'));
  let beardCat = existingCats.find(c => c.name && (c.name.toLowerCase().includes('beard') || c.name.toLowerCase().includes('groom')));
  let nailCat = existingCats.find(c => c.name && (c.name.toLowerCase().includes('nail') || c.name.toLowerCase().includes('feet')));

  if (!skinCat) {
    const res = await post('/admin/categories', {
      name: 'Skin Care & Facials',
      description: 'Revitalizing facials, organic peel therapy, de-tan treatments and skin glow packages.',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
    }, token);
    skinCat = res.data.data || res.data;
    console.log('Created Skin Care category:', skinCat.name, skinCat.id);
  }

  if (!beardCat) {
    const res = await post('/admin/categories', {
      name: 'Beard & Men Grooming',
      description: 'Sharp beard trims, luxury razor shaves, styling & conditioning.',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
    }, token);
    beardCat = res.data.data || res.data;
    console.log('Created Beard category:', beardCat.name, beardCat.id);
  }

  if (!nailCat) {
    const res = await post('/admin/categories', {
      name: 'Hands, Feet & Spa',
      description: 'Relaxing aroma pedicures, manicures and reflexology treatments.',
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80'
    }, token);
    nailCat = res.data.data || res.data;
    console.log('Created Hands & Feet category:', nailCat.name, nailCat.id);
  }

  // 2. Services
  const existingServicesRes = await get('/public/services');
  const existingServices = Array.isArray(existingServicesRes.data) ? existingServicesRes.data : [];
  const existingServiceNames = new Set(existingServices.map(s => s.name.toLowerCase().trim()));
  console.log('Existing services:', Array.from(existingServiceNames));

  const servicesToCreate = [
    {
      name: 'Signature Haircut & Wash',
      categoryId: hairCat.id,
      description: 'Precision scissor and clipper cut with hair wash, scalp massage, and bespoke styling.',
      gender: 'UNISEX',
      mrp: 799,
      price: 599,
      rewards: 60,
      durationMinutes: 45,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Deep Nourishing Hair Spa',
      categoryId: hairCat.id,
      description: 'Intense hydration with botanical scalp mask, hot towel steam, and shine serum.',
      gender: 'UNISEX',
      mrp: 1499,
      price: 1199,
      rewards: 120,
      durationMinutes: 50,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Balayage & Global Hair Color',
      categoryId: hairCat.id,
      description: 'L’Oréal Majirel ammonia-safe global tinting or seamless gradient sun-kissed balayage.',
      gender: 'UNISEX',
      mrp: 3999,
      price: 2999,
      rewards: 300,
      durationMinutes: 90,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Hydra-Boost Glow Facial & De-Tan',
      categoryId: skinCat.id,
      description: 'Deep pore extraction, ultrasonic exfoliation and hyaluronic acid booster for radiant glow.',
      gender: 'UNISEX',
      mrp: 1899,
      price: 1499,
      rewards: 150,
      durationMinutes: 60,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Activated Charcoal Pollution Detox',
      categoryId: skinCat.id,
      description: 'Pore cleansing with organic bamboo charcoal peel-off mask and vitamin C infusion.',
      gender: 'UNISEX',
      mrp: 1399,
      price: 1099,
      rewards: 110,
      durationMinutes: 45,
      image: 'https://images.unsplash.com/photo-1512290900672-1f5be6762319?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Royal Hot Towel Shave & Beard Sculpting',
      categoryId: beardCat.id,
      description: 'Traditional straight razor shave with essential oils, warm towels, and soothing balm.',
      gender: 'MALE',
      mrp: 499,
      price: 399,
      rewards: 40,
      durationMinutes: 30,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Beard Conditioning & Charcoal Mask',
      categoryId: beardCat.id,
      description: 'Deep beard wash with argan oil steam treatment and mustache shaping.',
      gender: 'MALE',
      mrp: 699,
      price: 549,
      rewards: 55,
      durationMinutes: 30,
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Signature Aroma Pedicure & Reflexology',
      categoryId: nailCat.id,
      description: 'Exfoliating foot soak with dead sea salts, scrub, cuticles care, and relaxing pressure massage.',
      gender: 'UNISEX',
      mrp: 1199,
      price: 899,
      rewards: 90,
      durationMinutes: 45,
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Classic Manicure & Hand Spa',
      categoryId: nailCat.id,
      description: 'Nail shaping, cuticle treatment, gentle exfoliating scrub, and nourishing hand butter massage.',
      gender: 'UNISEX',
      mrp: 899,
      price: 699,
      rewards: 70,
      durationMinutes: 40,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'
    }
  ];

  for (const s of servicesToCreate) {
    if (!existingServiceNames.has(s.name.toLowerCase().trim())) {
      const res = await post('/admin/services', s, token);
      console.log('Created service:', s.name, 'Status:', res.status);
    } else {
      console.log('Service already exists, skipping:', s.name);
    }
  }

  // 3. Products
  const existingProdsRes = await get('/public/products');
  const existingProds = Array.isArray(existingProdsRes.data) ? existingProdsRes.data : [];
  const existingProdNames = new Set(existingProds.map(p => p.name.toLowerCase().trim()));

  const productsToCreate = [
    {
      name: 'Moroccan Argan Hair Elixir',
      description: 'Pure cold-pressed Moroccan argan oil serum for instant frizz control, thermal heat protection, and silky shine.',
      brand: 'Groomish Luxe',
      category: 'Hair Care',
      price: 899,
      mrp: 1199,
      volumeOrSize: '100ml',
      stockQuantity: 45,
      image: 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Hydra-Boost Hyaluronic Facial Cleanser',
      description: 'Gentle foaming face wash infused with hyaluronic acid, niacinamide, and green tea extract for deep hydration.',
      brand: 'Groomish Dermacare',
      category: 'Skin & Facial',
      price: 549,
      mrp: 699,
      volumeOrSize: '150ml',
      stockQuantity: 60,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Organic Cedarwood Beard Conditioning Oil',
      description: 'All-natural beard growth oil with cedarwood, jojoba, and vitamin E to soften bristles and soothe skin itch.',
      brand: 'Groomish Barber',
      category: 'Beard Care',
      price: 449,
      mrp: 599,
      volumeOrSize: '50ml',
      stockQuantity: 35,
      image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Matte Finish Strong Hold Clay Wax',
      description: 'Premium beeswax and bentonite styling clay offering all-day reworkable grip with natural non-greasy matte look.',
      brand: 'Groomish Barber',
      category: 'Styling',
      price: 399,
      mrp: 499,
      volumeOrSize: '85g',
      stockQuantity: 50,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Volumizing Sea Salt Texture Spray',
      description: 'Texturizing hair mist with Mediterranean sea minerals for effortless beach waves and thickness without stickiness.',
      brand: 'Groomish Luxe',
      category: 'Hair Care',
      price: 499,
      mrp: 649,
      volumeOrSize: '200ml',
      stockQuantity: 40,
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80'
    }
  ];

  for (const p of productsToCreate) {
    if (!existingProdNames.has(p.name.toLowerCase().trim())) {
      const res = await post('/admin/products', p, token);
      console.log('Created product:', p.name, 'Status:', res.status);
    } else {
      console.log('Product already exists, skipping:', p.name);
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

seed().catch(console.error);
