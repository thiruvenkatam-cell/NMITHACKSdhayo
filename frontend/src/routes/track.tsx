import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { useRunnerStore } from "@/lib/store";
import {
  Phone,
  MessageCircle,
  Star,
  ShieldCheck,
  Copy,
  MapPin,
  Clock,
  Sparkles,
  Package,
  CheckCircle2,
  Navigation,
  Bike,
  Radio,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import MapContainer, { type TileStyle } from "@/components/MapContainer";
import type { Map as LeafletMap } from "leaflet";
import { socketService } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { CourierAvatar } from "@/components/courier/CourierAvatar";
import { CourierFlow } from "@/components/courier/CourierFlow";
import { ChatOverlay } from "@/components/ChatOverlay";
import { RatingOverlay } from "@/components/RatingOverlay";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track delivery \u2014 live ETA" },
      {
        name: "description",
        content:
          "Real-time avatar tracking and ETA for your campus delivery or lend handover.",
      },
    ],
  }),
  component: Track,
});

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

interface CourierData {
  name: string;
  gender: "male" | "female";
  rating: number;
  drops: number;
  dept: string;
  aiMatch: number;
}

const courier: CourierData = {
  name: "Rahul K.",
  gender: "male",
  rating: 4.9,
  drops: 124,
  dept: "CSE 2nd yr",
  aiMatch: 94,
};

const STAGES = [
  { label: "Accepted", icon: CheckCircle2, emoji: "\u2705" },
  { label: "Picking Up", icon: Package, emoji: "\uD83D\uDCE6" },
  { label: "On The Way", icon: Bike, emoji: "\uD83D\uDEB4" },
  { label: "Near You", icon: Navigation, emoji: "\uD83D\uDCCD" },
  { label: "Delivered", icon: Sparkles, emoji: "\uD83C\uDF89" },
] as const;

const CAMPUS_LABELS = [
  "Leaving Canteen Area",
  "Passing through Block A",
  "Using Library Shortcut",
  "Crossing Main Corridor",
  "Near Hostel Entrance",
  "Approaching your block",
  "At your door",
];

const ROUTE_LANDMARKS = [
  { emoji: "\uD83C\uDF54", label: "Canteen" },
  { emoji: "\uD83C\uDFEB", label: "Block A" },
  { emoji: "\uD83D\uDCDA", label: "Library" },
  { emoji: "\uD83C\uDFE0", label: "Hostel" },
  { emoji: "\uD83D\uDCCD", label: "You" },
];

const NOTIFICATIONS: Record<number, string> = {
  0: "\uD83C\uDF89 Rahul accepted your order!",
  1: "\uD83D\uDCE6 Rahul is picking up your order",
  2: "\uD83D\uDEB4 Rahul is on the way!",
  3: "\uD83D\uDCCD Rahul is near you \u2014 get ready!",
  4: "\u2705 Delivery complete!",
};

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */

