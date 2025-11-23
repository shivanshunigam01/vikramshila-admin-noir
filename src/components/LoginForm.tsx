import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { login } from "@/services/loginService";

interface LoginFormProps {
  onLogin: () => void;
  onCancel: () => void;
}

export default function LoginForm({ onLogin, onCancel }: LoginFormProps) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token, user } = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!token || !user) {
        console.warn("[login] Missing token/user in response", { token, user });
        toast({
          title: "Login response unexpected",
          description: "Token or user not found in response.",
          variant: "destructive",
        });
        return;
      }

      // ✅ persist to localStorage (and verify)
      try {
        console.log("[login] setting storage on", window.location.origin);
        localStorage.setItem("admin_token", String(token));
        localStorage.setItem("admin_user", JSON.stringify(user));

        const checkToken = localStorage.getItem("admin_token");
        const checkUser = localStorage.getItem("admin_user");
      } catch (storageErr) {
        console.error("[login] localStorage error", storageErr);
        toast({
          title: "Storage blocked",
          description:
            "Could not save login to local storage (blocked by browser or sandbox).",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login Successful",
        description: `Welcome ${user?.name || ""}`,
      });

      onLogin?.();
      // or navigate("/admin");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password";
      toast({
        title: "Login Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md vikram-card">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-black" />
                  ) : (
                    <Eye className="h-4 w-4 text-black" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="vikram-button flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Lock className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
