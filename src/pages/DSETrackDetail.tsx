import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  getDSETrackDay,
  getDSETrackRange,
  csvTrackDayUrl,
} from "@/services/dseService";
import { Button } from "@/components/ui/button";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icons
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay() || 7;
  if (day !== 1) x.setDate(x.getDate() - (day - 1));
  return x;
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  return addDays(s, 6);
}

const dayColors = [
  "#60a5fa",
  "#f472b6",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
];

function FitToBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    // tiny timeout to allow map mount
    setTimeout(() => map.fitBounds(bounds, { padding: [30, 30] }), 50);
  }, [bounds, map]);
  return null;
}

export default function DSETrackDetail() {
  const { dseId } = useParams();
  const [sp, setSp] = useSearchParams();

  const [mode, setMode] = useState<"day" | "range">(
    (sp.get("mode") as any) || "day"
  );
  const [date, setDate] = useState<string>(
    sp.get("date") || toISODate(new Date())
  );
  const [from, setFrom] = useState<string>(
    sp.get("from") || toISODate(addDays(new Date(), -7))
  );
  const [to, setTo] = useState<string>(sp.get("to") || toISODate(new Date()));
  const [maxAcc, setMaxAcc] = useState<number>(Number(sp.get("maxAcc") || 500));
  const [sampleSec, setSampleSec] = useState<number>(
    Number(sp.get("sampleSec") || 60)
  );
  const [showPoints, setShowPoints] = useState(true);

  const [loading, setLoading] = useState(false);
  const [dayData, setDayData] = useState<any | null>(null);
  const [rangeData, setRangeData] = useState<any | null>(null);

  // persist controls in URL
  useEffect(() => {
    const params: Record<string, string> = { mode };
    if (mode === "day") params.date = date;
    else {
      params.from = from;
      params.to = to;
    }
    if (maxAcc) params.maxAcc = String(maxAcc);
    if (sampleSec) params.sampleSec = String(sampleSec);
    setSp(params, { replace: true });
  }, [mode, date, from, to, maxAcc, sampleSec, setSp]);

  // load
  useEffect(() => {
    if (!dseId) return;
    (async () => {
      setLoading(true);
      try {
        if (mode === "day") {
          const d = await getDSETrackDay(dseId, date, maxAcc, sampleSec);
          setDayData(d);
          setRangeData(null);
        } else {
          const d = await getDSETrackRange(
            dseId,
            `${from}T00:00:00.000Z`,
            `${to}T23:59:59.999Z`,
            maxAcc,
            sampleSec
          );
          setRangeData(d);
          setDayData(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [dseId, mode, date, from, to, maxAcc, sampleSec]);

  const bounds = useMemo(() => {
    const coords: [number, number][] = [];
    if (dayData?.coords?.length) coords.push(...dayData.coords);
    if (rangeData?.days?.length)
      rangeData.days.forEach((d: any) => coords.push(...d.coords));
    if (!coords.length) return null;
    const latLngs = coords.map((c) => L.latLng(c[0], c[1]));
    return L.latLngBounds(latLngs);
  }, [dayData, rangeData]);

  const totalRangeDistance = useMemo(() => {
    if (!rangeData?.days) return 0;
    return rangeData.days
      .reduce((s: number, d: any) => s + (d.stats?.distanceKm || 0), 0)
      .toFixed(2);
  }, [rangeData]);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">
              DSE Detailed Route
            </h1>
            <p className="text-gray-400 text-sm">
              View the connected path and points for the selected date/range.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/dse-reports" className="text-blue-400 underline">
              ← Back to Reports
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-3 bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => setMode("day")}
                className={`px-3 py-2 text-sm ${
                  mode === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-200"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setMode("range")}
                className={`px-3 py-2 text-sm ${
                  mode === "range"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-200"
                }`}
              >
                Range
              </button>
            </div>

            {mode === "day" ? (
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                />
                <Button
                  variant="secondary"
                  className="bg-gray-800 text-gray-200"
                  onClick={() =>
                    setDate(toISODate(addDays(new Date(date), -1)))
                  }
                >
                  ← Prev
                </Button>
                <Button
                  variant="secondary"
                  className="bg-gray-800 text-gray-200"
                  onClick={() =>
                    setDate(toISODate(addDays(new Date(date), +1)))
                  }
                >
                  Next →
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                />
                <label className="text-gray-300 text-sm">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                />
                <Button
                  variant="secondary"
                  className="bg-gray-800 text-gray-200"
                  onClick={() => {
                    const s = startOfWeek(new Date());
                    const e = endOfWeek(new Date());
                    setFrom(toISODate(s));
                    setTo(toISODate(e));
                  }}
                >
                  This week
                </Button>
                <Button
                  variant="secondary"
                  className="bg-gray-800 text-gray-200"
                  onClick={() => {
                    const s = startOfMonth(new Date());
                    const e = endOfMonth(new Date());
                    setFrom(toISODate(s));
                    setTo(toISODate(e));
                  }}
                >
                  This month
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-gray-300 text-sm">Max acc (m)</label>
            <input
              type="number"
              value={maxAcc}
              onChange={(e) => setMaxAcc(Number(e.target.value))}
              className="w-24 bg-gray-900 border border-gray-700 text-white rounded px-2 py-2"
            />
            <label className="text-gray-300 text-sm">Sample (sec)</label>
            <input
              type="number"
              value={sampleSec}
              onChange={(e) => setSampleSec(Number(e.target.value))}
              className="w-24 bg-gray-900 border border-gray-700 text-white rounded px-2 py-2"
            />
            <label className="text-gray-300 text-sm">Show points</label>
            <input
              type="checkbox"
              checked={showPoints}
              onChange={(e) => setShowPoints(e.target.checked)}
            />
            {mode === "day" && dseId && (
              <a
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
                href={csvTrackDayUrl(dseId, date, maxAcc, sampleSec)}
                target="_blank"
              >
                ⬇️ Day CSV
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          {mode === "day" && dayData && (
            <>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Date</div>
                <div className="text-lg font-semibold">{dayData.date}</div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Distance</div>
                <div className="text-lg font-semibold">
                  {dayData.stats?.distanceKm?.toFixed(2)} km
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Pings</div>
                <div className="text-lg font-semibold">
                  {dayData.stats?.pings ?? 0}
                </div>
              </div>

              {/* ✅ Start & End Address Cards */}
              {dayData.startAddress && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100 w-full">
                  <div className="text-sm text-gray-400">Start Location</div>
                  <div className="text-md">{dayData.startAddress.display}</div>
                </div>
              )}
              {dayData.endAddress && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100 w-full">
                  <div className="text-sm text-gray-400">End Location</div>
                  <div className="text-md">{dayData.endAddress.display}</div>
                </div>
              )}
            </>
          )}

          {mode === "range" && rangeData && (
            <>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Range</div>
                <div className="text-lg font-semibold">
                  {rangeData.from.slice(0, 10)} → {rangeData.to.slice(0, 10)}
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Days</div>
                <div className="text-lg font-semibold">
                  {rangeData.days?.length ?? 0}
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-100">
                <div className="text-sm text-gray-400">Total distance</div>
                <div className="text-lg font-semibold">
                  {totalRangeDistance} km
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-gray-800">
          <MapContainer
            center={[22.9734, 78.6569]}
            zoom={5}
            className="h-[560px] w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
            />

            {mode === "day" && dayData?.coords?.length > 1 && (
              <>
                <Polyline
                  positions={dayData.coords}
                  weight={5}
                  color="#60a5fa"
                />
                {/* Start & End markers */}
                <Marker position={dayData.coords[0]}>
                  <Tooltip>
                    Start • {new Date(dayData.stats.first).toLocaleString()}
                  </Tooltip>
                </Marker>
                <Marker position={dayData.coords[dayData.coords.length - 1]}>
                  <Tooltip>
                    End • {new Date(dayData.stats.last).toLocaleString()}
                  </Tooltip>
                </Marker>
                {/* Optional mid points */}
                {showPoints &&
                  dayData.points.slice(1, -1).map((p: any, i: number) => (
                    <CircleMarker
                      key={i}
                      center={[p.lat, p.lon]}
                      radius={3}
                      opacity={0.8}
                    >
                      <Tooltip>
                        {new Date(p.ts).toLocaleString()} • acc:{p.acc ?? "-"}m
                      </Tooltip>
                    </CircleMarker>
                  ))}
              </>
            )}

            {mode === "range" &&
              rangeData?.days?.map((d: any, idx: number) => (
                <Polyline
                  key={d.date}
                  positions={d.coords}
                  weight={5}
                  color={dayColors[idx % dayColors.length]}
                ></Polyline>
              ))}

            <FitToBounds bounds={bounds} />
          </MapContainer>
        </div>

        {/* Per-day summary list (range) */}
        {mode === "range" && rangeData?.days?.length > 0 && (
          <div className="rounded-xl border border-gray-800 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">First ping</th>
                  <th className="p-3 text-left">Last ping</th>
                  <th className="p-3 text-right">Pings</th>
                  <th className="p-3 text-right">Distance (km)</th>
                  <th className="p-3 text-left">Open day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-100 bg-black">
                {rangeData.days.map((d: any, idx: number) => (
                  <tr key={d.date} className="hover:bg-gray-900/60">
                    <td className="p-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{
                          background: dayColors[idx % dayColors.length],
                        }}
                      />
                      {d.date}
                    </td>
                    <td className="p-3">
                      {d.stats.first
                        ? new Date(d.stats.first).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      {d.stats.last
                        ? new Date(d.stats.last).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-right">{d.stats.pings ?? 0}</td>
                    <td className="p-3 text-right">
                      {(d.stats.distanceKm ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        className="bg-blue-600"
                        onClick={() => {
                          setMode("day");
                          setDate(d.date);
                        }}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div className="text-gray-400">Loading…</div>}
      </div>
    </div>
  );
}
