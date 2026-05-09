import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MerchantShell } from "@/components/MerchantShell";
import { TopBar } from "@/components/TopBar";
import { Clock, CheckCircle2, XCircle, Bike, ChevronRight, MapPin, Zap, Filter } from "lucide-react";

export const Route = createFileRoute("/merchant-orders")({
  component: MerchantOrders,
});

type Order = {
  id: string; items: string; to: string; from: string; time: string;
  status: "new" | "preparing" | "assigned" | "picked" | "delivered" | "rejected";
  urgent: boolean; emoji: string; total: number; runner: string | null; eta: string;
};

const initial: Order[] = [
  { id: "#231", items: "Maggi × 2, Coffee", to: "Library Block", from: "Counter 2", time: "Just now", status: "new", urgent: true, emoji: "🍜", total: 130, runner: null, eta: "5 min" },
  { id: "#230", items: "Sandwich, Water Bottle", to: "Hostel B-402", from: "Counter 1", time: "2m ago", status: "new", urgent: false, emoji: "🥪", total: 75, runner: null, eta: "8 min" },
  { id: "#229", items: "Coffee × 3", to: "CSE Lab 4", from: "Counter 2", time: "5m ago", status: "preparing", urgent: false, emoji: "☕", total: 180, runner: "Aarav S.", eta: "6 min" },
  { id: "#228", items: "Notes Printout × 10", to: "Admin Office", from: "Print Desk", time: "8m ago", status: "assigned", urgent: true, emoji: "🖨️", total: 50, runner: "Priya K.", eta: "4 min" },
  { id: "#227", items: "Pen × 5, Notebook", to: "ME Workshop", from: "Counter 1", time: "12m ago", status: "picked", urgent: false, emoji: "✏️", total: 90, runner: "Rohan M.", eta: "3 min" },
  { id: "#226", items: "Water Bottle × 6", to: "Gym Block", from: "Counter 1", time: "20m ago", status: "delivered", urgent: false, emoji: "💧", total: 120, runner: "Sneha R.", eta: "—" },
  { id: "#225", items: "Maggi, Lemon Tea", to: "Hostel A-112", from: "Counter 2", time: "25m ago", status: "delivered", urgent: false, emoji: "🍜", total: 75, runner: "Aarav S.", eta: "—" },
];

const newOrderPool: Partial<Order>[] = [
  { items: "Samosa × 4", to: "ECE Dept", emoji: "🥟", total: 80, urgent: true, eta: "5 min" },
  { items: "Cold Coffee × 2", to: "Library 2nd Floor", emoji: "🧋", total: 120, urgent: false, eta: "7 min" },
  { items: "Veg Thali", to: "Hostel C-301", emoji: "🍛", total: 80, urgent: false, eta: "12 min" },
  { items: "Printout × 3", to: "Placement Cell", emoji: "🖨️", total: 15, urgent: true, eta: "4 min" },
];

function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [filter, setFilter] = useState<string>("all");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/merchant/orders");
      if (res.data.orders) {
        // Map backend orders to frontend format
        const mapped = res.data.orders.map((o: any) => ({
          id: o.order_id || `#${Math.floor(Math.random() * 900) + 100}`,
          items: o.items.map((i: any) => `${i.name} × ${i.quantity}`).join(", "),
          to: o.delivery_location || "Campus",
          from: "Store",
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: o.status === "pending" ? "new" : o.status,
          urgent: o.total_amount > 100, // Example logic
          emoji: "📦",
          total: o.total_amount,
          runner: o.courier_id || null,
          eta: "5 min"
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: Order["status"]) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const backendStatus = status === "new" ? "pending" : status;
      await api.post("/merchant/update-order-status", { order_id: id, status: backendStatus });
    } catch (err) {
      toast.error("Failed to update status on server");
      fetchOrders(); // Revert on failure
    }
  };

  const assignRunner = async (id: string) => {
    try {
      await api.post("/merchant/assign-courier", { order_id: id });
      toast.success(`Courier assigned!`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to assign courier");
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      new: "bg-red-500/15 text-red-600", preparing: "bg-amber-500/15 text-amber-600",
      assigned: "bg-blue-500/15 text-blue-600", picked: "bg-violet-500/15 text-violet-600",
      delivered: "bg-green-500/15 text-green-600", rejected: "bg-gray-500/15 text-gray-500",
    };
    return map[s] || "";
  };

  const stages = ["new", "preparing", "assigned", "picked", "delivered"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <MerchantShell>
      <TopBar title="Incoming Orders" back={false} />

      <div className="px-4 pt-2 pb-6">
        {/* Filter Chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
          {["all", ...stages, "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition-all ${
                filter === f ? "bg-red-500 text-white" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f} {f !== "all" && <span className="opacity-60">({orders.filter((o) => o.status === f).length})</span>}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.map((o, i) => (
            <div
              key={o.id + i}
              className={`rounded-2xl border bg-card p-4 transition-all ${
                o.status === "new" ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : "border-border"
              }`}
              style={{ animation: o.time === "Just now" ? "fade-up 0.4s ease-out" : undefined }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{o.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{o.id}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusBadge(o.status)}`}>{o.status}</span>
                      {o.urgent && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">URGENT</span>}
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{o.items}</p>
                  </div>
                </div>
                <span className="text-sm font-bold">₹{o.total}</span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.to}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />ETA {o.eta}</span>
                <span>{o.time}</span>
              </div>

              {/* Delivery Progress */}
              {o.status !== "new" && o.status !== "rejected" && (
                <div className="mt-3 flex items-center gap-1">
                  {stages.map((s, si) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${stages.indexOf(o.status) >= si ? "bg-red-500" : "bg-border"}`} />
                  ))}
                </div>
              )}

              {/* Runner info */}
              {o.runner && (
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <Bike className="h-3 w-3 text-red-500" />
                  <span className="font-semibold">{o.runner}</span>
                </div>
              )}

              {/* Action Buttons */}
              {o.status === "new" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { updateStatus(o.id, "preparing"); toast.success("Order accepted!"); }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => { updateStatus(o.id, "rejected"); toast.error("Order rejected"); }}
                    className="flex items-center justify-center gap-1 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-muted-foreground active:scale-95"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {o.status === "preparing" && (
                <button
                  onClick={() => assignRunner(o.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-red-500/30 bg-red-500/5 py-2.5 text-xs font-bold text-red-500 active:scale-95"
                >
                  <Zap className="h-3.5 w-3.5" /> AI Assign Courier
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes fade-up { 0% { opacity:0; transform:translateY(8px); } 100% { opacity:1; transform:translateY(0); } }`}</style>
    </MerchantShell>
  );
}
