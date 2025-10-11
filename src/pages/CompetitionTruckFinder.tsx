import findTruck from "../../public/find-truck.jpg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { competitionCompareFilter } from "@/services/competitionService";

export default function CompetitionTruckFinder() {
  const [payload, setPayload] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await competitionCompareFilter({});
        if (res.data.success) {
          const allCats = [
            ...new Set([
              ...(res.data.data.real || []).map((p: any) => p.category),
              ...(res.data.data.competitors || []).map((p: any) => p.category),
            ]),
          ];
          setCategories(allCats.filter(Boolean));
        }
      } catch (err) {
        console.error("Category load failed:", err);
      }
    })();
  }, []);

  const handleFindNow = async () => {
    try {
      const res = await competitionCompareFilter({
        payload,
        fuelType,
        category,
      });
      if (res.data.success) {
        navigate("/competition/compare", {
          state: {
            real: res.data.data.real || [],
            competitors: res.data.data.competitors || [],
          },
        });
      }
    } catch (err) {
      console.error("Error filtering products:", err);
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${findTruck})` }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 text-center text-white px-4 max-w-6xl w-full -mt-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-10">
          Compare Real vs Competition Products
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none w-full bg-transparent border border-white px-4 py-3 rounded text-white focus:outline-none pr-10"
          >
            <option value="all" className="bg-white text-black">
              Choose Category
            </option>
            {categories.map((c, idx) => (
              <option key={idx} value={c} className="bg-white text-black">
                {c}
              </option>
            ))}
          </select>

          {/* Fuel Type */}
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="appearance-none w-full bg-transparent border border-white px-4 py-3 rounded text-white focus:outline-none pr-10"
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
            className="appearance-none w-full bg-transparent border border-white px-4 py-3 rounded text-white focus:outline-none pr-10"
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-medium shadow-lg"
        >
          Find & Compare →
        </button>
      </div>
    </div>
  );
}
