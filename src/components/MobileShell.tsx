import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, ShoppingBag, Repeat2, MapPin, User, Zap, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { IncomingOrderPopup } from "./IncomingOrderPopup";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/store", label: "Store", icon: ShoppingBag },
  { to: "/lend", label: "Lend", icon: Repeat2 },
  { to: "/track", label: "Track", icon: MapPin },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[240px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6 lg:w-[260px]">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <Zap className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="text-lg font-bold tracking-tight">UniDrop</span>
        </Link>
        <nav className="mt-8 flex-1 space-y-1">
          {tabs.map((t) => {
            const active = isActive(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={2.4} />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate({ to: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.4} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 md:min-w-0">
        <div className="mx-auto w-full max-w-[480px] pb-24 md:max-w-[1240px] md:px-8 md:pb-12 md:pt-2">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-card/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
        <ul className="flex items-center justify-between">
          {tabs.map((t) => {
            const active = isActive(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to} className="flex-1">
                <Link
                  to={t.to}
                  className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                >
                  <span
                    className="flex h-9 w-12 items-center justify-center rounded-full transition-all"
                    style={{
                      background: active ? "var(--color-brand)" : "transparent",
                      color: active ? "var(--color-brand-foreground)" : "inherit",
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <IncomingOrderPopup />
    </div>
  );
}
