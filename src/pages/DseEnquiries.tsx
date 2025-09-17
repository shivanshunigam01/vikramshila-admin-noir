"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Calendar,
  Filter,
  Loader2,
  UserCircle2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

import { getAssignedtoDSE } from "@/services/leadsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  assignEnquiry,
  getMyAssignedEnquiries,
  updateEnquiryByDse,
} from "@/services/enquiriesService";

type Enquiry = {
  id: string;
  name: string; // fullName
  email?: string; // (not in schema; kept optional)
  phone?: string; // mobileNumber
  model?: string; // product (we’ll show as “Product”)
  panNumber?: string; // only if you later add to schema
  aadharNumber?: string; // only if you later add to schema
  status: "C0" | "C1" | "C2" | "C3";
  createdAt?: string;
  assignedTo?: string; // populated DSE name / id / legacy string
  dseUpdates?: { message: string; status: string; createdAt: string }[];
};

type DseUser = { _id: string; name: string; email: string };

export default function DSEEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // dialog states
  const [updateOpen, setUpdateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // update state
  const [updating, setUpdating] = useState(false);
  const [updateFor, setUpdateFor] = useState<Enquiry | null>(null);
  const [newStatus, setNewStatus] = useState<Enquiry["status"]>("C0");
  const [message, setMessage] = useState("");

  // assign state
  const [assigning, setAssigning] = useState(false);
  const [assignFor, setAssignFor] = useState<Enquiry | null>(null);
  const [assignee, setAssignee] = useState<string>("");
  const [dseOptions, setDseOptions] = useState<DseUser[]>([]);
  const [dseLoading, setDseLoading] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await getMyAssignedEnquiries(); // calls /enquiries/list
      const apiData = Array.isArray(res?.data) ? res.data : [];

      // Map to your UI shape (matches Enquiry schema fields)
      const mapped: Enquiry[] = apiData.filter(Boolean).map((e: any) => ({
        id: e._id,
        name: e.fullName || "-", // ✅ from schema
        email: e.email, // (not in schema; may be undefined)
        phone: e.mobileNumber, // ✅ from schema
        model: e.product, // ✅ from schema (displayed as Product)
        panNumber: e.panNumber, // if you add later
        aadharNumber: e.aadharNumber, // if you add later
        status: e.status || "C0",
        createdAt: e.createdAt,
        assignedTo:
          e?.assignedToId?.name ||
          e?.assignedTo || // legacy string
          e?.assignedToId?._id ||
          undefined,
        dseUpdates: e.dseUpdates || [],
      }));

      setEnquiries(mapped);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch enquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "C0":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "C1":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "C2":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "C3":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      default:
        return "";
    }
  };

  const filteredEnquiries = useMemo(
    () =>
      enquiries.filter((enquiry) => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          enquiry.name.toLowerCase().includes(q) ||
          (enquiry.email || "").toLowerCase().includes(q) ||
          (enquiry.phone || "").includes(searchTerm) ||
          (enquiry.model || "").toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" || enquiry.status === (statusFilter as any);
        return matchesSearch && matchesStatus;
      }),
    [enquiries, searchTerm, statusFilter]
  );

  // --- DSE list loader ---
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

  // open assign dialog
  const openAssign = (enquiry: Enquiry) => {
    setAssignFor(enquiry);
    setAssignee("");
    setAssignOpen(true);
    loadDseOptions();
  };

  // open update dialog
  const openUpdate = (enquiry: Enquiry) => {
    setUpdateFor(enquiry);
    setNewStatus(enquiry.status);
    setMessage("");
    setUpdateOpen(true);
  };

  // confirm update
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
                status: updated?.status || newStatus,
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

      toast({
        title: "Updated",
        description: "Enquiry status updated successfully.",
      });
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

  // confirm assign
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
                  updated?.assignedToId?.name ||
                  updated?.assignedTo ||
                  updated?.assignedToId?._id ||
                  e.assignedTo,
                status: updated?.status || e.status || "C0",
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
        description: e?.message || "Failed to assign enquiry",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            My DSE Enquiries
          </h1>
          <p className="text-muted-foreground">
            Track and manage enquiries assigned to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-blue-500">
            {enquiries.filter((e) => e.status === "C0").length} C0
          </Badge>
          <Badge variant="secondary" className="text-green-500">
            {enquiries.filter((e) => e.status === "C3").length} C3
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, product or assignee…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
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
              <Button variant="outline" size="icon" onClick={fetchEnquiries}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Enquiries Grid */}
      {!loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredEnquiries.map((enquiry) => (
            <Card key={enquiry.id}>
              <CardHeader className="pb-4 flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {enquiry.name}
                    {enquiry.email && (
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {enquiry.email || "—"}
                  </p>
                  {enquiry.assignedTo && (
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">
                        Assigned to:
                      </span>{" "}
                      <span className="font-medium">{enquiry.assignedTo}</span>
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(enquiry.status)}>
                  {enquiry.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{enquiry.phone || "-"}</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Product: {enquiry.model || "—"}</p>
                    <p>PAN: {enquiry.panNumber || "—"}</p>
                    <p>Aadhar: {enquiry.aadharNumber || "—"}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {enquiry.createdAt
                        ? new Date(enquiry.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => openUpdate(enquiry)}
                  >
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredEnquiries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No enquiries found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Update Dialog */}
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
    </div>
  );
}
