import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Gift, Users, Mail, TrendingUp, Eye, Calendar, Star } from "lucide-react";

const statsCards = [
  {
    title: "Products",
    value: "145",
    change: "+12%",
    changeType: "positive" as const,
    icon: Package,
  },
  {
    title: "Schemes",
    value: "23",
    change: "+5%",
    changeType: "positive" as const,
    icon: Gift,
  },
  {
    title: "Services",
    value: "18",
    change: "0%",
    changeType: "neutral" as const,
    icon: Users,
  },
  {
    title: "Enquiries",
    value: "847",
    change: "+18%",
    changeType: "positive" as const,
    icon: Mail,
  },
];

const recentActivity = [
  { action: "New enquiry", item: "Ace Gold Petrol", time: "2 minutes ago", icon: Mail },
  { action: "Product updated", item: "Magic Express", time: "15 minutes ago", icon: Package },
  { action: "New testimonial", item: "Customer Review", time: "1 hour ago", icon: Star },
  { action: "Scheme created", item: "Festival Offer", time: "3 hours ago", icon: Gift },
];

export default function Dashboard() {
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title} className="vikram-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className={`h-3 w-3 ${
                  card.changeType === 'positive' ? 'text-green-500' : 'text-gray-500'
                }`} />
                {card.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.item}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
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
              <button className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Add New Product</p>
                    <p className="text-sm text-primary-foreground/80">Create a new vehicle listing</p>
                  </div>
                </div>
              </button>
              <button className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Create Scheme</p>
                    <p className="text-sm text-primary-foreground/80">Launch a new offer</p>
                  </div>
                </div>
              </button>
              <button className="vikram-button text-primary-foreground p-4 rounded-lg text-left transition-all hover:scale-105">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">View Enquiries</p>
                    <p className="text-sm text-primary-foreground/80">Check customer inquiries</p>
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