import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Package, Clock, ChevronRight, Star, RotateCcw, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — UniDrop" },
      { name: "description", content: "View your past orders and reorder favorites." },
    ],
  }),
  component: Orders,
});

const pastOrders = [
  {
    id: "ORD-3487",
    date: "Today, 2:35 PM",
    items: ["Masala Maggi Cup", "Cold Coffee"],
    total: 95,
    status: "delivered",
    runner: "Aarav S.",
    rating: 5,
    emoji: "🍜",
  },
  {
    id: "ORD-3480",
    date: "Today, 11:20 AM",
    items: ["Veg Thali"],
    total: 80,
    status: "delivered",
    runner: "Priya K.",
    rating: 4,
    emoji: "🍛",
  },
  {
    id: "ORD-3472",
    date: "Yesterday, 4:45 PM",
    items: ["Cold Coffee × 2", "Choco Donut"],
    total: 155,
    status: "delivered",
    runner: "Rohan M.",
    rating: 5,
    emoji: "☕",
  },
  {
    id: "ORD-3465",
    date: "Yesterday, 12:10 PM",
    items: ["Samosa × 4", "Iced Lemon Tea"],
    total: 120,
    status: "delivered",
    runner: "Sneha R.",
    rating: 4,
    emoji: "🥟",
  },
  {
    id: "ORD-3451",
    date: "May 7, 6:00 PM",
    items: ["Notebook A4 × 2", "Banana (6)"],
    total: 120,
    status: "cancelled",
    runner: null,
    rating: null,
    emoji: "📓",
  },
  {
    id: "ORD-3440",
    date: "May 7, 1:30 PM",
    items: ["Masala Maggi Cup × 3"],
    total: 105,
    status: "delivered",
    runner: "Aarav S.",
    rating: 5,
    emoji: "🍜",
  },
];

function Orders() {
  return (
    <MobileShell>
      <TopBar title="My Orders" />

      <div className="px-4 pt-2 pb-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">{pastOrders.filter((o) => o.status === "delivered").length}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold">
              ₹{pastOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0)}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground">Total Spent</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold flex items-center justify-center gap-0.5">
              <Star className="h-4 w-4 fill-warning text-warning" /> 4.7
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground">Avg Given</p>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {pastOrders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">
                  {o.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{o.id}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        o.status === "delivered"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {o.status === "delivered" ? "DELIVERED" : "CANCELLED"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold line-clamp-1">{o.items.join(", ")}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {o.date}
                    </span>
                    {o.runner && <span>by {o.runner}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  {o.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < o.rating! ? "fill-warning text-warning" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">₹{o.total}</span>
                  {o.status === "delivered" && (
                    <Link
                      to="/store"
                      className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary transition-transform active:scale-95"
                    >
                      <RotateCcw className="h-3 w-3" /> Reorder
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state hint */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-[11px] text-muted-foreground">
          <ShoppingBag className="h-3.5 w-3.5" />
          That's all your recent orders
        </div>
      </div>
    </MobileShell>
  );
}
