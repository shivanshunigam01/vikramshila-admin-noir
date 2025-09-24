// src/pages/Enquiries.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Icons
import {
  Search,
  Clock,
  MoreHorizontal,
  UserCircle2,
  Eye,
  Mail,
  Phone,
  PencilLine,
  ClipboardList,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Services (you already have these)
import {
  getEnquiries,
  assignEnquiry,
  updateEnquiryByDse,
} from "@/services/enquiriesService";
import { getAssignedtoDSE } from "@/services/leadsService"; // same endpoint you’re using elsewhere

/* ---------- Types ---------- */
type DseUser = { _id: string; name: string; email: string };

type DseUpdate = { message: string; status: string; createdAt: string };

type Enquiry = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  model?: string;
  panNumber?: string;
  aadharNumber?: string;
  status: "C0" | "C1" | "C2" | "C3";
  createdAt?: string;
  assignedTo?: string;
  dseUpdates?: DseUpdate[];
};

const numberOrZero = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (n?: number | string) => {
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num as number)) return "0";
  return (num as number).toLocaleString("en-IN");
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "C0":
      return "bg-slate-500/20 text-white-700 border-slate-600/20";
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

/* ---------- Component ---------- */
export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View sheet
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<Enquiry | null>(null);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Enquiry | null>(null);
  const [assignee, setAssignee] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Update-status dialog
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateFor, setUpdateFor] = useState<Enquiry | null>(null);
  const [newStatus, setNewStatus] = useState<Enquiry["status"]>("C0");
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  // DSE list
  const [dseOptions, setDseOptions] = useState<DseUser[]>([]);
  const [dseLoading, setDseLoading] = useState(false);

  /* ---------- Fetch & Normalize ---------- */
  const normalize = (e: any): Enquiry => ({
    id: e?._id,
    name: e?.fullName ?? e?.customerName ?? e?.userName ?? "-",
    email: e?.email ?? e?.userEmail ?? undefined,
    phone: e?.mobileNumber ?? e?.phone ?? e?.userPhone ?? undefined,
    model: e?.productTitle ?? e?.product ?? "",
    panNumber: e?.panNumber ?? undefined,
    aadharNumber: e?.aadharNumber ?? undefined,
    status: (e?.status ?? "C0") as Enquiry["status"],
    createdAt: e?.createdAt,
    assignedTo:
      e?.assignedToId?.name ??
      e?.assignedTo ??
      e?.assignedToId?._id ??
      undefined,
    dseUpdates: Array.isArray(e?.dseUpdates) ? e.dseUpdates : [],
  });

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res: any = await getEnquiries(); // { success, message, data: [...] }
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setEnquiries(
        (Array.isArray(raw) ? raw : []).filter(Boolean).map(normalize)
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to fetch enquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  /* ---------- Filters ---------- */
  const filteredEnquiries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return enquiries.filter((x) => {
      const matchesSearch =
        (x.name || "").toLowerCase().includes(q) ||
        (x.email || "").toLowerCase().includes(q) ||
        (x.phone || "").includes(searchTerm) ||
        (x.model || "").toLowerCase().includes(q) ||
        (x.assignedTo || "").toLowerCase().includes(q) ||
        (x.status || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || x.status === (statusFilter as any);
      return matchesSearch && matchesStatus;
    });
  }, [enquiries, searchTerm, statusFilter]);

  /* ---------- View Sheet ---------- */
  const handleView = async (enquiry: Enquiry) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      // If you have an enquiry-by-id endpoint, you can refetch; else show cached
      setViewItem(enquiry);
    } finally {
      setViewLoading(false);
    }
  };

  /* ---------- DSE Options ---------- */
  const loadDseOptions = async () => {
    setDseLoading(true);
    try {
      const res = await getAssignedtoDSE();
      const arr = Array.isArray(res?.data) ? res.data : [];
      setDseOptions(
        arr.map((u: any) => ({ _id: u._id, name: u.name, email: u.email }))
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

  /* ---------- Assign ---------- */
  const openAssign = (enquiry: Enquiry) => {
    setAssignFor(enquiry);
    setAssignee("");
    setAssignOpen(true);
    loadDseOptions();
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
      const res = await assignEnquiry(assignFor.id, assignee);
      const updated = res?.data;

      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === assignFor.id
            ? {
                ...e,
                assignedTo:
                  updated?.assignedToId?.name ??
                  updated?.assignedTo ??
                  updated?.assignedToId?._id ??
                  e.assignedTo,
                status: (updated?.status ?? e.status) as Enquiry["status"],
              }
            : e
        )
      );

      toast({
        title: "Assigned",
        description: `Enquiry assigned to ${
          updated?.assignedToId?.name || updated?.assignedTo || "DSE"
        }.`,
      });

      setAssignOpen(false);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to assign",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  /* ---------- Update Status ---------- */
  const openUpdate = (enquiry: Enquiry) => {
    setUpdateFor(enquiry);
    setNewStatus(enquiry.status);
    setMessage("");
    setUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    if (!updateFor) return;
    setUpdating(true);
    try {
      const res = await updateEnquiryByDse(updateFor.id, {
        status: newStatus,
        message,
      });
      const updated = res?.data;

      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === updateFor.id
            ? {
                ...e,
                status: (updated?.status || newStatus) as Enquiry["status"],
                dseUpdates: [
                  ...(e.dseUpdates || []),
                  {
                    message,
                    status: newStatus,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : e
        )
      );

      toast({ title: "Updated", description: "Enquiry status updated." });
      setUpdateOpen(false);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to update enquiry",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Enquiries
          </h1>
          <p className="text-muted-foreground">
            Manage and track all customer enquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-blue-600">
            {enquiries.filter((e) => e.status === "C0").length} C0
          </Badge>
          <Badge variant="secondary" className="text-green-600">
            {enquiries.filter((e) => e.status === "C3").length} C3
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (name, phone, email, product, status, assignee)…"
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
          <p>Loading enquiries…</p>
        ) : filteredEnquiries.length > 0 ? (
          filteredEnquiries.map((enq) => (
            <Card
              key={enq.id}
              className="overflow-hidden border-muted-foreground/10 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base md:text-lg truncate">
                        {enq.name}
                      </h3>
                      {enq.model ? (
                        <Badge variant="outline" className="text-xs">
                          {enq.model}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {enq.createdAt
                          ? new Date(enq.createdAt).toLocaleDateString("en-IN")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`border ${getStatusColor(enq.status)}`}>
                      {enq.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleView(enq)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openUpdate(enq)}>
                          <PencilLine className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAssign(enq)}>
                          <UserCircle2 className="mr-2 h-4 w-4" />
                          Assign to DSE
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Contact */}
                {(enq.email || enq.phone) && (
                  <div className="rounded-md border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{enq.email || "—"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{enq.phone || "-"}</span>
                    </div>
                    {enq.assignedTo && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">
                          Assigned to:
                        </span>{" "}
                        <span className="font-medium">{enq.assignedTo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* DSE updates trail (last 2) */}
                {Array.isArray(enq.dseUpdates) && enq.dseUpdates.length > 0 && (
                  <div className="rounded-md border p-3">
                    <div className="text-xs uppercase text-muted-foreground mb-2 tracking-wider">
                      Recent Updates
                    </div>
                    <ul className="space-y-2 text-xs">
                      {enq.dseUpdates
                        .slice(-2)
                        .reverse()
                        .map((u, idx) => (
                          <li
                            key={idx}
                            className="flex items-start justify-between gap-3"
                          >
                            <span className="font-medium">{u.status}</span>
                            <span className="flex-1 text-muted-foreground">
                              {u.message}
                            </span>
                            <span className="whitespace-nowrap text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString(
                                "en-IN"
                              )}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No enquiries found</p>
        )}
      </div>

      {/* View Enquiry Sheet */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Enquiry Details</SheetTitle>
            <SheetDescription>
              Complete information of this enquiry
            </SheetDescription>
          </SheetHeader>

          {viewLoading ? (
            <p className="mt-4">Loading…</p>
          ) : viewItem ? (
            <div className="mt-4 space-y-5 text-sm">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground text-xs">Customer</div>
                  <div className="font-medium">{viewItem.name}</div>
                  <div className="text-muted-foreground">
                    {viewItem.email || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <Badge className={`mt-1 ${getStatusColor(viewItem.status)}`}>
                    {viewItem.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-2">Contact</h4>
                <p>
                  <b>Phone:</b> {viewItem.phone || "—"}
                </p>
                <p>
                  <b>Email:</b> {viewItem.email || "—"}
                </p>
              </div>

              <Separator />

              {/* Product */}
              <div>
                <h4 className="font-semibold mb-2">Product</h4>
                <p>
                  <b>Model:</b> {viewItem.model || "—"}
                </p>
                <p>
                  <b>PAN:</b> {viewItem.panNumber || "—"}
                </p>
                <p>
                  <b>Aadhaar:</b> {viewItem.aadharNumber || "—"}
                </p>
              </div>

              <Separator />

              {/* Assignment */}
              {viewItem.assignedTo && (
                <div>
                  <h4 className="font-semibold mb-2">Assigned</h4>
                  <p>{viewItem.assignedTo}</p>
                </div>
              )}

              {/* DSE Updates (full) */}
              {Array.isArray(viewItem.dseUpdates) &&
                viewItem.dseUpdates.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">DSE Update History</h4>
                      <div className="rounded-md border divide-y">
                        {viewItem.dseUpdates
                          .slice()
                          .reverse()
                          .map((u, idx) => (
                            <div
                              key={idx}
                              className="p-3 flex items-start justify-between gap-3"
                            >
                              <div className="font-medium">{u.status}</div>
                              <div className="flex-1 text-muted-foreground">
                                {u.message}
                              </div>
                              <div className="text-xs">
                                {new Date(u.createdAt).toLocaleString("en-IN")}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                Created:{" "}
                {viewItem.createdAt
                  ? new Date(viewItem.createdAt).toLocaleString("en-IN")
                  : "—"}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground">No enquiry found.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Enquiry</DialogTitle>
            <DialogDescription>
              Choose a DSE to assign this enquiry.
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
                {assigning ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Enquiry Status</DialogTitle>
            <DialogDescription>
              Update the status and add a message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md bg-input"
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as Enquiry["status"])
              }
            >
              <option value="C0">C0</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
              <option value="C3">C3</option>
            </select>

            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter update message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUpdateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmUpdate} disabled={updating}>
                {updating ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