function Track() {
  const { isOnline: isLive, setOnline: setIsLive } = useRunnerStore();
  const [showChat, setShowChat] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(4);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [campusLabel, setCampusLabel] = useState(CAMPUS_LABELS[0]);
  const [showOtp, setShowOtp] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [liveStage, setLiveStage] = useState("On way");
  const [liveEta, setLiveEta] = useState("4 min");
  const [liveProgress, setLiveProgress] = useState(55);
  const [courierName, setCourierName] = useState("Aarav");
  const [deliveryOtp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const runnerMarkerRef = useRef<unknown>(null);
  const notifiedStages = useRef<Set<number>>(new Set());

  // Connect to Socket.IO for realtime delivery updates
  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on('delivery_update', (data: any) => {
      if (data.stage) setLiveStage(data.stage);
      if (data.eta) setLiveEta(data.eta);
      if (data.progress) setLiveProgress(data.progress);
      if (data.courier) setCourierName(data.courier);
      if (data.label) toast.info(data.label);
    });

    socket.on('eta_update', (data: any) => {
      if (data.eta) setLiveEta(data.eta);
      if (data.progress) setLiveProgress(data.progress);
    });

    socket.on('delivery_completed', (data: any) => {
      setShowOtp(true);
      setLiveStage("Delivered");
      setLiveProgress(100);
      toast.success(data.message || "Order delivered! 🎉");
    });

    return () => {
      socket.off('delivery_update');
      socket.off('eta_update');
      socket.off('delivery_completed');
    };
  }, []);

  // --- Realtime simulation engine ---
  useEffect(() => {
    if (isLive) return;
    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= STAGES.length - 1) return prev;
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(stageTimer);
  }, [isLive]);

  useEffect(() => {
    if (isLive) return;
    if (!notifiedStages.current.has(currentStage)) {
      notifiedStages.current.add(currentStage);
      const msg = NOTIFICATIONS[currentStage];
      if (msg) toast(msg, { duration: 3000 });
    }
    const labelIndex = Math.min(
      Math.floor((currentStage / (STAGES.length - 1)) * (CAMPUS_LABELS.length - 1)),
      CAMPUS_LABELS.length - 1
    );
    setCampusLabel(CAMPUS_LABELS[labelIndex]);
    if (currentStage >= STAGES.length - 1) setShowOtp(true);
  }, [currentStage, isLive]);

  useEffect(() => {
    if (isLive) return;
    if (currentStage >= STAGES.length - 1) {
      setEtaMinutes(0);
      setEtaSeconds(0);
      return;
    }
    const etaTimer = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec <= 0) {
          setEtaMinutes((prevMin) => (prevMin <= 0 ? 0 : prevMin - 1));
          return 59;
        }
        return prevSec - 1;
      });
    }, 1000);
    return () => clearInterval(etaTimer);
  }, [currentStage, isLive]);

  useEffect(() => {
    if (isLive || currentStage >= STAGES.length - 1) return;
    const labelTimer = setInterval(() => {
      setCampusLabel((prev) => {
        const idx = CAMPUS_LABELS.indexOf(prev);
        const maxIdx = Math.min(
          Math.floor(((currentStage + 1) / (STAGES.length - 1)) * (CAMPUS_LABELS.length - 1)),
          CAMPUS_LABELS.length - 1
        );
        const minIdx = Math.floor((currentStage / (STAGES.length - 1)) * (CAMPUS_LABELS.length - 1));
        const nextIdx = idx >= maxIdx ? minIdx : idx + 1;
        return CAMPUS_LABELS[nextIdx];
      });
    }, 4000);
    return () => clearInterval(labelTimer);
  }, [currentStage, isLive]);

  const routeProgress = Math.min((currentStage / (STAGES.length - 1)) * 100, 100);
  const isDelivered = currentStage >= STAGES.length - 1;
  const isMoving = currentStage === 2 || currentStage === 3;

  return (
    <MobileShell>
      <TopBar
        title={isLive ? "Courier Mode" : "On the way"}
        subtitle={
          isLive
            ? "You're live \u2014 accept deliveries"
            : isDelivered
              ? "Delivered! \uD83C\uDF89"
              : `ETA ${etaMinutes}m ${etaSeconds.toString().padStart(2, "0")}s \u00B7 On campus`
        }
        back={false}
        right={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsLive(!isLive);
              toast(isLive ? "Courier mode OFF" : "\uD83D\uDFE2 You're now LIVE \u2014 accept deliveries!");
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            style={{
              background: isLive ? "var(--color-success)" : "var(--color-secondary)",
              color: isLive ? "var(--color-success-foreground)" : "var(--color-secondary-foreground)",
            }}
          >
            <motion.span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: isLive ? "#fff" : "var(--color-muted-foreground)" }}
              animate={isLive ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <Radio className="h-3 w-3" />
            {isLive ? "LIVE" : "Go Live"}
          </motion.button>
        }
      />

      <AnimatePresence mode="wait">
        {isLive ? (
          <motion.div key="courier" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <CourierFlow />
          </motion.div>
        ) : (
          <motion.div key="buyer" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            {/* AVATAR TRACKING SECTION */}
            <div className="relative overflow-hidden md:rounded-3xl" style={{ minHeight: 360 }}>
              <div className="absolute inset-0" style={{ background: "var(--color-surface)" }} />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

              <div className="relative z-10 flex flex-col gap-3 p-4">
                {/* Courier Profile Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3 shadow-card" style={{ background: "var(--color-card)" }}>
                  <CourierAvatar gender={courier.gender} size={52} isMoving={isMoving} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{courier.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: isDelivered ? "var(--color-success)" : "var(--color-brand)", color: isDelivered ? "var(--color-success-foreground)" : "var(--color-brand-foreground)" }}>
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: isDelivered ? "var(--color-success-foreground)" : "var(--color-brand-foreground)" }} />
                        {isDelivered ? "Delivered" : STAGES[currentStage]?.label ?? ""}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{courier.rating}</span>
                      <span>{"\u00B7"}</span><span>{courier.drops} drops</span><span>{"\u00B7"}</span><span>{courier.dept}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold" style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
                      <Sparkles className="h-3 w-3" />{courier.aiMatch}%
                    </div>
                    <span className="text-[9px] text-muted-foreground">AI Match</span>
                  </div>
                </motion.div>

                {/* ETA Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex items-center justify-between rounded-2xl border border-border p-3 shadow-card" style={{ background: "var(--color-card)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--color-accent)" }}>
                      <Clock className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Arrival</p>
                      <motion.p key={`${etaMinutes}-${etaSeconds}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-bold">
                        {isDelivered ? (<span style={{ color: "var(--color-success)" }}>Arrived! {"\uD83C\uDF89"}</span>) : (<>{etaMinutes}:{etaSeconds.toString().padStart(2, "0")}<span className="ml-1 text-xs font-semibold text-muted-foreground">min</span></>)}
                      </motion.p>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={campusLabel} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
                      <MapPin className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                      <span className="text-[11px] font-semibold">{campusLabel}</span>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>


                {/* Delivery Timeline */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-2xl border border-border p-4 shadow-card" style={{ background: "var(--color-card)" }}>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Timeline</p>
                  <div className="space-y-0">
                    {STAGES.map((stage, i) => {
                      const isCompleted = i < currentStage;
                      const isActive = i === currentStage;
                      const isPending = i > currentStage;
                      const Icon = stage.icon;
                      return (
                        <motion.div key={stage.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <motion.div className="flex h-7 w-7 items-center justify-center rounded-full border-2"
                              style={{ background: isCompleted ? "var(--color-success)" : isActive ? "var(--color-brand)" : "var(--color-secondary)", borderColor: isCompleted ? "var(--color-success)" : isActive ? "var(--color-brand)" : "var(--color-border)", color: isCompleted || isActive ? (isCompleted ? "var(--color-success-foreground)" : "var(--color-brand-foreground)") : "var(--color-muted-foreground)" }}
                              animate={isActive ? { scale: [1, 1.15, 1], boxShadow: ["0 0 0 0px var(--color-brand)", "0 0 0 6px transparent", "0 0 0 0px var(--color-brand)"] } : {}}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                              {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                            </motion.div>
                            {i < STAGES.length - 1 && <div className="w-0.5" style={{ height: 20, background: isCompleted ? "var(--color-success)" : "var(--color-border)" }} />}
                          </div>
                          <div className="pt-0.5 pb-3">
                            <p className="text-xs font-semibold" style={{ color: isPending ? "var(--color-muted-foreground)" : "var(--color-foreground)" }}>{stage.label}</p>
                            {isActive && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-0.5 text-[10px] text-muted-foreground">{campusLabel}</motion.p>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* BOTTOM SHEET */}
            <div className="-mt-6 rounded-t-3xl border-t border-border bg-card px-4 pb-6 pt-5 shadow-pop">
              <div className="mx-auto h-1 w-10 rounded-full bg-border" />
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">PICKED UP</span>
                <span className="text-[11px] font-semibold text-muted-foreground">Order #CC-3487</span>
              </div>
              <h2 className="mt-2 text-xl font-bold">{courier.name.split(" ")[0]} is bringing your order</h2>
              <p className="text-xs text-muted-foreground">Masala Maggi Cup {"\u00B7"} Cold Coffee {"\u00B7"} {"\u20B9"}95</p>

              {/* Runner card */}
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl">{"\uD83E\uDDD1\u200D\uD83C\uDF93"}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{courier.name.split(" ")[0]} {"\u00B7"} Runner</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {courier.rating} {"\u00B7"} {courier.drops} drops {"\u00B7"} {courier.dept}
                  </p>
                </div>
                <button onClick={() => setShowChat(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 active:scale-95"><MessageCircle className="h-4 w-4" /></button>
                <button onClick={() => toast.info("Calling runner...")} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform active:scale-95"><Phone className="h-4 w-4" /></button>
              </div>


        {/* OTP Inline Verification */}
        {showOtp && !otpConfirmed && (
          <div className="mt-3 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-primary">Delivery OTP</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Share with {courierName} to confirm delivery.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-background py-3 mb-3 border border-border">
              {deliveryOtp.split("").map((d, i) => (
                <span key={i} className="flex h-12 w-10 items-center justify-center rounded-xl bg-secondary text-xl font-bold">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex justify-center">
              <button onClick={() => { setOtpConfirmed(true); toast.success("Delivery confirmed! \uD83C\uDF89 +10 campus points"); }}
                className="flex items-center justify-center gap-2 rounded-xl bg-success px-10 py-3 text-sm font-bold text-white shadow-soft transition-transform active:scale-[0.98]">
                <ShieldCheck className="h-4 w-4" /> Received
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent p-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-accent-foreground">After delivery</p>
            <p className="text-xs text-accent-foreground">Rate {courierName} & earn 10 campus points</p>
          </div>
          <button onClick={() => setShowRating(true)} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95">Rate now</button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

      <ChatOverlay 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
        courierName={courier.name.split(" ")[0]}
        courierGender={courier.gender}
      />

      <RatingOverlay 
        isOpen={showRating} 
        onClose={() => setShowRating(false)} 
        courierName={courier.name.split(" ")[0]}
        courierGender={courier.gender}
      />
    </MobileShell>
  );
}
