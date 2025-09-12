// src/pages/Leads.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Car,
  Clock,
  MoreHorizontal,
  UserCircle2,
  IndianRupee,
  Printer,
  Eye,
  PencilLine,
  Download,
  Calculator,
} from "lucide-react";
import { getleads, getLeadById, assignLead } from "@/services/leadsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */
type KycFile = {
  originalName?: string;
  path?: string;
  size?: number;
  mimetype?: string;
};

type Lead = {
  _id: string;
  productTitle?: string;
  productCategory?: string;
  vehiclePrice?: number;
  downPaymentAmount?: number;
  downPaymentPercentage?: number;
  loanAmount?: number;
  interestRate?: number;
  tenure?: number;
  estimatedEMI?: number;
  status: "pending" | "approved" | "rejected" | "quotation" | string;
  createdAt: string;
  updatedAt?: string;
  customerName?: string;
  phone?: string;
  notes?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  aadharFile?: KycFile | null;
  panCardFile?: KycFile | null;
  assignedTo?: string;
  __v?: number;
};

/* ---------- Enhanced Quotation Form ---------- */
type QuotationForm = {
  // Customer Details
  customerName: string;
  contactNumber: string;
  address: string;
  gstNo: string;
  panNo: string;

  // Vehicle Details
  model: string;
  variant: string;
  color: string;

  // Pricing
  exShowroomPrice: string;
  rtoTax: string;
  insurance: string;
  accessories: string;
  extendedWarranty: string;
  totalOnRoadPrice: string;

  // Discounts
  consumerOffer: string;
  exchangeBonus: string;
  corporateDiscount: string;
  additionalDiscount: string;
  totalDiscount: string;

  // Final Amounts
  netSellingPrice: string;

  // Finance Details
  loanAmount: string;
  downPayment: string;
  processingFee: string;
  rateOfInterest: string;
  tenure: string;
  emi: string;

  // Additional
  deliveryPeriod: string;
  validityPeriod: string;
  salesExecutive: string;
  remarks: string;
};

const DSE_OPTIONS = [
  { code: "DSE-bhagalpur", label: "DSE – Bhagalpur" },
  { code: "DSE-banka", label: "DSE – Banka" },
  { code: "DSE-khagaria", label: "DSE – Khagaria" },
];

