// src/components/AddQuotationModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddQuotationModalProps {
  open: boolean;
  onClose: () => void;
  lead?: any; // prefilled data if editing a lead
}

export function AddQuotationModal({
  open,
  onClose,
  lead,
}: AddQuotationModalProps) {
  const [formData, setFormData] = useState({
    vehiclePrice: lead?.vehiclePrice || "",
    downPayment: lead?.downPaymentAmount || "",
    interest: lead?.interestRate || "",
    tenure: lead?.tenure || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Quotation Data Submitted:", formData);
    // 🔗 Call API here to save quotation
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Quotation & Costing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            name="vehiclePrice"
            value={formData.vehiclePrice}
            onChange={handleChange}
            placeholder="Vehicle Price"
          />
          <Input
            name="downPayment"
            value={formData.downPayment}
            onChange={handleChange}
            placeholder="Down Payment"
          />
          <Input
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            placeholder="Interest Rate"
          />
          <Input
            name="tenure"
            value={formData.tenure}
            onChange={handleChange}
            placeholder="Tenure (months)"
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
