import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Gift } from "lucide-react";
import {
  createScheme,
  deleteScheme,
  getSchemes,
  updateScheme,
} from "@/services/schemeService";

export default function Schemes() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      discount: "",
      startDate: "",
      endDate: "",
      banner: undefined,
    },
  });

  const resetForm = () =>
    form.reset({
      title: "",
      description: "",
      discount: "",
      startDate: "",
      endDate: "",
      banner: undefined,
    });

  // Fetch schemes from API
  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await getSchemes();
      setSchemes(res.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const filteredSchemes = schemes.filter((scheme) => {
    const matchesSearch =
      scheme.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || scheme.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add scheme
  const handleAdd = async (data: any) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === "banner" && data.banner) {
          formData.append("photos", data.banner); // ✅ map banner -> photos
        } else if (
          data[key] !== undefined &&
          data[key] !== null &&
          key !== "banner"
        ) {
          formData.append(key, data[key]);
        }
      });

      const res = await createScheme(formData);
      setSchemes((prev) => [...prev, res.data]);
      toast({
        title: "Scheme Added",
        description: `"${data.title}" added successfully.`,
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  // Open edit form
  const handleEditOpen = (scheme: any) => {
    setEditingScheme(scheme);
    form.reset({
      title: scheme.title || "",
      description: scheme.description || "",
      discount: scheme.discount || "",
      startDate: scheme.startDate || "",
      endDate: scheme.endDate || "",
      banner: undefined, // reset file input
    });
    setIsEditDialogOpen(true);
  };

  // Update scheme
  const handleUpdate = async (data: any) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === "banner" && data.banner) {
          formData.append("photos", data.banner);
        } else if (
          data[key] !== undefined &&
          data[key] !== null &&
          key !== "banner"
        ) {
          formData.append(key, data[key]);
        }
      });

      const res = await updateScheme(editingScheme._id, formData); // ✅ use _id
      setSchemes((prev) =>
        prev.map((s) => (s._id === editingScheme._id ? res.data : s))
      );
      toast({
        title: "Scheme Updated",
        description: `"${data.title}" updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setEditingScheme(null);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

  // Delete scheme
  const handleDeleteScheme = async (id: string, title: string) => {
    try {
      await deleteScheme(id);
      setSchemes((prev) => prev.filter((s) => s._id !== id)); // ✅ use _id
      toast({
        title: "Scheme Deleted",
        description: `"${title}" deleted successfully.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message });
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="vikram-button gap-2 w-fit">
              <Plus className="h-4 w-4" /> Create Scheme
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scheme</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAdd)}
                className="space-y-4"
              >
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Discount */}
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Banner */}
                <FormField
                  control={form.control}
                  name="banner"
                  render={({ field: { onChange, ref, name } }) => (
                    <FormItem>
                      <FormLabel>Banner</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          name={name}
                          ref={ref}
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Buttons */}
                <div className="flex gap-2">
                  <Button type="submit" className="vikram-button">
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
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
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search schemes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading schemes...</p>
        ) : (
          filteredSchemes.map((scheme) => (
            <Card key={scheme._id} className="vikram-card overflow-hidden">
              <img
                src={scheme.photos?.[0] || "/placeholder.svg"}
                alt={scheme.title}
                className="w-full h-40 object-cover"
              />
              <CardContent className="space-y-2">
                <h3 className="font-semibold">{scheme.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {scheme.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(scheme.status)}>
                    {scheme.status || "N/A"}
                  </Badge>
                  {scheme.discount && <span>{scheme.discount}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditOpen(scheme)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

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
                        <AlertDialogTitle>Delete Scheme</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{scheme.title}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex justify-end gap-2 p-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleDeleteScheme(scheme._id, scheme.title)
                          }
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="vikram-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scheme</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
              {/* Same fields as Add */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="banner"
                render={({ field: { onChange, ref, name } }) => (
                  <FormItem>
                    <FormLabel>Banner</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        name={name}
                        ref={ref}
                        onChange={(e) =>
                          onChange(e.target.files?.[0] || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" className="vikram-button">
                  Update
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
