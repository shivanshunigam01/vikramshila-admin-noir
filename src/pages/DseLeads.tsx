// src/pages/DSELeads.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Car,
  Clock,
  PencilLine,
  IndianRupee,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { getMyAssignedLeads, submitDseUpdate } from "@/services/leadsService";
import { cn } from "@/lib/utils";

/* ---------- Types (shape matches your API) ---------- */
type KycFile = {
  originalName?: string;
  path?: string;
  size?: number;
  mimetype?: string;
};

type DseUpdate = {
  byName?: string;
  message?: string;
  statusFrom?: string;
  statusTo?: string;
  createdAt?: string;
};

type Lead = {
  _id: string;
  productId?: string;
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

  // customer
  customerName?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  phone?: string;

  // KYC
  aadharFile?: KycFile | null;
  panCardFile?: KycFile | null;
  aadharNumber?: string | number;
  panNumber?: string;

  // assignment
  assignedTo?: string;
  assignedToEmail?: string;
  assignedToId?: string;

  dseUpdates?: DseUpdate[];
};

/* ---------- Utils ---------- */
const numberOrZero = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (n?: number | string) => {
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num as number)) return "0";
  return (num as number).toLocaleString("en-IN");
};

/* Normalize each lead so UI is safe */
const normalizeLead = (x: any): Lead => ({
  _id: String(x?._id),
  productId: x?.productId,
  productTitle: x?.productTitle || "",
  productCategory: x?.productCategory || "",
  vehiclePrice: numberOrZero(x?.vehiclePrice),
  downPaymentAmount: numberOrZero(x?.downPaymentAmount),
  downPaymentPercentage: numberOrZero(x?.downPaymentPercentage),
  loanAmount: numberOrZero(x?.loanAmount),
  interestRate: numberOrZero(x?.interestRate),
  tenure: numberOrZero(x?.tenure),
  estimatedEMI: numberOrZero(x?.estimatedEMI),
  status: (x?.status || "C1") as Lead["status"],
  createdAt: x?.createdAt || new Date().toISOString(),
  updatedAt: x?.updatedAt,

  customerName: x?.customerName || x?.userName || "",
  userName: x?.userName,
  userPhone: x?.userPhone || x?.phone || "",
  userEmail: x?.userEmail || "",
  phone: x?.phone || "",

  aadharFile: x?.aadharFile || null,
  panCardFile: x?.panCardFile || null,
  aadharNumber:
    x?.aadharNumber === 0 ? "" : x?.aadharNumber?.toString?.() || "",
  panNumber: x?.panNumber || "",

  assignedTo: x?.assignedTo || "",
  assignedToEmail: x?.assignedToEmail || "",
  assignedToId: x?.assignedToId || "",

  dseUpdates: Array.isArray(x?.dseUpdates) ? x.dseUpdates : [],
});

