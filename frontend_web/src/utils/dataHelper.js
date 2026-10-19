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

