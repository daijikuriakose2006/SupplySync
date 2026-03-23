import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { alertsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AlertItem {
  _id: string;
  type: "low_stock" | "expiry";
  productName: string;
  message: string;
  severity: "high" | "medium" | "low";
  isRead: boolean;
  createdAt: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // Auto-check for new alerts then fetch
      await alertsApi.check();
      const res = await alertsApi.list();
      setAlerts(res.data);
    } catch {
      toast({ title: "Failed to load alerts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await alertsApi.remove(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      toast({ title: "Alert deleted" });
    } catch {
      toast({ title: "Failed to delete alert", variant: "destructive" });
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive" as const;
      case "medium": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Stay on top of low stock and expiry warnings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No alerts at this time. All good!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <Card
              key={alert._id}
              className="animate-fade-in cursor-pointer transition-opacity hover:opacity-80"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => handleDelete(alert._id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.type === "low_stock" ? "bg-destructive/10" : "bg-warning/10"
                }`}>
                  {alert.type === "low_stock" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{alert.productName}</p>
                    <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleDateString("en-IN")}
                    <span className="ml-2 text-destructive">• Click to delete</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
