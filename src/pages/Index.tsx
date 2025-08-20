import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Car, Users, Award, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginForm from "@/components/LoginForm";

export default function Index() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleAdminClick = () => {
    if (isLoggedIn) {
      navigate("/admin");
    } else {
      setShowLogin(true);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary font-medium">
              <Car className="h-4 w-4" />
              Vikramshila Automobiles
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Driven by Trust,<br />
              <span className="text-primary">Delivered with Pride</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your trusted partner for Tata Motors commercial vehicles. Experience excellence 
              in automotive solutions with our comprehensive range of services.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleAdminClick}
              className="vikram-button gap-2 text-lg px-8 py-6"
            >
              {isLoggedIn ? "Go to Admin Panel" : "Admin Login"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
              <Phone className="h-5 w-5" />
              Contact Sales
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="vikram-card p-6 text-center">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Premium Vehicles</h3>
              <p className="text-muted-foreground">
                Wide range of Tata Motors commercial vehicles for all your business needs
              </p>
            </CardContent>
          </Card>

          <Card className="vikram-card p-6 text-center">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Expert Service</h3>
              <p className="text-muted-foreground">
                Professional service and support from our experienced team
              </p>
            </CardContent>
          </Card>

          <Card className="vikram-card p-6 text-center">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Trusted Quality</h3>
              <p className="text-muted-foreground">
                Proven track record of reliability and customer satisfaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to Manage Your Business?
          </h2>
          <p className="text-muted-foreground">
            Access the admin panel to manage products, schemes, enquiries and more.
          </p>
          <Button 
            onClick={handleAdminClick}
            className="vikram-button gap-2 text-lg px-8 py-6 mt-6"
          >
            {isLoggedIn ? "Go to Admin Panel" : "Admin Login"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {showLogin && (
        <LoginForm 
          onLogin={handleLogin}
          onCancel={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}