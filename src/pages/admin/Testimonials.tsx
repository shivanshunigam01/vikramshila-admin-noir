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
  Users,
  Star,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";

import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialById,
  getTestimonials,
  updateTestimonial,
} from "@/services/testimonialsService";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // 🔹 loader state

  const form = useForm({
    defaultValues: {
      customerName: "",
      location: "",
      testimonialText: "",
      rating: 5,
      image: null as File | null,
    },
  });

  const editForm = useForm({
    defaultValues: {
      customerName: "",
      location: "",
      testimonialText: "",
      rating: 5,
      image: null as File | null,
    },
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const res = await getTestimonials();
      setTestimonials(res.data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch testimonials",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.customerName);
      formData.append("location", data.location);
      formData.append("message", data.testimonialText);
      formData.append("rating", data.rating);
      if (data.image) formData.append("image", data.image);

      await createTestimonial(formData);

      toast({
        title: "Testimonial Added",
        description: `New testimonial from ${data.customerName} has been added.`,
      });

      setIsAddDialogOpen(false);
      form.reset();
      loadTestimonials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add testimonial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (id: string) => {
    setLoading(true);
    try {
      const res = await getTestimonialById(id);
      const t = res.data;
      editForm.reset({
        customerName: t.name,
        location: t.location,
        testimonialText: t.message,
        rating: t.rating,
        image: null,
      });
      setSelectedId(id);
      setIsEditDialogOpen(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load testimonial",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.customerName);
      formData.append("location", data.location);
      formData.append("message", data.testimonialText);
      formData.append("rating", data.rating);
      if (data.image) formData.append("image", data.image);

      await updateTestimonial(selectedId, formData);

      toast({
        title: "Updated",
        description: "Testimonial updated successfully",
      });

      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedId(null);
      loadTestimonials();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update testimonial",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    setLoading(true);
    try {
      await deleteTestimonial(id);
      toast({
        title: "Deleted",
        description: `Testimonial from ${customerName} deleted`,
      });
      loadTestimonials();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete testimonial",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const matchesSearch =
      testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || testimonial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
      />
    ));

  return (
    <div className="space-y-6">
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Customer Testimonials
          </h1>
          <p className="text-muted-foreground">
            Manage customer reviews and testimonials
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="vikram-button gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Testimonial</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="testimonialText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testimonial Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter testimonial..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 rounded-md border bg-input"
                        >
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="vikram-button">
                    Add
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="vikram-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="testimonialText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter testimonial..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 rounded-md border bg-input"
                      >
                        <option value={5}>5 Stars - Excellent</option>
                        <option value={4}>4 Stars - Very Good</option>
                        <option value={3}>3 Stars - Good</option>
                        <option value={2}>2 Stars - Fair</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
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

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search testimonials..."
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
              <option value="published">Published</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTestimonials.map((testimonial) => (
          <Card key={testimonial._id} className="vikram-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {testimonial.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    testimonial.status === "published" ? "default" : "secondary"
                  }
                >
                  {testimonial.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-1">
                {renderStars(testimonial.rating)}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({testimonial.rating}/5)
                </span>
              </div>

              <p className="text-sm text-muted-foreground italic">
                "{testimonial.message}"
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(testimonial.createdAt).toLocaleDateString("en-IN")}
              </div>

              <div className="flex gap-2">
                {/* <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleEditClick(testimonial._id)}
                >
                  <Edit className="h-3 w-3" />
                  Edit
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
                      <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the testimonial from{" "}
                        {testimonial.name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDelete(testimonial._id, testimonial.name)
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

      {filteredTestimonials.length === 0 && !loading && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No testimonials found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
