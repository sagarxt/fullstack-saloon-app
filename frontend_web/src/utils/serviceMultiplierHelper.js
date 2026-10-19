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
    let serviceName =
      item.serviceNameSnapshot ||
      item.serviceName ||
      item.service?.name ||
      "Salon Treatment";

    if (item.subServiceName && !serviceName.includes(`(${item.subServiceName})`)) {
      serviceName = `${serviceName} (${item.subServiceName})`;
    }

    const unitPrice = Number(
      item.servicePriceSnapshot ??
      item.price ??
      item.service?.price ??
      0
    );

    const unitMrp = Number(
      item.mrp ??
      item.serviceMrp ??
      item.service?.mrp ??
      unitPrice
    );

    const unitDuration = Number(
      item.serviceDurationSnapshot ??
      item.durationMinutes ??
      item.service?.durationMinutes ??
      30
    );

    const key = (serviceId ? String(serviceId) : "") + "__" + serviceName.toLowerCase().trim();

    const image = item.image || item.serviceImage || item.service?.image || null;

    if (!map.has(key)) {
      map.set(key, {
        key,
        serviceId,
        serviceName,
        image,
        unitPrice,
        unitMrp,
        unitDuration,
        quantity: 1,
        totalPrice: unitPrice,
        totalMrp: unitMrp,
        totalDuration: unitDuration,
        status: item.status || "CONFIRMED",
        itemIds: [item.id || `item-${index}`],
        rawItems: [item],
      });
    } else {
      const existing = map.get(key);
      if (!existing.image && image) {
        existing.image = image;
      }
      existing.quantity += 1;
      existing.totalPrice += unitPrice;
      existing.totalMrp += unitMrp;
      existing.totalDuration += unitDuration;
      existing.itemIds.push(item.id || `item-${index}`);
      existing.rawItems.push(item);
    }
  });

  return Array.from(map.values());
}
