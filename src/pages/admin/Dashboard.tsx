import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Gift,
  Users,
  Mail,
  TrendingUp,
  Eye,
  Calendar,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDashboardStats } from "@/services/dashboardService";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("week");
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  // Fetch stats on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.data);
        } else {
          toast({
            title: "Error",
            description:
              (res as any).message || "Failed to load dashboard stats",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description:
            err.response?.data?.message || "Failed to load dashboard stats",
          variant: "destructive",
        });
      }
    };
    fetchStats();
  }, []);

  // Map API data to cards
  const statsCards = stats
    ? [
        // 🔥 VISITOR ANALYTICS
        {
          title: "Today Visitors",
          value: stats.todayVisits,
          change: "",
          changeType: "neutral" as const,
          icon: Eye,
        },
        {
          title: "Total Visits",
          value: stats.totalVisits,
          change: "",
          changeType: "neutral" as const,
          icon: TrendingUp,
        },
        {
          title: "Unique Visitors",
          value: stats.uniqueVisitors,
          change: "",
          changeType: "neutral" as const,
          icon: Users,
        },

        // 🔹 EXISTING BUSINESS STATS
        {
          title: "Enquiries",
          value: stats.enquiries,
          change: "+18%",
          changeType: "positive" as const,
          icon: Mail,
        },
      ]
    : [];

  const recentActivity = [
    {
      action: "New enquiry",
      item: "Ace Gold Petrol",
      time: "2 minutes ago",
      icon: Mail,
    },
    {
      action: "Product updated",
      item: "Magic Express",
      time: "15 minutes ago",
      icon: Package,
    },
    {
      action: "New testimonial",
      item: "Customer Review",
      time: "1 hour ago",
      icon: Star,
    },
    {
      action: "Scheme created",
      item: "Festival Offer",
      time: "3 hours ago",
      icon: Gift,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Vikramshila Automobiles Admin Panel
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.length > 0 ? (
          statsCards.map((card) => (
            <Card key={card.title} className="vikram-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.change && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp
                      className={`h-3 w-3 ${
                        card.changeType === "positive"
                          ? "text-green-500"
                          : "text-gray-500"
                      }`}
                    />
                    <span>
                      {card.change} from last {timeFilter}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">Loading stats...</p>
        )}
      </div>

      {/* Rest of your code (Recent Activity + Quick Actions) stays the same */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="vikram-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.item}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="vikram-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <button
                onClick={() => navigate("/admin/products")}
                className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Add New Product</p>
                    <p className="text-sm text-primary-foreground/80">
                      Create a new vehicle listing
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate("/admin/schemes")}
                className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Create Scheme</p>
                    <p className="text-sm text-primary-foreground/80">
                      Launch a new offer
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate("/admin/enquiries")}
                className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">View Enquiries</p>
                    <p className="text-sm text-primary-foreground/80">
                      Check customer inquiries
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
