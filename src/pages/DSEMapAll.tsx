import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  getAllDSELatest,
  exportOneDSECSV,
  AllDSEPoint,
} from "@/services/dseService";

// Fix Leaflet default icon warnings
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

// ---------- time & status helpers ----------
function minutesDiff(ts: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
}
function humanSince(ts: string) {
  const m = minutesDiff(ts);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h}h ${rm}m ago` : `${h}h ago`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h ago` : `${d}d ago`;
}
function statusOf(ts: string) {
  const m = minutesDiff(ts);
  if (m <= 5) return { label: "Online", color: "#22c55e" }; // green
  if (m <= 30) return { label: "Recently Active", color: "#f59e0b" }; // amber
  return { label: "Inactive", color: "#ef4444" }; // red
}
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

// ---------- pretty pin icon (SVG + photo support) ----------
const ICON_CACHE: Record<string, L.DivIcon> = {};

function pinIcon(color: string, photoUrl?: string) {
  const key = `${color}-${photoUrl || "none"}`;
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const imgHtml = photoUrl
    ? `<img src="${photoUrl}" alt="DSE" 
        style="width:28px;height:28px;border-radius:50%;
        border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);
        position:absolute;top:-36px;left:0;right:0;margin:auto;" />`
    : "";

  const html = `
  <div class="va-pin" style="position:relative;">
    ${imgHtml}
    <svg width="28" height="40" viewBox="0 0 28 40">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <path filter="url(#shadow)"
            d="M14 0c-7.18 0-13 5.82-13 13 0 10.5 13 27 13 27s13-16.5 13-27C27 5.82 21.18 0 14 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="13" r="4.5" fill="white"/>
    </svg>
  </div>`;

  ICON_CACHE[key] = L.divIcon({
    className: "va-pin-wrap",
    html,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -36],
  });
  return ICON_CACHE[key];
}

// ---------- anti-overlap: smart spread ----------
type P = { lat: number; lon: number } & Record<string, any>;
function spreadClosePoints<T extends P>(rows: T[], meters = 30) {
  if (!rows.length) return [];
  const bucket = (x: number) => Math.round(x * 1e4) / 1e4;
  const groups: Record<string, T[]> = {};
  for (const r of rows) {
    const key = `${bucket(r.lat)}|${bucket(r.lon)}`;
    (groups[key] ||= []).push(r);
  }
  const R = 6378137;
  const out: (T & { dispLat: number; dispLon: number })[] = [];
  for (const key in groups) {
    const g = groups[key];
    if (g.length === 1) {
      out.push({ ...g[0], dispLat: g[0].lat, dispLon: g[0].lon });
      continue;
    }
    const centerLatRad = (g[0].lat * Math.PI) / 180;
    const dLat = (meters / R) * (180 / Math.PI);
    const dLon = (meters / (R * Math.cos(centerLatRad))) * (180 / Math.PI);
    g.forEach((pt, i) => {
      const ang = (2 * Math.PI * i) / g.length;
      const dispLat = pt.lat + dLat * Math.sin(ang);
      const dispLon = pt.lon + dLon * Math.cos(ang);
      out.push({ ...pt, dispLat, dispLon });
    });
  }
  return out;
}

function FitToBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds.pad(0.2));
  }, [bounds, map]);
  return null;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-gray-300">
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// ---------- PAGE ----------
export default function DSEMapAll() {
  const [points, setPoints] = useState<AllDSEPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWithin, setActiveWithin] = useState<number | "">("");
  const [query, setQuery] = useState("");
  const [onlyStatus, setOnlyStatus] = useState<
    "all" | "online" | "recent" | "inactive"
  >("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const mapRef = useRef<L.Map | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const mins = activeWithin ? Number(activeWithin) : undefined;
      const data = await getAllDSELatest(mins);
      setPoints(data || []);
    } catch (e) {
      console.error("Failed to fetch all DSE latest:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    if (!autoRefresh) return;
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [activeWithin, autoRefresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (points || []).filter((p) => {
      const st = statusOf(p.ts).label;
      const byName =
        !q ||
        p.dseName.toLowerCase().includes(q) ||
        (p.dsePhone || "").toLowerCase().includes(q);
      const byStatus =
        onlyStatus === "all" ||
        (onlyStatus === "online" && st === "Online") ||
        (onlyStatus === "recent" && st === "Recently Active") ||
        (onlyStatus === "inactive" && st === "Inactive");
      return byName && byStatus;
    });
  }, [points, query, onlyStatus]);

  const spread = useMemo(() => spreadClosePoints(filtered, 30), [filtered]);
  const bounds = useMemo(() => {
    if (!spread.length) return null;
    return L.latLngBounds(
      spread.map((p) => [p.dispLat, p.dispLon] as [number, number])
    );
  }, [spread]);

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">DSE Live Map</h1>
            <p className="text-gray-400 text-sm">
              Showing latest location of{" "}
              <span className="text-white font-semibold">{spread.length}</span>{" "}
              DSE{spread.length !== 1 ? "s" : ""}.
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <Legend color="#22c55e" label="Online ≤ 5m" />
              <Legend color="#f59e0b" label="Recently Active ≤ 30m" />
              <Legend color="#ef4444" label="Inactive > 30m" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name / phone"
              className="bg-gray-800 text-white rounded px-3 py-2 border border-gray-700 w-56"
            />
            <select
              className="bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
              value={onlyStatus}
              onChange={(e) => setOnlyStatus(e.target.value as any)}
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="recent">Recently Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
              value={activeWithin}
              onChange={(e) => setActiveWithin((e.target.value as any) || "")}
            >
              <option value="15">Active within 15 mins</option>
              <option value="30">Active within 30 mins</option>
              <option value="60">Active within 60 mins</option>
              <option value="180">Active within 3 hours</option>
              <option value="">All (no filter)</option>
            </select>
            <button
              onClick={fetchAll}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
            >
              Refresh
            </button>
            <label className="flex items-center gap-2 bg-gray-800 text-white rounded px-3 py-2 border border-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto refresh
            </label>
          </div>
        </div>

        {/* Empty */}
        {!loading && spread.length === 0 && (
          <div className="text-gray-400 bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            No matching DSE locations. Try clearing filters or expanding time.
          </div>
        )}

        {/* Map */}
        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          <MapContainer
            center={bounds ? (bounds.getCenter() as any) : INDIA_CENTER}
            zoom={bounds ? undefined : 5}
            scrollWheelZoom
            className="h-[70vh] w-full"
            whenCreated={(m) => (mapRef.current = m)}
            style={{ background: "#111827" }}
          >
            <FitToBounds bounds={bounds} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />

            {spread.map((p) => {
              const st = statusOf(p.ts);
              const since = humanSince(p.ts);
              const init = initials(p.dseName);
              return (
                <Marker
                  key={p._id}
                  position={[p.dispLat, p.dispLon]}
                  icon={pinIcon(st.color, (p as any).dsePhotoUrl)} // ✅ include photo
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -36]}
                    opacity={1}
                    permanent
                  >
                    <div className="text-xs font-semibold px-2 py-1 rounded bg-white shadow">
                      {p.dseName}
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {(p as any).dsePhotoUrl ? (
                          <img
                            src={(p as any).dsePhotoUrl}
                            alt="DSE"
                            className="w-8 h-8 rounded-full border border-gray-300"
                          />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                            style={{ background: "#6366f1" }}
                          >
                            {init}
                          </span>
                        )}
                        <div className="font-bold">{p.dseName}</div>
                      </div>
                      <div className="text-sm">📞 {p.dsePhone || "—"}</div>
                      <div className="text-sm">
                        <b>Status:</b>{" "}
                        <span style={{ color: st.color }}>{st.label}</span> •{" "}
                        {since}
                      </div>
                      <div className="text-sm">
                        <b>Coords:</b> {p.lat.toFixed(6)}, {p.lon.toFixed(6)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(p.ts).toLocaleString()}
                      </div>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Link
                          to={`/admin/dse-track/${
                            p.user
                          }?mode=day&date=${new Date(p.ts)
                            .toISOString()
                            .slice(0, 10)}`}
                          className="text-blue-500 underline"
                        >
                          View detailed page →
                        </Link>
                        <a
                          className="text-emerald-600 underline"
                          href={`https://www.google.com/maps?q=${p.lat},${p.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Google Maps
                        </a>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(`${p.lat}, ${p.lon}`)
                          }
                          className="text-gray-700 underline"
                        >
                          Copy coords
                        </button>
                        <button
                          onClick={() => exportOneDSECSV(p.user)}
                          className="text-indigo-600 underline"
                        >
                          Download DSE CSV
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* styling */}
      <style>{`
        .va-pin img { transition: transform 0.2s ease; }
        .va-pin img:hover { transform: scale(1.15); }
      `}</style>
    </div>
  );
}

// CSV Download Helper
function downloadFilteredCSV(
  rows: (AllDSEPoint & { dispLat: number; dispLon: number })[]
) {
  const headers = [
    "Name",
    "Phone",
    "Latitude",
    "Longitude",
    "Accuracy",
    "Speed",
    "Timestamp",
    "Status",
    "Since",
  ];
  const lines = rows.map((p) => {
    const st = statusOf(p.ts);
    return [
      `"${(p.dseName || "").replace(/"/g, '""')}"`,
      `"${(p.dsePhone || "").replace(/"/g, '""')}"`,
      p.lat,
      p.lon,
      p.acc ?? "",
      p.speed ?? "",
      new Date(p.ts).toISOString(),
      st.label,
      humanSince(p.ts),
    ].join(",");
  });
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dse-latest-filtered.csv";
  a.click();
  URL.revokeObjectURL(url);
}
