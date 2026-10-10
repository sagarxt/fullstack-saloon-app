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
