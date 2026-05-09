import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { MobileShell } from "@/components/MobileShell";
import { categories, products } from "@/lib/data";
import { Plus, Clock } from "lucide-react";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Campus Store — Order in minutes" },
      { name: "description", content: "Snacks, meals, drinks and supplies from your campus shops." },
    ],
  }),
  component: Store,
});

function Store() {
  const [active, setActive] = useState<string>("all");
  const list = active === "all" ? products : products.filter((p) => p.category === active);
  
  const { items, addToCart, getTotalItems, getSubtotal } = useCartStore();
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  return (
    <MobileShell>
      <TopBar title="Campus Store" subtitle="Block A · 8 shops nearby" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-2xl bg-accent px-3 py-2.5">
          <Clock className="h-4 w-4 text-accent-foreground" />
          <p className="text-[12px] font-semibold text-accent-foreground">
            Avg delivery <span className="text-primary">9 min</span> · Peer-runner network
          </p>
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        <Chip label="All" active={active === "all"} onClick={() => setActive("all")} emoji="✨" />
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} emoji={c.emoji} active={active === c.id} onClick={() => setActive(c.id)} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-6 md:grid-cols-3 md:gap-5 md:px-0 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p) => (
          <Link
            to="/product/$id"
            params={{ id: p.id }}
            key={p.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="relative flex aspect-square items-center justify-center text-5xl" style={{ background: p.bg }}>
              <span>{p.emoji}</span>
              <span className="absolute left-2 top-2 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-bold">⚡ {p.eta}</span>
              {p.mrp && (
                <span className="absolute right-2 top-2 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-bold text-success-foreground">
                  {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-1 text-[13px] font-semibold">{p.name}</p>
              <p className="line-clamp-1 text-[10px] text-muted-foreground">{p.shop} · {p.unit}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold">₹{p.price}</span>
                  {p.mrp && <span className="text-[10px] text-muted-foreground line-through">₹{p.mrp}</span>}
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(p);
                    toast.success(`Added ${p.name} to cart`);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft transition-transform active:scale-95"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <Link
          to="/cart"
          className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-[448px] items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-pop md:sticky md:bottom-6 md:mx-0 md:w-auto md:max-w-none md:px-5 md:py-4"
        >
          <div>
            <p className="text-[11px] font-semibold opacity-80 md:text-xs">{totalItems} item{totalItems > 1 ? 's' : ''} · 9 min</p>
            <p className="text-sm font-bold md:text-base">₹{subtotal} · View cart</p>
          </div>
          <span className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground md:px-4 md:py-2">Checkout →</span>
        </Link>
      )}
    </MobileShell>
  );
}

function Chip({ label, emoji, active, onClick }: { label: string; emoji?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors"
      style={{
        background: active ? "var(--color-primary)" : "var(--color-card)",
        color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
      }}
    >
      {emoji && <span>{emoji}</span>} {label}
    </button>
  );
}
