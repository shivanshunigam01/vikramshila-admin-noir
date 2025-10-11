import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCompetitionProducts } from "@/services/competitionService";

export default function CompetitionTruckFinder() {
  const [payload, setPayload] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Fetch unique categories from backend
    const fetchCats = async () => {
      const res = await getCompetitionProducts();
      if (res.data.success) {
        const all = res.data.data.map((p: any) => p.category);
        setCategories([...new Set(all)]);
      }
    };
    fetchCats();
  }, []);

  const handleFindNow = () => {
    const query = new URLSearchParams();
    if (payload !== "all") query.set("payload", payload);
    if (fuelType !== "all") query.set("fuelType", fuelType);
    if (category !== "all") query.set("category", category);
    navigate(`/competition/compare?${query.toString()}`);
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url('/find-truck.jpg')` }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 text-center text-white px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Find Competition Vehicles to Compare
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 rounded bg-transparent border border-white text-white"
          >
            <option value="all" className="bg-white text-black">
              Choose Category
            </option>
            {categories.map((c, i) => (
              <option key={i} value={c} className="bg-white text-black">
                {c}
              </option>
            ))}
          </select>

          {/* Fuel Type */}
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="px-4 py-3 rounded bg-transparent border border-white text-white"
          >
            <option value="all" className="bg-white text-black">
              Choose Fuel Type
            </option>
            <option value="Diesel" className="bg-white text-black">
              Diesel
            </option>
            <option value="Petrol" className="bg-white text-black">
              Petrol
            </option>
            <option value="CNG" className="bg-white text-black">
              CNG
            </option>
            <option value="Electric" className="bg-white text-black">
              Electric
            </option>
          </select>

          {/* Payload */}
          <select
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="px-4 py-3 rounded bg-transparent border border-white text-white"
          >
            <option value="all" className="bg-white text-black">
              Choose Payload Range
            </option>
            <option value="500-1000" className="bg-white text-black">
              500–1000 kg
            </option>
            <option value="1000-2000" className="bg-white text-black">
              1000–2000 kg
            </option>
            <option value="2000+" className="bg-white text-black">
              2000+ kg
            </option>
          </select>
        </div>

        <button
          onClick={handleFindNow}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded text-white font-semibold"
        >
          Find Now →
        </button>
      </div>
    </div>
  );
}
