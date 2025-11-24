import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Package,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  X,
  Star,
  ExternalLink,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  createCompetitionProduct,
  deleteCompetitionProduct,
  getCompetitionProducts,
  updateCompetitionProduct,
} from "@/services/competitionService";

export default function CompetitionProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [downloadingById, setDownloadingById] = useState<
    Record<string, boolean>
  >({});

  const { toast } = useToast();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const setRowDownloading = (id: string, val: boolean) =>
    setDownloadingById((prev) => ({ ...prev, [id]: val }));

  const [formData, setFormData] = useState<any>({
    name: "",
    category: "",
    price: "",
    description: "",
    newLaunch: 0,
    gvw: "",
    engine: "",
    fuelType: "",
    gearBox: "",
    clutchDia: "",
    torque: "",
    tyre: "",
    fuelTankCapacity: "",
    cabinType: "",
    warranty: "",
    applicationSuitability: "",
    payload: "",
    deckLength: [""],
    deckWidth: "",
    bodyDimensions: "",
    usp: [""],
    tco: "",
    profitMargin: "",
    seatAvailability: "",
    mileage: "",
    tyresCost: "",
    freightRate: "",
    tyreLife: "",
    image: null,
    brochure: null,
    monitoringFeatures: "",
    driverComfort: "",
    reviews: [
      {
        type: "text",
        content: "",
        file: null,
        rating: 5,
        customerName: "",
        customerLocation: "",
      },
    ],
    testimonials: [
      {
        type: "text",
        content: "",
        file: null,
        customerName: "",
        customerLocation: "",
        customerDesignation: "",
      },
    ],
  });

  // Fetch competition products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getCompetitionProducts();
      const payload = (res as any).data ?? res;

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      setProducts(list || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch competition products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (price: number) => {
    if (!price && price !== 0) return "-";
    if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lakh`;
    }
    return `${Number(price).toLocaleString()}`;
  };

  const getImageUrl = (product: any) => {
    if (!product.images || product.images.length === 0) {
      return "/placeholder.svg";
    }
    const image = product.images[0];
    if (typeof image === "string" && image.startsWith("http")) return image;
    const asString =
      typeof image === "string" ? image : image?.url || image?.path || "";
    const cleanPath = (asString || "").replace(/\\/g, "/");
    return `${API_URL}/${cleanPath}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await deleteCompetitionProduct(id);
      const data = (res as any).data ?? res;

      if (data?.success || data?.deleted || data?.status === "ok") {
        await fetchProducts();
        toast({
          title: "Success",
          description: `Competition product "${name}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to delete competition product",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Delete failed:", err?.message || err);
      toast({
        title: "Error",
        description: err?.message || "Failed to delete competition product",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("title", formData.name);
      fd.append("category", formData.category);
      fd.append("price", formData.price);
      fd.append("description", formData.description);
      fd.append("newLaunch", formData.newLaunch.toString());
      fd.append("gvw", formData.gvw);
      fd.append("engine", formData.engine);
      fd.append("fuelType", formData.fuelType);
      fd.append("gearBox", formData.gearBox);
      fd.append("clutchDia", formData.clutchDia);
      fd.append("torque", formData.torque);
      fd.append("tyre", formData.tyre);
      fd.append("fuelTankCapacity", formData.fuelTankCapacity);
      fd.append("cabinType", formData.cabinType);
      fd.append("warranty", formData.warranty);
      fd.append("applicationSuitability", formData.applicationSuitability);
      fd.append("payload", formData.payload);
      fd.append("deckWidth", formData.deckWidth);
      fd.append("bodyDimensions", formData.bodyDimensions);
      fd.append("tco", formData.tco);
      fd.append("profitMargin", formData.profitMargin);
      fd.append("seatAvailability", formData.seatAvailability || "");
      fd.append("mileage", formData.mileage || "");
      fd.append("tyresCost", formData.tyresCost || "");
      fd.append("tyreLife", formData.tyreLife || "");
      fd.append("freightRate", formData.freightRate || "");
      fd.append("monitoringFeatures", formData.monitoringFeatures || "");
      fd.append("driverComfort", String(formData.driverComfort ?? ""));

      formData.deckLength.forEach((item: string, index: number) => {
        if (item?.trim()) fd.append(`deckLength[${index}]`, item);
      });
      formData.usp.forEach((item: string, index: number) => {
        if (item?.trim()) fd.append(`usp[${index}]`, item);
      });

      formData.reviews.forEach((review: any, index: number) => {
        if (review.content || review.customerName) {
          fd.append(`reviews[${index}][type]`, review.type);
          fd.append(`reviews[${index}][content]`, review.content);
          fd.append(`reviews[${index}][rating]`, review.rating.toString());
          fd.append(`reviews[${index}][customerName]`, review.customerName);
          fd.append(
            `reviews[${index}][customerLocation]`,
            review.customerLocation
          );
          if (review.file) {
            fd.append("reviewFiles", review.file);
          }
        }
      });

      formData.testimonials.forEach((testimonial: any, index: number) => {
        if (testimonial.content || testimonial.customerName) {
          fd.append(`testimonials[${index}][type]`, testimonial.type);
          fd.append(`testimonials[${index}][content]`, testimonial.content);
          fd.append(
            `testimonials[${index}][customerName]`,
            testimonial.customerName
          );
          fd.append(
            `testimonials[${index}][customerLocation]`,
            testimonial.customerLocation
          );
          fd.append(
            `testimonials[${index}][customerDesignation]`,
            testimonial.customerDesignation
          );
          if (testimonial.file) {
            fd.append("testimonialFiles", testimonial.file);
          }
        }
      });

      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      const res = await createCompetitionProduct(fd);
      const data = (res as any).data ?? res;

      if (data?.success || data?.message === "Competition product created") {
        setFormData({
          name: "",
          category: "SCV Cargo",
          price: "",
          description: "",
          newLaunch: 0,
          gvw: "",
          engine: "",
          fuelType: "",
          gearBox: "",
          clutchDia: "",
          torque: "",
          tyre: "",
          fuelTankCapacity: "",
          cabinType: "",
          warranty: "",
          applicationSuitability: "",
          payload: "",
          deckLength: [""],
          deckWidth: "",
          bodyDimensions: "",
          usp: [""],
          tco: "",
          profitMargin: "",
          seatAvailability: "",
          mileage: "",
          tyresCost: "",
          tyreLife: "",
          freightRate: "",
          image: null,
          brochure: null,
          monitoringFeatures: "",
          driverComfort: "",
          reviews: [
            {
              type: "text",
              content: "",
              file: null,
              rating: 5,
              customerName: "",
              customerLocation: "",
            },
          ],
          testimonials: [
            {
              type: "text",
              content: "",
              file: null,
              customerName: "",
              customerLocation: "",
              customerDesignation: "",
            },
          ],
        });
        toast({
          title: "Success",
          description: "Competition product created successfully",
        });
        setIsAddDialogOpen(false);
        await fetchProducts();
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to create competition product",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(
        "Failed to create competition product:",
        err?.message || err
      );
      toast({
        title: "Error",
        description: err?.message || "Failed to create competition product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: any) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.name);
      fd.append("category", formData.category);
      fd.append("price", formData.price);
      fd.append("description", formData.description);
      fd.append("newLaunch", formData.newLaunch.toString());
      fd.append("gvw", formData.gvw);
      fd.append("engine", formData.engine);
      fd.append("fuelType", formData.fuelType);
      fd.append("gearBox", formData.gearBox);
      fd.append("clutchDia", formData.clutchDia);
      fd.append("torque", formData.torque);
      fd.append("tyre", formData.tyre);
      fd.append("fuelTankCapacity", formData.fuelTankCapacity);
      fd.append("cabinType", formData.cabinType);
      fd.append("warranty", formData.warranty);
      fd.append("applicationSuitability", formData.applicationSuitability);
      fd.append("payload", formData.payload);
      fd.append("deckWidth", formData.deckWidth);
      fd.append("bodyDimensions", formData.bodyDimensions);
      fd.append("tco", formData.tco);
      fd.append("profitMargin", formData.profitMargin);
      fd.append("seatAvailability", formData.seatAvailability || "");
      fd.append("mileage", formData.mileage || "");
      fd.append("tyresCost", formData.tyresCost || "");
      fd.append("tyreLife", formData.tyreLife || "");
      fd.append("freightRate", formData.freightRate || "");
      fd.append("monitoringFeatures", formData.monitoringFeatures || "");
      fd.append("driverComfort", String(formData.driverComfort ?? ""));

      formData.deckLength.forEach((item: string, index: number) => {
        if (item?.trim()) fd.append(`deckLength[${index}]`, item);
      });
      formData.usp.forEach((item: string, index: number) => {
        if (item?.trim()) fd.append(`usp[${index}]`, item);
      });

      formData.reviews.forEach((review: any, index: number) => {
        if (review.content || review.customerName) {
          fd.append(`reviews[${index}][type]`, review.type);
          fd.append(`reviews[${index}][content]`, review.content);
          fd.append(`reviews[${index}][rating]`, review.rating.toString());
          fd.append(`reviews[${index}][customerName]`, review.customerName);
          fd.append(
            `reviews[${index}][customerLocation]`,
            review.customerLocation
          );
          if (review.file) {
            fd.append("reviewFiles", review.file);
          }
        }
      });

      formData.testimonials.forEach((testimonial: any, index: number) => {
        if (testimonial.content || testimonial.customerName) {
          fd.append(`testimonials[${index}][type]`, testimonial.type);
          fd.append(`testimonials[${index}][content]`, testimonial.content);
          fd.append(
            `testimonials[${index}][customerName]`,
            testimonial.customerName
          );
          fd.append(
            `testimonials[${index}][customerLocation]`,
            testimonial.customerLocation
          );
          fd.append(
            `testimonials[${index}][customerDesignation]`,
            testimonial.customerDesignation
          );
          if (testimonial.file) {
            fd.append("testimonialFiles", testimonial.file);
          }
        }
      });

      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      const res = await updateCompetitionProduct(editingProduct._id, fd);
      const data = (res as any).data ?? res;

      if (data?.success || data?.message === "Competition product updated") {
        // Try to use updated product from response if present
        const updated = data?.data || data?.product;
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? updated || p : p))
        );
        toast({
          title: "Success",
          description: "Competition product updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        await fetchProducts();
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to update competition product",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(
        "Failed to update competition product:",
        err?.message || err
      );
      toast({
        title: "Error",
        description: err?.message || "Failed to update competition product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: string, index: number, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) =>
        i === index ? value : item
      ),
    }));
  };

  const handleReviewChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      reviews: prev.reviews.map((review: any, i: number) =>
        i === index ? { ...review, [field]: value } : review
      ),
    }));
  };

  const handleTestimonialChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial: any, i: number) =>
        i === index ? { ...testimonial, [field]: value } : testimonial
      ),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const addReview = () => {
    setFormData((prev: any) => ({
      ...prev,
      reviews: [
        ...prev.reviews,
        {
          type: "text",
          content: "",
          file: null,
          rating: 5,
          customerName: "",
          customerLocation: "",
        },
      ],
    }));
  };

  const addTestimonial = () => {
    setFormData((prev: any) => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        {
          type: "text",
          content: "",
          file: null,
          customerName: "",
          customerLocation: "",
          customerDesignation: "",
        },
      ],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const removeReview = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      reviews: prev.reviews.filter((_: any, i: number) => i !== index),
    }));
  };

  const removeTestimonial = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      testimonials: prev.testimonials.filter(
        (_: any, i: number) => i !== index
      ),
    }));
  };

  const renderStars = (
    rating: number,
    onRatingChange: ((n: number) => void) | null = null
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${onRatingChange ? "cursor-pointer" : ""}`}
            onClick={() => onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  const getBrochureUrl = (fileObj: any): string | null => {
    if (!fileObj) return null;

    if (typeof fileObj === "string") {
      return fileObj.startsWith("http") ? fileObj : `${API_URL}/${fileObj}`;
    }

    if (typeof File !== "undefined" && fileObj instanceof File) {
      return URL.createObjectURL(fileObj);
    }

    if (fileObj.url) {
      return fileObj.url.startsWith("http")
        ? fileObj.url
        : `${API_URL}/${fileObj.url}`;
    }
    if (fileObj.path) {
      const cleanPath = fileObj.path.replace(/\\/g, "/");
      return cleanPath.startsWith("http")
        ? cleanPath
        : `${API_URL}/${cleanPath}`;
    }

    return null;
  };

  const renderFilePreview = (fileObj: any, fileName: string, type = "file") => {
    const fileUrl = getBrochureUrl(fileObj);
    if (!fileUrl) return null;

    const getFileName = (url: string) => {
      if (!url) return "File";
      const parts = url.split("/");
      return parts[parts.length - 1] || "File";
    };

    return (
      <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              Current {type}: {fileName || getFileName(fileUrl)}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `${API_URL}/competition-products/${editingProduct?._id}/brochure`,
                  "_blank"
                )
              }
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProductForm = (isEdit = false) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <Input
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleFormChange("category", e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="SCV Cargo">SCV Cargo</option>
              <option value="SCV Passenger">SCV Passenger</option>
              <option value="Pickup">Pickup</option>
              <option value="SCV Pickup">SCV Pickup</option>
              <option value="LCV">LCV (Light Commercial Vehicle)</option>
              <option value="ICV">ICV (Intermediate Commercial Vehicle)</option>
              <option value="MCV">MCV (Medium Commercial Vehicle)</option>
              <option value="Buses">Buses</option>
              <option value="Winger">Winger</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input
              placeholder="e.g., 399000"
              value={formData.price}
              onChange={(e) => handleFormChange("price", e.target.value)}
            />
          </div>
          {["SCV Passenger", "Pickup", "Buses"].includes(formData.category) && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Seat Availability
              </label>
              <Input
                type="number"
                placeholder="Enter number of seats"
                value={formData.seatAvailability}
                onChange={(e) =>
                  handleFormChange("seatAvailability", e.target.value)
                }
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            placeholder="Enter product description..."
            value={formData.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
          />
        </div>

        <div className="space-y-4 border-b pb-4">
          <h3 className="font-semibold text-lg">Launch Settings</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.newLaunch === 1}
              onChange={(e) =>
                handleFormChange("newLaunch", e.target.checked ? 1 : 0)
              }
            />
            <span>Mark as New Launch</span>
          </label>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Technical Specifications</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">GVW</label>
            <Input
              placeholder="e.g., 1000 kg"
              value={formData.gvw}
              onChange={(e) => handleFormChange("gvw", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mileage */}
            <div>
              <label className="block text-sm font-medium mb-1">Mileage</label>
              <Input
                placeholder="e.g., 18 km/l or 8 km/kg"
                value={formData.mileage}
                onChange={(e) => handleFormChange("mileage", e.target.value)}
              />
            </div>

            {/* Tyres Cost */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tyres Cost (₹ per set)
              </label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={formData.tyresCost}
                onChange={(e) => handleFormChange("tyresCost", e.target.value)}
              />
            </div>

            {/* Tyre Life */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tyre Life
              </label>
              <Input
                placeholder="e.g., 40,000 km"
                value={formData.tyreLife}
                onChange={(e) => handleFormChange("tyreLife", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Engine</label>
            <Input
              placeholder="e.g., BS6 Diesel 1.5L"
              value={formData.engine}
              onChange={(e) => handleFormChange("engine", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fuel Type</label>
            <select
              value={formData.fuelType}
              onChange={(e) => handleFormChange("fuelType", e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="">Select Fuel Type</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gear Box</label>
            <Input
              placeholder="e.g., 5-Speed Manual"
              value={formData.gearBox}
              onChange={(e) => handleFormChange("gearBox", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Clutch Diameter
            </label>
            <Input
              placeholder="e.g., 200mm"
              value={formData.clutchDia}
              onChange={(e) => handleFormChange("clutchDia", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Torque</label>
            <Input
              placeholder="e.g., 200 Nm @ 1400-2200 rpm"
              value={formData.torque}
              onChange={(e) => handleFormChange("torque", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tyre</label>
            <Input
              placeholder="e.g., 145/80 R12"
              value={formData.tyre}
              onChange={(e) => handleFormChange("tyre", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fuel Tank Capacity
            </label>
            <Input
              placeholder="e.g., 40 Liters"
              value={formData.fuelTankCapacity}
              onChange={(e) =>
                handleFormChange("fuelTankCapacity", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cabin Type</label>
            <select
              value={formData.cabinType}
              onChange={(e) => handleFormChange("cabinType", e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="">Select Cabin Type</option>
              <option value="Single Cabin">Single Cabin</option>
              <option value="Double Cabin">Double Cabin</option>
              <option value="Crew Cabin">Crew Cabin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Warranty</label>
            <Input
              placeholder="e.g., 2 years/40,000 km"
              value={formData.warranty}
              onChange={(e) => handleFormChange("warranty", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payload</label>
            <Input
              placeholder="e.g., 750 kg"
              value={formData.payload}
              onChange={(e) => handleFormChange("payload", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deck Width</label>
            <Input
              placeholder="e.g., 1400mm"
              value={formData.deckWidth}
              onChange={(e) => handleFormChange("deckWidth", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Application Suitability
          </label>
          <Input
            placeholder="e.g., Urban delivery, Construction, Agriculture"
            value={formData.applicationSuitability}
            onChange={(e) =>
              handleFormChange("applicationSuitability", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Body Dimensions
          </label>
          <Input
            placeholder="e.g., L x W x H (mm)"
            value={formData.bodyDimensions}
            onChange={(e) => handleFormChange("bodyDimensions", e.target.value)}
          />
        </div>
      </div>

      {/* Deck Length Options */}
      <div className="space-y-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Deck Length Options</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("deckLength")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>

        {formData.deckLength.map((length: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Enter deck length option"
              value={length}
              onChange={(e) =>
                handleArrayChange("deckLength", index, e.target.value)
              }
            />
            {formData.deckLength.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem("deckLength", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Unique Selling Points */}
      <div className="space-y-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Unique Selling Points (USP)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("usp")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add USP
          </Button>
        </div>

        {formData.usp.map((point: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Enter USP point"
              value={point}
              onChange={(e) => handleArrayChange("usp", index, e.target.value)}
            />
            {formData.usp.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem("usp", index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Business Information */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Business Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              TCO (Total Cost of Ownership)
            </label>
            <Textarea
              placeholder="Enter TCO details and calculations..."
              value={formData.tco}
              onChange={(e) => handleFormChange("tco", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Profit Margin Information
            </label>
            <Textarea
              placeholder="Enter profit margin details..."
              value={formData.profitMargin}
              onChange={(e) => handleFormChange("profitMargin", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Freight Rate (per ton/km)
            </label>
            <Input
              placeholder="e.g., ₹25/km"
              value={formData.freightRate}
              onChange={(e) => handleFormChange("freightRate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Comfort & Monitoring */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Comfort & Monitoring</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Monitoring Features
            </label>
            <Textarea
              placeholder="e.g., Telematics, GPS tracking, Fuel monitoring, Real-time alerts, Immobilizer"
              value={formData.monitoringFeatures}
              onChange={(e) =>
                handleFormChange("monitoringFeatures", e.target.value)
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Driver Comfort (0–10)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              placeholder="Rate 0-10"
              value={formData.driverComfort || ""}
              onChange={(e) =>
                handleFormChange("driverComfort", Number(e.target.value))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Media & Files */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Media & Files</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Image
            </label>
            {isEdit &&
              editingProduct?.images?.length > 0 &&
              renderFilePreview(
                editingProduct.images[0],
                "Product Image",
                "image"
              )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFormChange("image", e.target.files?.[0] || null)
              }
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload a new product image
              </p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload a new image to replace the current one (optional)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Brochure (PDF)
            </label>
            {isEdit &&
              editingProduct?.brochureFile &&
              renderFilePreview(
                editingProduct.brochureFile,
                "Product Brochure",
                "brochure"
              )}
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                handleFormChange("brochure", e.target.files?.[0] || null)
              }
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload product brochure (PDF format)
              </p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload a new brochure to replace the current one (optional)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="space-y-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Customer Reviews</h3>
          <Button type="button" variant="outline" size="sm" onClick={addReview}>
            <Plus className="h-4 w-4 mr-1" />
            Add Review
          </Button>
        </div>

        {formData.reviews.map((review: any, index: number) => (
          <div
            key={index}
            className="p-4 border border-gray-700 rounded-lg space-y-4 bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Review {index + 1}</h4>
              {formData.reviews.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeReview(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={review.type}
                  onChange={(e) =>
                    handleReviewChange(index, "type", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-md border bg-input"
                >
                  <option value="text">Text Review</option>
                  <option value="video">Video Review</option>
                  <option value="photo">Photo Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating, (rating) =>
                    handleReviewChange(index, "rating", rating)
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({review.rating} Stars)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Name
                </label>
                <Input
                  placeholder="Enter customer name"
                  value={review.customerName}
                  onChange={(e) =>
                    handleReviewChange(index, "customerName", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Location
                </label>
                <Input
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={review.customerLocation}
                  onChange={(e) =>
                    handleReviewChange(
                      index,
                      "customerLocation",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Review Content
              </label>
              <Textarea
                placeholder="Enter customer review content..."
                value={review.content}
                onChange={(e) =>
                  handleReviewChange(index, "content", e.target.value)
                }
                rows={3}
              />
            </div>

            {(review.type === "video" || review.type === "photo") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {review.type === "video" ? "Video File" : "Photo File"}
                </label>
                <Input
                  type="file"
                  accept={review.type === "video" ? "video/*" : "image/*"}
                  onChange={(e) =>
                    handleReviewChange(
                      index,
                      "file",
                      e.target.files?.[0] || null
                    )
                  }
                />
                {!isEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload {review.type} file for this review
                  </p>
                )}
                {isEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a new {review.type} to replace the current one
                    (optional)
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Customer Testimonials */}
      <div className="space-y-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Customer Testimonials</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTestimonial}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Testimonial
          </Button>
        </div>

        {formData.testimonials.map((testimonial: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Testimonial {index + 1}</h4>
              {formData.testimonials.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTestimonial(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={testimonial.type}
                  onChange={(e) =>
                    handleTestimonialChange(index, "type", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-md border bg-input"
                >
                  <option value="text">Text Testimonial</option>
                  <option value="video">Video Testimonial</option>
                  <option value="photo">Photo Testimonial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Name
                </label>
                <Input
                  placeholder="Enter customer name"
                  value={testimonial.customerName}
                  onChange={(e) =>
                    handleTestimonialChange(
                      index,
                      "customerName",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Location
                </label>
                <Input
                  placeholder="e.g., Delhi, India"
                  value={testimonial.customerLocation}
                  onChange={(e) =>
                    handleTestimonialChange(
                      index,
                      "customerLocation",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Designation
                </label>
                <Input
                  placeholder="e.g., Business Owner, Fleet Manager"
                  value={testimonial.customerDesignation}
                  onChange={(e) =>
                    handleTestimonialChange(
                      index,
                      "customerDesignation",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Testimonial Content
              </label>
              <Textarea
                placeholder="Enter customer testimonial..."
                value={testimonial.content}
                onChange={(e) =>
                  handleTestimonialChange(index, "content", e.target.value)
                }
                rows={3}
              />
            </div>

            {(testimonial.type === "video" || testimonial.type === "photo") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {testimonial.type === "video" ? "Video File" : "Photo File"}
                </label>
                <Input
                  type="file"
                  accept={testimonial.type === "video" ? "video/*" : "image/*"}
                  onChange={(e) =>
                    handleTestimonialChange(
                      index,
                      "file",
                      e.target.files?.[0] || null
                    )
                  }
                />
                {!isEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload {testimonial.type} file for this testimonial
                  </p>
                )}
                {isEdit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a new {testimonial.type} to replace the current one
                    (optional)
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={isEdit ? handleUpdateSubmit : handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting
            ? isEdit
              ? "Updating..."
              : "Adding..."
            : isEdit
            ? "Update Competition Product"
            : "Add Competition Product"}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)
          }
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Loading competition products...
        </div>
      </div>
    );
  }

  const truncate = (str?: string, n = 40) => {
    if (!str) return "-";
    return str.length > n ? str.slice(0, n) + "…" : str;
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Competition Products Management
          </h1>
          <p className="text-muted-foreground">
            Manage your competition vehicle inventory and listings
          </p>
        </div>

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Competition Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Competition Product</DialogTitle>
            </DialogHeader>
            {renderProductForm()}
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Competition Product</DialogTitle>
            </DialogHeader>
            {renderProductForm(true)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competition products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md border bg-input text-sm"
              >
                <option value="all">All Categories</option>
                <option value="SCV Cargo">SCV Cargo</option>
                <option value="SCV Passenger">SCV Passenger</option>
                <option value="Pickup">Pickup</option>
                <option value="SCV Pickup">SCV Pickup</option>
                <option value="LCV">LCV (Light Commercial Vehicle)</option>
                <option value="ICV">
                  ICV (Intermediate Commercial Vehicle)
                </option>
                <option value="MCV">MCV (Medium Commercial Vehicle)</option>
                <option value="Buses">Buses</option>
                <option value="Winger">Winger</option>
                <option value="Others">Others</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Competition Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No competition products found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Monitoring Features
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Driver Comfort
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product: any) => (
                      <tr
                        key={product._id}
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                              <img
                                src={getImageUrl(product)}
                                alt={product.title || "Product image"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {product._id?.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-2">
                          <Badge variant="secondary">
                            ({product.category})
                          </Badge>
                        </td>

                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            <span className="font-medium">
                              {formatPrice(Number(product.price))}
                            </span>
                          </div>
                        </td>

                        <td
                          className="py-4 px-2 text-sm"
                          title={product.monitoringFeatures || ""}
                        >
                          {truncate(product.monitoringFeatures, 50)}
                        </td>

                        <td
                          className="py-4 px-2 text-sm"
                          title={product.driverComfort || ""}
                        >
                          {truncate(
                            typeof product.driverComfort === "number"
                              ? String(product.driverComfort)
                              : product.driverComfort,
                            50
                          )}
                        </td>

                        <td className="py-4 px-2">
                          <Badge
                            variant={
                              product.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              product.status === "active"
                                ? "bg-green-500/20 text-green-500 border-green-500/30"
                                : ""
                            }
                          >
                            {product.status || "inactive"}
                          </Badge>
                        </td>

                        <td className="py-4 px-2 text-sm text-muted-foreground">
                          {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </td>

                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingProduct(product);
                                setFormData({
                                  name: product.title || "",
                                  category: product.category || "SCV Cargo",
                                  price: product.price || "",
                                  description: product.description || "",
                                  newLaunch:
                                    typeof product.newLaunch === "number"
                                      ? product.newLaunch
                                      : product.newLaunch === true
                                      ? 1
                                      : 0,
                                  gvw: product.gvw || "",
                                  engine: product.engine || "",
                                  fuelType: product.fuelType || "",
                                  gearBox: product.gearBox || "",
                                  clutchDia: product.clutchDia || "",
                                  torque: product.torque || "",
                                  tyre: product.tyre || "",
                                  fuelTankCapacity:
                                    product.fuelTankCapacity || "",
                                  cabinType: product.cabinType || "",
                                  warranty: product.warranty || "",
                                  applicationSuitability:
                                    product.applicationSuitability || "",
                                  payload: product.payload || "",
                                  deckLength: product.deckLength || [""],
                                  deckWidth: product.deckWidth || "",
                                  bodyDimensions: product.bodyDimensions || "",
                                  usp: product.usp || [""],
                                  tco: product.tco || "",
                                  profitMargin: product.profitMargin || "",
                                  image: null,
                                  seatAvailability:
                                    product.seatAvailability || "",
                                  mileage: product.mileage || "",
                                  tyresCost: product.tyresCost || "",
                                  tyreLife: product.tyreLife || "",
                                  freightRate: product.freightRate || "",
                                  brochure: null,
                                  monitoringFeatures:
                                    product.monitoringFeatures || "",
                                  driverComfort: product.driverComfort || "",
                                  reviews: product.reviews || [
                                    {
                                      type: "text",
                                      content: "",
                                      file: null,
                                      rating: 5,
                                      customerName: "",
                                      customerLocation: "",
                                    },
                                  ],
                                  testimonials: product.testimonials || [
                                    {
                                      type: "text",
                                      content: "",
                                      file: null,
                                      customerName: "",
                                      customerLocation: "",
                                      customerDesignation: "",
                                    },
                                  ],
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                navigate(
                                  `/admin/competition-products/${product._id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Competition Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {product.title}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDelete(product._id, product.title)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredProducts.length)} of{" "}
                    {filteredProducts.length} competition products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1;

                          if (!showPage) {
                            if (page === 2 && currentPage > 4) {
                              return (
                                <span
                                  key={page}
                                  className="px-2 text-muted-foreground"
                                >
                                  ...
                                </span>
                              );
                            }
                            if (
                              page === totalPages - 1 &&
                              currentPage < totalPages - 3
                            ) {
                              return (
                                <span
                                  key={page}
                                  className="px-2 text-muted-foreground"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
