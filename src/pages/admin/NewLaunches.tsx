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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Rocket,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  createLaunch,
  deleteLaunch,
  getLaunches,
  updateLaunch,
} from "@/services/newLaunches";

interface Launch {
  _id: string;
  title: string;
  description: string;
  launchDate: string;
  mediaFiles: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewLaunches() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editingLaunch, setEditingLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState(false); // 🔹 loader state

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      launchDate: "",
      status: "active",
    },
  });

  const fetchLaunches = async () => {
    try {
      setLoading(true);
      const res = await getLaunches();
      if (res.success) {
        setLaunches(res.data);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load launches",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunches();
  }, []);

  useEffect(() => {
    if (editingLaunch) {
      form.reset({
        title: editingLaunch.title,
        description: editingLaunch.description,
        launchDate: editingLaunch.launchDate.split("T")[0],
        status: editingLaunch.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        launchDate: "",
        status: "active",
      });
      setFile(null);
    }
  }, [editingLaunch, isDialogOpen]);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("launchDate", data.launchDate);
      formData.append("status", data.status);
      if (file) formData.append("mediaFiles", file);

      let res;
      if (editingLaunch) {
        res = await updateLaunch(editingLaunch._id, formData);
      } else {
        res = await createLaunch(formData);
      }

      if (res.success) {
        toast({
          title: editingLaunch ? "Launch Updated" : "Launch Added",
          description: `"${data.title}" has been ${
            editingLaunch ? "updated" : "added"
          }.`,
        });
        fetchLaunches();
        setIsDialogOpen(false);
        setEditingLaunch(null);
        form.reset();
        setFile(null);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save launch",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      setLoading(true);
      const res = await deleteLaunch(id);
      if (res.success) {
        toast({
          title: "Deleted",
          description: `"${title}" has been removed.`,
        });
        fetchLaunches();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete launch",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLaunches = launches.filter((launch) => {
    const matchesSearch =
      launch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      launch.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || launch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 🔹 Global Loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            New Launches
          </h1>
          <p className="text-muted-foreground">
            Manage upcoming and recent product launches
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="vikram-button gap-2 w-fit"
              onClick={() => {
                setEditingLaunch(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Launch
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLaunch ? "Edit Launch" : "Add New Launch"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="launchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Launch Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="px-3 py-2 rounded-md border bg-input text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="upcoming">Upcoming</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Media File</FormLabel>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="vikram-button">
                    {editingLaunch ? "Update Launch" : "Add Launch"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingLaunch(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search launches..."
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
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Launches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLaunches.map((launch) => (
          <Card key={launch._id} className="vikram-card overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-muted overflow-hidden">
                <img
                  src={launch.mediaFiles[0]}
                  alt={launch.title}
                  className="w-full h-full object-cover"
                />
                <Badge
                  className={`absolute top-3 right-3 ${getStatusColor(
                    launch.status
                  )}`}
                >
                  {launch.status}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{launch.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {launch.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Launch:{" "}
                  {new Date(launch.launchDate).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => {
                    setEditingLaunch(launch);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="vikram-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Launch</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{launch.title}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(launch._id, launch.title)}
                        className="bg-red-600 hover:bg-red-700"
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

      {filteredLaunches.length === 0 && !loading && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No launches found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
