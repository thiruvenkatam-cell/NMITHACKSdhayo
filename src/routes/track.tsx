import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Phone, MessageCircle, Star, Navigation, Layers, ShieldCheck, Copy } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import MapContainer, { type TileStyle } from "@/components/MapContainer";
import type { Map as LeafletMap } from "leaflet";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track delivery — live map & ETA" },
      { name: "description", content: "Real-time tracking and ETA for your campus delivery or lend handover." },
    ],
  }),
  component: Track,
});

// Campus route waypoints (simulated delivery path)
const ROUTE_COORDS: [number, number][] = [
  [19.1334, 72.9133], // origin — canteen
  [19.1338, 72.9140],
  [19.1345, 72.9148],
  [19.1352, 72.9155],
  [19.1360, 72.9158],
  [19.1368, 72.9162],
  [19.1375, 72.9170],
  [19.1380, 72.9178], // runner current position
  [19.1386, 72.9185],
  [19.1392, 72.9190],
  [19.1398, 72.9195], // destination — hostel
];

const ORIGIN = ROUTE_COORDS[0];
const DESTINATION = ROUTE_COORDS[ROUTE_COORDS.length - 1];
const RUNNER_INDEX = 7; // runner is ~70% along the route
const RUNNER_POS = ROUTE_COORDS[RUNNER_INDEX];
const MAP_CENTER: [number, number] = [
  (ORIGIN[0] + DESTINATION[0]) / 2,
  (ORIGIN[1] + DESTINATION[1]) / 2,
];

