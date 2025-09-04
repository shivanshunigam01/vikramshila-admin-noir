"use client";

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
  Rocket,
  Calendar,
  Loader2,
  X,
  Star,
  FileText,
  ExternalLink,
  Download,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import {
  createLaunch,
  updateLaunch,
  deleteLaunch,
  getLaunches,
  downloadBrochureService,
} from "@/services/newLaunches";

export default function NewLaunches() {
  const [launches, setLaunches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLaunch, setEditingLaunch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [downloading, setDownloading] = useState(false);

  const { toast } = useToast();

  // Enhanced form data with all fields from product brochure
  const [formData, setFormData] = useState({
    name: "",
    category: "SCV Cargo",
    price: "",
    description: "",
    launchDate: "",
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
    status: "upcoming",
    image: null,
    brochure: null,
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

  const API_URL = "http://localhost:5000"; // Replace with your API URL

  // Mock data for demonstration
  const mockLaunches = [
    {
      _id: "1",
      title: "Tata Ace Gold CNG",
      category: "SCV Cargo",
      price: 450000,
      description:
        "The new generation small commercial vehicle with enhanced payload capacity and fuel efficiency.",
      launchDate: "2024-12-01",
      gvw: "1500 kg",
      engine: "BS6 CNG 1.5L",
      fuelType: "CNG",
      status: "upcoming",
      images: ["/api/placeholder/400/300"],
      brochureFile: { path: "brochures/tata-ace-gold.pdf" },
      createdAt: "2024-11-01",
      reviews: [],
      testimonials: [],
      usp: ["Best in class payload", "CNG variant", "Superior fuel efficiency"],
    },
    {
      _id: "2",
      title: "Mahindra Bolero Pickup Plus",
      category: "Pickup",
      price: 850000,
      description:
        "Rugged pickup truck designed for tough terrains and heavy-duty applications.",
      launchDate: "2024-11-15",
      gvw: "2500 kg",
      engine: "BS6 Diesel 2.5L",
      fuelType: "Diesel",
      status: "active",
      images: ["/api/placeholder/400/300"],
      brochureFile: { path: "brochures/bolero-pickup.pdf" },
      createdAt: "2024-10-15",
      reviews: [],
      testimonials: [],
      usp: ["4WD capability", "High ground clearance", "Robust chassis"],
    },
  ];

  useEffect(() => {
    fetchLaunches();
  }, []);

  const fetchLaunches = async () => {
    try {
      setLoading(true);
      const res = await getLaunches();
      setLaunches(res.data || []);
      toast({
        title: "Success",
        description: "Launches loaded successfully",
      });
    } catch (err: any) {
      console.error("Failed to fetch launches:", err.message || err);
      toast({
        title: "Error",
        description: "Failed to fetch launches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleReviewChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      reviews: prev.reviews.map((review, i) =>
        i === index ? { ...review, [field]: value } : review
      ),
    }));
  };

  const handleTestimonialChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial, i) =>
        i === index ? { ...testimonial, [field]: value } : testimonial
      ),
    }));
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addReview = () => {
    setFormData((prev) => ({
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

  const removeReview = (index) => {
    setFormData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== index),
    }));
  };

  const addTestimonial = () => {
    setFormData((prev) => ({
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

  const removeTestimonial = (index) => {
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.name);
      fd.append("category", formData.category);
      fd.append("price", formData.price);
      fd.append("description", formData.description);
      fd.append("launchDate", formData.launchDate);
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
      fd.append("status", formData.status);

      // Handle arrays
      formData.deckLength.forEach((item, index) => {
        if (item.trim()) fd.append(`deckLength[${index}]`, item);
      });
      formData.usp.forEach((item, index) => {
        if (item.trim()) fd.append(`usp[${index}]`, item);
      });

      // Handle reviews
      formData.reviews.forEach((review, index) => {
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
            fd.append(`reviewFiles`, review.file);
          }
        }
      });

      // Handle testimonials
      formData.testimonials.forEach((testimonial, index) => {
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
            fd.append(`testimonialFiles`, testimonial.file);
          }
        }
      });

      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      const res = await createLaunch(fd);

      if (res.message === "Launch created") {
        toast({ title: "Success", description: "Launch created successfully" });
        setIsAddDialogOpen(false);
        resetForm();
        fetchLaunches();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create launch",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      name: "",
      category: "SCV Cargo",
      price: "",
      description: "",
      launchDate: "",
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
      status: "upcoming",
      image: null,
      brochure: null,
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
  };

  const handleDelete = async (id, title) => {
    try {
      const res = await deleteLaunch(id);
      if (res.success) {
        setLaunches((prev) => prev.filter((l) => l._id !== id));
        toast({
          title: "Success",
          description: `Launch "${title}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to delete launch",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete launch",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBrochure = async (launch: any) => {
    if (!launch?._id) return;

    setDownloading(true);
    try {
      const response = await downloadBrochureService(launch._id);
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = launch.brochureFile?.originalName || "brochure.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Download failed",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getImageUrl = (launch) => {
    if (!launch.images || launch.images.length === 0) {
      return "/api/placeholder/400/300";
    }
    const image = launch.images[0];
    if (image.startsWith("http")) return image;
    const cleanPath = image.replace(/\\/g, "/");
    return `${API_URL}/${cleanPath}`;
  };

  const formatPrice = (price) => {
    if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lakh`;
    }
    return `${price.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "postponed":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:
        return "";
    }
  };

  const filteredLaunches = launches.filter((launch) => {
    const matchesSearch =
      launch.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      launch.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || launch.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || launch.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredLaunches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLaunches = filteredLaunches.slice(startIndex, endIndex);

  const renderStars = (rating, onRatingChange = null) => {
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

  const renderLaunchForm = (isEdit = false) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Launch Title
            </label>
            <Input
              placeholder="Enter launch title"
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Launch Date
            </label>
            <Input
              type="date"
              value={formData.launchDate}
              onChange={(e) => handleFormChange("launchDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input
              placeholder="e.g., 399000"
              value={formData.price}
              onChange={(e) => handleFormChange("price", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleFormChange("status", e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            placeholder="Enter launch description..."
            value={formData.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            rows={3}
          />
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

        {formData.deckLength.map((length, index) => (
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

        {formData.usp.map((point, index) => (
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
              rows={3}
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
              rows={3}
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
              Launch Image
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFormChange("image", e.target.files?.[0] || null)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload launch product image
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Brochure (PDF)
            </label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                handleFormChange("brochure", e.target.files?.[0] || null)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload product brochure (PDF format)
            </p>
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

        {formData.reviews.map((review, index) => (
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
                <p className="text-xs text-muted-foreground mt-1">
                  Upload {review.type} file for this review
                </p>
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

        {formData.testimonials.map((testimonial, index) => (
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
                <p className="text-xs text-muted-foreground mt-1">
                  Upload {testimonial.type} file for this testimonial
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Adding..." : "Add Launch"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsAddDialogOpen(false)}
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
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="text-lg text-muted-foreground ml-2">
          Loading launches...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            New Launches Management
          </h1>
          <p className="text-muted-foreground">
            Manage upcoming and recent vehicle launches
          </p>
        </div>

        {/* Add Launch Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Launch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Launch</DialogTitle>
            </DialogHeader>
            {renderLaunchForm()}
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
                placeholder="Search launches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-input text-sm"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="postponed">Postponed</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-input text-sm"
              >
                <option value="all">All Categories</option>
                <option value="SCV Cargo">SCV Cargo</option>
                <option value="SCV Passenger">SCV Passenger</option>
                <option value="Pickup">Pickup</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Launches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentLaunches.map((launch) => (
          <Card key={launch._id} className="overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-muted overflow-hidden">
                <img
                  src={getImageUrl(launch)}
                  alt={launch.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/api/placeholder/400/300";
                  }}
                />
                <Badge
                  className={`absolute top-3 right-3 ${getStatusColor(
                    launch.status
                  )}`}
                >
                  {launch.status}
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span className="line-clamp-2">{launch.title}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{launch.category}</Badge>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  <span className="font-medium text-sm">
                    {formatPrice(launch.price)}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm line-clamp-2">
                {launch.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Launch:{" "}
                  {new Date(launch.launchDate).toLocaleDateString("en-IN")}
                </span>
              </div>

              {launch.usp && launch.usp.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Key Features:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {launch.usp.slice(0, 2).map((usp, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {usp}
                      </Badge>
                    ))}
                    {launch.usp.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{launch.usp.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => {
                    setEditingLaunch(launch);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                {launch.brochureFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Launch</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{launch.title}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(launch._id, launch.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredLaunches.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No launches found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredLaunches.length)} of{" "}
            {filteredLaunches.length} launches
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
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
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    if (
                      page === totalPages - 1 &&
                      currentPage < totalPages - 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
