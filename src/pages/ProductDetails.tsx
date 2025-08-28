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
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProductDetails() {
  const { id } = useParams(); // get product id from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();
        setProduct(data.data); // assign product details
      } catch (err) {
        console.error("Failed to fetch product:", err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading product...</span>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-red-500">Product not found!</div>;
  }

  const brochureUrl = product.brochureFile?.startsWith("http")
    ? product.brochureFile
    : `${API_URL}/${product.brochureFile.replace(/\\/g, "/")}`;

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="mb-4 flex items-center gap-2"
        onClick={() => navigate(-1)} // go back one step
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="vikram-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {product.title}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Created on {new Date(product.createdAt).toLocaleDateString("en-IN")}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Product Image */}
          <div className="w-full max-w-md">
            <img
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.title}
              className="w-full rounded-lg border object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Category:</h3>
              <Badge>{product.category}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Price:</h3>
              <IndianRupee className="h-4 w-4" />
              <span>{product.price}</span>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Status:</h3>
              <Badge
                className={
                  product.status === "active"
                    ? "bg-green-500/20 text-green-500 border-green-500/30"
                    : ""
                }
              >
                {product.status}
              </Badge>
            </div>

            {/* 🚛 Additional Details */}
            {product.gvw && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">GVW:</h3>
                <span>{product.gvw}</span>
              </div>
            )}

            {product.engine && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Engine:</h3>
                <span>{product.engine}</span>
              </div>
            )}

            {product.fuelTankCapacity && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Fuel Tank Capacity:</h3>
                <span>{product.fuelTankCapacity}</span>
              </div>
            )}

            {/* 📄 Brochure */}
            {product.brochureFile && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(brochureUrl, "_blank")}
              >
                <FileText className="h-4 w-4" />
                View Brochure
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