function Track() {
  const [tileStyle, setTileStyle] = useState<TileStyle>("streets");
  const [showTilePicker, setShowTilePicker] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const deliveryOtp = "4827";
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const runnerMarkerRef = useRef<unknown>(null);

  // Animate the runner marker along remaining route
  useEffect(() => {
    if (!runnerMarkerRef.current) return;
    let animFrame: number;
    let idx = 0;
    const remaining = ROUTE_COORDS.slice(RUNNER_INDEX);

    const step = () => {
      if (!runnerMarkerRef.current) return;
      const pos = remaining[idx % remaining.length];
      // @ts-expect-error marker setLatLng
      runnerMarkerRef.current.setLatLng(pos);
      idx++;
      if (idx < remaining.length) {
        animFrame = window.setTimeout(step, 1200) as unknown as number;
      }
    };

    const delay = setTimeout(step, 2000);
    return () => {
      clearTimeout(delay);
      clearTimeout(animFrame);
    };
  }, []);

  // Show OTP after runner reaches destination
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOtp(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleMapReady = useCallback(async (map: LeafletMap) => {
    mapInstanceRef.current = map;
    const L = await import("leaflet");

    // Fit map to show entire route with padding
    const bounds = L.latLngBounds(ROUTE_COORDS);
    map.fitBounds(bounds, { padding: [50, 50] });

    // --- Completed route (solid) ---
    L.polyline(ROUTE_COORDS.slice(0, RUNNER_INDEX + 1), {
      color: "#1a1052",
      weight: 5,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // --- Remaining route (dashed) ---
    L.polyline(ROUTE_COORDS.slice(RUNNER_INDEX), {
      color: "#1a1052",
      weight: 4,
      opacity: 0.4,
      dashArray: "8, 12",
      lineCap: "round",
    }).addTo(map);

    // --- Origin marker (canteen) ---
    const originIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          display:flex;align-items:center;justify-content:center;
          width:40px;height:40px;border-radius:50%;
          background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);
          font-size:20px;
        ">🏪</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    L.marker(ORIGIN, { icon: originIcon })
      .bindPopup(
        '<div style="font-family:Inter,sans-serif;text-align:center">' +
        '<b style="font-size:13px">Hostel Canteen</b><br>' +
        '<span style="color:#666;font-size:11px">Pickup point</span></div>',
      )
      .addTo(map);

    // --- Destination marker (you) ---
    const destIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          display:flex;align-items:center;justify-content:center;
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(135deg,#1a1052,#2d1b69);
          box-shadow:0 4px 16px rgba(26,16,82,0.45);
          font-size:22px;color:#fff;
        ">🎯</div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
    L.marker(DESTINATION, { icon: destIcon })
      .bindPopup(
        '<div style="font-family:Inter,sans-serif;text-align:center">' +
        '<b style="font-size:13px">Your Location</b><br>' +
        '<span style="color:#666;font-size:11px">Drop-off point</span></div>',
      )
      .addTo(map);

    // --- Runner marker (animated) ---
    const runnerIcon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:52px;height:52px">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:oklch(0.91 0.18 100);opacity:0.4;
            animation:pulse-ring 1.8s cubic-bezier(0.2,0,0.4,1) infinite;
          "></div>
          <div style="
            position:absolute;inset:6px;border-radius:50%;
            background:linear-gradient(135deg,oklch(0.93 0.18 100),oklch(0.85 0.16 75));
            box-shadow:0 4px 16px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:22px;border:3px solid #fff;
          ">🚴</div>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
    });
    const runnerMarker = L.marker(RUNNER_POS, {
      icon: runnerIcon,
      zIndexOffset: 1000,
    })
      .bindPopup(
        '<div style="font-family:Inter,sans-serif;text-align:center">' +
        '<b style="font-size:13px">Aarav 🚴</b><br>' +
        '<span style="color:#666;font-size:11px">320m away · ETA 4 min</span></div>',
      )
      .addTo(map);

    runnerMarkerRef.current = runnerMarker;
  }, []);

  const tilePreviews: { style: TileStyle; label: string; emoji: string }[] = [
    { style: "streets", label: "Streets", emoji: "🗺️" },
    { style: "dark", label: "Dark", emoji: "🌙" },
    { style: "satellite", label: "Satellite", emoji: "🛰️" },
    { style: "watercolor", label: "Art", emoji: "🎨" },
  ];

  return (
    <MobileShell>
      <TopBar title="On the way" subtitle="ETA 4 min · 320 m away" back={false} />

      {/* Real Leaflet map */}
      <div className="relative h-[360px] overflow-hidden md:h-[520px] md:rounded-3xl">
        <MapContainer
          center={MAP_CENTER}
          zoom={16}
          tileStyle={tileStyle}
          hideZoomControl={false}
          className="h-full w-full"
          onMapReady={handleMapReady}
        />

        {/* Tile style switcher FAB */}
        <div className="absolute right-3 top-3 z-[1000]">
          <button
            onClick={() => setShowTilePicker(!showTilePicker)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop transition-transform hover:scale-105 active:scale-95"
          >
            <Layers className="h-4 w-4" />
          </button>

          {showTilePicker && (
            <div className="absolute right-0 top-12 flex gap-1.5 rounded-2xl bg-card/95 p-2 shadow-pop backdrop-blur-sm">
              {tilePreviews.map(({ style, label, emoji }) => (
                <button
                  key={style}
                  onClick={() => {
                    setTileStyle(style);
                    setShowTilePicker(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${
                    tileStyle === style
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Re-center FAB */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(RUNNER_POS, 17, { duration: 1 });
            }
          }}
          className="absolute left-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop transition-transform hover:scale-105 active:scale-95"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>

      {/* Sheet */}
      <div className="-mt-6 rounded-t-3xl border-t border-border bg-card px-4 pb-6 pt-5 shadow-pop">
        <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">PICKED UP</span>
          <span className="text-[11px] font-semibold text-muted-foreground">Order #CC-3487</span>
        </div>
        <h2 className="mt-2 text-xl font-bold">Aarav is bringing your order</h2>
        <p className="text-xs text-muted-foreground">Masala Maggi Cup · Cold Coffee · ₹95</p>

        {/* progress */}
        <div className="mt-4 flex items-center gap-2">
          {["Placed", "Picked", "On way", "Delivered"].map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="h-1.5 w-full rounded-full"
                style={{ background: i <= 2 ? "var(--color-primary)" : "var(--color-border)" }}
              />
              <span className="text-[10px] font-semibold" style={{ color: i <= 2 ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Runner card */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl">🧑‍🎓</div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Aarav · Runner</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" /> 4.9 · 124 drops · CSE 2nd yr
            </p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><MessageCircle className="h-4 w-4" /></button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent p-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-accent-foreground">After delivery</p>
            <p className="text-xs text-accent-foreground">Rate Aarav & earn 10 campus points</p>
          </div>
          <Link to="/" className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Rate now</Link>
        </div>
      </div>

      {/* OTP Verification Overlay */}
      {showOtp && !otpConfirmed && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] animate-in slide-in-from-bottom-4 fade-in">
          <div className="rounded-t-3xl border-t border-border bg-card px-5 pb-8 pt-5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">Delivery Verification</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Share this OTP with Aarav to confirm your delivery. Don't share it until you have your items.
            </p>
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-secondary py-5">
              {deliveryOtp.split("").map((d, i) => (
                <span key={i} className="flex h-14 w-12 items-center justify-center rounded-xl border-2 border-primary bg-card text-2xl font-bold">
                  {d}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(deliveryOtp);
                toast.success("OTP copied to clipboard");
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/80"
            >
              <Copy className="h-3.5 w-3.5" /> Copy OTP
            </button>
            <button
              onClick={() => {
                setOtpConfirmed(true);
                toast.success("Delivery confirmed! 🎉 +10 campus points");
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-sm font-bold text-white shadow-soft transition-transform active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" /> I've received my order
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
