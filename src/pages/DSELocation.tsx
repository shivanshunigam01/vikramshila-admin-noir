import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDSELocation } from "../services/dseService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DSELocationType {
  lat: number;
  lon: number;
  ts: string;
}

interface AddressData {
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

function DSELocation() {
  const { dseId } = useParams();
  const [location, setLocation] = useState<DSELocationType | null>(null);
  const [address, setAddress] = useState<string>("");
  const [addressDetails, setAddressDetails] = useState<AddressData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch address from coordinates using Nominatim API
  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data: AddressData = await response.json();

      if (data.display_name) {
        setAddress(data.display_name);
        setAddressDetails(data);
      } else {
        setAddress("Address not found");
      }
    } catch (err) {
      console.error("Error fetching address:", err);
      setAddress("Unable to fetch address");
    }
  };

  useEffect(() => {
    if (dseId) {
      (async () => {
        try {
          setLoading(true);
          const data = await getDSELocation(dseId);
          setLocation(data);
          await fetchAddress(data.lat, data.lon);
        } catch (error) {
          console.error("Error fetching DSE location:", error);
          setError("Failed to fetch location data");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [dseId]);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const locationTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - locationTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getStatusColor = (timestamp: string) => {
    const diffInMinutes = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60)
    );
    if (diffInMinutes <= 5) return "text-green-400";
    if (diffInMinutes <= 30) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusText = (timestamp: string) => {
    const diffInMinutes = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60)
    );
    if (diffInMinutes <= 5) return "Online";
    if (diffInMinutes <= 30) return "Recently Active";
    return "Inactive";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading DSE location...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Error Loading Location
              </h2>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 p-3 rounded-xl">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                DSE Location Tracker
              </h1>
              <p className="text-gray-400">ID: {dseId}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  getStatusText(location.ts) === "Online"
                    ? "bg-green-400"
                    : getStatusText(location.ts) === "Recently Active"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                } animate-pulse`}
              ></div>
              <h3 className="text-lg font-semibold text-white">Status</h3>
            </div>
            <p
              className={`text-2xl font-bold ${getStatusColor(
                location.ts
              )} mb-2`}
            >
              {getStatusText(location.ts)}
            </p>
            <p className="text-gray-400 text-sm">
              Last updated: {getTimeAgo(location.ts)}
            </p>
          </div>

          {/* Coordinates Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-500 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Coordinates</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Latitude:</span>
                <span className="text-white font-mono">
                  {location.lat.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Longitude:</span>
                <span className="text-white font-mono">
                  {location.lon.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Last Update</h3>
            </div>
            <p className="text-white font-semibold mb-1">
              {new Date(location.ts).toLocaleTimeString()}
            </p>
            <p className="text-gray-400 text-sm">
              {new Date(location.ts).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              Current Address
            </h3>
          </div>

          {address ? (
            <div className="space-y-3">
              <p className="text-white text-lg leading-relaxed">{address}</p>

              {addressDetails?.address && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                  {addressDetails.address.road && (
                    <div>
                      <span className="text-gray-400 text-sm">Street:</span>
                      <p className="text-white font-medium">
                        {addressDetails.address.road}
                      </p>
                    </div>
                  )}
                  {addressDetails.address.city && (
                    <div>
                      <span className="text-gray-400 text-sm">City:</span>
                      <p className="text-white font-medium">
                        {addressDetails.address.city}
                      </p>
                    </div>
                  )}
                  {addressDetails.address.state && (
                    <div>
                      <span className="text-gray-400 text-sm">State:</span>
                      <p className="text-white font-medium">
                        {addressDetails.address.state}
                      </p>
                    </div>
                  )}
                  {addressDetails.address.postcode && (
                    <div>
                      <span className="text-gray-400 text-sm">
                        Postal Code:
                      </span>
                      <p className="text-white font-medium">
                        {addressDetails.address.postcode}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              <span>Fetching address...</span>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Live Map View
              </h3>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Real-time location</span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            <MapContainer
              center={[location.lat, location.lon]}
              zoom={16}
              scrollWheelZoom={true}
              className="h-[500px] w-full"
              style={{ background: "#1f2937" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              <Marker position={[location.lat, location.lon]}>
                <Popup className="custom-popup">
                  <div className="p-2">
                    <h4 className="font-semibold mb-2">DSE Location</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Coordinates:</strong> {location.lat.toFixed(6)},{" "}
                      {location.lon.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Last Update:</strong>{" "}
                      {new Date(location.ts).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          getStatusText(location.ts) === "Online"
                            ? "text-green-600"
                            : getStatusText(location.ts) === "Recently Active"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {getStatusText(location.ts)}
                      </span>
                    </p>
                    {address && (
                      <p className="text-xs text-gray-500 mt-2 border-t pt-2">
                        {address}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}

export default DSELocation;
