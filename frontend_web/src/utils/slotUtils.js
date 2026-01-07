export const generateSlots = (
  startHour = 10,
  endHour = 20,
  interval = 30
) => {
  const slots = [];
  let current = startHour * 60;

  while (current < endHour * 60) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
    current += interval;
  }

  return slots;
};

export const isSlotBlocked = (
  slot,
  unavailableSlots,
  serviceDuration,
  interval = 30
) => {
  const blocksNeeded = Math.ceil(serviceDuration / interval);
  const [h, m] = slot.split(":").map(Number);
  let startMinutes = h * 60 + m;

  for (let i = 0; i < blocksNeeded; i++) {
    const check = startMinutes + i * interval;
    const checkSlot =
      `${String(Math.floor(check / 60)).padStart(2, "0")}:${String(check % 60).padStart(2, "0")}`;

    if (unavailableSlots.includes(checkSlot)) {
      return true;
    }
  }

  return false;
};
