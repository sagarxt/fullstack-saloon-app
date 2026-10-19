/**
 * Mobile utility helpers for Service variations / Sub-services
 */

export function getServicePriceRange(service: any): string {
  if (service?.subServices && Array.isArray(service.subServices) && service.subServices.length > 0) {
    const prices = service.subServices.map((s: any) => Number(s.price) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  }
  return `₹${service?.price ?? 0}`;
}

export function getServiceDurationRange(service: any): string {
  if (service?.subServices && Array.isArray(service.subServices) && service.subServices.length > 0) {
    const durs = service.subServices
      .map((s: any) => Number(s.durationMinutes) || 0)
      .filter((d: number) => d > 0);
    if (durs.length > 0) {
      const min = Math.min(...durs);
      const max = Math.max(...durs);
      return min === max ? `${min}m` : `${min}-${max}m`;
    }
  }
  return `${service?.durationMinutes ?? 30}m`;
}

export function formatServiceName(name?: string, subServiceName?: string): string {
  if (!name) return '';
  if (subServiceName && !name.includes(`(${subServiceName})`)) {
    return `${name} (${subServiceName})`;
  }
  return name;
}

/**
 * Calculates Groom Coins earned:
 * 100 spent -> 1 coin
 * >=150 spent -> 2 coins
 * 249 -> 2 coins
 * 299 -> 3 coins
 */
export function calculateGroomCoins(amount?: number | null, bonusCoins: number = 0, spendRate: number = 100): number {
  const rate = spendRate > 0 ? spendRate : 100;
  const num = Number(amount) || 0;
  if (num <= 0) return Number(bonusCoins) || 0;
  const base = Math.round(num / rate);
  const bonus = Number(bonusCoins) || 0;
  return Math.max(1, base + bonus);
}
