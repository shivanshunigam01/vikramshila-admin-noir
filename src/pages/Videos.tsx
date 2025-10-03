"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
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
import { Plus, Search, Edit, Trash2, Play, Loader2 } from "lucide-react";
import {
  createVideo,
  deleteVideo,
  getVideoById,
  getVideos,
  updateVideo,
} from "@/services/videoService";

interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  status: "pending" | "published";
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Video | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    videoUrl: "",
  });

  const loadVideos = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getVideos(p);
      setVideos(res.data.data);
      setPages(res.data.pagination.pages);
      setPage(res.data.pagination.page);
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  /** ADD video */
  const handleAdd = async () => {
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        videoUrl: form.videoUrl,
      };

      await createVideo(payload);

      toast({ title: "Video Added" });
      setIsAddOpen(false);
      setForm({ title: "", description: "", status: "pending", videoUrl: "" });
      loadVideos();
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    }
  };

  /** EDIT video */
  const handleEdit = async () => {
    try {
      if (!selected?._id) return;

      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        videoUrl: form.videoUrl,
      };

      await updateVideo(selected._id, payload);

      toast({ title: "Video Updated" });
      setIsEditOpen(false);
      setSelected(null);
      setForm({ title: "", description: "", status: "pending", videoUrl: "" });
      loadVideos();
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    }
  };

  /** DELETE video */
  const handleDelete = async (id: string) => {
    try {
      await deleteVideo(id);
      toast({ title: "Video Deleted" });
      loadVideos();
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    }
  };

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Play className="h-8 w-8 text-primary" /> Videos
        </h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Video</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <Input
              placeholder="YouTube/Vimeo Link"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full p-2 rounded-md border border-gray-700 bg-black text-white"
            >
              <option value="pending" className="bg-black text-white">
                Pending
              </option>
              <option value="published" className="bg-black text-white">
                Published
              </option>
            </select>
            <Button onClick={handleAdd}>Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-2 relative">
        <Search className="h-4 w-4 absolute left-2 top-3 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <Card key={v._id}>
            <CardHeader>
              <CardTitle>{v.title}</CardTitle>
              <Badge
                variant={v.status === "published" ? "default" : "secondary"}
              >
                {v.status}
              </Badge>
            </CardHeader>
            <CardContent>
              {/* If YouTube/Vimeo link, embed */}
              {v.videoUrl.includes("youtube") ||
              v.videoUrl.includes("vimeo") ? (
                <iframe
                  src={v.videoUrl}
                  className="w-full h-48 rounded-md"
                  allowFullScreen
                />
              ) : (
                <video
                  src={v.videoUrl}
                  controls
                  className="w-full h-48 rounded-md"
                />
              )}
              <p className="text-sm mt-2">{v.description}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const res = await getVideoById(v._id);
                    const data = res.data.data;
                    setSelected(data);
                    setForm({
                      title: data.title,
                      description: data.description,
                      status: data.status,
                      videoUrl: data.videoUrl,
                    });
                    setIsEditOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {v.title}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(v._id)}
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

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: pages }, (_, i) => (
          <Button
            key={i}
            variant={i + 1 === page ? "default" : "outline"}
            onClick={() => loadVideos(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            placeholder="YouTube/Vimeo Link"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full p-2 rounded-md border border-gray-700 bg-black text-white"
          >
            <option value="pending" className="bg-black text-white">
              Pending
            </option>
            <option value="published" className="bg-black text-white">
              Published
            </option>
          </select>
          <Button onClick={handleEdit}>Update</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
