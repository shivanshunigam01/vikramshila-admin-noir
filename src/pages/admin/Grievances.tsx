import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  getGrievances,
  resolveGrievance,
  deleteGrievance,
} from "@/services/grievance.service";
import { CheckCircle, Trash2, MessageSquare } from "lucide-react";

export default function Grievances() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch grievances from API
  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await getGrievances();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setGrievances(list);
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  // Mark as resolved
  const handleResolve = async (id: string) => {
    try {
      await resolveGrievance(id);
      setGrievances((prev) =>
        prev.map((g) =>
          g._id === id ? { ...g, status: "resolved", contacted: true } : g
        )
      );
      toast({ title: "Resolved", description: "Grievance marked as resolved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  // Delete grievance
  const handleDelete = async (id: string, fullName: string) => {
    try {
      await deleteGrievance(id);
      setGrievances((prev) => prev.filter((g) => g._id !== id));
      toast({
        title: "Deleted",
        description: `"${fullName}" grievance removed`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Grievances
        </h1>
        <p className="text-muted-foreground">
          Manage and follow up on customer grievances
        </p>
      </div>

      {/* Grievances List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading grievances...</p>
        ) : grievances.length === 0 ? (
          <p>No grievances found.</p>
        ) : (
          grievances.map((g) => (
            <Card key={g._id} className="vikram-card">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{g.fullName}</h3>
                  <Badge className={getStatusColor(g.status)}>{g.status}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  📱 {g.mobileNumber}
                </p>
                <p className="text-sm">📧 {g.email}</p>
                <p className="text-sm">
                  📍 {g.state || "N/A"} - {g.pincode || "N/A"}
                </p>

                <div className="text-sm">
                  <strong>Type:</strong> {g.type}
                </div>
                <div className="text-sm">
                  <strong>Subject:</strong> {g.subject}
                </div>
                <div className="text-sm">
                  <strong>Message:</strong> {g.message}
                </div>
                <div className="text-sm">
                  <strong>WhatsApp Consent:</strong>{" "}
                  {g.whatsappConsent ? "✅ Yes" : "❌ No"}
                </div>
                <div className="text-xs text-gray-400">
                  Created: {new Date(g.createdAt).toLocaleString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  {g.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(g._id)}
                      className="text-green-600 border-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="vikram-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Grievance</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete grievance from "
                          {g.fullName}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex justify-end gap-2 p-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(g._id, g.fullName)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
