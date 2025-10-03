"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Icons
import { MessageSquare, Trash2, Eye, PencilLine, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  getGrievances,
  updateGrievance,
  deleteGrievance,
} from "@/services/grievance.service";

/* ---------- Types ---------- */
type GrievanceUpdate = {
  status: string;
  message: string;
  at: string;
};

type Grievance = {
  _id: string;
  fullName: string;
  email?: string;
  mobileNumber?: string;
  type?: string;
  subject?: string;
  message?: string;
  whatsappConsent?: boolean;
  consentCall?: boolean;
  state?: string;
  pincode?: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: string;
  grievanceUpdates?: GrievanceUpdate[];
};

/* ---------- Helpers ---------- */
const getStatusColor = (status: Grievance["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-600 border-yellow-600/20";
    case "in-progress":
      return "bg-blue-500/20 text-blue-600 border-blue-600/20";
    case "resolved":
      return "bg-green-500/20 text-green-600 border-green-600/20";
    default:
      return "bg-gray-500/20 text-gray-600 border-gray-500/20";
  }
};

/* ---------- Component ---------- */
export default function Grievances() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View sheet
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Grievance | null>(null);

  // Update dialog
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateFor, setUpdateFor] = useState<Grievance | null>(null);
  const [newStatus, setNewStatus] =
    useState<Grievance["status"]>("in-progress");
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  /* ---------- Fetch ---------- */
  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await getGrievances();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setGrievances(list);
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  /* ---------- Filters ---------- */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return grievances.filter((g) => {
      const matchesSearch =
        g.fullName.toLowerCase().includes(q) ||
        (g.email || "").toLowerCase().includes(q) ||
        (g.mobileNumber || "").includes(q) ||
        (g.subject || "").toLowerCase().includes(q) ||
        (g.type || "").toLowerCase().includes(q) ||
        (g.status || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || g.status === (statusFilter as any);
      return matchesSearch && matchesStatus;
    });
  }, [grievances, searchTerm, statusFilter]);

  /* ---------- Actions ---------- */
  const confirmUpdate = async () => {
    if (!updateFor) return;
    setUpdating(true);
    try {
      const res = await updateGrievance(updateFor._id, {
        status: newStatus,
        message,
      });
      const updated = res.data?.data || res.data;
      setGrievances((prev) =>
        prev.map((g) => (g._id === updated._id ? updated : g))
      );
      toast({ title: "Updated", description: "Grievance updated." });
      setUpdateOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGrievance(id);
      setGrievances((prev) => prev.filter((g) => g._id !== id));
      toast({ title: "Deleted", description: "Grievance removed." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Grievances
          </h1>
          <p className="text-muted-foreground">
            Manage customer grievances through their lifecycle.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (name, phone, email, subject, status)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md border bg-input text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading grievances...</p>
        ) : filtered.length === 0 ? (
          <p>No grievances found</p>
        ) : (
          filtered.map((g) => (
            <Card
              key={g._id}
              className="overflow-hidden border-muted-foreground/10 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{g.fullName}</h3>
                  <Badge className={`border ${getStatusColor(g.status)}`}>
                    {g.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{g.subject}</p>
                <p className="text-xs">{g.message}</p>
                <div className="text-xs text-muted-foreground">
                  {new Date(g.createdAt).toLocaleDateString("en-IN")}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewItem(g);
                      setViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUpdateFor(g);
                      setNewStatus(g.status);
                      setMessage("");
                      setUpdateOpen(true);
                    }}
                  >
                    <PencilLine className="h-4 w-4 mr-1" /> Update
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => handleDelete(g._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Sheet */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Grievance Details</SheetTitle>
            <SheetDescription>Full grievance record</SheetDescription>
          </SheetHeader>
          {viewItem && (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p>
                  <b>Name:</b> {viewItem.fullName}
                </p>
                <p>
                  <b>Email:</b> {viewItem.email || "—"}
                </p>
                <p>
                  <b>Phone:</b> {viewItem.mobileNumber || "—"}
                </p>
                <p>
                  <b>Type:</b> {viewItem.type || "—"}
                </p>
                <p>
                  <b>Subject:</b> {viewItem.subject || "—"}
                </p>
                <p>
                  <b>Message:</b> {viewItem.message || "—"}
                </p>
              </div>

              <Separator />

              <h4 className="font-semibold">Update History</h4>
              {Array.isArray(viewItem.grievanceUpdates) &&
              viewItem.grievanceUpdates.length > 0 ? (
                <div className="rounded-md border divide-y">
                  {viewItem.grievanceUpdates
                    .slice()
                    .reverse()
                    .map((u, i) => (
                      <div
                        key={i}
                        className="p-3 flex items-start justify-between gap-3"
                      >
                        <div className="font-medium">{u.status}</div>
                        <div className="flex-1 text-muted-foreground">
                          {u.message}
                        </div>
                        <div className="text-xs">
                          {new Date(u.at).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No updates yet</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Update Dialog */}
      {/* Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Grievance</DialogTitle>
            <DialogDescription>
              Change grievance status and add a note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Custom black select */}
            <select
              className="w-full p-2 rounded-md border border-gray-700 bg-black text-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <Textarea
              placeholder="Add a message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-black text-white border-gray-700"
            />

            <div className="flex justify-end gap-2">
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
