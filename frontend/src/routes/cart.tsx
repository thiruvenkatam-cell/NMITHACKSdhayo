import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Bike, Clock, Minus, Plus, Zap, ShieldCheck, MapPin, Receipt, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: Cart,
});

function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, getSubtotal, clearCart } = useCartStore();
  const [priority, setPriority] = useState<"standard" | "urgent">("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>("");
  const [deliveryLocation, setDeliveryLocation] = useState("Room 402, Hostel B");

  const subtotal = getSubtotal();
  const platformFee = items.length > 0 ? 5 : 0;
  const runnerTip = priority === "standard" ? 15 : 30;
  const total = subtotal + platformFee + (items.length > 0 ? runnerTip : 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setMatchStatus("Processing payment...");
    
    try {
      const itemString = items.map(i => `${i.name} x ${i.qty}`).join(", ");
      const res = await api.post("/create-order", {
        order_type: "canteen_delivery",
        item: itemString,
        pickup_name: "Hostel Canteen",
        drop_name: deliveryLocation,
        priority: priority
      });
      
      setMatchStatus("Order placed successfully!");
      setTimeout(() => {
        clearCart();
        // Pass order ID if track page needs it, or just rely on backend socket
        navigate({ to: "/track", search: { orderId: res.data.order.order_id } });
      }, 1000);
      
    } catch (err) {
      toast.error("Failed to place order.");
      setIsProcessing(false);
    }
  };

  return (
    <MobileShell>
      <TopBar title="Checkout" subtitle="Campus Store · Block A" />

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Your cart is empty!</p>
            <Link to="/store" className="text-primary font-bold mt-2 inline-block">Go to Store</Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl" style={{ background: item.bg }}>
                {item.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                <p className="text-sm font-semibold mt-1">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-2 py-1.5 shadow-sm">
                <button onClick={() => updateQty(item.id, item.qty - 1)} className="text-muted-foreground"><Minus className="h-4 w-4" /></button>
                <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-primary"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}

        <Link to="/store" className="flex w-full mt-2 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50 py-3 text-xs font-bold text-muted-foreground hover:bg-secondary">
          + Add more items
        </Link>
      </div>

      <div className="h-2 w-full bg-secondary/50 my-2" />

      {/* Delivery Priority */}
      <div className="px-4 py-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Delivery Speed
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPriority("standard")}
            className={`rounded-2xl border-2 p-3 text-left transition-all ${
              priority === "standard" 
                ? "border-primary bg-primary/5 shadow-soft" 
                : "border-border bg-card"
            }`}
          >
            <div className="flex justify-between items-start">
              <Bike className={`h-5 w-5 ${priority === "standard" ? "text-primary" : "text-muted-foreground"}`} />
              {priority === "standard" && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">✓</div>}
            </div>
            <p className="mt-2 text-sm font-bold">Standard</p>
            <p className="text-xs text-muted-foreground mt-0.5">15-20 mins · ₹15 tip</p>
          </button>

          <button
            onClick={() => setPriority("urgent")}
            className={`rounded-2xl border-2 p-3 text-left transition-all ${
              priority === "urgent" 
                ? "border-brand bg-brand/10 shadow-pop" 
                : "border-border bg-card"
            }`}
          >
            <div className="flex justify-between items-start">
              <Zap className={`h-5 w-5 ${priority === "urgent" ? "text-brand" : "text-muted-foreground"}`} strokeWidth={3} />
              {priority === "urgent" && <div className="h-4 w-4 rounded-full bg-brand flex items-center justify-center text-[10px] text-brand-foreground">✓</div>}
            </div>
            <p className="mt-2 text-sm font-bold">Priority</p>
            <p className="text-xs text-muted-foreground mt-0.5">Under 10 mins · ₹30 tip</p>
          </button>
        </div>
      </div>

      <div className="h-2 w-full bg-secondary/50 my-2" />

      {/* Delivery Details */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-accent p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Delivering to</p>
            <p className="text-sm font-semibold mt-0.5">{deliveryLocation}</p>
          </div>
          <button 
            onClick={() => {
              const newLoc = window.prompt("Enter new delivery location:", deliveryLocation);
              if (newLoc && newLoc.trim()) {
                setDeliveryLocation(newLoc.trim());
                toast.success("Delivery location updated!");
              }
            }}
            className="text-xs font-bold text-primary transition-opacity active:opacity-70"
          >
            Change
          </button>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="px-4 py-4 mb-24">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> Bill Details
        </h3>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item Total</span>
            <span className="font-semibold">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Runner Tip <ShieldCheck className="h-3 w-3 text-success" />
            </span>
            <span className="font-semibold">₹{items.length > 0 ? runnerTip : 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee</span>
            <span className="font-semibold">₹{platformFee}</span>
          </div>
          <div className="h-px w-full bg-border my-2" />
          <div className="flex justify-between text-base font-bold">
            <span>To Pay</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-card px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] md:pb-4"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-primary-foreground shadow-pop transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-90"
        >
          {isProcessing ? (
            <div className="flex w-full items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              <span className="font-bold">{matchStatus}</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold opacity-90">Pay via UPI</span>
                <span className="text-lg font-bold">₹{total}</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                Place Order <ArrowRight className="h-5 w-5" />
              </div>
            </>
          )}
        </button>
      </div>
    </MobileShell>
  );
}
