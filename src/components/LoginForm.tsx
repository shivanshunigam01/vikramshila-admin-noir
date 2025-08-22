// import { useState } from "react";
// import { useNavigate } from "react-router-dom"; // ✅ add this
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { Eye, EyeOff, User, Lock } from "lucide-react";
// import { login } from "@/services/loginService";

// interface LoginFormProps {
//   onLogin: () => void;
//   onCancel: () => void;
// }

// export default function LoginForm({ onLogin, onCancel }: LoginFormProps) {
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();
//   const navigate = useNavigate(); // ✅ hook for navigation

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     debugger;
//     try {
//       const response = await login({
//         email: formData.username,
//         password: formData.password,
//       });
//         setIsLoading(false);
//       }
//     } catch (err: any) {
//         onLogin(); // ✅ parent decides where to go
//         setIsLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <Card className="w-full max-w-md vikram-card">
//         <CardHeader className="text-center space-y-4">
//           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
//             <User className="h-8 w-8 text-primary" />
//           </div>
//           <CardTitle className="text-2xl">Admin Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="username">Username</Label>
//               <Input
//                 id="username"
//                 type="text"
//                 placeholder="Enter your username"
//                 value={formData.username}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, username: e.target.value }))
//                 }
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={formData.password}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       password: e.target.value,
//                     }))
//                   }
//                   required
//                 />
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-4 w-4" />
//                   ) : (
//                     <Eye className="h-4 w-4" />
//                   )}
//                 </Button>
//               </div>
//             </div>

//             <div className="flex gap-2 pt-4">
//               <Button
//                 type="submit"
//                 className="vikram-button flex-1"
//                 disabled={isLoading}
//               >
//                 {isLoading ? (
//                   <>
//                     <Lock className="h-4 w-4 mr-2 animate-spin" />
//                     Logging in...
//                   </>
//                 ) : (
//                   <>
//                     <Lock className="h-4 w-4 mr-2" />
//                     Login
//                   </>
//                 )}
//               </Button>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={onCancel}
//                 disabled={isLoading}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>

//           {/* <div className="mt-6 p-3 bg-muted/20 rounded-lg">
//             <p className="text-xs text-muted-foreground text-center">
//               Demo Credentials:
//               <br />
//               Username: <span className="font-mono">admin</span>
//               <br />
//               Password: <span className="font-mono">admin123</span>
//             </p>
//           </div> */}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ add this
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
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate(); // ✅ hook for navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({
        email: formData.username,
        password: formData.password,
      });

      // ✅ Login success
      onLogin();
      setIsLoading(false);
    } catch (err: any) {
      // ❌ Login failed
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
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
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
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
