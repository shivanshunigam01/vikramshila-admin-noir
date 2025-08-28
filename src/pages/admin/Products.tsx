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
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productService";
import { Navigate, useNavigate } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // loader for add product
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "SCV Cargo",
    price: "",
    description: "",
    gvw: "",
    engine: "",
    fuelTankCapacity: "",
    image: null,
    brochure: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await getProducts();
        setProducts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getProductCategory = (product) => {
    const title = product.title?.toLowerCase() || "";
    const description = product.description?.toLowerCase() || "";

    if (title.includes("pickup") || description.includes("pickup")) {
      return "Pickup";
    } else if (
      title.includes("passenger") ||
      description.includes("passenger")
    ) {
      return "SCV Passenger";
    } else {
      return "SCV Cargo";
    }
  };

  const formatPrice = (price) => {
    if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lakh`;
    }
    return `${price.toLocaleString()}`;
  };

  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0) {
      return "/placeholder.svg";
    }

    const image = product.images[0];
    if (image.startsWith("http")) return image;
    const cleanPath = image.replace(/\\/g, "/");
    return `${API_URL}/${cleanPath}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const productCategory = getProductCategory(product);
    const matchesCategory =
      selectedCategory === "all" || productCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const navigate = useNavigate();
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        window.location.reload();
      } else {
        alert(res.message || "Failed to delete product");
      }
    } catch (err: any) {
      console.error("Delete failed:", err.message || err);
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
      fd.append("gvw", formData.gvw);
      fd.append("engine", formData.engine);
      fd.append("fuelTankCapacity", formData.fuelTankCapacity);

      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      const res = await createProduct(fd);

      if (res.message === "Product created") {
        setFormData({
          name: "",
          category: "SCV Cargo",
          price: "",
          description: "",
          gvw: "",
          engine: "",
          fuelTankCapacity: "",
          image: null,
          brochure: null,
        });
      }
      setIsAddDialogOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error("Failed to create product:", err.message || err);
      alert(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      fd.append("gvw", formData.gvw);
      fd.append("engine", formData.engine);
      fd.append("fuelTankCapacity", formData.fuelTankCapacity);

      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      const res = await updateProduct(editingProduct._id, fd);

      if (res.success || res.message === "Product updated") {
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data : p))
        );
        setIsEditDialogOpen(false);
        setEditingProduct(null);

        window.location.reload();
      }
    } catch (err: any) {
      console.error("Failed to update product:", err.message || err);
      alert(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };
  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Products Management
          </h1>
          <p className="text-muted-foreground">
            Manage your vehicle inventory and listings
          </p>
        </div>

        {/* 👉 Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="vikram-button gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-4">
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

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        handleFormChange("category", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border bg-input"
                    >
                      <option value="SCV Cargo">SCV Cargo</option>
                      <option value="SCV Passenger">SCV Passenger</option>
                      <option value="Pickup">Pickup</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price
                    </label>
                    <Input
                      placeholder="e.g., 3.99 Lakh"
                      value={formData.price}
                      onChange={(e) =>
                        handleFormChange("price", e.target.value)
                      }
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      placeholder="Enter product description..."
                      value={formData.description}
                      onChange={(e) =>
                        handleFormChange("description", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      GVW
                    </label>
                    <Input
                      placeholder="Enter GVW"
                      value={formData.gvw}
                      onChange={(e) => handleFormChange("gvw", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Engine
                    </label>
                    <Input
                      placeholder="Enter Engine details"
                      value={formData.engine}
                      onChange={(e) =>
                        handleFormChange("engine", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fuel Tank Capacity
                    </label>
                    <Input
                      placeholder="Enter Fuel Tank Capacity"
                      value={formData.fuelTankCapacity}
                      onChange={(e) =>
                        handleFormChange("fuelTankCapacity", e.target.value)
                      }
                    />
                  </div>

                  {/* File Inputs */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Image
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFormChange("image", e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Brochure (PDF)
                    </label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        handleFormChange(
                          "brochure",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      className="vikram-button flex items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {submitting ? "Adding..." : "Add Product"}
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
              </div>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-4">
                {/* Same form fields as Add */}
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleFormChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-md border bg-input"
                  >
                    <option value="SCV Cargo">SCV Cargo</option>
                    <option value="SCV Passenger">SCV Passenger</option>
                    <option value="Pickup">Pickup</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <Input
                    placeholder="e.g., 3.99 Lakh"
                    value={formData.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Enter product description..."
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">GVW</label>
                  <Input
                    placeholder="Enter GVW"
                    value={formData.gvw}
                    onChange={(e) => handleFormChange("gvw", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Engine
                  </label>
                  <Input
                    placeholder="Enter Engine details"
                    value={formData.engine}
                    onChange={(e) => handleFormChange("engine", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fuel Tank Capacity
                  </label>
                  <Input
                    placeholder="Enter Fuel Tank Capacity"
                    value={formData.fuelTankCapacity}
                    onChange={(e) =>
                      handleFormChange("fuelTankCapacity", e.target.value)
                    }
                  />
                </div>

                {/* File inputs */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Image (upload to replace)
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFormChange("image", e.target.files?.[0] || null)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Brochure (upload to replace)
                  </label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      handleFormChange("brochure", e.target.files?.[0] || null)
                    }
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateSubmit}
                    className="vikram-button flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Updating..." : "Update Product"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {/* Same form fields as Add */}
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

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input
                  placeholder="e.g., 3.99 Lakh"
                  value={formData.price}
                  onChange={(e) => handleFormChange("price", e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Enter product description..."
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GVW</label>
                <Input
                  placeholder="Enter GVW"
                  value={formData.gvw}
                  onChange={(e) => handleFormChange("gvw", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine</label>
                <Input
                  placeholder="Enter Engine details"
                  value={formData.engine}
                  onChange={(e) => handleFormChange("engine", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fuel Tank Capacity
                </label>
                <Input
                  placeholder="Enter Fuel Tank Capacity"
                  value={formData.fuelTankCapacity}
                  onChange={(e) =>
                    handleFormChange("fuelTankCapacity", e.target.value)
                  }
                />
              </div>

              {/* File inputs */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Image (upload to replace)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFormChange("image", e.target.files?.[0] || null)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Brochure (upload to replace)
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    handleFormChange("brochure", e.target.files?.[0] || null)
                  }
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateSubmit}
                  className="vikram-button flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Updating..." : "Update Product"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="vikram-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found.
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
                    {currentProducts.map((product) => (
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
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {product._id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="secondary">
                            {getProductCategory(product)}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            <span className="font-medium">
                              {formatPrice(product.price)}
                            </span>
                          </div>
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
                            {product.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-2 text-sm text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
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
                                  name: product.title,
                                  category: product.category || "SCV Cargo",
                                  price: product.price,
                                  description: product.description,
                                  gvw: product.gvw,
                                  engine: product.engine,
                                  fuelTankCapacity: product.fuelTankCapacity,
                                  image: null,
                                  brochure: null,
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* View Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                navigate(`/admin/products/${product._id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {product.brochureFile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  let brochureUrl = product.brochureFile;
                                  if (!brochureUrl.startsWith("http")) {
                                    brochureUrl = `${API_URL}/${brochureUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`;
                                  }
                                  window.open(brochureUrl, "_blank");
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}

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
                              <AlertDialogContent className="vikram-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Product
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
                    {filteredProducts.length} products
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
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1;

                          if (!showPage) {
                            // Show ellipsis
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
