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
  Settings,
  Loader2,
  CheckCircle,
} from "lucide-react";

import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "@/services/serviceServices";

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [viewingService, setViewingService] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      icon: null,
      status: "active",
    },
  });

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getServices();
      setServices(res?.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle Add / Update
  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("status", data.status);

      if (data.icon instanceof File) {
        formData.append("icon", data.icon);
      }

      if (editingService) {
        await updateService(editingService._id, formData);
        toast({
          title: "Service Updated",
          description: `"${data.title}" updated successfully.`,
        });
      } else {
        await createService(formData);
        toast({
          title: "Service Added",
          description: `"${data.title}" added successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    setLoading(true);
    try {
      await deleteService(id);
      toast({
        title: "Service Deleted",
        description: `"${title}" has been deleted successfully.`,
      });
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Services Management
          </h1>
          <p className="text-muted-foreground">
            Manage services dynamically with CRUD
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="vikram-button gap-2 w-fit">
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add New Service"}
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
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title" {...field} />
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
                          placeholder="Enter description..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <>
                          {editingService && !field.value && (
                            <div className="mb-2">
                              <img
                                src={editingService.icon}
                                alt="current icon"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                              <p className="text-xs text-muted-foreground">
                                Current Icon
                              </p>
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              field.onChange(e.target.files?.[0] || null)
                            }
                          />
                        </>
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
                          className="w-full px-3 py-2 rounded-md border bg-input"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="vikram-button"
                    disabled={loading}
                  >
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingService ? "Update Service" : "Add Service"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingService(null);
                      form.reset();
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
                placeholder="Search services..."
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
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Services Grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service._id} className="vikram-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={service.icon}
                      alt={service.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge
                        variant={
                          service.status === "active" ? "default" : "secondary"
                        }
                        className={
                          service.status === "active"
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : ""
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />{" "}
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {service.description}
                </p>
                <div className="text-xs text-muted-foreground">
                  Added:{" "}
                  {new Date(service.createdAt).toLocaleDateString("en-IN")}
                </div>
                <div className="flex gap-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={async () => {
                      const res = await getServiceById(service._id);
                      setViewingService(res.data);
                      toast({
                        title: "Service Details",
                        description: `Viewing "${res.data.title}"`,
                      });
                    }}
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button> */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => {
                      setEditingService(service);
                      form.reset({
                        title: service.title,
                        description: service.description,
                        status: service.status,
                        icon: null, // reset file field
                      });
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
                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{service.title}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleDelete(service._id, service.title)
                          }
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
      )}

      {!loading && filteredServices.length === 0 && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No services found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
