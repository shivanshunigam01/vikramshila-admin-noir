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
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Package,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";
import {
  getCompetitionProducts,
  createCompetitionProduct,
  updateCompetitionProduct,
  deleteCompetitionProduct,
} from "@/services/competitionService";

export default function CompetitionProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [formData, setFormData] = useState<any>({
    brand: "",
    model: "",
    category: "",
    description: "",
    price: "",
    payload: "",
    engine: "",
    fuelType: "",
    gearBox: "",
    clutchDia: "",
    torque: "",
    tyre: "",
    mileage: "",
    fuelTankCapacity: "",
    cabinType: "",
    warranty: "",
    monitoringFeatures: "",
    driverComfort: "",
    applicationSuitability: "",
    bodyDimensions: "",
    image: null,
    brochure: null,
  });

  const categories = [
    "SCV Cargo",
    "SCV Passenger",
    "Pickup",
    "LCV",
    "ICV",
    "MCV",
    "Buses",
    "Winger",
    "Others",
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getCompetitionProducts();
      if (res.data.success) setProducts(res.data.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load competition products.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return "-";
    const num = Number(price);
    return num >= 100000
      ? `${(num / 100000).toFixed(2)} Lakh`
      : `${num.toLocaleString()}`;
  };

  const getImageUrl = (p: any) => {
    const img = p.images?.[0];
    if (!img) return "/placeholder.svg";
    if (img.startsWith("http")) return img;
    const clean = img.replace(/\\/g, "/");
    return `${API_URL}/${clean}`;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      const fieldsToSend = [
        "brand",
        "model",
        "category",
        "description",
        "price",
        "payload",
        "engine",
        "fuelType",
        "gearBox",
        "clutchDia",
        "torque",
        "tyre",
        "mileage",
        "fuelTankCapacity",
        "cabinType",
        "warranty",
        "monitoringFeatures",
        "driverComfort",
        "applicationSuitability",
        "bodyDimensions",
      ];
      fieldsToSend.forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          fd.append(key, String(formData[key]));
        }
      });
      if (formData.image) fd.append("images", formData.image);
      if (formData.brochure) fd.append("brochureFile", formData.brochure);

      if (editingProduct) {
        await updateCompetitionProduct(editingProduct._id, fd);
        toast({
          title: "Updated",
          description: "Product updated successfully.",
        });
      } else {
        await createCompetitionProduct(fd);
        toast({ title: "Added", description: "Product added successfully." });
      }
      resetForm();
      loadProducts();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save product.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      category: "",
      description: "",
      price: "",
      payload: "",
      engine: "",
      fuelType: "",
      gearBox: "",
      clutchDia: "",
      torque: "",
      tyre: "",
      mileage: "",
      fuelTankCapacity: "",
      cabinType: "",
      warranty: "",
      monitoringFeatures: "",
      driverComfort: "",
      applicationSuitability: "",
      bodyDimensions: "",
      image: null,
      brochure: null,
    });
    setEditingProduct(null);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompetitionProduct(id);
      toast({ title: "Deleted", description: "Product deleted successfully." });
      loadProducts();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBrochure = (brochureFile: any) => {
    if (!brochureFile?.path) {
      toast({
        title: "No Brochure",
        description: "This product has no brochure file.",
      });
      return;
    }
    const url = brochureFile.path.replace(/\\/g, "/");
    const fullUrl = url.startsWith("http") ? url : `${API_URL}/${url}`;
    window.open(fullUrl, "_blank");
  };

  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      p.brand?.toLowerCase().includes(search) ||
      p.model?.toLowerCase().includes(search);
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const truncate = (str?: string | any[], n = 40) => {
    if (!str) return "-";
    const text = Array.isArray(str) ? str.join(", ") : String(str);
    return text.length > n ? text.slice(0, n) + "…" : text;
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "brand",
          "model",
          "category",
          "payload",
          "fuelType",
          "engine",
          "torque",
          "mileage",
          "gearBox",
          "clutchDia",
          "tyre",
          "fuelTankCapacity",
          "cabinType",
          "warranty",
          "price",
        ].map((field) => (
          <Input
            key={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={(e) =>
              setFormData({ ...formData, [field]: e.target.value })
            }
          />
        ))}
      </div>

      <Input
        placeholder="Application Suitability"
        value={formData.applicationSuitability}
        onChange={(e) =>
          setFormData({ ...formData, applicationSuitability: e.target.value })
        }
      />
      <Input
        placeholder="Body Dimensions"
        value={formData.bodyDimensions}
        onChange={(e) =>
          setFormData({ ...formData, bodyDimensions: e.target.value })
        }
      />
      <Input
        placeholder="Monitoring Features"
        value={formData.monitoringFeatures}
        onChange={(e) =>
          setFormData({ ...formData, monitoringFeatures: e.target.value })
        }
      />
      <Input
        placeholder="Driver Comfort (0–10)"
        value={formData.driverComfort}
        onChange={(e) =>
          setFormData({ ...formData, driverComfort: e.target.value })
        }
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-background"
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Upload Image</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.files?.[0] || null })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Brochure (PDF)
          </label>
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFormData({
                ...formData,
                brochure: e.target.files?.[0] || null,
              })
            }
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {editingProduct ? "Update Product" : "Add Product"}
        </Button>
        <Button variant="outline" onClick={resetForm}>
          Cancel
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
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
            Competition Products
          </h1>
          <p className="text-muted-foreground">
            Add and manage competitor vehicle data
          </p>
        </div>

        {/* Add/Edit Dialogs */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background z-10 pb-3 border-b">
              <DialogTitle>Add Competition Product</DialogTitle>
            </DialogHeader>
            <div className="pr-2">{renderForm()}</div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background z-10 pb-3 border-b">
              <DialogTitle>Edit Competition Product</DialogTitle>
            </DialogHeader>
            <div className="pr-2">{renderForm()}</div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand or model..."
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
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Competition Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No competition products found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2">Image</th>
                      <th className="text-left py-2 px-2">Brand</th>
                      <th className="text-left py-2 px-2">Model</th>
                      <th className="text-left py-2 px-2">Category</th>
                      <th className="text-left py-2 px-2">Fuel</th>
                      <th className="text-left py-2 px-2">Payload</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Monitoring</th>
                      <th className="text-left py-2 px-2">Comfort</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((p) => (
                      <tr key={p._id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <img
                            src={getImageUrl(p)}
                            alt="img"
                            className="w-12 h-12 object-cover rounded-md border"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholder.svg")
                            }
                          />
                        </td>
                        <td className="py-3 px-2 font-medium">{p.brand}</td>
                        <td className="py-3 px-2">{p.model}</td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{p.category}</Badge>
                        </td>
                        <td className="py-3 px-2">{p.fuelType}</td>
                        <td className="py-3 px-2">{p.payload}</td>
                        <td className="py-3 px-2 font-semibold">
                          ₹{formatPrice(p.price)}
                        </td>
                        <td className="py-3 px-2">
                          {truncate(p.monitoringFeatures, 25)}
                        </td>
                        <td className="py-3 px-2">{p.driverComfort || "-"}</td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            {p.brochureFile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDownloadBrochure(p.brochureFile)
                                }
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProduct(p);
                                setFormData(p);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {p.brand}{" "}
                                    {p.model}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p._id)}
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
                    Showing {startIndex + 1}–
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredProducts.length
                    )}{" "}
                    of {filteredProducts.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
