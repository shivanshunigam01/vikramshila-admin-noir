import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAttendance,
  getAllDSELatest,
  getSummaryAll,
  getClientVisits,
  csvAttendanceUrl,
  csvSummaryAllUrl,
  csvLatestAllUrl,
  csvClientVisitsUrl,
  ReportAttendanceRow,
  SummaryAllRow,
} from "@/services/dseService";

/* ------------------------------------------------------------
   Utility helpers
------------------------------------------------------------ */
function nowISODate() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
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
  if (m <= 5)
    return { label: "Online", color: "bg-green-500", text: "text-green-400" };
  if (m <= 30)
    return {
      label: "Recently Active",
      color: "bg-amber-500",
      text: "text-yellow-400",
    };
  return { label: "Inactive", color: "bg-red-500", text: "text-red-400" };
}

/* ------------------------------------------------------------
   MAIN PAGE
------------------------------------------------------------ */
export default function DSEReports() {
  const [tab, setTab] = useState<
    "attendance" | "overview" | "summary" | "visits"
  >("attendance");

  // Attendance
  const [date, setDate] = useState(nowISODate());
  const [attRows, setAttRows] = useState<ReportAttendanceRow[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attQ, setAttQ] = useState("");

  // Overview
  const [latest, setLatest] = useState<any[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestQ, setLatestQ] = useState("");
  const [activeWithin, setActiveWithin] = useState<string>("60");

  // Summary
  const [from, setFrom] = useState(toISODate(addDays(new Date(), -7)));
  const [to, setTo] = useState(nowISODate());
  const [bucket, setBucket] = useState<"day" | "week" | "month">("day");
  const [sumRows, setSumRows] = useState<SummaryAllRow[]>([]);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumQ, setSumQ] = useState("");

  // Client Visits
  const [visits, setVisits] = useState<any[]>([]);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitQ, setVisitQ] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* ------------------------------------------------------------
     Loaders
  ------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      setAttLoading(true);
      try {
        const d = await getAttendance(date);
        setAttRows(d.rows);
      } finally {
        setAttLoading(false);
      }
    })();
  }, [date]);

  useEffect(() => {
    (async () => {
      setLatestLoading(true);
      try {
        const d = await getAllDSELatest(Number(activeWithin));
        setLatest(d);
      } finally {
        setLatestLoading(false);
      }
    })();
  }, [activeWithin]);

  useEffect(() => {
    (async () => {
      setSumLoading(true);
      try {
        const d = await getSummaryAll(
          `${from}T00:00:00.000Z`,
          `${to}T23:59:59.999Z`,
          bucket
        );
        setSumRows(d.rows);
      } finally {
        setSumLoading(false);
      }
    })();
  }, [from, to, bucket]);

  useEffect(() => {
    (async () => {
      setVisitLoading(true);
      try {
        const d = await getClientVisits();
        setVisits(d);
      } finally {
        setVisitLoading(false);
      }
    })();
  }, []);

  /* ------------------------------------------------------------
     Filters
  ------------------------------------------------------------ */
  const attFiltered = useMemo(() => {
    const q = attQ.trim().toLowerCase();
    return !q
      ? attRows
      : attRows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.phone || "").toLowerCase().includes(q)
        );
  }, [attRows, attQ]);

  const latestFiltered = useMemo(() => {
    const q = latestQ.trim().toLowerCase();
    return !q
      ? latest
      : latest.filter(
          (r) =>
            r.dseName.toLowerCase().includes(q) ||
            (r.dsePhone || "").toLowerCase().includes(q)
        );
  }, [latest, latestQ]);

  const sumFiltered = useMemo(() => {
    const q = sumQ.trim().toLowerCase();
    return !q
      ? sumRows
      : sumRows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.phone || "").toLowerCase().includes(q)
        );
  }, [sumRows, sumQ]);

  const visitFiltered = useMemo(() => {
    const q = visitQ.trim().toLowerCase();
    return !q
      ? visits
      : visits.filter((v) =>
          [
            v.dseName,
            v.dsePhone,
            v.clientName,
            v.clientMobile,
            v.currentAddress,
            v.permanentAddress,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
  }, [visits, visitQ]);

  /* ------------------------------------------------------------
     JSX
  ------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: "attendance", label: "Attendance (Day)" },
            { key: "overview", label: "All DSEs Overview" },
            { key: "summary", label: "Movement Summary" },
            { key: "visits", label: "Client Visits" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg border ${
                tab === t.key
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---------------- Attendance ---------------- */}
        {tab === "attendance" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-white text-xl font-semibold">
                Attendance — day wise
              </h2>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
              />
              <a
                href={csvAttendanceUrl(date)}
                target="_blank"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
              >
                ⬇️ Download CSV
              </a>
              <input
                placeholder="Search name/phone"
                value={attQ}
                onChange={(e) => setAttQ(e.target.value)}
                className="ml-auto bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="p-3 text-left">Present</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">First ping</th>
                    <th className="p-3 text-left">Last ping</th>
                    <th className="p-3 text-right">Pings</th>
                    <th className="p-3 text-right">Distance (km)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black text-gray-100">
                  {attLoading ? (
                    <tr>
                      <td className="p-4 text-gray-400" colSpan={7}>
                        Loading…
                      </td>
                    </tr>
                  ) : attFiltered.length === 0 ? (
                    <tr>
                      <td className="p-4 text-gray-400" colSpan={7}>
                        No rows
                      </td>
                    </tr>
                  ) : (
                    attFiltered.map((r) => (
                      <tr key={r.dseId} className="hover:bg-gray-900/60">
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              r.present
                                ? "bg-green-600/20 text-green-400"
                                : "bg-red-600/20 text-red-400"
                            }`}
                          >
                            {r.present ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3">{r.phone || "—"}</td>
                        <td className="p-3">
                          {r.first ? new Date(r.first).toLocaleString() : "—"}
                        </td>
                        <td className="p-3">
                          {r.last ? new Date(r.last).toLocaleString() : "—"}
                        </td>
                        <td className="p-3 text-right">{r.pings ?? 0}</td>
                        <td className="p-3 text-right">
                          {(r.distanceKm ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------- Overview ---------------- */}
        {tab === "overview" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-white text-xl font-semibold">
                All DSEs — latest location
              </h2>
              <select
                value={activeWithin}
                onChange={(e) => setActiveWithin(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
              >
                <option value="15">Active within 15 mins</option>
                <option value="30">Active within 30 mins</option>
                <option value="60">Active within 60 mins</option>
                <option value="180">Active within 3 hours</option>
                <option value="">All (no filter)</option>
              </select>
              <a
                href={csvLatestAllUrl(
                  activeWithin ? Number(activeWithin) : undefined
                )}
                target="_blank"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
              >
                ⬇️ Download CSV
              </a>
              <input
                placeholder="Search name/phone"
                value={latestQ}
                onChange={(e) => setLatestQ(e.target.value)}
                className="ml-auto bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Last seen</th>
                    <th className="p-3 text-left">Coords</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black text-gray-100">
                  {latestLoading ? (
                    <tr>
                      <td className="p-4 text-gray-400" colSpan={6}>
                        Loading…
                      </td>
                    </tr>
                  ) : latestFiltered.length === 0 ? (
                    <tr>
                      <td className="p-4 text-gray-400" colSpan={6}>
                        No rows
                      </td>
                    </tr>
                  ) : (
                    latestFiltered.map((p) => {
                      const st = statusOf(p.ts);
                      return (
                        <tr key={p._id} className="hover:bg-gray-900/60">
                          <td className="p-3">{p.dseName}</td>
                          <td className="p-3">{p.dsePhone || "—"}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${st.color.replace(
                                "bg-",
                                "text-"
                              )}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="p-3">{humanSince(p.ts)}</td>
                          <td className="p-3">
                            {p.lat && p.lon
                              ? `${Number(p.lat).toFixed(5)}, ${Number(
                                  p.lon
                                ).toFixed(5)}`
                              : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-3">
                              <Link
                                to={`/admin/dse-location/${p.user}`}
                                className="text-blue-400 underline"
                              >
                                Map
                              </Link>
                              <Link
                                to={`/admin/dse-reports/${p.user}`}
                                className="text-indigo-400 underline"
                              >
                                Summary
                              </Link>
                              {p.lat && p.lon && (
                                <a
                                  className="text-emerald-400 underline"
                                  href={`https://maps.google.com/?q=${p.lat},${p.lon}`}
                                  target="_blank"
                                >
                                  Google Maps
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------- Movement Summary ---------------- */}
        {tab === "summary" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-white text-xl font-semibold">
                Movement summary — all DSEs
              </h2>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
              />
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value as any)}
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <a
                href={csvSummaryAllUrl(
                  `${from}T00:00:00.000Z`,
                  `${to}T23:59:59.999Z`,
                  bucket
                )}
                target="_blank"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
              >
                ⬇️ Download CSV
              </a>
              <input
                placeholder="Search name/phone"
                value={sumQ}
                onChange={(e) => setSumQ(e.target.value)}
                className="ml-auto bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-64"
              />
            </div>
            {sumLoading ? (
              <div className="text-gray-400">Loading…</div>
            ) : sumFiltered.length === 0 ? (
              <div className="text-gray-400">No rows</div>
            ) : (
              <div className="space-y-4">
                {sumFiltered.map((row) => (
                  <div
                    key={row.dseId}
                    className="rounded-xl border border-gray-800 bg-black"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                      <div>
                        <div className="text-white font-semibold">
                          {row.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {row.phone || "—"}
                        </div>
                      </div>
                      <Link
                        to={`/admin/dse-reports/${row.dseId}`}
                        className="text-indigo-400 underline"
                      >
                        Open DSE summary
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-900 text-gray-300">
                          <tr>
                            <th className="p-3 text-left">Bucket</th>
                            <th className="p-3 text-left">First ping</th>
                            <th className="p-3 text-left">Last ping</th>
                            <th className="p-3 text-right">Pings</th>
                            <th className="p-3 text-right">Distance (km)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-100">
                          {row.buckets.length === 0 ? (
                            <tr>
                              <td className="p-3 text-gray-400" colSpan={5}>
                                No data in range
                              </td>
                            </tr>
                          ) : (
                            row.buckets.map((b) => (
                              <tr key={b.key} className="hover:bg-gray-900/60">
                                <td className="p-3">{b.key}</td>
                                <td className="p-3">
                                  {b.first
                                    ? new Date(b.first).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="p-3">
                                  {b.last
                                    ? new Date(b.last).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="p-3 text-right">
                                  {b.pings ?? 0}
                                </td>
                                <td className="p-3 text-right">
                                  {(b.distanceKm ?? 0).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- Client Visits ---------------- */}
        {tab === "visits" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-white text-xl font-semibold">
                Client Visits — all DSEs
              </h2>
              <a
                href={csvClientVisitsUrl}
                target="_blank"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
              >
                ⬇️ Download CSV
              </a>
              <input
                placeholder="Search DSE / client / phone / address"
                value={visitQ}
                onChange={(e) => setVisitQ(e.target.value)}
                className="ml-auto bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-64"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="p-3 text-left">DSE</th>
                    <th className="p-3 text-left">DSE Phone</th>
                    <th className="p-3 text-left">Client Name</th>
                    <th className="p-3 text-left">Client Mobile</th>
                    <th className="p-3 text-left">Current Address</th>
                    <th className="p-3 text-left">Permanent Address</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Photo</th>
                    <th className="p-3 text-left">Visit Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black text-gray-100">
                  {visitLoading ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  ) : visitFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-gray-400">
                        No client visits yet.
                      </td>
                    </tr>
                  ) : (
                    visitFiltered.map((v) => {
                      const lat = v.location?.lat ?? v.lat ?? null;
                      const lon = v.location?.lon ?? v.lon ?? null;
                      return (
                        <tr key={v._id} className="hover:bg-gray-900/60">
                          <td className="p-3">{v.dseName || "—"}</td>
                          <td className="p-3">{v.dsePhone || "—"}</td>
                          <td className="p-3 text-emerald-400 font-medium">
                            {v.clientName || "—"}
                          </td>
                          <td className="p-3">{v.clientMobile || "—"}</td>
                          <td
                            className="p-3 max-w-xs truncate"
                            title={v.currentAddress}
                          >
                            {v.currentAddress || "—"}
                          </td>
                          <td
                            className="p-3 max-w-xs truncate"
                            title={v.permanentAddress}
                          >
                            {v.permanentAddress || "—"}
                          </td>
                          <td className="p-3">
                            {lat && lon ? (
                              <a
                                href={`https://maps.google.com/?q=${lat},${lon}`}
                                target="_blank"
                                className="text-sky-400 underline"
                              >
                                {Number(lat).toFixed(4)},{" "}
                                {Number(lon).toFixed(4)}
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {v.photoUrl ? (
                              <img
                                src={v.photoUrl}
                                alt="visit"
                                className="w-12 h-12 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                                onClick={() => setPreviewUrl(v.photoUrl)}
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-3">
                            {v.createdAt
                              ? new Date(v.createdAt).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 🖼️ Image Preview Modal */}
            {previewUrl && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="relative">
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                  >
                    ✕
                  </button>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[80vh] max-w-[90vw] rounded-lg border border-gray-700 shadow-2xl object-contain"
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
