import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export default function ProductFormDialog({
  open,
  onOpenChange,
  initialData = null,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "SCV Cargo",
    price: "",
    description: "",
    image: null,
    brochure: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.title || "",
        category: initialData.category || "SCV Cargo",
        price: initialData.price || "",
        description: initialData.description || "",
        image: null,
        brochure: null,
      });
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vikram-card max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="SCV Cargo">SCV Cargo</option>
              <option value="SCV Passenger">SCV Passenger</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <Input
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Image
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleChange("image", e.target.files?.[0] || null)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Brochure (PDF)
            </label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                handleChange("brochure", e.target.files?.[0] || null)
              }
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onSubmit(formData)}
              className="vikram-button"
            >
              {initialData ? "Update Product" : "Add Product"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
