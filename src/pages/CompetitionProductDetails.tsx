import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  IndianRupee,
  FileText,
  ChevronLeft,
  Star,
  User,
  MapPin,
  Briefcase,
  Video,
  MessageSquare,
  Award,
  Fuel,
  Wrench,
  Truck,
  Settings,
  Calendar,
  Target,
  TrendingUp,
  Calculator,
  Gauge,
  Zap,
  Weight,
  Ruler,
  Shield,
  ThumbsUp,
  Quote,
  Eye, // Monitoring Features icon
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export default function CompetitionProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/competition-products/${id}`);
        const data = await res.json();
        setProduct(data.data);
      } catch (err: any) {
        console.error(
          "Failed to fetch competition product:",
          err?.message || err
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, API_URL]);

  const formatPrice = (price: any) => {
    if (!price) return "N/A";
    if (
      typeof price === "string" &&
      (price.includes("Lakh") || price.includes("Crore"))
    ) {
      return price;
    }
    const numPrice = parseFloat(price.toString().replace(/[^\d.]/g, ""));
    if (isNaN(numPrice)) return price;
    if (numPrice >= 100000) {
      return `${(numPrice / 100000).toFixed(2)} Lakh`;
    }
    return `${numPrice.toLocaleString()}`;
  };

  const renderStars = (rating: any) => {
    const numRating = parseInt(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < numRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
        }`}
      />
    ));
  };

  // more robust: handles string or object image
  const getImageUrl = (image: any) => {
    if (!image) return "/placeholder.svg";

    if (typeof image === "string") {
      if (image.startsWith("http")) return image;
      return `${API_URL}/${image.replace(/\\/g, "/")}`;
    }

    const path = image.url || image.path || "";
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${API_URL}/${path.replace(/\\/g, "/")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (val: any) => {
    const n = Number(String(val).replace(/[^\d.]/g, ""));
    return isNaN(n) ? val : n.toLocaleString("en-IN");
  };

  const formatPerKm = (val: any) => {
    if (!hasContent(val)) return null;
    const s = String(val).trim();
    if (s.includes("/km")) return s;
    return `₹${formatCurrency(s)}/km`;
  };

  const getBrochureUrl = (product: any): string => {
    return `${API_URL}/competition-products/${product._id}/brochure`;
  };

  // Helper: check meaningful content
  const hasContent = (value: any) => {
    return value && value.toString().trim() !== "" && value !== "N/A";
  };

  // NEW helpers for driverComfort + monitoringFeatures
  const formatComfort = (val: any) => {
    if (!hasContent(val)) return null;
    const n = Number(String(val).replace(/[^\d.]/g, ""));
    if (isNaN(n)) return String(val);
    const capped = Math.max(0, Math.min(10, n));
    return `${capped} / 10`;
  };

  // monitoringFeatures can be string or array, handle both
  let monitoringList: string[] = [];
  if (Array.isArray(product?.monitoringFeatures)) {
    monitoringList = product.monitoringFeatures
      .map((x: any) => (typeof x === "string" ? x : String(x)))
      .filter((x: any) => hasContent(x));
  } else if (typeof product?.monitoringFeatures === "string") {
    monitoringList = product.monitoringFeatures
      .split(/[,\n•;-]+/)
      .map((s) => s.trim())
      .filter((s) => hasContent(s));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-300">
            Loading competition product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">
            Competition product not found
          </h3>
          <p className="text-gray-400 mb-6">
            The requested competition product could not be found or may have
            been removed.
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const brochureUrl = `${API_URL}/competition-products/${product._id}/brochure`;

  return (
    <div className="min-h-screen bg-black py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Button */}
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-200"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Competition Products
        </Button>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden bg-gray-900 border-gray-800 shadow-2xl hover:shadow-orange-500/10 transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  <img
                    src={getImageUrl(
                      product.images?.[selectedImage] || product.images?.[0]
                    )}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  {product.status === "active" && (
                    <Badge className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-white">
                      <Zap className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="p-4 bg-gray-900">
                    <div className="flex gap-2 overflow-x-auto">
                      {product.images.map((image: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === index
                              ? "border-orange-500 shadow-md shadow-orange-500/25"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${product.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800 shadow-2xl hover:shadow-orange-500/10 transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold text-white mb-2">
                      {product.title}
                    </CardTitle>
                    {product.category && (
                      <Badge
                        variant="secondary"
                        className="mb-4 text-sm px-3 py-1 bg-gray-700 text-gray-200"
                      >
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  {hasContent(product.price) && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <IndianRupee className="h-6 w-6 text-orange-500" />
                        <span className="text-3xl font-bold text-orange-500">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Starting Price</p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                {hasContent(product.description) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-white">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-justify">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Key Features */}
                {product.usp &&
                  product.usp.length > 0 &&
                  product.usp.some((point: any) => hasContent(point)) && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
                        <Award className="h-5 w-5 text-orange-500" />
                        Key Features
                      </h3>
                      <div className="grid gap-3">
                        {product.usp
                          .filter((point: any) => hasContent(point))
                          .map((point: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-green-900/30 rounded-lg border border-green-800/50"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-300">
                                {point}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Quick Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-800">
                  {brochureUrl && (
                    <Button
                      className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() =>
                        window.open(
                          `${API_URL}/competition-products/${product._id}/brochure`,
                          "_blank"
                        )
                      }
                    >
                      <FileText className="h-4 w-4" />
                      Download Brochure
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Package className="h-4 w-4" />
                    Get Quote
                  </Button>
                </div>

                <div className="text-sm text-gray-400 pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Listed on {formatDate(product.createdAt)}</span>
                    {product.updatedAt &&
                      product.updatedAt !== product.createdAt && (
                        <>
                          <span>•</span>
                          <span>Updated {formatDate(product.updatedAt)}</span>
                        </>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Specifications */}
        <Card className="bg-gray-900 border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <Settings className="h-6 w-6 text-orange-500" />
              Technical Specifications (Competition)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Engine & Performance */}
              <div className="space-y-5">
                <h4 className="font-semibold text-base text-gray-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-700">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  Engine & Performance
                </h4>

                {hasContent(product.engine) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Engine
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.engine}
                    </p>
                  </div>
                )}
                {hasContent(product.mileage) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Mileage
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-orange-500" />
                      {product.mileage}
                    </p>
                  </div>
                )}

                {hasContent(product.fuelType) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-2">
                      Fuel Type
                    </span>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-5 w-5 text-gray-400" />
                      <Badge
                        variant="outline"
                        className={`${
                          product.fuelType === "Electric"
                            ? "bg-green-900/50 text-green-400 border-green-600"
                            : product.fuelType === "CNG"
                            ? "bg-blue-900/50 text-blue-400 border-blue-600"
                            : "bg-orange-900/50 text-orange-400 border-orange-600"
                        } text-sm px-3 py-1`}
                      >
                        {product.fuelType}
                      </Badge>
                    </div>
                  </div>
                )}

                {hasContent(product.torque) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Torque
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-orange-500" />
                      {product.torque}
                    </p>
                  </div>
                )}

                {hasContent(product.fuelTankCapacity) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Fuel Tank Capacity
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.fuelTankCapacity} Liters
                    </p>
                  </div>
                )}
              </div>

              {/* Transmission & Components */}
              <div className="space-y-5">
                <h4 className="font-semibold text-base text-gray-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-700">
                  <Settings className="h-5 w-5 text-orange-500" />
                  Transmission & Components
                </h4>

                {hasContent(product.tyreLife) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Tyre Life
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.tyreLife}
                    </p>
                  </div>
                )}

                {hasContent(product.gearBox) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Gearbox
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.gearBox}
                    </p>
                  </div>
                )}

                {hasContent(product.clutchDia) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Clutch Diameter
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.clutchDia} mm
                    </p>
                  </div>
                )}

                {hasContent(product.tyre) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Tyre Specification
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.tyre}
                    </p>
                  </div>
                )}

                {hasContent(product.cabinType) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Cabin Type
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.cabinType}
                    </p>
                  </div>
                )}
              </div>

              {/* Dimensions & Capacity */}
              <div className="space-y-5">
                <h4 className="font-semibold text-base text-gray-300 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-700">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Dimensions & Capacity
                </h4>

                {hasContent(product.seatAvailability) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Seat Availability
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      {product.seatAvailability}
                    </p>
                  </div>
                )}
                {hasContent(product.gvw) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Gross Vehicle Weight (GVW)
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Weight className="h-4 w-4 text-orange-500" />
                      {product.gvw} kg
                    </p>
                  </div>
                )}

                {hasContent(product.payload) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Payload Capacity
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      {product.payload} kg
                    </p>
                  </div>
                )}

                {hasContent(product.bodyDimensions) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Body Dimensions
                    </span>
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-orange-500" />
                      {product.bodyDimensions}
                    </p>
                  </div>
                )}

                {hasContent(product.deckWidth) && (
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm font-semibold text-gray-400 block mb-1">
                      Deck Width
                    </span>
                    <p className="text-base font-medium text-white">
                      {product.deckWidth} mm
                    </p>
                  </div>
                )}

                {product.deckLength &&
                  product.deckLength.length > 0 &&
                  product.deckLength.some((length: any) =>
                    hasContent(length)
                  ) && (
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                      <span className="text-sm font-semibold text-gray-400 block mb-2">
                        Available Deck Lengths
                      </span>
                      <div className="space-y-2">
                        {product.deckLength
                          .filter((length: any) => hasContent(length))
                          .map((length: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="text-sm font-medium text-white">
                                {length} mm
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Driver Comfort & Monitoring */}
            {(hasContent(product.driverComfort) ||
              monitoringList.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-700">
                {hasContent(product.driverComfort) && (
                  <div className="bg-rose-900/30 p-5 rounded-lg border border-rose-800/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-rose-300">
                      <ThumbsUp className="h-5 w-5" />
                      Driver Comfort
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-rose-200">
                        {formatComfort(product.driverComfort)}
                      </span>
                      {Number(
                        String(product.driverComfort).replace(/[^\d.]/g, "")
                      ) >= 0 && (
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-rose-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  (Number(
                                    String(product.driverComfort).replace(
                                      /[^\d.]/g,
                                      ""
                                    )
                                  ) /
                                    10) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-rose-200/80 mt-2">
                      Higher score indicates better in-cabin comfort (AC, power
                      steering, seating ergonomics, etc.).
                    </p>
                  </div>
                )}

                {monitoringList.length > 0 && (
                  <div className="bg-cyan-900/30 p-5 rounded-lg border border-cyan-800/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-cyan-300">
                      <Eye className="h-5 w-5" />
                      Monitoring Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {monitoringList.map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-800/70 text-cyan-200 border border-cyan-700 px-3 py-1 rounded-full"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-cyan-200/80 mt-2">
                      Examples: FleetEdge, driver monitoring, telematics,
                      geo-fencing, live fuel tracking.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Additional Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-700">
              {hasContent(product.warranty) && (
                <div className="bg-blue-900/30 p-5 rounded-lg border border-blue-800/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-400">
                    <Shield className="h-5 w-5" />
                    Warranty
                  </h4>
                  <p className="text-sm font-medium text-blue-300">
                    {product.warranty}
                  </p>
                </div>
              )}

              {(hasContent(product.tyresCost) ||
                hasContent(product.freightRate)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {hasContent(product.tyresCost) && (
                    <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-300">
                        <Wrench className="h-5 w-5 text-orange-500" />
                        Tyres Cost (₹ per set)
                      </h4>
                      <p className="text-sm font-medium text-white">
                        ₹{formatCurrency(product.tyresCost)}
                      </p>
                    </div>
                  )}

                  {hasContent(product.freightRate) && (
                    <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-300">
                        <Truck className="h-5 w-5 text-orange-500" />
                        Freight Rate (per ton/km)
                      </h4>
                      <p className="text-sm font-medium text-white">
                        {formatPerKm(product.freightRate)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {hasContent(product.applicationSuitability) && (
                <div className="bg-green-900/30 p-5 rounded-lg border border-green-800/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                    <Target className="h-5 w-5" />
                    Application Suitability
                  </h4>
                  <p className="text-sm font-medium text-green-300">
                    {product.applicationSuitability}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        {(hasContent(product.tco) || hasContent(product.profitMargin)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasContent(product.tco) && (
              <Card className="bg-gray-900 border-gray-800 shadow-2xl hover:shadow-orange-500/10 transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Calculator className="h-5 w-5 text-orange-500" />
                    Total Cost of Ownership (TCO)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-900/30 p-5 rounded-lg border border-orange-800/50">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-orange-300 font-medium">
                      {product.tco}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasContent(product.profitMargin) && (
              <Card className="bg-gray-900 border-gray-800 shadow-2xl hover:shadow-orange-500/10 transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Profit Margin Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-900/30 p-5 rounded-lg border border-purple-800/50">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-purple-300 font-medium">
                      {product.profitMargin}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Customer Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <ThumbsUp className="h-6 w-6 text-orange-500" />
                Customer Reviews ({product.reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {product.reviews.map((review: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-700 rounded-xl p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:shadow-md hover:shadow-orange-500/10 transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-base">
                            {hasContent(review.customerName)
                              ? review.customerName
                              : "Anonymous Customer"}
                          </div>
                          {hasContent(review.customerLocation) && (
                            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                              <MapPin className="h-4 w-4" />
                              {review.customerLocation}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating || 5)}
                          <span className="text-sm font-medium ml-1 text-gray-300">
                            ({review.rating || 5}/5)
                          </span>
                        </div>
                        {review.type && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-800 border-gray-600 text-gray-300"
                          >
                            {review.type === "video" && (
                              <Video className="h-3 w-3 mr-1" />
                            )}
                            {review.type === "photo" && (
                              <Package className="h-3 w-3 mr-1" />
                            )}
                            {review.type === "text" && (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            )}
                            {review.type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {hasContent(review.content) && (
                      <div className="ml-16">
                        <p className="text-gray-300 leading-relaxed text-sm bg-gray-800/30 p-4 rounded-lg border border-gray-700 italic mb-3">
                          "{review.content}"
                        </p>
                      </div>
                    )}

                    {/* Review Media */}
                    {hasContent(review.file) && (
                      <div className="ml-16 mt-3">
                        {review.type === "photo" ? (
                          <div className="max-w-xs">
                            <img
                              src={review.file}
                              alt="Customer review"
                              className="w-full h-48 object-cover rounded-lg border border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                              onClick={() => window.open(review.file, "_blank")}
                            />
                          </div>
                        ) : review.type === "video" ? (
                          <div className="max-w-md">
                            <video
                              controls
                              className="w-full h-48 object-cover rounded-lg border border-gray-700 bg-gray-800"
                            >
                              <source src={review.file} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {!hasContent(review.content) &&
                      !hasContent(review.file) && (
                        <div className="ml-16">
                          <div className="text-gray-500 text-sm italic bg-gray-800/20 p-3 rounded-lg border border-gray-700/50">
                            No review content provided
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Testimonials */}
        {product.testimonials && product.testimonials.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Quote className="h-6 w-6 text-orange-500" />
                Customer Testimonials ({product.testimonials.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {product.testimonials.map((testimonial: any, index: number) => (
                  <div
                    key={index}
                    className="border border-blue-800/50 rounded-xl p-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 hover:shadow-md hover:shadow-blue-500/10 transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-200 text-base">
                            {hasContent(testimonial.customerName)
                              ? testimonial.customerName
                              : "Anonymous Customer"}
                          </div>
                          <div className="space-y-1 mt-1">
                            {hasContent(testimonial.customerDesignation) && (
                              <div className="flex items-center gap-1 text-sm text-blue-300">
                                <Briefcase className="h-4 w-4" />
                                {testimonial.customerDesignation}
                              </div>
                            )}
                            {hasContent(testimonial.customerLocation) && (
                              <div className="flex items-center gap-1 text-sm text-blue-300">
                                <MapPin className="h-4 w-4" />
                                {testimonial.customerLocation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {testimonial.type && (
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-600 text-blue-400 bg-blue-900/50"
                        >
                          {testimonial.type === "video" && (
                            <Video className="h-3 w-3 mr-1" />
                          )}
                          {testimonial.type === "photo" && (
                            <Package className="h-3 w-3 mr-1" />
                          )}
                          {testimonial.type === "text" && (
                            <MessageSquare className="h-3 w-3 mr-1" />
                          )}
                          {testimonial.type}
                        </Badge>
                      )}
                    </div>

                    {hasContent(testimonial.content) && (
                      <div className="ml-16">
                        <blockquote className="text-blue-200 leading-relaxed italic text-sm bg-gray-800/30 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm mb-3">
                          "{testimonial.content}"
                        </blockquote>
                      </div>
                    )}

                    {hasContent(testimonial.file) && (
                      <div className="ml-16 mt-3">
                        {testimonial.type === "photo" ? (
                          <div className="max-w-xs">
                            <img
                              src={testimonial.file}
                              alt="Customer testimonial"
                              className="w-full h-48 object-cover rounded-lg border border-blue-700 hover:opacity-90 transition-opacity cursor-pointer"
                              onClick={() =>
                                window.open(testimonial.file, "_blank")
                              }
                            />
                          </div>
                        ) : testimonial.type === "video" ? (
                          <div className="max-w-md">
                            <video
                              controls
                              className="w-full h-64 object-cover rounded-lg border border-blue-700 bg-gray-800"
                            >
                              <source src={testimonial.file} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {!hasContent(testimonial.content) &&
                      !hasContent(testimonial.file) && (
                        <div className="ml-16">
                          <div className="text-gray-500 text-sm italic bg-gray-800/20 p-3 rounded-lg border border-gray-700/50">
                            No testimonial content provided
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
