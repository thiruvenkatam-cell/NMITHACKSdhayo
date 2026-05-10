import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import MapContainer, { type TileStyle } from "@/components/MapContainer";
import { useAuth } from "@/lib/store";
import { Star, MessageCircle, Navigation, CheckCircle2, Circle, Loader2, MapPin, Key, Clock, Award, Shield } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { socketService } from "@/lib/socket";

type LendTrackSearch = {
  requestId?: string;
  lender?: string;
  distance?: string;
  rating?: string;
};

export const Route = createFileRoute("/lend-track")({
  validateSearch: (search: Record<string, unknown>): LendTrackSearch => {
    return {
      requestId: search.requestId as string | undefined,
      lender: search.lender as string | undefined,
      distance: search.distance as string | undefined,
      rating: search.rating as string | undefined,
    };
  },
  component: LendTrack,
});

const TIMELINE_STEPS = [
  { id: 1, title: "Request Item", desc: "Request placed securely." },
  { id: 2, title: "AI Match", desc: "Finding the best peer nearby..." },
  { id: 3, title: "Lender Accepts", desc: "Lender confirmed the request." },
  { id: 4, title: "Live Tracking", desc: "Meet at the designated spot." },
  { id: 5, title: "OTP Handover", desc: "Share OTP to receive item." },
  { id: 6, title: "Return Reminder", desc: "Automated safe-return tracking." },
  { id: 7, title: "Ratings & Rewards", desc: "Earn campus rep points." }
];

function LendTrack() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tileStyle, setTileStyle] = useState<TileStyle>("streets");
  const [showTilePicker, setShowTilePicker] = useState(false);
  const [lenderInfo, setLenderInfo] = useState<{ name: string; distance: string; rating: number } | null>(null);
  
  // Timeline State
  const [activeStep, setActiveStep] = useState(1);
  const mapRef = useRef<LeafletMap | null>(null);
  const lenderMarkerRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);

  const lenderName = search.lender || "Priya Sharma";
  const lenderDistance = search.distance || "~150m";
  const lenderRating = search.rating ? parseFloat(search.rating) : 4.9;

  // Connect to Socket.IO for real-time timeline updates
  useEffect(() => {
    const socket = socketService.connect();
    const reqId = search.requestId || `req_${Date.now()}`;

    // Emit start_lend_flow to let the server drive the timeline
    socket.emit('start_lend_flow', {
      request_id: reqId,
      item: 'Requested Item',
    });

    // Listen for server-driven step updates
    socket.on('lend_step', (data: any) => {
      if (data.step) {
        setActiveStep(data.step);
      }
      if (data.match) {
        setLenderInfo({
          name: data.match.lender || lenderName,
          distance: data.match.distance || lenderDistance,
          rating: data.match.rating || lenderRating,
        });
      }
      if (data.desc) {
        // Update the step description with backend info
        toast.info(data.desc);
      }
    });

    return () => {
      socket.off('lend_step');
    };
  }, [search.requestId]);

  // Fallback: if no socket events arrive within 3s, use setTimeout
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (activeStep === 1) {
        setActiveStep(2);
      }
    }, 3000);
    return () => clearTimeout(fallback);
  }, [activeStep]);

  // Leaflet Map Logic
  const handleMapReady = async (map: LeafletMap) => {
    mapRef.current = map;
    const L = await import("leaflet");

    const userLatLng: [number, number] = [19.1334, 72.9133];
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="width:40px;height:40px;border-radius:50%;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);font-size:20px;display:flex;align-items:center;justify-content:center;">📍</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker(userLatLng, { icon: userIcon }).addTo(map).bindPopup("You");

    if (lenderInfo) {
      addLenderMarkerAndLine(L, map, userLatLng);
    }
  };

  const addLenderMarkerAndLine = (L: any, map: LeafletMap, userLatLng: [number, number]) => {
    if (lenderMarkerRef.current) (lenderMarkerRef.current as any).remove();
    if (polylineRef.current) (polylineRef.current as any).remove();

    const lenderLatLng: [number, number] = [19.1345, 72.9148];
    const lenderIcon = L.divIcon({
      className: "",
      html: `<div style="width:40px;height:40px;border-radius:50%;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);font-size:20px;display:flex;align-items:center;justify-content:center;">👤</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    const marker = L.marker(lenderLatLng, { icon: lenderIcon }).addTo(map).bindPopup(lenderInfo!.name);
    lenderMarkerRef.current = marker;

    const line = L.polyline([userLatLng, lenderLatLng], {
      color: "var(--color-primary)",
      weight: 4,
      dashArray: "6,6",
    }).addTo(map);
    polylineRef.current = line;

    const bounds = L.latLngBounds([userLatLng, lenderLatLng]);
    map.fitBounds(bounds, { padding: [60, 60] });
  };

  useEffect(() => {
    if (!lenderInfo || !mapRef.current) return;
    import("leaflet").then((L) => {
      const userLatLng: [number, number] = [19.1334, 72.9133];
      addLenderMarkerAndLine(L, mapRef.current!, userLatLng);
    });
  }, [lenderInfo]);

  const getStepIcon = (stepId: number) => {
    if (stepId < activeStep) return <CheckCircle2 className="h-5 w-5 text-primary" />;
    if (stepId === activeStep) {
      if (stepId === 2) return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      return <Circle className="h-5 w-5 fill-primary text-primary animate-pulse" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground/30" />;
  };

  return (
    <MobileShell>
      <TopBar title="Order Status" />
      
      {/* Map Section - Only visible from step 4 onwards */}
      {activeStep >= 4 && (
        <div className="relative h-[240px] w-full overflow-hidden border-b border-border shadow-sm md:rounded-3xl md:border md:m-4 md:w-auto">
          <MapContainer
            center={[19.1334, 72.9133]}
            zoom={16}
            tileStyle={tileStyle}
            onMapReady={handleMapReady}
            className="h-full w-full z-0"
          />
          <div className="absolute right-3 top-3 z-[1000]">
            <button
              onClick={() => setShowTilePicker(!showTilePicker)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop transition-transform hover:scale-105 active:scale-95"
            >
              <Navigation className="h-4 w-4" />
            </button>
            {showTilePicker && (
              <div className="absolute right-0 top-12 flex gap-1.5 rounded-2xl bg-card/95 p-2 shadow-pop backdrop-blur-sm">
                {(["streets", "dark", "satellite"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      setTileStyle(style);
                      setShowTilePicker(false);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${
                      tileStyle === style ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    {style === "streets" ? "🗺️" : style === "dark" ? "🌙" : "🛰️"}
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-xl bg-card/95 backdrop-blur-md p-3 shadow-pop border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">Meet at Library Entrance</p>
              <p className="text-[10px] text-muted-foreground">Estimated: ~5 mins</p>
            </div>
            {lenderInfo && (
              <button onClick={() => navigate({ to: '/chat/$id', params: { id: lenderInfo.name } })} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95">
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}


      {/* Advance Demo Button (for testing/hackathon purposes) */}
      <div className="p-4 bg-background border-t border-border mb-16 md:mb-0">
        <button 
          onClick={() => setActiveStep(prev => prev < 7 ? prev + 1 : 1)}
          className="w-full text-xs py-3 bg-secondary text-secondary-foreground rounded-xl font-bold transition active:scale-95"
        >
          [Demo] Simulate next step
        </button>
      </div>

    </MobileShell>
  );
}
