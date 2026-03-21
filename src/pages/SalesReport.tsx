import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, IndianRupee, ShoppingCart, TrendingUp, Calendar, FileText } from "lucide-react";
import { salesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SaleRecord {
  _id: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  gstPct: number;
  billChargeTotal: number;
  total: number;
  date: string;
  time: string;
}

export default function SalesReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await salesApi.list({ date: selectedDate });
      setSales(res.data);
    } catch {
      toast({ title: "Failed to load sales", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, [selectedDate]);

  const totalItems = sales.reduce((s, sale) => s + sale.quantity, 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const totalBillCharges = sales.reduce((s, sale) => s + (sale.billChargeTotal || 0), 0);
  const uniqueProducts = new Set(sales.map((s) => s.productName)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Report</h1>
          <p className="text-muted-foreground">View daily sales details, items sold, and revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
          <Button variant="outline" size="icon" onClick={fetchSales} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, label: "Total Items Sold", value: totalItems.toString() },
          { icon: IndianRupee, label: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}` },
          { icon: FileText, label: "Bill Charges", value: `₹${totalBillCharges.toFixed(2)}` },
          { icon: TrendingUp, label: "Unique Products", value: uniqueProducts.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Sales on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No sales recorded for this date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">GST%</TableHead>
                    <TableHead className="text-right">Bill Charges</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{sale.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{sale.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{sale.gstPct}%</TableCell>
                      <TableCell className="text-right text-muted-foreground">₹{(sale.billChargeTotal || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">₹{(sale.total + (sale.billChargeTotal || 0)).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
