/**
 * Constructs a Google Maps turn-by-turn navigation URL with origin set to the user's current location
 * and destination targeted to the salon branch's GPS coordinates or address.
 * 
 * On mobile devices, this URL launches directly into the Google Maps App navigation mode.
 */
export function getBranchNavigationUrl(branchOrBooking) {
  if (!branchOrBooking) return "https://www.google.com/maps";

  const lat = branchOrBooking.storeLatitude ?? branchOrBooking.latitude;
  const lng = branchOrBooking.storeLongitude ?? branchOrBooking.longitude;

  if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const queryParts = [
    branchOrBooking.storeName || branchOrBooking.name || "Groomish Salon",
    branchOrBooking.storeAddress || branchOrBooking.address,
    branchOrBooking.city,
    branchOrBooking.state,
    branchOrBooking.pincode,
  ].filter(Boolean);

  const destination = queryParts.join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || "Groomish Salon")}`;
}
