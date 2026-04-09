import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, IndianRupee, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi } from "@/lib/api";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, trendsRes, catRes] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.salesTrends('daily'),
        dashboardApi.categoryDistribution(),
      ]);
      setSummary(sumRes.data);
      setSalesTrends(trendsRes.data);
      setCategoryDist(catRes.data.map((c: any, i: number) => ({ ...c, fill: COLORS[i % COLORS.length] })));
    } catch {
      toast({ title: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    toast({ title: "Dashboard refreshed" });
  };

  const stats = summary ? [
    { title: "Total Products", value: summary.totalProducts?.toString() || "0", icon: Package, change: "In inventory", trend: "up" as const },
    { title: "Low Stock Items", value: summary.lowStockCount?.toString() || "0", icon: AlertTriangle, change: "Needs attention", trend: "down" as const },
    { title: "Total Revenue", value: `₹${(summary.totalRevenue || 0).toFixed(0)}`, icon: IndianRupee, change: "All time", trend: "up" as const },
    { title: "Active Alerts", value: summary.activeAlerts?.toString() || "0", icon: ShoppingCart, change: "Unread", trend: "down" as const },
  ] : [];

  const topProducts = summary?.topProducts || [];

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sales Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryDist} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {categoryDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {categoryDist.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                  {c.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top Selling Products (This Week)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v} units`} allowDecimals={false} />
                <YAxis type="category" dataKey="productName" width={140} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(v: any) => [`${v} units`, "Quantity Sold"]}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                  {topProducts.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        "hsl(220 90% 55%)",
                        "hsl(250 80% 60%)",
                        "hsl(280 70% 60%)",
                        "hsl(310 65% 58%)",
                        "hsl(340 60% 58%)",
                      ][index] || "hsl(var(--primary))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
