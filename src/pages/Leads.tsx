// src/pages/Leads.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Car, Clock } from "lucide-react";
import { getleads } from "@/services/leadsService";

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getleads();
      setLeads(res.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Search + filter
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.productTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "approved":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-gray-200 text-gray-600 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
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
      <Card className="vikram-card">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
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
            <option value="rejected">Rejected</option>
          </select>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading leads...</p>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card key={lead._id} className="vikram-card overflow-hidden">
              <CardContent className="space-y-2 p-4">
                <h3 className="font-semibold text-lg">
                  {lead.productTitle || "N/A"}
                </h3>
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Vehicle Price: ₹{lead.vehiclePrice}</p>
                  <p>
                    Down Payment: ₹{lead.downPaymentAmount} (
                    {lead.downPaymentPercentage}%)
                  </p>
                  <p>Loan Amount: ₹{lead.loanAmount}</p>
                  <p>Interest: {lead.interestRate}%</p>
                  <p>Tenure: {lead.tenure} months</p>
                  <p>EMI: ₹{lead.estimatedEMI}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No leads found</p>
        )}
      </div>
    </div>
  );
}
