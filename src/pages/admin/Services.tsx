"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

import {
  Search,
  Edit,
  Trash2,
  Eye,
  Settings,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import {
  deleteServiceBooking,
  getServiceBookings,
  updateServiceBooking,
} from "@/services/serviceBookingServices";

export default function Services() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const form = useForm({ defaultValues: { status: "" } });

  // Fetch bookings
  const load = async () => {
    setLoading(true);
    try {
      const res = await getServiceBookings();
      setItems(res?.data || []);
    } catch (e: any) {
      toast({
        title: "Error loading",
        description: e.message || "Failed to load service bookings",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Status badge styling
  const statusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-600/30";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-600/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-600/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-600/30";
    }
  };

  // Search filter
  const filtered = items.filter((s) => {
    const txt = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(txt) ||
      s.phone.includes(txt) ||
      s.registrationNumber.toLowerCase().includes(txt) ||
      s.modelVariant.toLowerCase().includes(txt)
    );
  });

  // Submit status update
  const handleStatusUpdate = async (data: any) => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      await updateServiceBooking(selectedItem._id, { status: data.status });

      toast({
        title: "Updated Successfully",
        description: "Service booking status updated.",
      });

      setIsDialogOpen(false);
      load();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update status",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Delete booking
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteServiceBooking(id);
      toast({ title: "Deleted", description: "Booking removed." });
      load();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to delete",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex gap-3 items-center">
            <Settings className="h-8 w-8 text-primary" />
            Service Booking Management
          </h1>
          <p className="text-muted-foreground">
            View, update & manage customer service requests
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, reg no, model..."
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
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* SERVICE CARDS GRID */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered
            .filter((x) => statusFilter === "all" || x.status === statusFilter)
            .map((b) => (
              <Card key={b._id} className="vikram-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{b.name}</div>

                      <div className="text-muted-foreground text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone size={14} /> {b.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} /> {b.email}
                        </div>
                      </div>
                    </div>

                    <Badge className={statusClass(b.status)}>
                      <CheckCircle size={12} className="mr-1" />
                      {b.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  {/* VEHICLE DETAILS */}
                  <div className="border rounded-lg p-3 space-y-1 bg-black/10">
                    <div className="flex gap-2 items-center">
                      <FileText size={14} />
                      Reg No: {b.registrationNumber}
                    </div>
                    <div className="flex gap-2 items-center">
                      Model: {b.modelVariant}
                    </div>
                  </div>

                  {/* SERVICE DETAILS */}
                  <div className="border rounded-lg p-3 space-y-1 bg-black/10">
                    <div>Service Type: {b.serviceType}</div>
                    <div>Package: {b.servicePackage}</div>

                    <div className="flex gap-2 items-center">
                      <Calendar size={14} />
                      {new Date(b.appointmentDate).toLocaleDateString("en-IN")}
                    </div>

                    <div className="flex gap-2 items-center">
                      <Clock size={14} /> {b.timeSlot}
                    </div>
                  </div>

                  {/* ATTACHMENT */}
                  {b.attachment && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(b.attachment, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Attachment
                    </Button>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2">
                    {/* UPDATE BUTTON */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedItem(b);
                        form.reset({ status: b.status });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Update
                    </Button>

                    {/* DELETE BUTTON */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="vikram-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDelete(b._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* UPDATE STATUS POPUP */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="vikram-card max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleStatusUpdate)}
            className="space-y-4"
          >
            <select
              {...form.register("status")}
              className="w-full px-3 py-2 rounded-md border bg-input"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <Button type="submit" className="vikram-button w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
