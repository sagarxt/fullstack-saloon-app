export const generateSlots = (
  start = "09:00",
  end = "21:00",
  intervalMinutes = 30
) => {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  while (h < endH || (h === endH && m < endM)) {
    slots.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
    m += intervalMinutes;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }
  return slots;
};

/**
 * Returns today's local date string formatted as YYYY-MM-DD
 */
export const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a specific slot time on a given date is in the past
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} slotStr - 'HH:mm'
 * @returns {boolean}
 */
export const isPastSlot = (dateStr, slotStr) => {
  if (!dateStr || !slotStr) return false;
  const todayStr = getTodayDateString(0);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [h, m] = slotStr.split(":").map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = h * 60 + m;
  return slotMinutes <= currentMinutes;
};

/**
 * Filters out slots that are in the past when the date is today
 */
export const filterPastSlots = (slots, dateStr) => {
  const todayStr = getTodayDateString(0);
  if (!dateStr || dateStr < todayStr) return [];
  if (dateStr > todayStr) return slots;
  return slots.filter((slot) => !isPastSlot(dateStr, slot));
};

