import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSummaryForDSE, csvSummaryOneUrl } from "@/services/dseService";

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

export default function DSEReportsDse() {
  const { dseId } = useParams();
  const [from, setFrom] = useState(toISODate(addDays(new Date(), -7)));
  const [to, setTo] = useState(nowISODate());
  const [bucket, setBucket] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dseId) load();
  }, [dseId, from, to, bucket]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getSummaryForDSE(
        dseId!,
        `${from}T00:00:00.000Z`,
        `${to}T23:59:59.999Z`,
        bucket
      );
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">DSE Summary</h1>
            {data && (
              <p className="text-gray-400">
                {data.name} — {data.phone || "—"}
              </p>
            )}
          </div>
          {data && (
            <a
              href={csvSummaryOneUrl(
                dseId!,
                `${from}T00:00:00.000Z`,
                `${to}T23:59:59.999Z`,
                bucket
              )}
              target="_blank"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2"
            >
              ⬇️ Download CSV
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
        </div>

        <div className="rounded-xl border border-gray-800 overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td className="p-4 text-gray-400" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : !data || data.buckets.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-400" colSpan={5}>
                    No data
                  </td>
                </tr>
              ) : (
                data.buckets.map((b: any) => (
                  <tr key={b.key} className="hover:bg-gray-900/60">
                    <td className="p-3">{b.key}</td>
                    <td className="p-3">
                      {b.first ? new Date(b.first).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      {b.last ? new Date(b.last).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 text-right">{b.pings ?? 0}</td>
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
    </div>
  );
}
