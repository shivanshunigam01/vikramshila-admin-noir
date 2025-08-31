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
  Upload,
  Video,
  Star,
  Calculator,
  TrendingUp,
  X,
  FileSpreadsheet,
  Download,
  Image,
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productService";
import { Navigate, useNavigate } from "react-router-dom";
const FormFields = ({
  formData,
  handleFormChange,
  handleUSPChange,
  updateDeckLength,
  removeDeckLength,
  addDeckLength,
}) => (
  <div className="space-y-6">
    {/* Basic Information */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Product Name *</label>
          <Input
            placeholder="Enter product name"
            value={formData.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => handleFormChange("category", e.target.value)}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            required
          >
            <option value="SCV Cargo">SCV Cargo</option>
            <option value="SCV Passenger">SCV Passenger</option>
            <option value="Pickup">Pickup</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Price (₹) *</label>
          <Input
            type="text"
            placeholder="e.g., 599000 or 5.99 Lakh"
            value={formData.price}
            onChange={(e) => handleFormChange("price", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">GVW *</label>
          <Input
            placeholder="e.g., 1000 kg"
            value={formData.gvw}
            onChange={(e) => handleFormChange("gvw", e.target.value)}
            required
          />
        </div>
      </div>
    </div>

    {/* USP Points */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">
        Unique Selling Points (USP)
      </h3>
      <div className="space-y-3">
        {formData.usp.map((point, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium">
              USP Point {index + 1}
            </label>
            <Input
              placeholder={`Enter USP point ${index + 1}`}
              value={point}
              onChange={(e) => handleUSPChange(index, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>

    {/* Deck Length */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">
        Deck Length Options
      </h3>
      <div className="space-y-3">
        {formData.deckLength.map((length, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Deck length option ${index + 1}`}
              value={length}
              onChange={(e) => updateDeckLength(index, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeDeckLength(index)}
              className="text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addDeckLength}>
          <Plus className="h-4 w-4 mr-2" /> Add Deck Length Option
        </Button>
      </div>
    </div>
  </div>
);
