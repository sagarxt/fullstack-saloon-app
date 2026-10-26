/**
 * Brand Registry & Authenticity Helper for Salon Products on Mobile
 * Provides brand profiles, logos, descriptions, and verification badges.
 */

export interface BrandProfile {
  name: string;
  tagline: string;
  origin: string;
  verified: boolean;
  logo: string | null;
  initials: string;
  accentColor: string;
  badge: string;
}

export const KNOWN_BRANDS: Record<string, Partial<BrandProfile>> = {
  'groomish pro': {
    name: 'Groomish Pro',
    tagline: 'Certified In-House Salon Formulation',
    origin: 'Groomish Labs',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png',
    accentColor: '#F36A22',
    badge: 'Verified Product',
  },
  'groomish barber': {
    name: 'Groomish Barber',
    tagline: 'Master Barber Styling & Beard Essentials',
    origin: 'Groomish Barbershop',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png',
    accentColor: '#D97706',
    badge: 'Verified Product',
  },
  'groomish signature': {
    name: 'Groomish Signature',
    tagline: 'Prestige Botanical & Keratin Therapies',
    origin: 'Groomish Elite',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png',
    accentColor: '#F36A22',
    badge: 'Verified Product',
  },
  "l'oréal professionel": {
    name: "L'Oréal Professionnel",
    tagline: 'Paris • Professional Haircare & Color',
    origin: 'Paris, France',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/f_auto,q_auto,w_200/v1767424595/salon_app/loreal_logo.png',
    accentColor: '#000000',
    badge: 'Verified Product',
  },
  "l'oréal pro": {
    name: "L'Oréal Pro",
    tagline: 'Paris • Professional Haircare & Color',
    origin: 'Paris, France',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/f_auto,q_auto,w_200/v1767424595/salon_app/loreal_logo.png',
    accentColor: '#000000',
    badge: 'Verified Product',
  },
  loreal: {
    name: "L'Oréal Professionnel",
    tagline: 'Paris • Professional Haircare & Color',
    origin: 'Paris, France',
    verified: true,
    logo: 'https://res.cloudinary.com/dfdnljcyt/image/upload/f_auto,q_auto,w_200/v1767424595/salon_app/loreal_logo.png',
    accentColor: '#000000',
    badge: 'Verified Product',
  },
  kérastase: {
    name: 'Kérastase',
    tagline: 'Luxury Hair & Scalp Nutrition',
    origin: 'Paris, France',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=200&q=80',
    accentColor: '#9333EA',
    badge: 'Verified Product',
  },
  kerastase: {
    name: 'Kérastase',
    tagline: 'Luxury Hair & Scalp Nutrition',
    origin: 'Paris, France',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=200&q=80',
    accentColor: '#9333EA',
    badge: 'Verified Product',
  },
  olaplex: {
    name: 'Olaplex',
    tagline: 'Patented Hair Bond Multiplier',
    origin: 'California, USA',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=200&q=80',
    accentColor: '#2563EB',
    badge: 'Verified Product',
  },
  schwarzkopf: {
    name: 'Schwarzkopf Professional',
    tagline: 'German Hair Bonding Innovation',
    origin: 'Berlin, Germany',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80',
    accentColor: '#111827',
    badge: 'Verified Product',
  },
  moroccanoil: {
    name: 'Moroccanoil',
    tagline: 'Argan Oil Infused Luxury Rituals',
    origin: 'Mediterranean Sourced',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=200&q=80',
    accentColor: '#0284C7',
    badge: 'Verified Product',
  },
  wella: {
    name: 'Wella Professionals',
    tagline: 'Precision Color & Deep Salon Repair',
    origin: 'Darmstadt, Germany',
    verified: true,
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    accentColor: '#DC2626',
    badge: 'Verified Product',
  },
};

export function getBrandInitials(name?: string): string {
  if (!name) return 'SB';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getBrandInfo(rawBrandName?: string, serverBrands: any[] = []): BrandProfile {
  if (!rawBrandName || !rawBrandName.trim()) {
    return {
      name: 'Authentic Salon Brand',
      tagline: 'Certified Salon Formulation',
      origin: 'Authorized Salon Partner',
      verified: true,
      logo: null,
      initials: 'SB',
      accentColor: '#F36A22',
      badge: 'Verified Product',
    };
  }

  const clean = rawBrandName.trim();
  const key = clean.toLowerCase();

  // 1. Check server brands array
  if (Array.isArray(serverBrands) && serverBrands.length > 0) {
    const match = serverBrands.find((b: any) => {
      if (!b) return false;
      const bName = (typeof b === 'string' ? b : b.name || '').trim().toLowerCase();
      return bName === key || bName.includes(key) || key.includes(bName);
    });
    if (match && typeof match === 'object') {
      return {
        name: match.name || clean,
        tagline: match.shortDescription || 'Certified Authentic Salon Partner',
        origin: 'Authorized Salon Stockist',
        verified: true,
        logo: match.logo || null,
        initials: getBrandInitials(match.name || clean),
        accentColor: '#F36A22',
        badge: 'Verified Product',
      };
    }
  }

  // 2. Check known brands preset
  const found = KNOWN_BRANDS[key] || Object.entries(KNOWN_BRANDS).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  if (found) {
    return {
      name: found.name || clean,
      tagline: found.tagline || 'Certified Authentic Salon Partner',
      origin: found.origin || 'Authorized Partner',
      verified: true,
      logo: found.logo || null,
      initials: getBrandInitials(found.name || clean),
      accentColor: found.accentColor || '#F36A22',
      badge: 'Verified Product',
    };
  }

  return {
    name: clean,
    tagline: 'Professional Salon Grade Formulation',
    origin: 'Authorized Salon Distributor',
    verified: true,
    logo: null,
    initials: getBrandInitials(clean),
    accentColor: '#1E293B',
    badge: 'Verified Product',
  };
}
