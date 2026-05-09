import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/lib/store";

export function GlobalFloatingCart() {
  const { items, getTotalItems, getSubtotal } = useCartStore();
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  if (totalItems === 0) return null;

  return (
    <>
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Link
        to="/cart"
        className="fixed inset-x-0 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-[448px] items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-pop md:mx-0 md:w-auto md:max-w-none md:px-5 md:py-4"
        style={{
          animation: "fade-in-up 0.3s ease-out",
          bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div>
          <p className="text-[11px] font-semibold opacity-80 md:text-xs">
            {totalItems} item{totalItems > 1 ? "s" : ""} · 9 min
          </p>
          <p className="text-sm font-bold md:text-base">₹{subtotal} · View cart</p>
        </div>
        <span className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground md:px-4 md:py-2">
          Checkout →
        </span>
      </Link>
    </>
  );
}

