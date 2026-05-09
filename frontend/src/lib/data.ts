export type Product = {
  id: string;
  name: string;
  shop: string;
  price: number;
  mrp?: number;
  unit: string;
  emoji: string;
  bg: string;
  category: string;
  eta: string;
};

export const categories = [
  { id: "snacks", name: "Snacks", emoji: "🍟", bg: "oklch(0.95 0.08 75)" },
  { id: "drinks", name: "Drinks", emoji: "🥤", bg: "oklch(0.93 0.08 200)" },
  { id: "meals", name: "Meals", emoji: "🍱", bg: "oklch(0.94 0.08 30)" },
  { id: "stationery", name: "Stationery", emoji: "✏️", bg: "oklch(0.93 0.08 280)" },
  { id: "coffee", name: "Coffee", emoji: "☕", bg: "oklch(0.92 0.06 60)" },
  { id: "sweets", name: "Sweets", emoji: "🍩", bg: "oklch(0.94 0.09 350)" },
  { id: "fruits", name: "Fruits", emoji: "🍎", bg: "oklch(0.94 0.1 140)" },
  { id: "essentials", name: "Essentials", emoji: "🧴", bg: "oklch(0.93 0.05 240)" },
];

export const products: Product[] = [
  { id: "p1", name: "Masala Maggi Cup", shop: "Hostel Canteen", price: 35, mrp: 40, unit: "70g", emoji: "🍜", bg: "oklch(0.95 0.1 60)", category: "snacks", eta: "8 min" },
  { id: "p2", name: "Cold Coffee", shop: "Brew Hub", price: 60, mrp: 80, unit: "300ml", emoji: "🧋", bg: "oklch(0.92 0.06 60)", category: "coffee", eta: "10 min" },
  { id: "p3", name: "Veg Thali", shop: "Mess 2", price: 80, unit: "1 plate", emoji: "🍛", bg: "oklch(0.94 0.09 30)", category: "meals", eta: "15 min" },
  { id: "p4", name: "Samosa (2 pcs)", shop: "Tuck Shop", price: 20, emoji: "🥟", unit: "2 pcs", bg: "oklch(0.95 0.1 70)", category: "snacks", eta: "6 min" },
  { id: "p5", name: "Notebook A4", shop: "Campus Store", price: 45, mrp: 60, unit: "200 pg", emoji: "📓", bg: "oklch(0.93 0.08 280)", category: "stationery", eta: "12 min" },
  { id: "p6", name: "Iced Lemon Tea", shop: "Brew Hub", price: 40, unit: "350ml", emoji: "🧃", bg: "oklch(0.94 0.09 130)", category: "drinks", eta: "9 min" },
  { id: "p7", name: "Choco Donut", shop: "Sweet Spot", price: 35, emoji: "🍩", unit: "1 pc", bg: "oklch(0.94 0.09 350)", category: "sweets", eta: "10 min" },
  { id: "p8", name: "Banana (6)", shop: "Fruit Cart", price: 30, emoji: "🍌", unit: "6 pcs", bg: "oklch(0.94 0.12 110)", category: "fruits", eta: "7 min" },
];

export type LendItem = {
  id: string;
  title: string;
  by: string;
  avatar: string;
  rating: number;
  distance: string;
  pricePerHr: number;
  emoji: string;
  bg: string;
  tag: "Lend" | "Need";
  posted: string;
  status?: "online" | "offline";
};

export const lendItems: LendItem[] = [
  { id: "l1", title: "Scientific Calculator", by: "Aarav S.", avatar: "🧑‍🎓", rating: 4.8, distance: "120 m", pricePerHr: 15, emoji: "🧮", bg: "oklch(0.93 0.08 200)", tag: "Lend", posted: "2m ago", status: "online" },
  { id: "l2", title: "Need Drafter Set (urgent)", by: "Priya K.", avatar: "👩‍🎓", rating: 4.9, distance: "Block C", pricePerHr: 25, emoji: "📐", bg: "oklch(0.94 0.09 30)", tag: "Need", posted: "Just now", status: "online" },
  { id: "l3", title: "HDMI Cable 2m", by: "Rohan M.", avatar: "🧑", rating: 4.7, distance: "Library", pricePerHr: 10, emoji: "🔌", bg: "oklch(0.93 0.06 280)", tag: "Lend", posted: "8m ago", status: "online" },
  { id: "l4", title: "Lab Coat (M)", by: "Sneha R.", avatar: "👩", rating: 4.6, distance: "Hostel A", pricePerHr: 12, emoji: "🥼", bg: "oklch(0.95 0.04 240)", tag: "Lend", posted: "20m ago", status: "offline" },
  { id: "l5", title: "Need iPad for design class", by: "Kabir J.", avatar: "🧑‍💻", rating: 4.5, distance: "Studio 3", pricePerHr: 80, emoji: "🪟", bg: "oklch(0.94 0.06 320)", tag: "Need", posted: "5m ago", status: "online" },
];
