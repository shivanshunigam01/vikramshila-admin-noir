"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import {
  Search,
  Phone,
  Mail,
  Eye,
  ClipboardList,
  Clock,
  MoreHorizontal,
  UserCircle2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { getEnquiries } from "@/services/enquiriesService";

/* ------------ Types ------------ */
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

  //   status: "C0" | "C1" | "C2" | "C3";
  createdAt: string;

  //   assignedTo: string;
  //   dseUpdates?: DseUpdate[];
};

/* ------------ Status Colors ------------ */
const statusColor = (s: string) => {
  switch (s) {
    case "C0":
      return "bg-slate-500/20 text-slate-700 border-slate-600/30";
    case "C1":
      return "bg-blue-500/20 text-blue-700 border-blue-600/30";
    case "C2":
      return "bg-amber-500/20 text-amber-700 border-amber-600/30";
    case "C3":
      return "bg-green-500/20 text-green-700 border-green-600/30";
    default:
      return "bg-muted text-foreground border-border";
  }
};

/* ------------ Main ------------ */
export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Enquiry | null>(null);

  /* Normalize API Response */
  const normalize = (e: any): Enquiry => ({
    id: e._id,
    name: e.fullName || "—",
    phone: e.mobileNumber || "—",
    email: "—",
    state: e.state || "—",
    pin: e.pincode || "—",
    description: e.briefDescription || "—",
    whatsappConsent: e.whatsappConsent || false,
    createdAt: e.createdAt || "",
  });

  /* Load Data */
  const load = async () => {
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

  /* Filtering */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return enquiries.filter((x) => {
      const match =
        x.name.toLowerCase().includes(q) ||
        x.email.toLowerCase().includes(q) ||
        x.phone.includes(q) ||
        x.state.toLowerCase().includes(q) ||
        x.pin.includes(q);

      return match;
    });
  }, [searchTerm, statusFilter, enquiries]);

  /* View Handler */
  const openView = (item: Enquiry) => {
    setViewItem(item);
    setViewOpen(true);
  };

  /* ------------ UI ------------ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          Enquiries
        </h1>
        <p className="text-muted-foreground">Manage all customer enquiries</p>
      </div>

      {/* Search + Filter Box */}
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enquiry (name, phone, email, state, PIN)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md border bg-input text-sm"
          >
            <option value="all">All Status</option>
            <option value="C0">C0</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
          </select> */}
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading enquiries…</p>
        ) : filtered.length === 0 ? (
          <p>No enquiries found.</p>
        ) : (
          filtered.map((enq) => (
            <Card
              key={enq.id}
              className="overflow-hidden border-muted-foreground/10 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {enq.name}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(enq.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  {/* <Badge className={statusColor(enq.status)}>
                    {enq.status}
                  </Badge> */}
                </div>

                {/* Contact */}
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {enq.phone}
                  </p>
                  {/* <p className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" /> {enq.email}
                  </p> */}

                  {/* <p className="mt-2 text-xs text-muted-foreground">
                    Assigned to:{" "}
                    <span className="font-medium">{enq.assignedTo}</span>
                  </p> */}
                </div>

                {/* More Details */}
                <div className="rounded-md border p-3 text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-2 tracking-wider">
                    Enquiry Details
                  </div>

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

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openView(enq)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Sheet */}
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
              {/* <p>
                <b>Email:</b> {viewItem.email}
              </p> */}
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

              {/* <b>Status:</b>{" "}
                <Badge className={statusColor(viewItem.status)}>
                  {vie    <p>
          wItem.status}
                </Badge>
              </p> */}

              <p>
                <b>Created:</b>{" "}
                {new Date(viewItem.createdAt).toLocaleString("en-IN")}
              </p>

              <Separator />

              {/* <p>
                <b>Assigned To:</b> {viewItem.assignedTo}
              </p> */}

              {/* History */}
              {/* {viewItem.dseUpdates?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold">DSE Updates</h3>

                  {viewItem.dseUpdates.map((u, idx) => (
                    <div
                      key={idx}
                      className="border p-3 mt-2 rounded-md bg-muted/20"
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
              )} */}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
