"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Eye,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
  Calendar,
  Filter,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { getEnquiries } from "@/services/enquiriesService";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await getEnquiries();
      // API returns { success, message, data }
      const apiData = Array.isArray(res?.data) ? res.data : [res?.data];
      // map backend fields to UI-compatible ones
      const mapped = apiData.map((e: any) => ({
        id: e._id,
        fullName: e.fullName,
        mobileNumber: e.mobileNumber,
        state: e.state,
        pincode: e.pincode,
        product: e.product,
        whatsappConsent: e.whatsappConsent,
        status: e.contacted ? "contacted" : "new",
        createdAt: e.createdAt,
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
      case "new":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "contacted":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "follow-up":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "converted":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      default:
        return "";
    }
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      enquiry.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.mobileNumber?.includes(searchTerm) ||
      enquiry.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.state?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || enquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            Customer Enquiries
          </h1>
          <p className="text-muted-foreground">
            Track and manage customer inquiries and leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-blue-500">
            {enquiries.filter((e) => e.status === "new").length} New
          </Badge>
          <Badge variant="secondary" className="text-green-500">
            {enquiries.filter((e) => e.status === "converted").length} Converted
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, product, or location..."
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
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow-up">Follow-up</option>
                <option value="converted">Converted</option>
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
            <Card key={enquiry.id} className="vikram-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {enquiry.fullName}
                      {enquiry.whatsappConsent && (
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ID: {enquiry.id}
                    </p>
                  </div>
                  <Badge className={getStatusColor(enquiry.status)}>
                    {enquiry.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{enquiry.mobileNumber}</span>
                    <Button variant="ghost" size="sm" className="ml-auto gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Call
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {enquiry.state}, {enquiry.pincode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-fit">
                      {enquiry.product}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1 vikram-button"
                    disabled={enquiry.status === "converted"}
                    onClick={() => {
                      toast({
                        title: "Customer Contacted",
                        description: `${enquiry.fullName} has been marked as contacted.`,
                      });
                    }}
                  >
                    <Phone className="h-3 w-3" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredEnquiries.length === 0 && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No enquiries found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
