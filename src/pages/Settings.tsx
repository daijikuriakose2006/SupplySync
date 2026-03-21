import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Save, LogOut } from "lucide-react";
import { settingsApi } from "@/lib/api";

export default function Settings() {
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "staff";
  const userName = localStorage.getItem("userName") || "";

  useEffect(() => {
    settingsApi.get().then((res) => {
      setShopName(res.data.shopName || "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsApi.update(shopName);
      localStorage.setItem("shopName", shopName);
      toast({ title: "Settings saved", description: "Shop name updated." });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and shop details.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Shop Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : userRole === "admin" ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Shop Name</Label>
                <Input
                  placeholder="Enter your shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This name will appear on customer bills.
                </p>
              </div>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Shop Name</Label>
                <p className="text-lg font-medium text-foreground mt-1">
                  {shopName || <span className="text-muted-foreground italic">Not set by admin</span>}
                </p>
              </div>
              {userName && (
                <div>
                  <Label className="text-muted-foreground">Logged in as</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{userName}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Only admins can change the shop name.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LogOut className="h-4 w-4 text-destructive" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your SupplySync account.
          </p>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
