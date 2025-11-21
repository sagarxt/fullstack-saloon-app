// app/data/dummyData.ts
export const services = [
  { id: 1, name: "Haircut", price: "$25", duration: "30 min", icon: "✂️" },
  { id: 2, name: "Hair Color", price: "$80", duration: "90 min", icon: "🎨" },
  { id: 3, name: "Facial", price: "$60", duration: "60 min", icon: "✨" },
  { id: 4, name: "Manicure", price: "$30", duration: "45 min", icon: "💅" },
  { id: 5, name: "Massage", price: "$90", duration: "60 min", icon: "💆" },
  { id: 6, name: "Spa Package", price: "$150", duration: "120 min", icon: "🧖" },
];

export const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 5,
    comment: "Amazing service! Loved my new haircut.",
    date: "2 days ago",
  },
  {
    id: 2,
    name: "Mike Chen",
    rating: 5,
    comment: "Best spa experience ever!",
    date: "1 week ago",
  },
  {
    id: 3,
    name: "Emily Davis",
    rating: 4,
    comment: "Great staff, very professional.",
    date: "2 weeks ago",
  },
];

export const offers = [
  {
    id: 1,
    title: "20% OFF First Visit",
    description: "Get 20% discount on your first booking",
    code: "FIRST20",
    color: "#FF6B6B",
  },
  {
    id: 2,
    title: "Refer & Earn",
    description: "Refer a friend and get $10 credit",
    code: "REFER10",
    color: "#4ECDC4",
  },
  {
    id: 3,
    title: "Weekend Special",
    description: "15% off on all spa services",
    code: "WEEKEND15",
    color: "#FFD93D",
  },
];

export const bookings = [
  {
    id: 1,
    service: "Haircut",
    date: "Nov 22, 2025",
    time: "10:00 AM",
    status: "Upcoming",
    stylist: "Jane Doe",
  },
  {
    id: 2,
    service: "Facial",
    date: "Nov 25, 2025",
    time: "2:00 PM",
    status: "Upcoming",
    stylist: "Sarah Smith",
  },
  {
    id: 3,
    service: "Massage",
    date: "Nov 15, 2025",
    time: "3:00 PM",
    status: "Completed",
    stylist: "Mike Johnson",
  },
];

export const notifications = [
  {
    id: 1,
    title: "Booking Confirmed",
    message: "Your haircut appointment is confirmed for Nov 22",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Special Offer",
    message: "Get 20% off on weekend spa packages!",
    time: "1 day ago",
    read: false,
  },
  {
    id: 3,
    title: "Reminder",
    message: "Your appointment is tomorrow at 10:00 AM",
    time: "2 days ago",
    read: true,
  },
  {
    id: 4,
    title: "New Services",
    message: "Check out our new bridal makeup packages",
    time: "1 week ago",
    read: true,
  },
];
