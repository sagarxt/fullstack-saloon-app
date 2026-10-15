/**
 * Brand Registry & Authenticity Helper for Salon Products
 * Provides brand profiles, logos, and verification badges.
 */

export const KNOWN_BRANDS = {
  "groomish pro": {
    name: "Groomish Pro",
    tagline: "Certified In-House Salon Formulation",
    origin: "Groomish Labs",
    verified: true,
    logo: "/groomisg_now_icon.png",
    accentColor: "#F36A22",
    badge: "Salon Exclusive",
  },
  "groomish barber": {
    name: "Groomish Barber",
    tagline: "Master Barber Styling & Beard Essentials",
    origin: "Groomish Barbershop",
    verified: true,
    logo: "/groomisg_now_icon.png",
    accentColor: "#D97706",
    badge: "Master Barber Grade",
  },
  "groomish premium": {
    name: "Groomish Premium",
    tagline: "Luxury Botanical & Keratin Therapies",
    origin: "Groomish Elite",
    verified: true,
    logo: "/groomisg_now_icon.png",
    accentColor: "#F36A22",
    badge: "Prestige Care",
  },
  "l'oréal professionnel": {
    name: "L'Oréal Professionnel",
    tagline: "Paris • Professional Haircare & Color",
    origin: "Paris, France",
    verified: true,
    logo: "https://res.cloudinary.com/dfdnljcyt/image/upload/f_auto,q_auto,w_200/v1767424595/salon_app/loreal_logo.png",
    accentColor: "#000000",
    badge: "Authorized Distributor",
  },
  "loreal": {
    name: "L'Oréal Professionnel",
    tagline: "Paris • Professional Haircare & Color",
    origin: "Paris, France",
    verified: true,
    logo: "https://res.cloudinary.com/dfdnljcyt/image/upload/f_auto,q_auto,w_200/v1767424595/salon_app/loreal_logo.png",
    accentColor: "#000000",
    badge: "Authorized Distributor",
  },
  "kérastase": {
    name: "Kérastase",
    tagline: "Luxury Hair & Scalp Nutrition",
    origin: "Paris, France",
    verified: true,
    accentColor: "#9333EA",
    badge: "Luxury Stockist",
  },
  "kerastase": {
    name: "Kérastase",
    tagline: "Luxury Hair & Scalp Nutrition",
    origin: "Paris, France",
    verified: true,
    accentColor: "#9333EA",
    badge: "Luxury Stockist",
  },
  "olaplex": {
    name: "Olaplex",
    tagline: "Patented Hair Bond Multiplier",
    origin: "California, USA",
    verified: true,
    accentColor: "#2563EB",
    badge: "Official Bond Builder",
  },
  "schwarzkopf": {
    name: "Schwarzkopf Professional",
    tagline: "German Hair Bonding Innovation",
    origin: "Berlin, Germany",
    verified: true,
    accentColor: "#111827",
    badge: "Authorized Partner",
  },
  "moroccanoil": {
    name: "Moroccanoil",
    tagline: "Argan Oil Infused Luxury",
    origin: "Mediterranean Sourced",
    verified: true,
    accentColor: "#0284C7",
    badge: "Authentic Salon Care",
  },
  "wella": {
    name: "Wella Professionals",
    tagline: "Precision Color & Deep Repair",
    origin: "Darmstadt, Germany",
    verified: true,
    accentColor: "#DC2626",
    badge: "Salon Partner",
  },
};

/**
 * Normalizes brand name and returns full brand details
 */
export function getBrandInfo(rawBrandName) {
  if (!rawBrandName || !rawBrandName.trim()) {
    return {
      name: "Authentic Salon Brand",
      tagline: "Certified Salon Formulation",
      origin: "Authorized Partner",
      verified: true,
      logo: null,
      initials: "SB",
      accentColor: "#F36A22",
      badge: "100% Genuine",
    };
  }

  const clean = rawBrandName.trim();
  const key = clean.toLowerCase();

  const found = KNOWN_BRANDS[key] || Object.entries(KNOWN_BRANDS).find(([k]) => key.includes(k) || k.includes(key))?.[1];

  if (found) {
    return {
      ...found,
      initials: getBrandInitials(found.name),
    };
  }

  return {
    name: clean,
    tagline: "Certified Authentic Salon Partner",
    origin: "Authorized Distributor",
    verified: true,
    logo: null,
    initials: getBrandInitials(clean),
    accentColor: "#1E293B",
    badge: "100% Genuine",
  };
}

/**
 * Derives 2-letter monogram initials for a brand
 */
export function getBrandInitials(name) {
  if (!name) return "SB";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Builds list of brands present in current products catalog
 */
export function extractBrandsFromProducts(products = [], serverBrands = []) {
  const brandMap = new Map();

  // Seed from server brands
  if (Array.isArray(serverBrands)) {
    serverBrands.filter(Boolean).forEach((b) => {
      const clean = b.trim();
      if (clean) {
        brandMap.set(clean.toLowerCase(), {
          rawName: clean,
          count: 0,
        });
      }
    });
  }

  // Count active products per brand
  products.forEach((p) => {
    if (p && p.brand && p.brand.trim()) {
      const clean = p.brand.trim();
      const key = clean.toLowerCase();
      const existing = brandMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        brandMap.set(key, {
          rawName: clean,
          count: 1,
        });
      }
    }
  });

  return Array.from(brandMap.values()).map((item) => {
    const info = getBrandInfo(item.rawName);
    return {
      ...info,
      productCount: item.count,
    };
  });
}
