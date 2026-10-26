/**
 * Safely extract an array from either a Spring Data Page object ({ content: [...] }),
 * a raw array ([...]), or an object containing an items array.
 * Prevents "TypeError: xxx.filter / xxx.map is not a function" crashes.
 */
export const extractList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.items)) return data.items;
  return [];
};

/**
 * Returns formatted price range: "₹499 - ₹2,999" or "₹499" if single price
 */
export const getServicePriceRange = (service) => {
  if (service?.subServices && Array.isArray(service.subServices) && service.subServices.length > 0) {
    const prices = service.subServices.map((s) => Number(s.price) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  }
  return `₹${service?.price ?? 0}`;
};

/**
 * Returns formatted duration range: "30 - 120 mins" or "30 mins"
 */
export const getServiceDurationRange = (service) => {
  if (service?.subServices && Array.isArray(service.subServices) && service.subServices.length > 0) {
    const durs = service.subServices
      .map((s) => Number(s.durationMinutes) || 0)
      .filter((d) => d > 0);
    if (durs.length > 0) {
      const min = Math.min(...durs);
      const max = Math.max(...durs);
      return min === max ? `${min} mins` : `${min} - ${max} mins`;
    }
  }
  return `${service?.durationMinutes ?? 30} mins`;
};

/**
 * Formats "Service name (sub service name)"
 */
export const formatServiceName = (name, subServiceName) => {
  if (!name) return "";
  if (subServiceName && !name.includes(`(${subServiceName})`)) {
    return `${name} (${subServiceName})`;
  }
  return name;
};

/**
 * Calculates Groom Coins earned:
 * 100 spent -> 1 coin
 * >=150 spent -> 2 coins
 * 249 -> 2 coins
 * 299 -> 3 coins
 */
export const calculateGroomCoins = (amount, extraBonus = 0, spendRate = 100) => {
  const rate = spendRate > 0 ? spendRate : 100;
  const num = Number(amount) || 0;
  if (num <= 0) return Number(extraBonus) || 0;
  const base = Math.round(num / rate);
  const bonus = Number(extraBonus) || 0;
  return Math.max(1, base + bonus);
};

/**
 * Safely parse UTC timestamp strings from backend (which may lack 'Z')
 * and format in user's local date and 12-hour time (e.g., "26/10/2026, 04:40 pm").
 */
export const formatLocalDateTime = (dateStr, options = {}) => {
  if (!dateStr) return "";
  try {
    const s = String(dateStr).trim();
    const normalized =
      s.endsWith("Z") || s.includes("+") || /T\d{2}:\d{2}:\d{2}.*[\+\-]/.test(s)
        ? s
        : s.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...options,
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Sorts bookings for Staff & Admin views:
 * 1. Today's bookings on top, sorted by appointment time (ascending: e.g. 09:00, 10:30, 14:00).
 * 2. Upcoming future bookings, sorted by appointment time ascending.
 * 3. Past or other bookings, sorted by appointment/created time descending.
 */
export const sortBookingsWithTodayOnTop = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const parseTime = (dateVal) => {
    if (!dateVal) return 0;
    const s = String(dateVal).trim();
    const normalized = s.endsWith("Z") || s.includes("+") || /T\d{2}:\d{2}:\d{2}.*[\+\-]/.test(s)
      ? s
      : s.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const getBucket = (b) => {
    const t = parseTime(b.scheduledAt || b.createdAt);
    if (t >= todayStart && t < todayEnd) return 1; // Today's bookings on top
    if (t >= todayEnd) return 2; // Upcoming future bookings
    return 3; // Past bookings
  };

  return [...list].sort((a, b) => {
    const bucketA = getBucket(a);
    const bucketB = getBucket(b);

    if (bucketA !== bucketB) {
      return bucketA - bucketB;
    }

    const timeA = parseTime(a.scheduledAt || a.createdAt);
    const timeB = parseTime(b.scheduledAt || b.createdAt);

    if (bucketA === 1) {
      // Today: sort by scheduled time ascending (earliest appointment first)
      return timeA - timeB;
    }
    if (bucketA === 2) {
      // Upcoming: nearest first
      return timeA - timeB;
    }
    // Past: most recent first
    return timeB - timeA;
  });
};



