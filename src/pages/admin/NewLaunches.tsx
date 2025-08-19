import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Image,
  Play
} from "lucide-react";

const launches = [
  {
    id: 1,
    title: "Tata Ace Gold EX",
    description: "Enhanced version of the popular Ace Gold with improved features and performance",
    launchDate: "2024-04-15",
    status: "upcoming",
    image: "/placeholder.svg",
    videoUrl: "https://example.com/video1",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Magic Express Plus",
    description: "Upgraded passenger vehicle with better comfort and safety features",
    launchDate: "2024-03-20",
    status: "launched", 
    image: "/placeholder.svg",
    videoUrl: "https://example.com/video2",
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    title: "Yodha 2.0",
    description: "Next generation pickup truck with advanced technology",
    launchDate: "2024-05-30",
    status: "upcoming",
    image: "/placeholder.svg",
    videoUrl: null,
    createdAt: "2024-01-08",
  },
];

export default function NewLaunches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      launchDate: "",
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "launched":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default:
        return "";
    }
  };

  const filteredLaunches = launches.filter(launch => {
    const matchesSearch = launch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         launch.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || launch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: number, title: string) => {
    toast({
      title: "Launch Deleted",
      description: `"${title}" has been deleted successfully.`,
    });
  };

  const handleSubmit = (data: any) => {
    toast({
      title: "Launch Added",
      description: `New launch "${data.title}" has been added successfully.`,
    });
    setIsAddDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="vikram-button gap-2 w-fit">
              <Plus className="h-4 w-4" />
              Add Launch
            </Button>
          </DialogTrigger>
          <DialogContent className="vikram-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Launch</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                        <Textarea placeholder="Enter product description..." {...field} />
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
                <div className="flex gap-2">
                  <Button type="submit" className="vikram-button">Add Launch</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
              <option value="launched">Launched</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Launches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLaunches.map((launch) => (
          <Card key={launch.id} className="vikram-card overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-muted overflow-hidden">
                <img
                  src={launch.image}
                  alt={launch.title}
                  className="w-full h-full object-cover"
                />
                {launch.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                )}
              </div>
              <Badge 
                className={`absolute top-3 right-3 ${getStatusColor(launch.status)}`}
              >
                {launch.status}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{launch.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{launch.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Launch: {new Date(launch.launchDate).toLocaleDateString("en-IN")}</span>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="vikram-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Launch</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{launch.title}"? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(launch.id, launch.title)}
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

      {filteredLaunches.length === 0 && (
        <Card className="vikram-card">
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No launches found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}