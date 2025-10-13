import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  ChevronLeft,
  Fuel,
  Gauge,
  Settings,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { competitionCompareFilter } from "@/services/competitionService";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitionCompare() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [combined, setCombined] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sameBrandOnly, setSameBrandOnly] = useState(true);

  const params = new URLSearchParams(location.search);
  const filters = Object.fromEntries(params.entries());

  // ✅ Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await competitionCompareFilter(filters);
        if (res.success && res.data) {
          const { real = [], competitors = [] } = res.data;

          const tataProducts = real.map((p: any) => ({
            ...p,
            type: "Tata Product",
            imageUrl:
              p.images?.[0] && typeof p.images[0] === "string"
                ? p.images[0]
                : "/placeholder.svg",
          }));

          const compProducts = competitors.map((p: any) => ({
            ...p,
            type: p.brand ? `${p.brand}` : "Competitor",
            imageUrl:
              p.images?.[0] && typeof p.images[0] === "string"
                ? p.images[0]
                : "/placeholder.svg",
          }));

          if (sameBrandOnly) {
            setCombined(tataProducts);
          } else {
            setCombined([...tataProducts, ...compProducts]);
          }
        } else {
          setError("No data found for this selection.");
          setCombined([]);
        }
      } catch (err) {
        console.error("Error fetching compare data:", err);
        setError("Error fetching comparison data.");
        setCombined([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search, sameBrandOnly]);

  // ✅ Utility
  const num = (v?: string | number) => {
    if (v == null) return null;
    const str = String(v)
      .replace(/,/g, "")
      .match(/[\d.]+/);
    return str ? parseFloat(str[0]) : null;
  };

  const highlight = (
    label: string,
    values: (string | number)[],
    higherIsBetter = true
  ) => {
    const nums = values
      .map(num)
      .filter((n): n is number => typeof n === "number");
    if (nums.length === 0) return values.map((v) => (v ? String(v) : "—"));
    const best = higherIsBetter ? Math.max(...nums) : Math.min(...nums);
    return values.map((v) => {
      const n = num(v);
      return n === best ? `🏆 ${v}` : v ?? "—";
    });
  };

  const attributes = [
    { label: "Brand / Category", key: "category" },
    {
      label: "Payload",
      key: "payload",
      icon: <Truck className="w-4 h-4 text-blue-400" />,
    },
    {
      label: "Fuel Type",
      key: "fuelType",
      icon: <Fuel className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: "Engine",
      key: "engine",
      icon: <Settings className="w-4 h-4 text-purple-400" />,
    },
    {
      label: "Torque",
      key: "torque",
      icon: <Gauge className="w-4 h-4 text-amber-400" />,
    },
    {
      label: "Mileage",
      key: "mileage",
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
    },
    {
      label: "Price",
      key: "price",
      icon: <Wallet className="w-4 h-4 text-green-400" />,
      higherIsBetter: false,
    },
    { label: "Cabin Type", key: "cabinType" },
  ];

  // ---------------- UI ----------------
  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-gray-400 mt-6 text-lg">Fetching latest data...</p>
      </div>
    );
  }

  if (error || combined.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-6 text-lg">
          {error || "No products found."}
        </p>
        <Button
          onClick={() => navigate("/competition/finder")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          ← Back to Finder
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 min-h-screen text-white py-10 px-4 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header + Toggle */}
        <div className="sticky top-0 backdrop-blur-md bg-black/40 border-b border-white/10 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between mb-8 shadow-lg">
          <Button
            variant="outline"
            onClick={() => navigate("/competition/finder")}
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Finder
          </Button>

          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameBrandOnly}
              onChange={(e) => setSameBrandOnly(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            Compare within same brand (Tata Motors only)
          </label>
        </div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {sameBrandOnly
            ? "Tata Motors Product Comparison"
            : "Tata Motors vs Competitor Comparison"}
        </motion.h1>

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mb-16">
          <AnimatePresence>
            {combined.map((p, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-500 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={p.imageUrl}
                      alt={p.model || p.title}
                      className="w-full h-56 object-contain bg-black p-4 transition-transform duration-500 hover:scale-105"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).src =
                          "/placeholder.svg")
                      }
                    />
                    <span
                      className={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold ${
                        p.type.includes("Tata")
                          ? "bg-blue-600/90 text-white"
                          : "bg-red-600/90 text-white"
                      }`}
                    >
                      {p.type}
                    </span>
                  </div>

                  <CardContent className="p-5">
                    <h2 className="text-xl font-bold mb-2 truncate">
                      {p.title || p.model}
                    </h2>
                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                      {p.description || "—"}
                    </p>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-400 font-semibold text-lg">
                        ₹{p.price || "N/A"}
                      </span>
                      <span className="text-gray-400">{p.fuelType}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Comparison Table */}
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" /> Key Specifications
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-white/10 shadow-inner max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-300 uppercase text-xs tracking-wider sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="p-3 font-semibold">Specification</th>
                    {combined.map((p, i) => (
                      <th
                        key={i}
                        className="p-3 font-semibold text-center whitespace-nowrap"
                      >
                        {p.model || p.title}
                        <div className="text-xs text-gray-400">{p.type}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {attributes.map(
                    ({ label, key, icon, higherIsBetter = true }) => {
                      const values = combined.map((p) => p[key] || "—");
                      const highlighted = highlight(
                        label,
                        values,
                        higherIsBetter
                      );
                      return (
                        <tr
                          key={label}
                          className="border-b border-gray-700 hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="p-3 text-gray-300 font-medium flex items-center gap-2">
                            {icon}
                            {label}
                          </td>
                          {highlighted.map((v, i) => (
                            <td
                              key={i}
                              className={`p-3 text-center ${
                                String(v).startsWith("🏆")
                                  ? "text-emerald-400 font-semibold"
                                  : "text-gray-100"
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Button */}
        <div className="text-center mt-12">
          <Button
            onClick={() => navigate("/competition/finder")}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full shadow-lg shadow-blue-500/20"
          >
            Compare Another Set
          </Button>
        </div>
      </div>
    </div>
  );
}