export default function DSELeads() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<"C0" | "C1" | "C2" | "C3" | "">(
    ""
  );
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await getMyAssignedLeads();

      // accept: [] | {data: []} | {data: {data: []}}
      const arr = Array.isArray(r)
        ? r
        : Array.isArray(r?.data)
        ? r.data
        : Array.isArray(r?.data?.data)
        ? r.data.data
        : [];

      setItems(arr.map(normalizeLead));
    } catch (e: any) {
      toast({
        title: "Failed to load",
        description: e?.message || "—",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusColor = (s: string) => {
    switch (s) {
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const strIn = (t?: string) => (t || "").toLowerCase().includes(s);
      return (
        strIn(x.productTitle) ||
        strIn(x.productCategory) ||
        strIn(x.customerName || x.userName) ||
        strIn(x.userEmail) ||
        (x.userPhone || x.phone || "").includes(q) ||
        strIn(x.panNumber)
      );
    });
  }, [q, items]);

  const openUpdate = (lead: Lead) => {
    setActive(lead);
    setNewStatus("" as any);
    setMessage("");
    setOpen(true);
  };

  const submit = async () => {
    if (!active) return;
    try {
      await submitDseUpdate(active._id, {
        status: newStatus || undefined,
        message: message || undefined,
      });
      toast({ title: "Updated", description: "Lead updated successfully." });
      setOpen(false);
      await load();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "—",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Car className="h-8 w-8 text-primary" />
          My Leads
        </h1>
        <p className="text-muted-foreground">Leads assigned to you</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by model, name, phone, email, PAN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading…</p>
        ) : filtered.length ? (
          filtered.map((lead) => (
            <Card
              key={lead._id}
              className="border-muted-foreground/10 hover:shadow-md"
            >
              <CardContent className="p-4 space-y-3">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {lead.productTitle || "N/A"}
                      </h3>
                      {lead.productCategory && (
                        <Badge variant="outline" className="text-xs">
                          {lead.productCategory}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        {lead.updatedAt
                          ? ` • upd ${new Date(
                              lead.updatedAt
                            ).toLocaleDateString("en-IN")}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <Badge className={cn("border", getStatusColor(lead.status))}>
                    {lead.status}
                  </Badge>
                </div>

                {/* Customer */}
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-sm font-medium">
                    {lead.customerName || lead.userName || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lead.userPhone || lead.phone || "—"} ·{" "}
                    {lead.userEmail || "—"}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {lead.userPhone && (
                      <a href={`tel:${lead.userPhone}`}>
                        <Button size="sm" variant="outline">
                          <Phone className="h-3.5 w-3.5 mr-1" /> Call
                        </Button>
                      </a>
                    )}
                    {lead.userEmail && (
                      <a href={`mailto:${lead.userEmail}`}>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3.5 w-3.5 mr-1" /> Email
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Finance */}
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground mb-2 tracking-wider">
                    Finance Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{formatINR(lead.vehiclePrice)}</span>
                    </div>
                    <div>
                      DP: ₹{formatINR(lead.downPaymentAmount)}
                      {lead.downPaymentPercentage
                        ? ` (${lead.downPaymentPercentage}%)`
                        : ""}
                    </div>
                    <div>Loan: ₹{formatINR(lead.loanAmount)}</div>
                    <div>EMI: ₹{formatINR(lead.estimatedEMI)}</div>
                    <div>ROI: {lead.interestRate}%</div>
                    <div>Tenure: {lead.tenure} months</div>
                  </div>
                </div>

                {/* KYC */}
                {(lead.aadharFile?.path ||
                  lead.panCardFile?.path ||
                  lead.aadharNumber ||
                  lead.panNumber) && (
                  <div className="rounded-md border p-3">
                    <div className="text-xs uppercase text-muted-foreground mb-2 tracking-wider">
                      KYC
                    </div>
                    <div className="space-y-1 text-sm">
                      {lead.aadharNumber ? (
                        <div>Aadhaar No: {lead.aadharNumber}</div>
                      ) : null}
                      {lead.panNumber ? (
                        <div>PAN No: {lead.panNumber}</div>
                      ) : null}
                      <div className="flex flex-col gap-1">
                        {lead.aadharFile?.path && (
                          <a
                            href={lead.aadharFile.path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs underline"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Aadhaar: {lead.aadharFile.originalName || "file"}
                          </a>
                        )}
                        {lead.panCardFile?.path && (
                          <a
                            href={lead.panCardFile.path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs underline"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            PAN: {lead.panCardFile.originalName || "file"}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment */}
                {(lead.assignedTo || lead.assignedToEmail) && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Assigned: </span>
                    <span className="font-medium">
                      {lead.assignedTo || "-"}
                    </span>
                    {lead.assignedToEmail ? ` · ${lead.assignedToEmail}` : ""}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2">
                  <Button size="sm" onClick={() => openUpdate(lead)}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    Update status / add note
                  </Button>
                </div>

                {/* Recent activity */}
                {(lead.dseUpdates?.length ?? 0) > 0 && (
                  <div className="rounded-md border p-2 bg-muted/40">
                    <div className="text-xs font-semibold mb-1">
                      Recent activity
                    </div>
                    <ul className="text-xs space-y-1 max-h-28 overflow-auto pr-1">
                      {lead
                        .dseUpdates!.slice(-3)
                        .reverse()
                        .map((u, i) => (
                          <li key={i}>
                            {u.byName || "DSE"}:{" "}
                            {u.message || "(status change)"} — {u.statusFrom} →{" "}
                            {u.statusTo} on{" "}
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleString("en-IN")
                              : ""}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No leads found.</p>
        )}
      </div>

      {/* Update dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Status</Label>
              <select
                className="mt-1 w-full border rounded-md p-2 bg-input"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
              >
                <option value="">(no change)</option>
                <option value="C0">C0</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="C3">C3</option>
              </select>
            </div>
            <div>
              <Label>Comment / Note</Label>
              <Textarea
                rows={4}
                placeholder="e.g., Spoke to customer, requested callback tomorrow 3pm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
