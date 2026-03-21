import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, BarChart3, ScanBarcode, Bell, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-inventory.jpg";

const features = [
  {
    icon: Package,
    title: "Smart Inventory",
    description: "Track stock levels in real-time with automated alerts for low stock and expiry.",
  },
  {
    icon: BarChart3,
    title: "Demand Forecasting",
    description: "Predict future demand with moving average and regression analysis.",
  },
  {
    icon: ScanBarcode,
    title: "Barcode Scanning",
    description: "Speed up operations with barcode-based product lookup and entry.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about low stock, expiring items, and critical thresholds.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure admin and staff roles with granular permission control.",
  },
  {
    icon: Users,
    title: "Multi-User",
    description: "Support concurrent users with secure session management.",
  },
];

const benefits = [
  "Minimize overstocking and understocking",
  "Enable data-driven decision-making",
  "Automate inventory tracking",
  "Improve operational speed",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">SupplySync</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Sign Up
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Package className="h-3.5 w-3.5" />
              Inventory Intelligence Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Smarter Inventory,{" "}
              <span className="text-primary">Better Decisions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              SupplySync helps small and medium businesses efficiently manage inventory, analyze sales data, and forecast demand — reducing waste and maximizing profit.
            </p>
            <div className="space-y-2">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}>
                Learn More
              </Button>
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="rounded-2xl overflow-hidden shadow-2xl border">
              <img src={heroImage} alt="SupplySync inventory dashboard" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              A complete toolkit for managing your inventory and making smarter business decisions.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">Ready to Optimize Your Inventory?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join businesses that have reduced waste and improved planning with SupplySync.
          </p>
          <Button size="lg" onClick={() => navigate("/signup")}>
            Get Started Now
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">SupplySync</span>
          </div>
          <p>© 2026 SupplySync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
