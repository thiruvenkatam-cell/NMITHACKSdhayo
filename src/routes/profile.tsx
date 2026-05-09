import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useRunnerStore } from "@/lib/store";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Star, Wallet, Award, Bike, ChevronRight, Settings, ShieldCheck, Heart } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { isOnline, setOnline, setIncomingOrder } = useRunnerStore();

  const menuItems = [
    { icon: "📦", label: "My orders", sub: "12 completed", link: "/orders" },
    { icon: "🤝", label: "My lendings", sub: "5 active", link: "/lend" },
    { icon: "🏆", label: "Leaderboard", sub: "Rank #8", link: "/leaderboard" },
    { icon: "⭐", label: "Reviews & ratings", sub: "4.9 average", link: null },
    { icon: "🔔", label: "Notifications", sub: "3 unread", link: "/notifications" },
    { icon: "❓", label: "Help & safety", sub: "24/7 campus support", link: null },
  ];

  const handleGoLive = () => {
    // Determine the next state
    const nextStatus = !isOnline;
    setOnline(nextStatus);
    
    if (nextStatus) {
      toast.success("You are now online! 🚴");
      setTimeout(() => {
        setIncomingOrder({
          id: "ord-124",
          items: ["Calculator", "Lab Coat"],
          earnings: 15,
          exp: 20,
          pickupLocation: "Library Block",
          pickupDistance: "100m",
          dropoffLocation: "Lab 2, ECE Dept",
          dropoffDistance: "300m",
          eta: "5 min"
        });
      }, 3000);
    } else {
      setIncomingOrder(null);
    }
  };

  return (
    <MobileShell>
      <TopBar title="Profile" back={false} right={<button onClick={() => toast("Settings coming soon")} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"><Settings className="h-4 w-4" /></button>} />

      <div className="bg-gradient-primary px-4 pb-8 pt-4 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-3xl text-brand-foreground ring-4 ring-card/20">
            🧑‍🎓
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">Vihaan Reddy</p>
            <p className="text-[11px] opacity-80">CSE · 3rd year · @vihaan.r</p>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-0.5 rounded-full bg-card/15 px-2 py-0.5 font-semibold">
                <Star className="h-3 w-3 fill-warning text-warning" /> 4.9
              </span>
              <span className="flex items-center gap-1 rounded-full bg-card/15 px-2 py-0.5 font-semibold">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Mini icon={<Wallet className="h-4 w-4" />} label="Wallet" value="₹420" />
          <Mini icon={<Award className="h-4 w-4" />} label="Points" value="1,280" />
          <Mini icon={<Bike className="h-4 w-4" />} label="Drops" value="38" />
        </div>
      </div>

      <div className="-mt-4 rounded-t-3xl bg-background px-4 pb-6 pt-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">🚴</div>
            <div className="flex-1">
              <p className="text-sm font-bold">Runner mode</p>
              <p className="text-[11px] text-muted-foreground">Earn while heading to your next class</p>
            </div>
            <button onClick={handleGoLive} className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
              {isOnline ? "Go offline" : "Go online"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {menuItems.map((r) =>
            r.link ? (
              <Link key={r.label} to={r.link} className="w-full flex items-center text-left gap-3 rounded-2xl border border-border bg-card px-3 py-3 hover:bg-secondary/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">{r.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ) : (
              <button key={r.label} onClick={() => toast(`${r.label} coming soon in V2!`)} className="w-full flex items-center text-left gap-3 rounded-2xl border border-border bg-card px-3 py-3 hover:bg-secondary/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">{r.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          Made with <Heart className="h-3 w-3 fill-destructive text-destructive" /> for campus
        </div>
      </div>
    </MobileShell>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/15 p-3 backdrop-blur">
      <div className="flex items-center gap-1 text-[10px] font-semibold opacity-80">{icon}{label}</div>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}
