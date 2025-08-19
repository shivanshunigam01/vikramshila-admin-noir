import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Gift,
  Calendar,
  IndianRupee,
  Percent
} from "lucide-react";

const schemes = [
  {
    id: 1,
    title: "Festival Discount 2024",
    description: "Special discounts during festive season",
    discount: "15%",
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    status: "active",
    banner: "/placeholder.svg",
  },
  {
    id: 2,
    title: "First Time Buyer Offer",
    description: "Exclusive offer for first-time commercial vehicle buyers",
    discount: "₹25,000",
    startDate: "2024-02-15",
    endDate: "2024-04-15",
    status: "active",
    banner: "/placeholder.svg",
  },
  {
    id: 3,
    title: "Trade-in Bonus",
    description: "Additional benefits on vehicle exchange",
    discount: "₹30,000",
    startDate: "2024-01-01",
    endDate: "2024-02-28",
    status: "expired",
    banner: "/placeholder.svg",
  },
  {
    id: 4,
    title: "Summer Special",
    description: "Beat the heat with cool offers",
    discount: "12%",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    status: "upcoming",
    banner: "/placeholder.svg",
  },
];

export default function Schemes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "expired":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "";
    }
  };

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || scheme.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Schemes & Offers
          </h1>
          <p className="text-muted-foreground">
            Manage promotional schemes and special offers
          </p>
        </div>
        <Button className="vikram-button gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Create Scheme
        </Button>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schemes..."
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
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSchemes.map((scheme) => (
          <Card key={scheme.id} className="vikram-card overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-muted overflow-hidden">
                <img
                  src={scheme.banner}
                  alt={scheme.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <Badge 
                className={`absolute top-3 right-3 ${getStatusColor(scheme.status)}`}
              >
                {scheme.status}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{scheme.title}</span>
                <div className="flex items-center gap-1 text-primary">
                  {scheme.discount.includes('%') ? (
                    <Percent className="h-4 w-4" />
                  ) : (
                    <IndianRupee className="h-4 w-4" />
                  )}
                  <span className="text-lg font-bold">{scheme.discount}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{scheme.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(scheme.startDate).toLocaleDateString("en-IN")}</span>
                </div>
                <span>-</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(scheme.endDate).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No schemes found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}