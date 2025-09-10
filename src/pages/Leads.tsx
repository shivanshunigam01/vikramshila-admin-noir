// src/pages/Leads.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Car, Clock } from "lucide-react";
import { getleads } from "@/services/leadsService";

// shadcn dialog (install if not present)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Lead = {
  _id: string;
  productTitle?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "quotation" | string;
  vehiclePrice?: number;
  downPaymentAmount?: number;
  downPaymentPercentage?: number;
  loanAmount?: number;
  interestRate?: number;
  tenure?: number;
  estimatedEMI?: number;
  customerName?: string;
  phone?: string;
  notes?: string;
};

type QuotationForm = {
  productTitle: string;
  customerName: string;
  phone: string;
  vehiclePrice: string;
  downPaymentPercentage: string;
  downPaymentAmount: string;
  loanAmount: string;
  interestRate: string;
  tenure: string;
  estimatedEMI: string;
  notes: string;
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<QuotationForm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getleads();
      setLeads((res.data || []) as Lead[]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 🔔 Open quotation modal automatically when the page is visited
  useEffect(() => {
    // only auto-open once, and only after data is fetched
    if (!loading) {
      openQuotationModal(); // opens as a blank form
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Search + filter
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.productTitle || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (lead.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.customerName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "approved":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "quotation":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default:
        return "bg-gray-200 text-gray-600 border-gray-300";
    }
  };

  // ---------- Quotation Modal helpers ----------
  const computeEMI = (
    principal: number,
    annualRatePct: number,
    months: number
  ) => {
    if (!principal || !annualRatePct || !months) return 0;
    const r = annualRatePct / 12 / 100;
    return Math.round(
      (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    );
  };

  const openQuotationModal = (lead?: Lead) => {
    setSelectedLead(lead ?? null);
    const dpPct = lead?.downPaymentPercentage ?? 10;
    const vPrice = lead?.vehiclePrice ?? 0;
    const dpAmt = lead?.downPaymentAmount ?? Math.round((vPrice * dpPct) / 100);
    const loan = lead?.loanAmount ?? Math.max(vPrice - dpAmt, 0);
    const rate = lead?.interestRate ?? 9.5;
    const tenure = lead?.tenure ?? 36;
    const emi = lead?.estimatedEMI ?? computeEMI(loan, rate, tenure);

    setForm({
      productTitle: lead?.productTitle || "",
      customerName: lead?.customerName || "",
      phone: lead?.phone || "",
      vehiclePrice: vPrice ? String(vPrice) : "",
      downPaymentPercentage: String(dpPct),
      downPaymentAmount: String(dpAmt),
      loanAmount: String(loan),
      interestRate: String(rate),
      tenure: String(tenure),
      estimatedEMI: String(emi),
      notes: lead?.notes || "",
    });
    setIsModalOpen(true);
  };

  const onFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    const next = { ...form, [name]: value } as QuotationForm;

    // auto recompute DP/Loan/EMI on relevant changes
    const vPrice = Number(next.vehiclePrice) || 0;
    const dpPct = Number(next.downPaymentPercentage) || 0;
    const dpAmt = Math.round((vPrice * dpPct) / 100);
    next.downPaymentAmount = String(dpAmt);
    next.loanAmount = String(Math.max(vPrice - dpAmt, 0));

    const emi = computeEMI(
      Number(next.loanAmount),
      Number(next.interestRate),
      Number(next.tenure)
    );
    next.estimatedEMI = String(emi);

    setForm(next);
  };

  const saveQuotation = async () => {
    if (!form) return;
    setSubmitting(true);
    try {
      // TODO: replace with your API call
      // await createOrUpdateQuotation({ leadId: selectedLead?._id, ...mappedFields });
      toast({
        title: "Quotation saved",
        description: selectedLead
          ? `Saved quotation for ${selectedLead.productTitle ?? "lead"}.`
          : "Saved new quotation.",
      });

      // optional: mark in-memory status as "quotation"
      if (selectedLead) {
        setLeads((prev) =>
          prev.map((l) =>
            l._id === selectedLead._id ? { ...l, status: "quotation" } : l
          )
        );
      }
      setIsModalOpen(false);
      setSelectedLead(null);
      setForm(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to save quotation",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const moveLeadToQuotation = (lead: Lead) => {
    // update locally for UI feedback (wire your API if needed)
    setLeads((prev) =>
      prev.map((l) => (l._id === lead._id ? { ...l, status: "quotation" } : l))
    );
    openQuotationModal(lead);
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            Leads
          </h1>
          <p className="text-muted-foreground">
            Manage and track all customer leads
          </p>
        </div>

        {/* Manual trigger if needed */}
        <Button variant="secondary" onClick={() => openQuotationModal()}>
          Add Quotation & Costing
        </Button>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md border bg-input text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="quotation">Quotation</option>
            <option value="rejected">Rejected</option>
          </select>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading leads...</p>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card key={lead._id} className="vikram-card overflow-hidden">
              <CardContent className="space-y-2 p-4">
                <h3 className="font-semibold text-lg">
                  {lead.productTitle || "N/A"}
                </h3>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Vehicle Price: ₹{lead.vehiclePrice ?? "-"}</p>
                  <p>
                    Down Payment: ₹{lead.downPaymentAmount ?? "-"} (
                    {lead.downPaymentPercentage ?? "-"}%)
                  </p>
                  <p>Loan Amount: ₹{lead.loanAmount ?? "-"}</p>
                  <p>Interest: {lead.interestRate ?? "-"}%</p>
                  <p>Tenure: {lead.tenure ?? "-"} months</p>
                  <p>EMI: ₹{lead.estimatedEMI ?? "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => openQuotationModal(lead)}
                    className="col-span-2 sm:col-span-1"
                  >
                    Add Quotation & Costing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveLeadToQuotation(lead)}
                    className="col-span-2 sm:col-span-1"
                  >
                    Move to C1
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No leads found</p>
        )}
      </div>

      {/* Add Quotation & Costing Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Quotation & Costing</DialogTitle>
            <DialogDescription>
              Fill in the quotation details. Values auto-recalculate as you
              edit.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input
                  name="productTitle"
                  value={form.productTitle}
                  onChange={onFormChange}
                  placeholder="Model / Variant"
                />
              </div>

              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  name="customerName"
                  value={form.customerName}
                  onChange={onFormChange}
                  placeholder="Customer name"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={onFormChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Vehicle Price (₹)</Label>
                <Input
                  name="vehiclePrice"
                  type="number"
                  value={form.vehiclePrice}
                  onChange={onFormChange}
                  placeholder="e.g. 2750000"
                />
              </div>

              <div className="space-y-2">
                <Label>Down Payment %</Label>
                <Input
                  name="downPaymentPercentage"
                  type="number"
                  value={form.downPaymentPercentage}
                  onChange={onFormChange}
                  placeholder="e.g. 10"
                />
              </div>

              <div className="space-y-2">
                <Label>Down Payment Amount (₹)</Label>
                <Input
                  name="downPaymentAmount"
                  value={form.downPaymentAmount}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Loan Amount (₹)</Label>
                <Input name="loanAmount" value={form.loanAmount} disabled />
              </div>

              <div className="space-y-2">
                <Label>Interest Rate (% p.a.)</Label>
                <Input
                  name="interestRate"
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={onFormChange}
                  placeholder="e.g. 9.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Tenure (months)</Label>
                <Input
                  name="tenure"
                  type="number"
                  value={form.tenure}
                  onChange={onFormChange}
                  placeholder="e.g. 36"
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated EMI (₹)</Label>
                <Input name="estimatedEMI" value={form.estimatedEMI} disabled />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  name="notes"
                  value={form.notes}
                  onChange={onFormChange}
                  placeholder="Additional remarks, offers, accessories, etc."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveQuotation} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Quotation"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
