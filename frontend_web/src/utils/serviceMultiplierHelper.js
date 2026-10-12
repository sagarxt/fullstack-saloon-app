/**
 * Groups identical services in a booking items array to show a multiplier / quantity.
 * 
 * @param {Array} items - Raw bookingItems list from backend
 * @returns {Array} List of grouped service items with quantity multiplier
 */
export function groupBookingServices(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const map = new Map();

  items.forEach((item, index) => {
    // Unique key by serviceId or service name
    const serviceId = item.serviceId || item.service?.id;
    const serviceName =
      item.serviceNameSnapshot ||
      item.serviceName ||
      item.service?.name ||
      "Salon Treatment";

    const unitPrice = Number(
      item.servicePriceSnapshot ??
      item.price ??
      item.service?.price ??
      0
    );

    const unitDuration = Number(
      item.serviceDurationSnapshot ??
      item.durationMinutes ??
      item.service?.durationMinutes ??
      30
    );

    const key = serviceId ? String(serviceId) : serviceName.toLowerCase().trim();

    if (!map.has(key)) {
      map.set(key, {
        key,
        serviceId,
        serviceName,
        unitPrice,
        unitDuration,
        quantity: 1,
        totalPrice: unitPrice,
        totalDuration: unitDuration,
        status: item.status || "CONFIRMED",
        itemIds: [item.id || `item-${index}`],
        rawItems: [item],
      });
    } else {
      const existing = map.get(key);
      existing.quantity += 1;
      existing.totalPrice += unitPrice;
      existing.totalDuration += unitDuration;
      existing.itemIds.push(item.id || `item-${index}`);
      existing.rawItems.push(item);
    }
  });

  return Array.from(map.values());
}
