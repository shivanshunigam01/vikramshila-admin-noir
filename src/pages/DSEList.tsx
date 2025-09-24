  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { getDSEList } from "../services/dseService";

  interface DSE {
    _id: string;
    name: string;
    phone: string;
    role: string;
    createdAt: string;
  }

  function DSEList() {
    const [dseList, setDseList] = useState<DSE[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchDSE = async () => {
        try {
          const data = await getDSEList();
          setDseList(data || []);
        } catch (error) {
          console.error("Error fetching DSE list:", error);
        }
      };
      fetchDSE();
    }, []);

    const getInitials = (name: string) =>
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white-800">
          Active DSE List
        </h1>

        {dseList.length === 0 ? (
          <p className="text-gray-500">No DSEs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dseList.map((dse) => (
              <div
                key={dse._id}
                className="relative border border-gray-800 rounded-2xl shadow-lg p-5 bg-gradient-to-b from-gray-900 to-black hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-transform transform hover:-translate-y-1 hover:scale-105"
              >
                {/* Avatar */}
                <div className="absolute -top-5 left-5 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-gray-900">
                  {getInitials(dse.name)}
                </div>

                {/* Card Content */}
                <div className="ml-20">
                  <h2 className="text-lg font-semibold text-white tracking-wide">
                    {dse.name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                    📞 {dse.phone}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Role:{" "}
                    <span className="font-medium text-blue-400">
                      {dse.role.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created:{" "}
                    {new Date(dse.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* Navigate Button */}
                  <button
                    onClick={() => navigate(`/admin/dse-location/${dse._id}`)}
                    className="mt-5 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 font-medium shadow-md"
                  >
                    📍 View Current Location
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  export default DSEList;