/* ---------- Component ---------- */
export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // view
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  // assign
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Lead | null>(null);
  const [assignee, setAssignee] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  /* ---------- Quotation Dialog ---------- */
  const [qOpen, setQOpen] = useState(false);
  const [qMode, setQMode] = useState<"form" | "preview">("form");
  const [qLead, setQLead] = useState<Lead | null>(null);
  const [qForm, setQForm] = useState<QuotationForm | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Utils
  const formatINR = (n?: number | string) => {
    const num = typeof n === "string" ? Number(n) : n;
    if (!Number.isFinite(num as number)) return "0";
    return (num as number).toLocaleString("en-IN");
  };

  const numberOrZero = (v: any, fallback: number = 0): number => {
    const n = Number(v);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : fallback;
  };

  const cryptoRandomId = () => Math.random().toString(36).slice(2);

  const normalizeLead = (x: any): Lead => {
    const vPrice = numberOrZero(x?.vehiclePrice);
    const dpPct = numberOrZero(x?.downPaymentPercentage, 10);
    const dpAmt = numberOrZero(
      x?.downPaymentAmount,
      Math.round((vPrice * dpPct) / 100)
    );
    const loan = numberOrZero(x?.loanAmount, Math.max(vPrice - dpAmt, 0));
    const rate = numberOrZero(x?.interestRate, 9.5);
    const tenure = numberOrZero(x?.tenure, 36);
    const emi = numberOrZero(x?.estimatedEMI, 0);

    const safeKyc = (f: any): KycFile | null =>
      f && typeof f === "object"
        ? {
            originalName: f.originalName ?? "",
            path: f.path ?? "",
            size: typeof f.size === "number" ? f.size : undefined,
            mimetype: f.mimetype ?? "",
          }
        : null;

    return {
      _id: String(x?._id ?? cryptoRandomId()),
      productTitle: x?.productTitle ?? "",
      productCategory: x?.productCategory ?? "",
      vehiclePrice: vPrice,
      downPaymentAmount: dpAmt,
      downPaymentPercentage: dpPct,
      loanAmount: loan,
      interestRate: rate,
      tenure,
      estimatedEMI: emi,
      status: (x?.status ?? "pending") as Lead["status"],
      createdAt: x?.createdAt ?? new Date().toISOString(),
      updatedAt: x?.updatedAt,
      customerName: x?.customerName ?? x?.userName ?? "",
      phone: x?.phone ?? x?.userPhone ?? "",
      notes: x?.notes ?? "",
      userId: x?.userId,
      userName: x?.userName,
      userPhone: x?.userPhone,
      userEmail: x?.userEmail,
      aadharFile: safeKyc(x?.aadharFile),
      panCardFile: safeKyc(x?.panCardFile),
      assignedTo: x?.assignedTo,
      __v: x?.__v,
    };
  };

  // Fetch all leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getleads();
      const raw = Array.isArray(res?.data) ? res.data : [];
      setLeads(raw.map(normalizeLead));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to fetch leads",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Search + filter
  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.productTitle || "").toLowerCase().includes(q) ||
        (lead.productCategory || "").toLowerCase().includes(q) ||
        (lead.status || "").toLowerCase().includes(q) ||
        (lead.customerName || "").toLowerCase().includes(q) ||
        (lead.userName || "").toLowerCase().includes(q) ||
        (lead.userEmail || "").toLowerCase().includes(q) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.userPhone || "").includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-600/20";
      case "approved":
        return "bg-green-500/20 text-green-700 border-green-600/20";
      case "rejected":
        return "bg-red-500/20 text-red-700 border-red-600/20";
      case "quotation":
        return "bg-blue-500/20 text-blue-700 border-blue-600/20";
      default:
        return "bg-muted text-foreground/70 border-border";
    }
  };

  // View action
  const handleView = async (leadId: string) => {
    setViewLoading(true);
    setViewOpen(true);
    try {
      const res = await getLeadById(leadId);
      const data = res?.data ? normalizeLead(res.data) : null;
      setViewLead(data);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load lead",
      });
      setViewLead(null);
    } finally {
      setViewLoading(false);
    }
  };

  // Assign actions
  const openAssign = (lead: Lead) => {
    setAssignFor(lead);
    setAssignee("");
    setAssignOpen(true);
  };

  const confirmAssign = async () => {
    if (!assignFor || !assignee) {
      toast({
        title: "Select a DSE",
        description: "Please choose an assignee.",
      });
      return;
    }
    setAssigning(true);
    try {
      await assignLead(assignFor._id, assignee);
      setLeads((prev) =>
        prev.map((l) =>
          l._id === assignFor._id ? { ...l, assignedTo: assignee } : l
        )
      );
      toast({
        title: "Assigned",
        description: `Lead assigned to ${assignee}.`,
      });
      setAssignOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Lead Assigned" });
    } finally {
      setAssigning(false);
    }
  };

  /* ---------- Quotation Functions ---------- */
  const openQuotation = (lead: Lead) => {
    const basePrice = lead.vehiclePrice || 0;
    const rto = Math.round(basePrice * 0.12);
    const insurance = Math.round(basePrice * 0.04);
    const accessories = 15000;
    const warranty = 8000;
    const totalOnRoad = basePrice + rto + insurance + accessories + warranty;

    const form: QuotationForm = {
      customerName: lead.customerName || lead.userName || "",
      contactNumber: lead.phone || lead.userPhone || "",
      address: "",
      gstNo: "",
      panNo: "",

      model: lead.productTitle || "",
      variant: "",
      color: "",

      exShowroomPrice: String(basePrice),
      rtoTax: String(rto),
      insurance: String(insurance),
      accessories: String(accessories),
      extendedWarranty: String(warranty),
      totalOnRoadPrice: String(totalOnRoad),

      consumerOffer: "0",
      exchangeBonus: "0",
      corporateDiscount: "0",
      additionalDiscount: "0",
      totalDiscount: "0",

      netSellingPrice: String(totalOnRoad),

      loanAmount: String(lead.loanAmount || 0),
      downPayment: String(lead.downPaymentAmount || 0),
      processingFee: "15000",
      rateOfInterest: String(lead.interestRate || ""),
      tenure: String(lead.tenure || ""),
      emi: String(lead.estimatedEMI || ""),

      deliveryPeriod: "30-45 days",
      validityPeriod: "30 days",
      salesExecutive: lead.assignedTo || "",
      remarks: "",
    };

    setQLead(lead);
    setQForm(form);
    setQMode("form");
    setQOpen(true);
  };

  const setQ = (k: keyof QuotationForm, v: string) => {
    setQForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [k]: v };

      // Auto-calc totals when pricing changes
      if (
        [
          "exShowroomPrice",
          "rtoTax",
          "insurance",
          "accessories",
          "extendedWarranty",
        ].includes(k)
      ) {
        const totalOnRoad =
          numberOrZero(updated.exShowroomPrice) +
          numberOrZero(updated.rtoTax) +
          numberOrZero(updated.insurance) +
          numberOrZero(updated.accessories) +
          numberOrZero(updated.extendedWarranty);
        updated.totalOnRoadPrice = String(totalOnRoad);
      }

      if (
        [
          "consumerOffer",
          "exchangeBonus",
          "corporateDiscount",
          "additionalDiscount",
        ].includes(k)
      ) {
        const totalDiscount =
          numberOrZero(updated.consumerOffer) +
          numberOrZero(updated.exchangeBonus) +
          numberOrZero(updated.corporateDiscount) +
          numberOrZero(updated.additionalDiscount);
        updated.totalDiscount = String(totalDiscount);
      }

      // Net selling price
      const netPrice =
        numberOrZero(updated.totalOnRoadPrice) -
        numberOrZero(updated.totalDiscount);
      updated.netSellingPrice = String(Math.max(netPrice, 0));

      return updated;
    });
  };

  const goPreview = () => {
    if (qForm) setQMode("preview");
  };

  /* ---------- Print & Download ---------- */

  // dynamically load html2pdf.js when needed (no build changes)
  const ensureHtml2Pdf = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const w = window as any;
      if (w.html2pdf) return resolve(w.html2pdf);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () =>
        reject(new Error("Failed to load html2pdf.js from CDN"));
      document.body.appendChild(script);
    });

  const printQuotation = () => {
    if (printRef.current) {
      const printWindow = window.open("", "", "height=800,width=1200");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Vehicle Quotation</title>
              <style>
                html,body{background:#fff;color:#111;font-family:Arial,sans-serif;margin:0;padding:20px}
                table{width:100%;border-collapse:collapse;margin:10px 0}
                th,td{border:1px solid #000;padding:8px;text-align:left;color:#111}
                th{background:#f0f0f0;font-weight:bold}
                .header{text-align:center;margin-bottom:20px}
                .company-name{font-size:24px;font-weight:bold;margin-bottom:5px}
                .company-details{font-size:14px;margin-bottom:10px}
                .section-title{font-weight:700;margin:15px 0 5px}
                .amount{text-align:right}
                .total-row{background:#f0f0f0;font-weight:700}
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = await ensureHtml2Pdf();
      const fname = `Quotation_${
        qForm?.model || qLead?.productTitle || "Vehicle"
      }_${qForm?.customerName || "Customer"}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`.replace(/\s+/g, "_");

      await html2pdf()
        .from(printRef.current)
        .set({
          filename: fname,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .save();
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message || "Could not generate PDF.",
        variant: "destructive",
      });
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Force preview to render in light colors even in dark mode */}
      <style>{`
        .quotation-preview,
        .quotation-preview * {
          color: #111 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .quotation-preview table th,
        .quotation-preview table td { border-color: rgba(0,0,0,.7) !important; }
        .quotation-preview .total-row { background: #e8f5e9 !important; }
        .quotation-preview .header .company-name { color: #1f2937 !important; }
        .quotation-preview .section-title { color: #374151 !important; }
      `}</style>

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
      </div>

      {/* Filters */}
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (model, category, name, phone, email, status)…"
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

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading leads...</p>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card
              key={lead._id}
              className="overflow-hidden border-muted-foreground/10 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base md:text-lg truncate">
                        {lead.productTitle || "N/A"}
                      </h3>
                      {lead.productCategory ? (
                        <Badge variant="outline" className="text-xs">
                          {lead.productCategory}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString("en-IN")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn("border", getStatusColor(lead.status))}
                    >
                      {lead.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openQuotation(lead)}>
                          <Calculator className="mr-2 h-4 w-4" />
                          Create Quotation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(lead._id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAssign(lead)}>
                          <UserCircle2 className="mr-2 h-4 w-4" />
                          Assign to DSE
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {(lead.customerName ||
                  lead.userName ||
                  lead.phone ||
                  lead.userPhone) && (
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserCircle2 className="h-4 w-4" />
                      <span className="truncate">
                        {lead.customerName || lead.userName || "—"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lead.phone || lead.userPhone || "-"}
                    </div>
                    {lead.assignedTo && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">
                          Assigned to:
                        </span>{" "}
                        <span className="font-medium">{lead.assignedTo}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground mb-2 tracking-wider">
                    Finance Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{formatINR(lead.vehiclePrice)}</span>
                    </div>
                    <div>DP: ₹{formatINR(lead.downPaymentAmount)}</div>
                    <div>Loan: ₹{formatINR(lead.loanAmount)}</div>
                    <div>EMI: ₹{formatINR(lead.estimatedEMI)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No leads found</p>
        )}
      </div>

      {/* View Lead Sheet */}
      {/* View Lead Sheet */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
            <SheetDescription>
              Complete information of this lead
            </SheetDescription>
          </SheetHeader>

          {viewLoading ? (
            <p className="mt-4">Loading...</p>
          ) : viewLead ? (
            <div className="mt-4 space-y-5 text-sm">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground text-xs">Product</div>
                  <div className="font-medium">{viewLead.productTitle}</div>
                  <div className="text-muted-foreground">
                    {viewLead.productCategory}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <Badge
                    className={cn("mt-1", getStatusColor(viewLead.status))}
                  >
                    {viewLead.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Customer */}
              <div>
                <h4 className="font-semibold mb-2">Customer Details</h4>
                <p>
                  <b>Name:</b>{" "}
                  {viewLead.customerName || viewLead.userName || "—"}
                </p>
                <p>
                  <b>Phone:</b> {viewLead.phone || viewLead.userPhone || "—"}
                </p>
                <p>
                  <b>Email:</b> {viewLead.userEmail || "—"}
                </p>
              </div>

              <Separator />

              {/* Vehicle & Finance */}
              <div>
                <h4 className="font-semibold mb-2">Vehicle & Finance</h4>
                <p>
                  <b>Ex-Showroom:</b> ₹{formatINR(viewLead.vehiclePrice)}
                </p>
                <p>
                  <b>Down Payment:</b> ₹{formatINR(viewLead.downPaymentAmount)}{" "}
                  ({viewLead.downPaymentPercentage}%)
                </p>
                <p>
                  <b>Loan Amount:</b> ₹{formatINR(viewLead.loanAmount)}
                </p>
                <p>
                  <b>Interest Rate:</b> {viewLead.interestRate}%
                </p>
                <p>
                  <b>Tenure:</b> {viewLead.tenure} months
                </p>
                <p>
                  <b>Estimated EMI:</b> ₹{formatINR(viewLead.estimatedEMI)}
                </p>
              </div>

              <Separator />

              {/* Assignment */}
              {viewLead.assignedTo && (
                <div>
                  <h4 className="font-semibold mb-2">Assigned</h4>
                  <p>{viewLead.assignedTo}</p>
                </div>
              )}

              <Separator />

              {/* KYC Docs */}
              <div>
                <h4 className="font-semibold mb-2">KYC Documents</h4>
                {viewLead.aadharFile?.path && (
                  <p>
                    <b>Aadhaar:</b>{" "}
                    <a
                      href={viewLead.aadharFile.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {viewLead.aadharFile.originalName}
                    </a>
                  </p>
                )}
                {viewLead.panCardFile?.path && (
                  <p>
                    <b>PAN:</b>{" "}
                    <a
                      href={viewLead.panCardFile.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {viewLead.panCardFile.originalName}
                    </a>
                  </p>
                )}
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground">
                Created: {new Date(viewLead.createdAt).toLocaleString("en-IN")}{" "}
                <br />
                Updated:{" "}
                {viewLead.updatedAt
                  ? new Date(viewLead.updatedAt).toLocaleString("en-IN")
                  : "—"}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground">No lead found.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Choose a DSE to assign this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to</Label>
              <select
                id="assignee"
                className="w-full px-3 py-2 border rounded-md bg-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Select DSE…</option>
                {DSE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAssign} disabled={assigning || !assignee}>
                {assigning ? "Assigning…" : "Assign Lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Quotation Dialog ---------- */}
      <Dialog open={qOpen} onOpenChange={setQOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Vehicle Quotation
            </DialogTitle>
            <DialogDescription>
              Create professional quotation for {qLead?.productTitle}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={qMode === "form" ? "default" : "outline"}
                onClick={() => setQMode("form")}
              >
                <PencilLine className="h-4 w-4 mr-1" />
                Edit Form
              </Button>
              <Button
                size="sm"
                variant={qMode === "preview" ? "default" : "outline"}
                onClick={goPreview}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>

            {qMode === "preview" && (
              <div className="flex gap-2">
                {/* <Button size="sm" variant="outline" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button> */}
                <Button size="sm" onClick={printQuotation}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            )}
          </div>

          {/* Form Mode */}
          {qMode === "form" && qForm && (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {/* Customer Information */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-blue-600">
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium">
                        Customer Name *
                      </Label>
                      <Input
                        placeholder="Enter customer name"
                        value={qForm.customerName}
                        onChange={(e) => setQ("customerName", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Contact Number *
                      </Label>
                      <Input
                        placeholder="Enter contact number"
                        value={qForm.contactNumber}
                        onChange={(e) => setQ("contactNumber", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Sales Executive
                      </Label>
                      <Input
                        placeholder="Enter sales executive name"
                        value={qForm.salesExecutive}
                        onChange={(e) => setQ("salesExecutive", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Address</Label>
                      <Input
                        placeholder="Enter customer address"
                        value={qForm.address}
                        onChange={(e) => setQ("address", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">GST No.</Label>
                      <Input
                        placeholder="Enter GST number"
                        value={qForm.gstNo}
                        onChange={(e) => setQ("gstNo", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">PAN No.</Label>
                      <Input
                        placeholder="Enter PAN number"
                        value={qForm.panNo}
                        onChange={(e) => setQ("panNo", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-green-600">
                    Vehicle Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Model *</Label>
                      <Input
                        placeholder="Vehicle model"
                        value={qForm.model}
                        onChange={(e) => setQ("model", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Variant</Label>
                      <Input
                        placeholder="Vehicle variant"
                        value={qForm.variant}
                        onChange={(e) => setQ("variant", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Color</Label>
                      <Input
                        placeholder="Vehicle color"
                        value={qForm.color}
                        onChange={(e) => setQ("color", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-purple-600">
                    Pricing Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium">
                        Ex-Showroom Price *
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.exShowroomPrice}
                        onChange={(e) =>
                          setQ("exShowroomPrice", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        RTO/Road Tax
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.rtoTax}
                        onChange={(e) => setQ("rtoTax", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Insurance Premium
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.insurance}
                        onChange={(e) => setQ("insurance", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Accessories</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.accessories}
                        onChange={(e) => setQ("accessories", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Extended Warranty
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.extendedWarranty}
                        onChange={(e) =>
                          setQ("extendedWarranty", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>

                    {/* >>> CHANGED: editable + visible on dark */}
                    <div>
                      <Label className="text-sm font-medium">
                        Total On-Road Price
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.totalOnRoadPrice}
                        onChange={(e) =>
                          setQ("totalOnRoadPrice", e.target.value)
                        }
                        className="mt-1 bg-input text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Discounts & Offers */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-orange-600">
                    Discounts & Offers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-sm font-medium">
                        Consumer Offer
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.consumerOffer}
                        onChange={(e) => setQ("consumerOffer", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Exchange Bonus
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.exchangeBonus}
                        onChange={(e) => setQ("exchangeBonus", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Corporate Discount
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.corporateDiscount}
                        onChange={(e) =>
                          setQ("corporateDiscount", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Additional Discount
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.additionalDiscount}
                        onChange={(e) =>
                          setQ("additionalDiscount", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>

                    {/* >>> CHANGED: editable + visible on dark */}
                    <div>
                      <Label className="text-sm font-medium">
                        Total Discount
                      </Label>
                      <Input
                        type="number"
                        value={qForm.totalDiscount}
                        onChange={(e) => setQ("totalDiscount", e.target.value)}
                        className="mt-1 bg-input text-foreground"
                      />
                    </div>

                    {/* >>> CHANGED: editable + visible on dark */}
                    <div>
                      <Label className="text-sm font-medium">
                        Net Selling Price
                      </Label>
                      <Input
                        type="number"
                        value={qForm.netSellingPrice}
                        onChange={(e) =>
                          setQ("netSellingPrice", e.target.value)
                        }
                        className="mt-1 bg-input text-foreground font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Finance Details */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-red-600">
                    Finance Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Loan Amount</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.loanAmount}
                        onChange={(e) => setQ("loanAmount", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Down Payment
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.downPayment}
                        onChange={(e) => setQ("downPayment", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Processing Fee
                      </Label>
                      <Input
                        type="number"
                        placeholder="15000"
                        value={qForm.processingFee}
                        onChange={(e) => setQ("processingFee", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Rate of Interest (%)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="9.5"
                        value={qForm.rateOfInterest}
                        onChange={(e) => setQ("rateOfInterest", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Tenure (Months)
                      </Label>
                      <Input
                        type="number"
                        placeholder="36"
                        value={qForm.tenure}
                        onChange={(e) => setQ("tenure", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        EMI (₹/month)
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={qForm.emi}
                        onChange={(e) => setQ("emi", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="lg:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-gray-600">
                    Additional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">
                        Delivery Period
                      </Label>
                      <Input
                        placeholder="30-45 days"
                        value={qForm.deliveryPeriod}
                        onChange={(e) => setQ("deliveryPeriod", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Quotation Validity
                      </Label>
                      <Input
                        placeholder="30 days"
                        value={qForm.validityPeriod}
                        onChange={(e) => setQ("validityPeriod", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Remarks</Label>
                      <Textarea
                        rows={3}
                        placeholder="Any additional remarks or notes"
                        value={qForm.remarks}
                        onChange={(e) => setQ("remarks", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setQOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={goPreview}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Generate Preview
                </Button>
              </div>
            </div>
          )}

          {/* Preview (forced light theme) */}
          {qMode === "preview" && qForm && (
            <div className="overflow-y-auto max-h-[70vh]">
              <div
                ref={printRef}
                className="quotation-preview bg-white p-8 border rounded-md"
              >
                {/* Header */}
                <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <div className="company-name text-2xl font-bold">
                    Vikramshila Automobiles Pvt Ltd.
                  </div>
                  <div className="company-details text-sm">
                    Authorized Dealer - Tata Commercial Vehicles
                    <br />
                    Address: Bhagalpur, Banka & Khagaria | Contact:
                    +91-8406991610
                  </div>
                  <div
                    className="text-lg font-semibold mt-2"
                    style={{ color: "#2563eb" }}
                  >
                    VEHICLE QUOTATION
                  </div>
                  <div className="text-sm">
                    Date: {new Date().toLocaleDateString("en-IN")} | Quotation
                    No: Q{Date.now().toString().slice(-6)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="mb-6">
                  <div className="section-title text-lg font-semibold mb-2 border-b border-gray-300 pb-1">
                    Customer Details
                  </div>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-4 font-medium w-1/4">
                          Customer Name:
                        </td>
                        <td className="py-1">{qForm.customerName || "—"}</td>
                        <td className="py-1 pr-4 font-medium w-1/4">
                          Contact Number:
                        </td>
                        <td className="py-1">{qForm.contactNumber || "—"}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-medium">Address:</td>
                        <td className="py-1" colSpan={3}>
                          {qForm.address || "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-medium">GST No:</td>
                        <td className="py-1">{qForm.gstNo || "—"}</td>
                        <td className="py-1 pr-4 font-medium">PAN No:</td>
                        <td className="py-1">{qForm.panNo || "—"}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-medium">
                          Sales Executive:
                        </td>
                        <td className="py-1">{qForm.salesExecutive || "—"}</td>
                        <td className="py-1 pr-4 font-medium">
                          Delivery Period:
                        </td>
                        <td className="py-1">{qForm.deliveryPeriod || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Vehicle Details */}
                <div className="mb-6">
                  <div className="section-title text-lg font-semibold mb-2 border-b border-gray-300 pb-1">
                    Vehicle Specification
                  </div>
                  <table>
                    <tbody>
                      <tr>
                        <td className="py-1 pr-4 font-medium w-1/4">Model:</td>
                        <td className="py-1 pr-4">{qForm.model || "—"}</td>
                        <td className="py-1 pr-4 font-medium w-1/4">
                          Variant:
                        </td>
                        <td className="py-1">{qForm.variant || "—"}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-medium">Color:</td>
                        <td className="py-1 pr-4">{qForm.color || "—"}</td>
                        <td className="py-1 pr-4 font-medium">
                          Quotation Validity:
                        </td>
                        <td className="py-1">{qForm.validityPeriod || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Price Breakdown */}
                <div className="mb-6">
                  <div className="section-title text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
                    Price Breakdown
                  </div>
                  <table>
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th className="text-left p-2 font-semibold">
                          Particulars
                        </th>
                        <th className="text-right p-2 font-semibold w-32">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2">Ex-Showroom Price</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.exShowroomPrice)}
                        </td>
                      </tr>
                      <tr style={{ background: "#fafafa" }}>
                        <td className="p-2">RTO/Road Tax</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.rtoTax)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">Insurance Premium</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.insurance)}
                        </td>
                      </tr>
                      <tr style={{ background: "#fafafa" }}>
                        <td className="p-2">Accessories</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.accessories)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">Extended Warranty</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.extendedWarranty)}
                        </td>
                      </tr>
                      <tr className="total-row">
                        <td className="p-2">Total On-Road Price</td>
                        <td className="p-2 text-right amount">
                          {formatINR(qForm.totalOnRoadPrice)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Discounts */}
                {numberOrZero(qForm.totalDiscount) > 0 && (
                  <div className="mb-6">
                    <div className="section-title text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
                      Discounts & Offers
                    </div>
                    <table>
                      <thead>
                        <tr style={{ background: "#fee2e2" }}>
                          <th className="text-left p-2 font-semibold">
                            Discount Type
                          </th>
                          <th className="text-right p-2 font-semibold w-32">
                            Amount (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {numberOrZero(qForm.consumerOffer) > 0 && (
                          <tr>
                            <td className="p-2">Consumer Offer</td>
                            <td className="p-2 text-right amount">
                              -{formatINR(qForm.consumerOffer)}
                            </td>
                          </tr>
                        )}
                        {numberOrZero(qForm.exchangeBonus) > 0 && (
                          <tr style={{ background: "#fafafa" }}>
                            <td className="p-2">Exchange Bonus</td>
                            <td className="p-2 text-right amount">
                              -{formatINR(qForm.exchangeBonus)}
                            </td>
                          </tr>
                        )}
                        {numberOrZero(qForm.corporateDiscount) > 0 && (
                          <tr>
                            <td className="p-2">Corporate Discount</td>
                            <td className="p-2 text-right amount">
                              -{formatINR(qForm.corporateDiscount)}
                            </td>
                          </tr>
                        )}
                        {numberOrZero(qForm.additionalDiscount) > 0 && (
                          <tr style={{ background: "#fafafa" }}>
                            <td className="p-2">Additional Discount</td>
                            <td className="p-2 text-right amount">
                              -{formatINR(qForm.additionalDiscount)}
                            </td>
                          </tr>
                        )}
                        <tr className="total-row" style={{ color: "#b91c1c" }}>
                          <td className="p-2">Total Discounts</td>
                          <td className="p-2 text-right amount">
                            -{formatINR(qForm.totalDiscount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Final Price */}
                <div className="mb-6">
                  <table className="w-full">
                    <tbody>
                      <tr
                        className="total-row"
                        style={{
                          background: "#ecfdf5",
                          border: "2px solid #bbf7d0",
                        }}
                      >
                        <td
                          className="p-3 text-xl font-bold"
                          style={{ color: "#166534" }}
                        >
                          Net Customer Payable Amount
                        </td>
                        <td
                          className="p-3 text-right text-xl font-bold"
                          style={{ color: "#166534" }}
                        >
                          ₹ {formatINR(qForm.netSellingPrice)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Finance Details */}
                {qForm.loanAmount && numberOrZero(qForm.loanAmount) > 0 && (
                  <div className="mb-6">
                    <div className="section-title text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
                      Finance Details
                    </div>
                    <table>
                      <tbody>
                        <tr>
                          <td className="py-1 pr-4 font-medium w-1/4">
                            Loan Amount:
                          </td>
                          <td className="py-1 pr-4">
                            ₹ {formatINR(qForm.loanAmount)}
                          </td>
                          <td className="py-1 pr-4 font-medium w-1/4">
                            Down Payment:
                          </td>
                          <td className="py-1">
                            ₹ {formatINR(qForm.downPayment)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 font-medium">
                            Rate of Interest:
                          </td>
                          <td className="py-1 pr-4">
                            {qForm.rateOfInterest || "—"}%
                          </td>
                          <td className="py-1 pr-4 font-medium">Tenure:</td>
                          <td className="py-1">{qForm.tenure || "—"} months</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 font-medium">
                            Processing Fee:
                          </td>
                          <td className="py-1 pr-4">
                            ₹ {formatINR(qForm.processingFee)}
                          </td>
                          <td className="py-1 pr-4 font-medium">EMI:</td>
                          <td
                            className="py-1 font-semibold"
                            style={{ color: "#2563eb" }}
                          >
                            ₹ {formatINR(qForm.emi)}/month
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="mb-6">
                  <div className="section-title text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
                    Terms & Conditions
                  </div>
                  <ol className="text-sm space-y-1 pl-5">
                    <li>
                      1. Prices are subject to change without prior notice as
                      per OEM policies.
                    </li>
                    <li>
                      2. This quotation is valid for{" "}
                      {qForm.validityPeriod || "30 days"} from the date of
                      issue.
                    </li>
                    <li>
                      3. Registration & Insurance charges are as per actuals at
                      the time of billing.
                    </li>
                    <li>
                      4. Finance approval is subject to the financier&apos;s
                      terms and conditions.
                    </li>
                    <li>
                      5. Delivery time:{" "}
                      {qForm.deliveryPeriod || "As per model availability"}.
                    </li>
                    <li>
                      6. All disputes are subject to Bhagalpur jurisdiction
                      only.
                    </li>
                    <li>
                      7. Vehicle booking requires advance payment as per company
                      norms.
                    </li>
                  </ol>
                </div>

                {/* Remarks */}
                {qForm.remarks && (
                  <div className="mb-6">
                    <div className="section-title text-lg font-semibold mb-2 border-b border-gray-300 pb-1">
                      Remarks
                    </div>
                    <p className="text-sm">{qForm.remarks}</p>
                  </div>
                )}

                {/* Footer/Signature */}
                <div className="mt-8 pt-4 border-t">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm">For any queries, contact:</div>
                      <div className="font-medium">
                        {qForm.salesExecutive || "Sales Team"}
                      </div>
                      <div className="text-sm">
                        Vikramshila Automobiles Pvt Ltd.
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-gray-400 w-48 mb-1"></div>
                      <div className="text-sm font-medium">
                        Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
