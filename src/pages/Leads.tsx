// src/pages/Leads.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
// icons
import { Mail, Phone /* ...existing */ } from "lucide-react";
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
import {
  createQoute,
  updateQoutation,
  getQoutationByLeadId,
  type CreateQoutePayload,
  getAssignedtoDSE,
  sendQoutationEmail,
  sendQoutationSMS,
  createInternalCosting,
  updateInternalCosting,
  getInternalCostingByLeadId,
  type InternalCostingPayload,
} from "@/services/leadsService";

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
  status: "C0" | "C1" | "C2" | "C3" | string;
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

  // INTERNAL COSTING dialog state
  const [icOpen, setIcOpen] = useState(false);
  const [icMode, setIcMode] = useState<"form" | "preview">("form");
  const [icLead, setIcLead] = useState<Lead | null>(null);
  const [icForm, setIcForm] = useState<InternalCostingPayload | null>(null);
  const [icId, setIcId] = useState<string | null>(null);
  const [icSaving, setIcSaving] = useState(false);
  const icPrintRef = useRef<HTMLDivElement>(null);

  /* ---------- Quotation Dialog ---------- */
  const [qOpen, setQOpen] = useState(false);
  const [qMode, setQMode] = useState<"form" | "preview">("form");
  const [qLead, setQLead] = useState<Lead | null>(null);
  const [qForm, setQForm] = useState<QuotationForm | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ensure a quotation exists, then return the id
  const ensureSavedQuotation = async (): Promise<string | null> => {
    if (qId) return qId;
    const payload = buildCreateQoutePayload();
    if (!payload) return null;
    try {
      const res = await createQoute(payload);
      const created = res?.data;
      if (created?._id) {
        setQId(created._id);
        return created._id;
      }
      toast({ title: "Could not save quotation", variant: "destructive" });
      return null;
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "Could not create quotation.",
        variant: "destructive",
      });
      return null;
    }
  };
  // which IC fields must be numeric (used by setIC)
  const IC_NUMERIC_KEYS = new Set<keyof InternalCostingPayload>([
    "exShowroomOemTp",
    "handlingCost",
    "exchangeBuybackSubsidy",
    "dealerSchemeContribution",
    "fabricationCost",
    "marketingCost",
    "addersSubtotal",

    "dealerMargin",
    "insuranceCommission",
    "financeCommission",
    "oemSchemeSupport",
    "earlyBirdSchemeSupport",
    "targetAchievementDiscount",
    "rtoEarnings",
    "quarterlyTargetEarnings",
    "additionalSupportsClaims",
    "earningsSubtotal",

    "baseVehicleCost",
    "totalCostAdders",
    "totalEarningsSupports",
    "netDealerCost",

    "customerQuotedPrice",
    "dealerProfitPerVehicle",
  ]);

  // build a default form for a lead
  const buildDefaultCostingForm = (lead: Lead): InternalCostingPayload => {
    const base = numberOrZero(lead.vehiclePrice);

    // a sensible “quoted price” default (you can change)
    const quoted =
      numberOrZero(lead.downPaymentAmount) +
      numberOrZero(lead.estimatedEMI) * numberOrZero(lead.tenure);

    return {
      leadId: lead._id,

      // Vehicle Information
      model: lead.productTitle || "",
      category: lead.productCategory || "",
      variant: "",
      fuel: "",
      payloadSeating: "",
      exShowroomOemTp: base,

      // A) Adders
      handlingCost: 0,
      exchangeBuybackSubsidy: 0,
      dealerSchemeContribution: 0,
      fabricationCost: 0,
      marketingCost: 0,
      addersSubtotal: 0,

      // B) Earnings
      dealerMargin: 0,
      insuranceCommission: 0,
      financeCommission: 0,
      oemSchemeSupport: 0,
      earlyBirdSchemeSupport: 0,
      targetAchievementDiscount: 0,
      rtoEarnings: 0,
      quarterlyTargetEarnings: 0,
      additionalSupportsClaims: 0,
      earningsSubtotal: 0,

      // C) Summary
      baseVehicleCost: base,
      totalCostAdders: 0,
      totalEarningsSupports: 0,
      netDealerCost: base,

      // Profit
      customerQuotedPrice: quoted,
      dealerProfitPerVehicle: quoted - base,

      // misc
      preparedBy: "",
      remarks: "",
    };
  };

  // recalc derived fields when any input changes
  const setIC = (k: keyof InternalCostingPayload, v: string | number) => {
    setIcForm((prev) => {
      if (!prev) return prev;

      const x: InternalCostingPayload = { ...prev };

      const toNum = (val: any) => numberOrZero(val);
      const setVal = (key: keyof InternalCostingPayload, value: any) => {
        (x as any)[key] = IC_NUMERIC_KEYS.has(key) ? toNum(value) : value;
      };

      setVal(k, v);

      // derive subtotals
      const addersSubtotal =
        toNum(x.handlingCost) +
        toNum(x.exchangeBuybackSubsidy) +
        toNum(x.dealerSchemeContribution) +
        toNum(x.fabricationCost) +
        toNum(x.marketingCost);

      const earningsSubtotal =
        toNum(x.dealerMargin) +
        toNum(x.insuranceCommission) +
        toNum(x.financeCommission) +
        toNum(x.oemSchemeSupport) +
        toNum(x.earlyBirdSchemeSupport) +
        toNum(x.targetAchievementDiscount) +
        toNum(x.rtoEarnings) +
        toNum(x.quarterlyTargetEarnings) +
        toNum(x.additionalSupportsClaims);

      x.addersSubtotal = addersSubtotal;
      x.earningsSubtotal = earningsSubtotal;

      x.baseVehicleCost = toNum(x.exShowroomOemTp);
      x.totalCostAdders = addersSubtotal;
      x.totalEarningsSupports = earningsSubtotal;
      x.netDealerCost = x.baseVehicleCost + addersSubtotal - earningsSubtotal;

      x.dealerProfitPerVehicle =
        toNum(x.customerQuotedPrice) - toNum(x.netDealerCost);

      return x;
    });
  };

  const ensureHtml2Pdf = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const w = window as any;
      if (w.html2pdf) return resolve(w.html2pdf);
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.onload = () => resolve((window as any).html2pdf);
      s.onerror = () => reject(new Error("Failed to load html2pdf"));
      document.body.appendChild(s);
    });

  const printCosting = () => {
    if (!icPrintRef.current) return;
    const w = window.open("", "", "height=800,width=1200");
    if (!w) return;
    w.document.write(
      `<html><head><title>Internal Costing</title></head><body>${icPrintRef.current.innerHTML}</body></html>`
    );
    w.document.close();
    w.print();
    w.close();
  };

  const downloadCostingPDF = async () => {
    if (!icPrintRef.current) return;
    const html2pdf = await ensureHtml2Pdf();
    const fname = `InternalCosting_${
      icLead?.productTitle || "Vehicle"
    }_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, "_");
    await html2pdf()
      .from(icPrintRef.current)
      .set({
        filename: fname,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "pt", format: "a4" },
      })
      .save();
  };
  // open dialog, load existing (if any) else default
  const openCosting = async (lead: Lead) => {
    setIcLead(lead);
    setIcOpen(true);
    setIcMode("form");
    setIcSaving(false);

    try {
      const res = await getInternalCostingByLeadId(lead._id); // returns { success, data }
      const doc = res?.data;
      if (doc && doc._id) {
        setIcId(doc._id);
        // make sure numbers are numbers
        setIcForm({
          ...buildDefaultCostingForm(lead),
          ...doc,
        });
      } else {
        setIcId(null);
        setIcForm(buildDefaultCostingForm(lead));
      }
    } catch (e: any) {
      toast({
        title: "Couldn’t load Internal Costing",
        description: e?.message || "Opening a blank form instead.",
      });
      setIcId(null);
      setIcForm(buildDefaultCostingForm(lead));
    }
  };

  // create new
  const handleCreateInternalCosting = async () => {
    if (!icForm) return;
    setIcSaving(true);
    try {
      const res = await createInternalCosting(icForm);
      const created = res?.data;
      if (created?._id) setIcId(created._id);
      toast({
        title: "Internal Costing created",
        description: created?._id ? `#${created._id}` : "Saved.",
      });
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "Unable to save costing.",
        variant: "destructive",
      });
    } finally {
      setIcSaving(false);
    }
  };

  // update existing
  const handleUpdateInternalCosting = async () => {
    if (!icId || !icForm) {
      toast({ title: "Nothing to update", description: "Create first." });
      return;
    }
    setIcSaving(true);
    try {
      const res = await updateInternalCosting(icId, icForm);
      toast({
        title: "Internal Costing updated",
        description: "Saved changes.",
      });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Unable to update costing.",
        variant: "destructive",
      });
    } finally {
      setIcSaving(false);
    }
  };

  // toggle to preview
  const goIcPreview = () => {
    if (icForm) setIcMode("preview");
  };

  // print
  const printInternalCosting = () => {
    if (!icPrintRef.current) return;
    const w = window.open("", "", "height=800,width=1200");
    if (!w) return;
    w.document.write(`
    <html>
      <head>
        <title>Internal Costing</title>
        <style>
          html,body{background:#fff;color:#111;font-family:Arial,sans-serif;margin:0;padding:20px}
          table{width:100%;border-collapse:collapse;margin:10px 0}
          th,td{border:1px solid #000;padding:8px;text-align:left;color:#111}
          th{background:#f0f0f0;font-weight:bold}
          .header{text-align:center;margin-bottom:20px}
        </style>
      </head>
      <body>${icPrintRef.current.innerHTML}</body>
    </html>
  `);
    w.document.close();
    w.print();
    w.close();
  };

  // download as PDF (uses same html2pdf loader you already have)
  const downloadInternalCostingPDF = async () => {
    if (!icPrintRef.current) return;
    try {
      const html2pdf = await ensureHtml2Pdf();
      const fname = `Internal_Costing_${
        icForm?.model || icLead?.productTitle || "Vehicle"
      }_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, "_");

      await html2pdf()
        .from(icPrintRef.current)
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

  // update existing

  // toggle to preview

  const handleUpdateCosting = async () => {
    if (!icId || !icForm) return;
    setIcSaving(true);
    try {
      await updateInternalCosting(icId, icForm);
      toast({ title: "Internal costing updated" });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "—",
        variant: "destructive",
      });
    } finally {
      setIcSaving(false);
    }
  };

  const emailQuotation = async () => {
    if (!qLead || !qForm) return;

    // use saved email, no alerts
    const to = (qLead.userEmail || "").trim();
    if (!to) {
      toast({
        title: "Missing email",
        description: "No email found for this lead.",
        variant: "destructive",
      });
      return;
    }

    const id = await ensureSavedQuotation();
    if (!id) return;

    try {
      const r = await sendQoutationEmail(id, to);
      toast({ title: "Email sent", description: r?.message || "Delivered." });
    } catch (e: any) {
      toast({
        title: "Email failed",
        description: e?.message || "Unable to send.",
        variant: "destructive",
      });
    }
  };

  const smsQuotation = async (via: "sms" | "whatsapp" = "sms") => {
    if (!qLead || !qForm) return;

    // prefer form contact, fallback to lead phone; strip spaces
    const to = (qForm.contactNumber || qLead.userPhone || "").replace(
      /\s+/g,
      ""
    );
    if (!to) {
      toast({
        title: "Missing phone",
        description: "No phone number found for this lead.",
        variant: "destructive",
      });
      return;
    }

    const id = await ensureSavedQuotation();
    if (!id) return;

    try {
      const r = await sendQoutationSMS(id, to, via);
      toast({
        title: via === "whatsapp" ? "WhatsApp sent" : "SMS sent",
        description: r?.message || "Delivered.",
      });
    } catch (e: any) {
      toast({
        title: "Message failed",
        description: e?.message || "Unable to send.",
        variant: "destructive",
      });
    }
  };

  // Utils
  const formatINR = (n?: number | string) => {
    const num = typeof n === "string" ? Number(n) : n;
    if (!Number.isFinite(num as number)) return "0";
    return (num as number).toLocaleString("en-IN");
  };

  useEffect(() => {
    if (assignOpen) {
      loadDseOptions();
    }
  }, [assignOpen]);

  type DseUser = { _id: string; name: string; email: string };

  const [dseOptions, setDseOptions] = useState<DseUser[]>([]);
  const [dseLoading, setDseLoading] = useState(false);

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
      status: (x?.status ?? "C0") as Lead["status"],
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

  const [qId, setQId] = useState<string | null>(null); // backend quotation _id
  const [qSaving, setQSaving] = useState(false);
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
      case "C0":
        return "bg-slate-500/20 text-slate-700 border-slate-600/20";
      case "C1":
        return "bg-blue-500/20 text-blue-700 border-blue-600/20";
      case "C2":
        return "bg-amber-500/20 text-amber-700 border-amber-600/20";
      case "C3":
        return "bg-green-500/20 text-green-700 border-green-600/20";
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

  const buildCreateQoutePayload = (): CreateQoutePayload | null => {
    if (!qLead || !qForm) return null;

    const num = (v: any) => numberOrZero(v);

    const payload: CreateQoutePayload = {
      leadId: qLead._id,

      // customer
      customerName: qForm.customerName,
      contactNumber: qForm.contactNumber,
      address: qForm.address || "",
      gstNo: qForm.gstNo || "",
      panNo: qForm.panNo || "",
      salesExecutive: qForm.salesExecutive || "",

      // vehicle
      model: qForm.model,
      variant: qForm.variant || "",
      color: qForm.color || "",

      // pricing
      exShowroomPrice: num(qForm.exShowroomPrice),
      rtoTax: num(qForm.rtoTax),
      insurance: num(qForm.insurance),
      accessories: num(qForm.accessories),
      extendedWarranty: num(qForm.extendedWarranty),
      totalOnRoadPrice: num(qForm.totalOnRoadPrice),

      // discounts
      consumerOffer: num(qForm.consumerOffer),
      exchangeBonus: num(qForm.exchangeBonus),
      corporateDiscount: num(qForm.corporateDiscount),
      additionalDiscount: num(qForm.additionalDiscount),
      totalDiscount: num(qForm.totalDiscount),

      // final
      netSellingPrice: num(qForm.netSellingPrice),

      // finance
      loanAmount: num(qForm.loanAmount),
      downPayment: num(qForm.downPayment),
      processingFee: num(qForm.processingFee),
      rateOfInterest: num(qForm.rateOfInterest),
      tenure: num(qForm.tenure),
      emi: num(qForm.emi),

      // misc
      deliveryPeriod: qForm.deliveryPeriod || "",
      validityPeriod: qForm.validityPeriod || "",
      remarks: qForm.remarks || "",
    };

    // simple validation
    if (!payload.customerName || !payload.contactNumber || !payload.model) {
      toast({
        title: "Missing required fields",
        description: "Customer Name, Contact Number & Model are mandatory.",
        variant: "destructive",
      });
      return null;
    }

    return payload;
  };

  const loadDseOptions = async () => {
    setDseLoading(true);
    try {
      const res = await getAssignedtoDSE();
      const arr = Array.isArray(res?.data) ? res.data : [];
      setDseOptions(
        arr.map((u) => ({ _id: u._id, name: u.name, email: u.email }))
      );
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to load DSE list.",
        variant: "destructive",
      });
    } finally {
      setDseLoading(false);
    }
  };
  // Assign actions
  const openAssign = (lead: Lead) => {
    setAssignFor(lead);
    setAssignee("");
    setAssignOpen(true);
    loadDseOptions();
  };
  const handleCreateQoute = async () => {
    const payload = buildCreateQoutePayload();
    if (!payload) return;

    setQSaving(true);
    try {
      const res = await createQoute(payload);
      const created = res?.data;
      if (created?._id) setQId(created._id);

      // (optional) reflect status on the lead card
      if (qLead?._id) {
        setLeads((prev) =>
          prev.map((l) => (l._id === qLead._id ? { ...l, status: "C1" } : l))
        );
      }

      toast({
        title: "Quotation created",
        description: `Quotation ${created?._id ? `` : ""} saved.`,
      });
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "Could not create quotation.",
        variant: "destructive",
      });
    } finally {
      setQSaving(false);
    }
  };

  const handleUpdateQoutation = async () => {
    if (!qId) {
      toast({
        title: "No quotation to update",
        description: "Please create the quotation first.",
      });
      return;
    }
    const payload = buildCreateQoutePayload();
    if (!payload) return;

    setQSaving(true);
    try {
      const res = await updateQoutation(qId, payload);
      const updated = res?.data;

      toast({
        title: "Quotation updated",
        description: `Quotation has been updated.`,
      });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Could not update quotation.",
        variant: "destructive",
      });
    } finally {
      setQSaving(false);
    }
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
      const res = await assignLead(assignFor._id, assignee);
      const updated = res?.data; // ← updated Lead from server

      setLeads((prev) =>
        prev.map((l) =>
          l._id === assignFor._id
            ? {
                ...l,
                assignedTo: updated?.assignedTo ?? l.assignedTo,
                status: updated?.status ?? l.status, // server bumps to C1
              }
            : l
        )
      );

      toast({
        title: "Assigned",
        description: `Lead assigned to ${updated?.assignedTo || "DSE"}.`,
      });
      setAssignOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to assign" });
    } finally {
      setAssigning(false);
    }
  };

  const quotationToForm = (q: any): QuotationForm => ({
    customerName: q.customerName || "",
    contactNumber: q.contactNumber || "",
    address: q.address || "",
    gstNo: q.gstNo || "",
    panNo: q.panNo || "",
    model: q.model || "",
    variant: q.variant || "",
    color: q.color || "",
    exShowroomPrice: String(q.exShowroomPrice ?? 0),
    rtoTax: String(q.rtoTax ?? 0),
    insurance: String(q.insurance ?? 0),
    accessories: String(q.accessories ?? 0),
    extendedWarranty: String(q.extendedWarranty ?? 0),
    totalOnRoadPrice: String(q.totalOnRoadPrice ?? 0),
    consumerOffer: String(q.consumerOffer ?? 0),
    exchangeBonus: String(q.exchangeBonus ?? 0),
    corporateDiscount: String(q.corporateDiscount ?? 0),
    additionalDiscount: String(q.additionalDiscount ?? 0),
    totalDiscount: String(q.totalDiscount ?? 0),
    netSellingPrice: String(q.netSellingPrice ?? 0),
    loanAmount: String(q.loanAmount ?? 0),
    downPayment: String(q.downPayment ?? 0),
    processingFee: String(q.processingFee ?? 0),
    rateOfInterest: String(q.rateOfInterest ?? 0),
    tenure: String(q.tenure ?? 0),
    emi: String(q.emi ?? 0),
    deliveryPeriod: q.deliveryPeriod || "",
    validityPeriod: q.validityPeriod || "",
    salesExecutive: q.salesExecutive || "",
    remarks: q.remarks || "",
  });

  /* ---------- Quotation Functions ---------- */
  const openQuotation = async (lead: Lead) => {
    setQLead(lead);
    setQOpen(true);
    setQMode("form");
    setQSaving(false);

    // If it's a fresh lead (not yet quotation), build a blank/default form
    const buildDefaultForm = () => {
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
      return form;
    };

    // If the lead already has a quotation, fetch & prefill for UPDATE
    if (lead.status === "C1") {
      try {
        const res = await getQoutationByLeadId(lead._id);
        const q = res?.data;
        if (q && q._id) {
          setQId(q._id); // <-- keep the SAME quotation id
          setQForm(quotationToForm(q)); // <-- prefill the form
          return;
        }
      } catch (e: any) {
        toast({
          title: "Couldn’t load quotation",
          description: e?.message || "Opening a blank form instead.",
        });
        // fall through to default form
      }
    }

    // Default (create-new) form & clear quotation id
    setQId(null);
    setQForm(buildDefaultForm());
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
            <option value="C0">C0</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
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
                      <DropdownMenuContent align="end" className="w-56">
                        {lead.status === "C2" || lead.status === "C3" ? (
                          <DropdownMenuItem onClick={() => openCosting(lead)}>
                            <Calculator className="mr-2 h-4 w-4" />
                            {/** if you want to say Update when it already exists: */}
                            {/** (!!icId known only inside the dialog; keep it generic here) */}
                            Add Internal Costing
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => openQuotation(lead)}>
                            {lead.status === "C1" ? (
                              <>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Update Quotation
                              </>
                            ) : (
                              <>
                                <Calculator className="mr-2 h-4 w-4" />
                                Create Quotation
                              </>
                            )}
                          </DropdownMenuItem>
                        )}

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
                disabled={dseLoading}
              >
                <option value="">
                  {dseLoading ? "Loading DSE…" : "Select DSE…"}
                </option>
                {!dseLoading && dseOptions.length === 0 && (
                  <option value="" disabled>
                    No DSE found
                  </option>
                )}
                {dseOptions.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name} ({opt.email})
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
                <Button
                  size="sm"
                  onClick={qId ? handleUpdateQoutation : handleCreateQoute}
                  disabled={qSaving}
                  className={
                    qId
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                >
                  {qSaving ? (
                    <>
                      <Clock className="h-4 w-4 mr-1" /> Saving…
                    </>
                  ) : qId ? (
                    <>
                      <PencilLine className="h-4 w-4 mr-1" /> Update Quotation
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" /> Create & Save
                    </>
                  )}
                </Button>

                <Button size="sm" variant="outline" onClick={emailQuotation}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>

                {/* SMS – no prompts */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => smsQuotation("sms")}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  SMS
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => smsQuotation("whatsapp")}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>

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

      {/* ---------- Internal Costing Dialog ---------- */}
      <Dialog open={icOpen} onOpenChange={setIcOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Internal Costing
            </DialogTitle>
            <DialogDescription>
              Create internal costing for {icLead?.productTitle} (visible only
              to staff)
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={icMode === "form" ? "default" : "outline"}
                onClick={() => setIcMode("form")}
              >
                <PencilLine className="h-4 w-4 mr-1" />
                Edit Form
              </Button>
              <Button
                size="sm"
                variant={icMode === "preview" ? "default" : "outline"}
                onClick={() => setIcMode("preview")}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>

            {icMode === "preview" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={
                    icId
                      ? handleUpdateInternalCosting
                      : handleCreateInternalCosting
                  }
                  disabled={icSaving}
                  className={
                    icId
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                >
                  {icSaving ? (
                    <>
                      <Clock className="h-4 w-4 mr-1" /> Saving…
                    </>
                  ) : icId ? (
                    <>
                      <PencilLine className="h-4 w-4 mr-1" /> Update Costing
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" /> Create & Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadInternalCostingPDF}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" onClick={printInternalCosting}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            )}
          </div>

          {/* FORM */}
          {icMode === "form" && icForm && (
            <div className="overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
                {/* Vehicle Info */}
                <div className="md:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-blue-600">
                    Vehicle Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <Label>Model</Label>
                      <Input
                        value={icForm.model}
                        onChange={(e) => setIC("model", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={icForm.category || ""}
                        onChange={(e) => setIC("category", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Variant</Label>
                      <Input
                        value={icForm.variant || ""}
                        onChange={(e) => setIC("variant", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Fuel</Label>
                      <Input
                        value={icForm.fuel || ""}
                        onChange={(e) => setIC("fuel", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Payload/Seating</Label>
                      <Input
                        value={icForm.payloadSeating || ""}
                        onChange={(e) =>
                          setIC("payloadSeating", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Ex-Showroom (OEM TP)</Label>
                      <Input
                        type="number"
                        value={icForm.exShowroomOemTp}
                        onChange={(e) =>
                          setIC("exShowroomOemTp", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* A) Cost Adders */}
                <div className="md:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-purple-600">
                    A) Cost Adders (Dealer Expenses)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      [
                        "handlingCost",
                        "Dealer Handling Cost (Logistics, PDI, Admin)",
                      ],
                      [
                        "exchangeBuybackSubsidy",
                        "Exchange/Buyback Subsidy (Dealer Share)",
                      ],
                      [
                        "dealerSchemeContribution",
                        "Scheme / Discount Contribution by Dealer",
                      ],
                      ["fabricationCost", "Fabrication Cost (Dealer Share)"],
                      [
                        "marketingCost",
                        "Marketing Cost (Per Vehicle Allocation)",
                      ],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <Label>{label}</Label>
                        <Input
                          type="number"
                          value={(icForm as any)[key] ?? 0}
                          onChange={(e) => setIC(key as any, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                    <div>
                      <Label>Subtotal: Cost Adders (₹)</Label>
                      <Input
                        type="number"
                        value={icForm.addersSubtotal}
                        readOnly
                        className="mt-1 bg-muted/40"
                      />
                    </div>
                  </div>
                </div>

                {/* B) Earnings & Supports */}
                <div className="md:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-green-600">
                    B) Earnings & Supports (Reduce Net Cost)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      ["dealerMargin", "Dealer Margin (₹)"],
                      ["insuranceCommission", "Insurance Commission"],
                      ["financeCommission", "Finance Commission"],
                      [
                        "oemSchemeSupport",
                        "Scheme / Discount Support from OEM",
                      ],
                      ["earlyBirdSchemeSupport", "Early Bird Scheme Support"],
                      [
                        "targetAchievementDiscount",
                        "Target Achievement Discount (Monthly/Monthly Slab)",
                      ],
                      ["rtoEarnings", "RTO Earnings"],
                      ["quarterlyTargetEarnings", "Quarterly Target Earnings"],
                      [
                        "additionalSupportsClaims",
                        "Additional Supports / Claims",
                      ],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <Label>{label}</Label>
                        <Input
                          type="number"
                          value={(icForm as any)[key] ?? 0}
                          onChange={(e) => setIC(key as any, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                    <div>
                      <Label>Subtotal: Earnings & Supports (₹)</Label>
                      <Input
                        type="number"
                        value={icForm.earningsSubtotal}
                        readOnly
                        className="mt-1 bg-muted/40"
                      />
                    </div>
                  </div>
                </div>

                {/* C) Net Dealer Cost & Profitability */}
                <div className="md:col-span-3">
                  <h4 className="text-base font-semibold mb-3 text-red-600">
                    C) Net Dealer Cost & Profitability
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Base Vehicle Cost (Ex-Showroom OEM TP)</Label>
                      <Input
                        type="number"
                        value={icForm.baseVehicleCost}
                        readOnly
                        className="mt-1 bg-muted/40"
                      />
                    </div>
                    <div>
                      <Label>Total Cost Adders</Label>
                      <Input
                        type="number"
                        value={icForm.totalCostAdders}
                        readOnly
                        className="mt-1 bg-muted/40"
                      />
                    </div>
                    <div>
                      <Label>Total Earnings & Supports</Label>
                      <Input
                        type="number"
                        value={icForm.totalEarningsSupports}
                        readOnly
                        className="mt-1 bg-muted/40"
                      />
                    </div>
                    <div>
                      <Label>
                        Net Dealer Cost (₹) = Base + Adders – Earnings
                      </Label>
                      <Input
                        type="number"
                        value={icForm.netDealerCost}
                        readOnly
                        className="mt-1 bg-muted/40 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Quoted & Profit */}
                <div className="md:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Customer Quoted Price (₹)</Label>
                      <Input
                        type="number"
                        value={icForm.customerQuotedPrice}
                        onChange={(e) =>
                          setIC("customerQuotedPrice", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>
                        Dealer Profit per Vehicle (₹) = Quoted – Net Dealer Cost
                      </Label>
                      <Input
                        type="number"
                        value={icForm.dealerProfitPerVehicle}
                        readOnly
                        className="mt-1 bg-muted/40 font-semibold"
                      />
                    </div>
                    <div>
                      <Label>Prepared By</Label>
                      <Input
                        value={icForm.preparedBy || ""}
                        onChange={(e) => setIC("preparedBy", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Remarks</Label>
                      <Input
                        value={icForm.remarks || ""}
                        onChange={(e) => setIC("remarks", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setIcOpen(false)}>
                  Close
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIcMode("preview")}
                >
                  <Eye className="h-4 w-4 mr-1" /> Generate Preview
                </Button>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {icMode === "preview" && icForm && (
            <div className="overflow-y-auto max-h-[70vh]">
              <div
                ref={icPrintRef}
                className="bg-white text-black p-8 border rounded-md"
              >
                <div
                  className="text-center pb-3 mb-4"
                  style={{ borderBottom: "2px solid #111" }}
                >
                  <div className="text-2xl font-bold">
                    Vikramshila Automobiles Pvt Ltd. - INTERNAL COSTING SHEET
                  </div>
                  <div className="text-sm" style={{ color: "#b91c1c" }}>
                    For Dealer Management Use Only
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">Vehicle Information</div>
                  <table
                    className="w-full"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Model",
                          "Category",
                          "Variant",
                          "Fuel",
                          "Payload/Seating",
                          "Ex-Showroom (OEM TP)",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              border: "1px solid #000",
                              padding: 6,
                              textAlign: "left",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {icForm.model || "—"}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {icForm.category || "—"}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {icForm.variant || "—"}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {icForm.fuel || "—"}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {icForm.payloadSeating || "—"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: 6,
                            textAlign: "right",
                          }}
                        >
                          ₹ {formatINR(icForm.exShowroomOemTp)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* A) Cost Adders */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">
                    A) Cost Adders (Dealer Expenses)
                  </div>
                  <table
                    className="w-full"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      {[
                        [
                          "Dealer Handling Cost (Logistics, PDI, Admin)",
                          icForm.handlingCost,
                        ],
                        [
                          "Exchange/Buyback Subsidy (Dealer Share)",
                          icForm.exchangeBuybackSubsidy,
                        ],
                        [
                          "Scheme / Discount Contribution by Dealer",
                          icForm.dealerSchemeContribution,
                        ],
                        [
                          "Fabrication Cost (Dealer Share)",
                          icForm.fabricationCost,
                        ],
                        [
                          "Marketing Cost (Per Vehicle Allocation)",
                          icForm.marketingCost,
                        ],
                        ["Subtotal: Cost Adders (₹)", icForm.addersSubtotal],
                      ].map(([k, v], i) => (
                        <tr key={i}>
                          <td style={{ border: "1px solid #000", padding: 6 }}>
                            {k as string}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: 6,
                              textAlign: "right",
                            }}
                          >
                            ₹ {formatINR(v as number)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* B) Earnings & Supports */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">
                    B) Earnings & Supports (Reduce Net Cost)
                  </div>
                  <table
                    className="w-full"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      {[
                        ["Dealer Margin (₹)", icForm.dealerMargin],
                        ["Insurance Commission", icForm.insuranceCommission],
                        ["Finance Commission", icForm.financeCommission],
                        [
                          "Scheme / Discount Support from OEM",
                          icForm.oemSchemeSupport,
                        ],
                        [
                          "Early Bird Scheme Support",
                          icForm.earlyBirdSchemeSupport,
                        ],
                        [
                          "Target Achievement Discount (Monthly/Monthly Slab)",
                          icForm.targetAchievementDiscount,
                        ],
                        ["RTO Earnings", icForm.rtoEarnings],
                        [
                          "Quarterly Target Earnings",
                          icForm.quarterlyTargetEarnings,
                        ],
                        [
                          "Additional Supports / Claims",
                          icForm.additionalSupportsClaims,
                        ],
                        [
                          "Subtotal: Earnings & Supports (₹)",
                          icForm.earningsSubtotal,
                        ],
                      ].map(([k, v], i) => (
                        <tr key={i}>
                          <td style={{ border: "1px solid #000", padding: 6 }}>
                            {k as string}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: 6,
                              textAlign: "right",
                            }}
                          >
                            ₹ {formatINR(v as number)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* C) Summary */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">
                    C) Net Dealer Cost & Profitability
                  </div>
                  <table
                    className="w-full"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      {[
                        [
                          "Base Vehicle Cost (Ex-Showroom OEM TP)",
                          icForm.baseVehicleCost,
                        ],
                        ["Total Cost Adders", icForm.totalCostAdders],
                        [
                          "Total Earnings & Supports",
                          icForm.totalEarningsSupports,
                        ],
                        [
                          "Net Dealer Cost (₹) = Base + Adders – Earnings",
                          icForm.netDealerCost,
                        ],
                        [
                          "Customer Quoted Price (₹)",
                          icForm.customerQuotedPrice,
                        ],
                        [
                          "Dealer Profit per Vehicle (₹) = Quoted – Net Dealer Cost",
                          icForm.dealerProfitPerVehicle,
                        ],
                      ].map(([k, v], i) => (
                        <tr key={i}>
                          <td style={{ border: "1px solid #000", padding: 6 }}>
                            {k as string}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000",
                              padding: 6,
                              textAlign: "right",
                              fontWeight: i >= 3 ? 700 : 400,
                            }}
                          >
                            ₹ {formatINR(v as number)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(icForm.preparedBy || icForm.remarks) && (
                  <div className="text-sm">
                    {icForm.preparedBy && (
                      <div>
                        <b>Prepared By:</b> {icForm.preparedBy}
                      </div>
                    )}
                    {icForm.remarks && (
                      <div>
                        <b>Remarks:</b> {icForm.remarks}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
