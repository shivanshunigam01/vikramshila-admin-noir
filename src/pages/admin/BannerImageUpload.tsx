import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  uploadImage,
  getBannerImages,
  deleteBannerImage,
} from "@/services/bannerServices";

export default function BannerImageUpload() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await getBannerImages();
      if (res.success) {
        setBanners(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch banners:", err.message || err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch banners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("banner", selectedImage);

      const res = await uploadImage(fd);
      if (res.success) {
        toast({
          title: "Upload Successful",
          description: "Banner image uploaded successfully",
        });
        setSelectedImage(null);
        fetchBanners(); // reload banners
      }
    } catch (err: any) {
      console.error("Upload failed:", err.message || err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await deleteBannerImage(id);
      if (res.success) {
        toast({
          title: "Deleted Successfully",
          description: "Banner image deleted successfully",
        });
        fetchBanners(); // reload banners
      }
    } catch (err: any) {
      console.error("Delete failed:", err.message || err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Plus className="h-8 w-8 text-primary" />
            Banner Image Upload
          </h1>
          <p className="text-muted-foreground">Manage your banner images</p>
        </div>

        {/* Upload Form */}
        <Card className="vikram-card max-w-md w-full">
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              className="vikram-button w-full flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Uploading..." : "Upload Image"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Banner Images Table */}
      <Card className="vikram-card">
        <CardHeader>
          <CardTitle>Banner Images ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading banners...
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No banners found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Image
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner) => (
                    <tr
                      key={banner._id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-4 px-2">
                        <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden">
                          <img
                            src={banner.imageUrl}
                            alt="Banner"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(banner.imageUrl, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(banner._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
