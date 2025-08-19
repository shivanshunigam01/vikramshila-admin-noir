import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Package,
  IndianRupee
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Ace Gold Petrol",
    category: "SCV Cargo",
    price: "₹3.99 Lakh",
    image: "/placeholder.svg",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Magic Express",
    category: "SCV Passenger",
    price: "₹5.25 Lakh",
    image: "/placeholder.svg",
    status: "active",
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    name: "Yodha Pickup",
    category: "Pickup",
    price: "₹7.45 Lakh",
    image: "/placeholder.svg",
    status: "inactive",
    createdAt: "2024-01-08",
  },
  {
    id: 4,
    name: "Winger Passenger",
    category: "SCV Passenger",
    price: "₹8.90 Lakh",
    image: "/placeholder.svg",
    status: "active",
    createdAt: "2024-01-05",
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Products Management
          </h1>
          <p className="text-muted-foreground">
            Manage your vehicle inventory and listings
          </p>
        </div>
        <Button className="vikram-button gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="vikram-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md border bg-input text-sm"
              >
                <option value="all">All Categories</option>
                <option value="SCV Cargo">SCV Cargo</option>
                <option value="SCV Passenger">SCV Passenger</option>
                <option value="Pickup">Pickup</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="vikram-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Price</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Created</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        <span className="font-medium">{product.price.replace('₹', '')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge 
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={product.status === "active" ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-2 text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}