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

export default function CompetitionCompare() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const data = state || { real: [], competitors: [] };

  // Combine both Tata and Competition products
  const combined = [
    ...data.real.map((p: any) => ({
      ...p,
      type: "Tata Product",
      imageUrl:
        p.images?.[0] && typeof p.images[0] === "string"
          ? p.images[0]
          : "/placeholder.svg",
    })),
    ...data.competitors.map((p: any) => ({
      ...p,
      type: "Competitor",
      imageUrl:
        p.images?.[0] && typeof p.images[0] === "string"
          ? p.images[0]
          : "/placeholder.svg",
    })),
  ].slice(0, 3);

  if (combined.length === 0)
    return (
      <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-6">No matching products found.</p>
        <Button
          onClick={() => navigate("/competition/finder")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          ← Back to Finder
        </Button>
      </div>
    );

  // Utility: extract numeric part for comparison
  const num = (v?: string | number) => {
    if (v == null) return null;
    const str = String(v)
      .replace(/,/g, "")
      .match(/[\d.]+/);
    return str ? parseFloat(str[0]) : null;
  };

  // Highlight the best value per attribute
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

  // Table attributes
  const attributes = [
    { label: "Category", key: "category" },
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
      higherIsBetter: false, // lower price wins
    },
    { label: "Cabin Type", key: "cabinType" },
  ];

  return (
    <div className="bg-black min-h-screen text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/competition/finder")}
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Finder
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Product Comparison
          </h1>
        </div>

        {/* Product Cards */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${combined.length} gap-6 mb-12`}
        >
          {combined.map((p, idx) => (
            <Card
              key={idx}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-gray-500 transition-all duration-300"
            >
              <CardHeader className="p-0">
                <div className="aspect-[4/3] bg-black rounded-t-lg overflow-hidden relative group">
                  <img
                    src={p.imageUrl}
                    alt={p.model || p.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/placeholder.svg";
                    }}
                  />
                  <div
                    className={`absolute top-3 left-3 text-xs px-2 py-1 rounded ${
                      p.type === "Tata Product" ? "bg-blue-600" : "bg-red-600"
                    }`}
                  >
                    {p.type}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/50 px-3 py-1 rounded text-sm text-white/80">
                    {p.category}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold mb-1">
                  {p.title || p.model}
                </CardTitle>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {p.description || "No description available."}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold text-green-400">
                    {p.price ? `₹ ${p.price}` : "Price N/A"}
                  </div>
                  <div className="text-xs text-gray-400">{p.fuelType}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Key Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.08]">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs uppercase text-gray-300">
                      Spec
                    </th>
                    {combined.map((p, i) => (
                      <th
                        key={i}
                        className="py-3 px-4 text-left text-sm font-semibold text-white"
                      >
                        {p.model || p.title}
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
                          className="border-b border-white/10 hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-gray-300 flex items-center gap-2">
                            {icon}
                            {label}
                          </td>
                          {highlighted.map((v, i) => (
                            <td
                              key={i}
                              className={`py-3 px-4 ${
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
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            Compare Another Set
          </Button>
        </div>
      </div>
    </div>
  );
}
