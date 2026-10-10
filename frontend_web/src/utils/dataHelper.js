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
