// src/pages/admin/PlannerReports.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays,
  MapPin,
  User,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { getPlannerReports, updatePlanStatus } from "@/services/plannerService";

export default function PlannerReportsAdmin() {
  const { toast } = useToast();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDse, setSelectedDse] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedDse !== "all") params.dseIdOrName = selectedDse;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await getPlannerReports(params);
      const payload = (res as any).data ?? res;
      setPlans(payload.data?.data || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load planner reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleApplyFilters = async () => {
    await loadReports();
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedDse("all");
    setStatusFilter("all");
    loadReports();
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      setRefreshing(true);
      await updatePlanStatus(id, "completed");
      toast({ title: "Updated", description: "Visit marked as completed" });
      await loadReports();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const uniqueDseList = useMemo(() => {
    const map = new Map<string, string>();
    plans.forEach((p) => {
      const key = p.dseId || p.dseName || "unknown";
      const label = p.dseName || p.dseCode || key;
      if (!map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [plans]);

  const summary = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter((p) => p.status === "completed").length;
    const planned = plans.filter((p) => p.status === "planned").length;
    const cancelled = plans.filter((p) => p.status === "cancelled").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, planned, cancelled, completionRate };
  }, [plans]);

  const getStatusColor = (status: string) => {
    if (status === "completed")
      return "bg-green-500/20 text-green-500 border-green-500/40";
    if (status === "cancelled")
      return "bg-red-500/20 text-red-500 border-red-500/40";
    return "bg-yellow-500/20 text-yellow-500 border-yellow-500/40";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            DSE Planner Reports
          </h1>
          <p className="text-muted-foreground">
            View & analyze visit plans of all DSEs – planned vs completed.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={loadReports}
          disabled={loading || refreshing}
        >
          {refreshing || loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">DSE</label>
              <Select
                value={selectedDse}
                onValueChange={(val) => setSelectedDse(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All DSE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DSE</SelectItem>
                  {uniqueDseList.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} disabled={loading}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Visits</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">
              {summary.completed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pending (Planned)</p>
            <p className="text-2xl font-bold text-yellow-500">
              {summary.planned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">{summary.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Visit Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans found for selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Time</th>
                    <th className="text-left py-2 px-2">DSE</th>
                    <th className="text-left py-2 px-2">Customer</th>
                    <th className="text-left py-2 px-2">Location</th>
                    <th className="text-left py-2 px-2">Purpose</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2 px-2">
                        {p.visitDate
                          ? new Date(p.visitDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{p.visitTime || "-"}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{p.dseName || p.dseCode || p.dseId}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">{p.customerName || "-"}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{p.location || "-"}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="line-clamp-2 max-w-xs">
                          {p.purpose || "-"}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(p.status)}
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right">
                        {p.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleMarkCompleted(p._id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Done
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
