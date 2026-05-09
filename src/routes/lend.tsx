import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { lendItems } from "@/lib/data";
import { Star, Plus } from "lucide-react";

export const Route = createFileRoute("/lend")({
  head: () => ({
    meta: [
      { title: "Lend & Borrow — Live student exchange" },
      { name: "description", content: "Borrow calculators, lab gear, and more from students online right now." },
    ],
  }),
  component: Lend,
});

function Lend() {
  const [tab, setTab] = useState<"all" | "Lend" | "Need">("all");
  const list = tab === "all" ? lendItems : lendItems.filter((x) => x.tag === tab);
  return (
    <MobileShell>
      <TopBar title="Lend & Borrow" subtitle="42 students online · campus-wide" />

      <div className="px-4 py-3">
        <div className="flex gap-2">
          {(["all", "Lend", "Need"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-xl border py-2 text-xs font-bold capitalize transition"
              style={{
                background: tab === t ? "var(--color-primary)" : "var(--color-card)",
                color: tab === t ? "var(--color-primary-foreground)" : "var(--color-foreground)",
                borderColor: tab === t ? "var(--color-primary)" : "var(--color-border)",
              }}
            >
              {t === "all" ? "All" : t === "Lend" ? "Lending" : "Needs"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 px-4 pb-6 md:grid-cols-2 md:gap-4 md:px-0 lg:grid-cols-3">
        {list.map((l) => (
          <Link
            to="/lend/$id"
            params={{ id: l.id }}
            key={l.id}
            className="block rounded-2xl border border-border bg-card p-3 shadow-card"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: l.bg }}>
                {l.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${l.tag === "Lend" ? "bg-success/15 text-success" : "bg-warning/25 text-warning-foreground"}`}>
                    {l.tag === "Lend" ? "LENDING" : "NEEDS"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{l.posted}</span>
                  {l.status === "online" && <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> online
                  </span>}
                </div>
                <p className="mt-1 line-clamp-1 text-sm font-semibold">{l.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{l.avatar} {l.by}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{l.rating}</span>
                  <span>· {l.distance}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold">₹{l.pricePerHr}<span className="text-[10px] font-normal text-muted-foreground">/hr</span></p>
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                    {l.tag === "Lend" ? "Borrow" : "Offer"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => toast("Opening Request Form...")}
        className="fixed bottom-24 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-brand-foreground shadow-pop md:bottom-8 md:right-8 transition-transform active:scale-95 hover:scale-105"
      >
        <Plus className="h-5 w-5" strokeWidth={3} />
        <span className="text-sm font-bold">Post request</span>
      </button>
    </MobileShell>
  );
}
