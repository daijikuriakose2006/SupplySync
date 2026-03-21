import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ShoppingCart, AlertTriangle, RefreshCw } from "lucide-react";
import { recommendationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  predictedDemand: number;
  reorderQty: number;
  urgency: "high" | "medium" | "low";
  supplier: string;
}

const urgencyStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning-foreground border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recommendationsApi.list();
      setRecommendations(res.data);
    } catch {
      toast({ title: "Failed to load recommendations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    fetchData();
    toast({ title: "Recommendations refreshed" });
  };

  const needsReorder = recommendations.filter((r) => r.reorderQty > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recommendations</h1>
          <p className="text-muted-foreground">Products you should restock for next week based on sales trends.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{needsReorder.length}</p>
              <p className="text-sm text-muted-foreground">Products to Reorder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{needsReorder.filter((r) => r.urgency === "high").length}</p>
              <p className="text-sm text-muted-foreground">Urgent Restocks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{recommendations.filter((r) => r.reorderQty === 0).length}</p>
              <p className="text-sm text-muted-foreground">Well Stocked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Next Week Restock Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No products found. Add products to see recommendations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Predicted Demand</TableHead>
                  <TableHead className="text-right">Order Qty</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.name}</TableCell>
                    <TableCell className="text-muted-foreground">{rec.category}</TableCell>
                    <TableCell className="text-right">{rec.currentStock}</TableCell>
                    <TableCell className="text-right">{rec.predictedDemand}</TableCell>
                    <TableCell className="text-right font-medium">
                      {rec.reorderQty > 0 ? rec.reorderQty : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={urgencyStyles[rec.urgency]}>
                        {rec.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{rec.supplier || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
