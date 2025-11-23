import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  MapPin,
  CalendarDays,
  CheckCircle,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  createPlan,
  updatePlanStatus,
  getPlanByDSE,
} from "@/services/plannerService";

export default function DSEPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [plans, setPlans] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    visitDate: "",
    visitTime: "",
    customerName: "",
    location: "",
    purpose: "",
    notes: "",
  });

  const { toast } = useToast();

  const dseUser =
    JSON.parse(localStorage.getItem("dse_user") || "null") ||
    JSON.parse(localStorage.getItem("admin_user") || "null") ||
    {};

  const dseId = dseUser?._id || dseUser?.id || "";

  const dseName = dseUser?.name || dseUser?.username || "DSE";

  const loadPlans = async () => {
    if (!dseId) return;
    try {
      const res = await getPlanByDSE(dseId);
      const api = res.data;
      setPlans(api?.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      const payload = {
        ...formData,
        dseId,
        dseName,
      };
      await createPlan(payload);
      toast({
        title: "Success",
        description: "Plan created successfully!",
      });

      setOpenDialog(false);
      setFormData({
        visitDate: "",
        visitTime: "",
        customerName: "",
        location: "",
        purpose: "",
        notes: "",
      });

      await loadPlans();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Failed to create plan",
        variant: "destructive",
      });
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await updatePlanStatus(id, "completed");
      toast({ title: "Success", description: "Visit marked as completed" });
      await loadPlans();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Update failed",
        variant: "destructive",
      });
    }
  };

  const filteredPlans = plans.filter(
    (p) =>
      new Date(p.visitDate).toDateString() ===
      new Date(selectedDate || new Date()).toDateString()
  );

  const handleDialogOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (open && selectedDate) {
      setFormData({
        ...formData,
        visitDate: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  const completedCount = filteredPlans.filter(
    (p) => p.status === "completed"
  ).length;
  const pendingCount = filteredPlans.filter(
    (p) => p.status !== "completed"
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-black min-h-screen">
      {/* Left Sidebar - Calendar */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-950 border-slate-800 shadow-lg sticky top-4">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-slate-950">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
            />

            {/* Stats */}
            <div className="mt-4 space-y-2 border-t border-slate-700 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Visits:</span>
                <span className="text-white font-bold">
                  {filteredPlans.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Completed:</span>
                <span className="text-green-400 font-bold">
                  {completedCount}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Pending:</span>
                <span className="text-yellow-400 font-bold">
                  {pendingCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Content - Visits List */}
      <div className="lg:col-span-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {selectedDate?.toLocaleDateString("en-IN", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredPlans.length} visit
              {filteredPlans.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>

          <Dialog open={openDialog} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 h-9 px-3 text-sm">
                <Plus className="h-4 w-4" /> Add Visit
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-sm bg-slate-950 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white text-base">
                  Create Visit Plan
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) =>
                      setFormData({ ...formData, visitDate: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white text-sm h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={formData.visitTime}
                    onChange={(e) =>
                      setFormData({ ...formData, visitTime: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white text-sm h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Customer
                  </label>
                  <Input
                    placeholder="Customer name"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Location
                  </label>
                  <Input
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Purpose
                  </label>
                  <Textarea
                    placeholder="Purpose"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 resize-none text-sm"
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="border-slate-700 bg-slate-900 text-white placeholder-slate-500 resize-none text-sm"
                    rows={1}
                  />
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-2 h-8 text-sm"
                  onClick={handleCreatePlan}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Visits Grid/List */}
        {filteredPlans.length === 0 ? (
          <Card className="bg-slate-950 border-slate-800 h-96 flex items-center justify-center">
            <div className="text-center">
              <CalendarDays className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                No visits planned
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Click "Add Visit" to schedule a new visit
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {/* Pending Visits */}
            {filteredPlans.filter((p) => p.status !== "completed").length >
              0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pending ({pendingCount})
                </h3>
                <div className="space-y-2">
                  {filteredPlans
                    .filter((p) => p.status !== "completed")
                    .map((p) => (
                      <Card
                        key={p._id}
                        className="bg-slate-950 border-l-4 border-l-blue-600 border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === p._id ? null : p._id)
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                <h3 className="text-sm font-bold text-white truncate">
                                  {p.customerName}
                                </h3>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {p.location}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {p.visitTime}
                              </p>

                              {/* Expanded Content */}
                              {expandedId === p._id && (
                                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                                  {p.purpose && (
                                    <div>
                                      <p className="text-xs text-slate-400 mb-0.5">
                                        Purpose:
                                      </p>
                                      <p className="text-xs text-slate-300">
                                        {p.purpose}
                                      </p>
                                    </div>
                                  )}
                                  {p.notes && (
                                    <div>
                                      <p className="text-xs text-slate-400 mb-0.5">
                                        Notes:
                                      </p>
                                      <p className="text-xs text-slate-300">
                                        {p.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkCompleted(p._id);
                              }}
                              className="gap-1 border-blue-700 hover:bg-blue-900 text-blue-400 h-8 px-2 text-xs flex-shrink-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Done
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Completed Visits */}
            {filteredPlans.filter((p) => p.status === "completed").length >
              0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Completed ({completedCount})
                </h3>
                <div className="space-y-2">
                  {filteredPlans
                    .filter((p) => p.status === "completed")
                    .map((p) => (
                      <Card
                        key={p._id}
                        className="bg-slate-900 border-l-4 border-l-green-600 border-slate-800 opacity-75 hover:opacity-100 transition-all cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === p._id ? null : p._id)
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />
                                <h3 className="text-sm font-bold text-slate-300 truncate">
                                  {p.customerName}
                                </h3>
                                <Badge className="bg-green-700 text-green-100 text-xs h-5">
                                  ✓
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {p.location}
                              </p>
                              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {p.visitTime}
                              </p>

                              {/* Expanded Content */}
                              {expandedId === p._id && (
                                <div className="mt-2 pt-2 border-t border-slate-700 space-y-1.5">
                                  {p.purpose && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-0.5">
                                        Purpose:
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {p.purpose}
                                      </p>
                                    </div>
                                  )}
                                  {p.notes && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-0.5">
                                        Notes:
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {p.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <ChevronDown
                              className={`h-4 w-4 text-slate-600 flex-shrink-0 transition-transform ${
                                expandedId === p._id ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
