import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Gift,
  Users,
  Rocket,
  Settings,
  Mail,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Schemes & Offers", href: "/admin/schemes", icon: Gift },
  { name: "Testimonials", href: "/admin/testimonials", icon: Users },
  { name: "New Launches", href: "/admin/launches", icon: Rocket },
  { name: "Services", href: "/admin/services", icon: Settings },
  { name: "Enquiries", href: "/admin/enquiries", icon: Mail },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored tokens/auth data
    localStorage.removeItem("admin_token");
    sessionStorage.clear();

    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });

    // Navigate to login page (or home page)
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="vikram-nav h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                VA
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Vikramshila Automobiles</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="vikram-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout? You will need to login again
                  to access the admin panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="vikram-button"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 top-16 z-30 w-64 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto py-6">
              <nav className="px-4 space-y-2">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/admin"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground vikram-button"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-20 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="container max-w-7xl mx-auto p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
