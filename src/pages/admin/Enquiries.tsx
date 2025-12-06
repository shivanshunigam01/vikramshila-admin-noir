"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import {
  Search,
  Clock,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  ClipboardList,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Separator } from "@/components/ui/separator";

/* ----------------- SERVICE IMPORTS ----------------- */
import { getEnquiries } from "@/services/enquiriesService";

/* ----------------- TYPES ----------------- */
type DseUpdate = {
  message: string;
  status: string;
  createdAt: string;
};

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;

  state: string;
  pin: string;
  description: string;
  whatsappConsent: boolean;

  status: "C0" | "C1" | "C2" | "C3";
  createdAt: string;

  assignedTo: string;
  dseUpdates?: DseUpdate[];
};

/* ----------------- STATUS COLORS ----------------- */
const getStatusColor = (status: string) => {
  switch (status) {
    case "C0":
      return "bg-slate-500/20 text-slate-300 border-slate-600/20";
    case "C1":
      return "bg-blue-500/20 text-blue-300 border-blue-600/20";
    case "C2":
      return "bg-amber-500/20 text-amber-300 border-amber-600/20";
    case "C3":
      return "bg-green-500/20 text-green-300 border-green-600/20";
    default:
      return "bg-muted text-foreground/70 border-border";
  }
};

/* ========================================================
                FINAL ENQUIRIES PAGE
========================================================= */
export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Enquiry | null>(null);

  /* ----------------- NORMALIZER ----------------- */
  const normalize = (e: any): Enquiry => ({
    id: e._id,

    name: e.customerName || "—",
    phone: e.customerPhone || "—",
    email: e.customerEmail || "—",

    state: e.state || "—",
    pin: e.pin || "—",
    description: e.briefDescription || "—",
    whatsappConsent: e.whatsappConsent || false,

    status: e.status || "C0",
    createdAt: e.createdAt || "",

    assignedTo: e.assignedTo || "Unassigned",

    dseUpdates: Array.isArray(e.dseUpdates) ? e.dseUpdates : [],
  });

  /* ----------------- FETCH ENQUIRIES ----------------- */
  const load = async () => {
    setLoading(true);
    try {
      const res = await getEnquiries();
      const raw = Array.isArray(res?.data) ? res.data : [];
      setEnquiries(raw.map(normalize));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unable to load enquiries",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* ----------------- FILTERED LIST ----------------- */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return enquiries.filter((x) => {
      const match =
        x.name.toLowerCase().includes(q) ||
        x.email.toLowerCase().includes(q) ||
        x.phone.includes(q) ||
        x.state.toLowerCase().includes(q) ||
        x.pin.includes(q);

      const matchStatus = statusFilter === "all" || x.status === statusFilter;
      return match && matchStatus;
    });
  }, [searchTerm, statusFilter, enquiries]);

  /* ----------------- VIEW ----------------- */
  const handleView = (item: Enquiry) => {
    setViewItem(item);
    setViewOpen(true);
  };

  /* ========================================================
                    UI START
========================================================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          Enquiries
        </h1>
      </div>

      {/* SEARCH + FILTER */}
      <Card>
        <CardContent className="pt-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, email, state, PIN…"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 bg-input text-sm"
          >
            <option value="all">All</option>
            <option value="C0">C0</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
          </select>
        </CardContent>
      </Card>

      {/* LIST GRID */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {!loading &&
          filtered.map((enq) => (
            <Card key={enq.id} className="p-4 space-y-3 border border-white/10">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{enq.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 inline mr-1" />
                    {enq.phone}
                    <br />
                    <Mail className="h-3 w-3 inline mr-1" />
                    {enq.email}
                  </p>
                </div>

                <Badge className={getStatusColor(enq.status)}>
                  {enq.status}
                </Badge>
              </div>

              <div className="text-sm border p-3 rounded-md bg-muted/20">
                <p>
                  <b>State:</b> {enq.state}
                </p>
                <p>
                  <b>PIN:</b> {enq.pin}
                </p>
                <p>
                  <b>Description:</b> {enq.description}
                </p>
                <p>
                  <b>WhatsApp:</b> {enq.whatsappConsent ? "Yes" : "No"}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleView(enq)}
              >
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Button>
            </Card>
          ))}
      </div>

      {/* ================= VIEW SHEET ================= */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {viewItem && (
            <div className="p-4 space-y-5">
              <SheetHeader>
                <SheetTitle>{viewItem.name}</SheetTitle>
              </SheetHeader>

              <Separator />

              <p>
                <b>Phone:</b> {viewItem.phone}
              </p>
              <p>
                <b>Email:</b> {viewItem.email}
              </p>
              <p>
                <b>State:</b> {viewItem.state}
              </p>
              <p>
                <b>PIN:</b> {viewItem.pin}
              </p>

              <Separator />

              <p>
                <b>Description:</b> {viewItem.description}
              </p>
              <p>
                <b>WhatsApp Consent:</b>{" "}
                {viewItem.whatsappConsent ? "Yes" : "No"}
              </p>

              <Separator />

              <p>
                <b>Status:</b>{" "}
                <Badge className={getStatusColor(viewItem.status)}>
                  {viewItem.status}
                </Badge>
              </p>

              <p>
                <b>Created:</b>{" "}
                {new Date(viewItem.createdAt).toLocaleString("en-IN")}
              </p>

              <Separator />

              <p>
                <b>Assigned To:</b> {viewItem.assignedTo || "Unassigned"}
              </p>

              {/* FULL HISTORY */}
              {viewItem.dseUpdates?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mt-3">
                    DSE Update History
                  </h3>

                  {viewItem.dseUpdates.map((u, idx) => (
                    <div
                      key={idx}
                      className="border p-3 mt-2 rounded-md bg-muted/10"
                    >
                      <p>
                        <b>Status:</b> {u.status}
                      </p>
                      <p>
                        <b>Message:</b> {u.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
