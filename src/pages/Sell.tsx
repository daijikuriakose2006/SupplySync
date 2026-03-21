import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Printer, ShoppingBag, Search } from "lucide-react";
import { productsApi, salesApi, gstApi, billChargesApi, settingsApi, SaleItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  category: string;
  sellingPrice: number;
  barcode?: string;
  stockQuantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  gstPct: number;
  gstAmount: number;
  itemTotal: number;
}

export default function Sell() {
  const [searchInput, setSearchInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [gstRates, setGstRates] = useState<{ category: string; percentage: number }[]>([]);
  const [billCharges, setBillCharges] = useState<{ _id: string; name: string; percentage: number }[]>([]);
  const [shopName, setShopName] = useState("My Shop");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([gstApi.list(), billChargesApi.list(), settingsApi.get()])
      .then(([gRes, bRes, sRes]) => {
        setGstRates(gRes.data);
        setBillCharges(bRes.data);
        setShopName(sRes.data.shopName || "My Shop");
      })
      .catch(() => {});
  }, []);

  // Search suggestions
  useEffect(() => {
    if (!searchInput.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.list({ search: searchInput, limit: 8 });
        setSuggestions(res.data.products);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const getGstForCategory = (category: string) => {
    const entry = gstRates.find((g) => g.category.toLowerCase() === category.toLowerCase());
    return entry ? entry.percentage : 0;
  };

  const addToCart = (product: Product) => {
    const gstPct = getGstForCategory(product.category);
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) => {
          if (item.product._id !== product._id) return item;
          const qty = item.quantity + 1;
          const itemTotal = item.product.sellingPrice * qty;
          const gstAmount = itemTotal * (gstPct / 100);
          return { ...item, quantity: qty, gstAmount, itemTotal };
        });
      }
      const itemTotal = product.sellingPrice;
      const gstAmount = itemTotal * (gstPct / 100);
      return [...prev, { product, quantity: 1, gstPct, gstAmount, itemTotal }];
    });
    setSearchInput("");
    setShowDropdown(false);
    toast({ title: `Added ${product.name}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    try {
      const res = await productsApi.list({ search: searchInput, limit: 1 });
      if (res.data.products.length > 0) {
        addToCart(res.data.products[0]);
      } else {
        toast({ title: "Product not found", variant: "destructive" });
      }
    } catch {}
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) {
      setCart((prev) => prev.filter((item) => item.product._id !== productId));
    } else {
      setCart((prev) => prev.map((item) => {
        if (item.product._id !== productId) return item;
        const itemTotal = item.product.sellingPrice * qty;
        const gstAmount = itemTotal * (item.gstPct / 100);
        return { ...item, quantity: qty, gstAmount, itemTotal };
      }));
    }
  };

  const removeItem = (productId: string) => setCart((prev) => prev.filter((item) => item.product._id !== productId));

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const totalGst = cart.reduce((sum, item) => sum + item.gstAmount, 0);
  const subtotalWithGst = subtotal + totalGst;
  const billChargeAmounts = billCharges.map((c) => ({ ...c, amount: subtotalWithGst * (c.percentage / 100) }));
  const totalBillCharges = billChargeAmounts.reduce((s, c) => s + c.amount, 0);
  const grandTotal = subtotalWithGst + totalBillCharges;

  const generateBillHTML = () => {
    const date = new Date().toLocaleDateString("en-IN");
    const time = new Date().toLocaleTimeString("en-IN");
    const rows = cart.map((item) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.product.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${item.product.sellingPrice.toFixed(2)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${item.gstPct}%</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${item.gstAmount.toFixed(2)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${(item.itemTotal + item.gstAmount).toFixed(2)}</td>
      </tr>
    `).join("");
    const chargeRows = billChargeAmounts.map((c) => `<p>${c.name} (${c.percentage}%): ₹${c.amount.toFixed(2)}</p>`).join("");
    return `<html><head><title>Bill - ${shopName}</title>
      <style>body{font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:20px}
      table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:8px 12px;text-align:left}
      .total{font-size:18px;font-weight:bold;margin-top:12px}
      @media print{button{display:none}}</style></head>
      <body>
        <div style="text-align:center;margin-bottom:20px">
          <h1 style="margin:0;font-size:24px">${shopName}</h1>
          <p style="color:#666;margin:4px 0">Date: ${date} | Time: ${time}</p><hr/>
        </div>
        <table>
          <thead><tr><th>Product</th><th style="text-align:center">Qty</th>
          <th style="text-align:right">Price</th><th style="text-align:center">GST%</th>
          <th style="text-align:right">GST Amt</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:right;margin-top:16px">
          <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
          <p>Total GST: ₹${totalGst.toFixed(2)}</p>
          ${chargeRows}
          <p class="total">Grand Total: ₹${grandTotal.toFixed(2)}</p>
        </div>
        <div style="text-align:center;margin-top:30px;color:#999;font-size:12px">
          <p>Thank you for shopping at ${shopName}!</p>
        </div>
        <div style="text-align:center;margin-top:10px">
          <button onclick="window.print()" style="padding:8px 24px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer">Print / Save as PDF</button>
        </div>
      </body></html>`;
  };

  const sellAndPrint = async () => {
    if (cart.length === 0) return;
    try {
      const items: SaleItem[] = cart.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        price: item.product.sellingPrice,
      }));
      await salesApi.record(items);
      const html = generateBillHTML();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
      setCart([]);
      toast({ title: "Sale completed! Bill opened for printing." });
    } catch (err: any) {
      toast({ title: "Failed to record sale", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const clearCart = () => { setCart([]); toast({ title: "Cart cleared" }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sell Products</h1>
          <p className="text-muted-foreground">Search by product name or barcode to create a customer bill.</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          {cart.length} items in cart
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Search by name or barcode..."
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((product) => (
                      <button
                        key={product._id} type="button"
                        className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center justify-between gap-2 border-b last:border-b-0 transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); addToCart(product); }}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.barcode || "—"}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">₹{product.sellingPrice.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button type="submit" className="w-full mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Customer Bill</CardTitle>
              <div className="flex gap-2">
                {cart.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={clearCart}>Clear</Button>
                    <Button size="sm" onClick={sellAndPrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Sell & Print Bill
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No items added yet.</p>
                  <p className="text-sm">Search a product name or barcode to start billing.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">GST%</TableHead>
                        <TableHead className="text-right">GST Amt</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product._id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product._id, item.quantity - 1)}>-</Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product._id, item.quantity + 1)}>+</Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">₹{item.product.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.gstPct}%</TableCell>
                          <TableCell className="text-right text-muted-foreground">₹{item.gstAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">₹{(item.itemTotal + item.gstAmount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.product._id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total GST</span><span>₹{totalGst.toFixed(2)}</span>
                    </div>
                    {billChargeAmounts.map((c) => (
                      <div key={c.name} className="flex justify-between text-muted-foreground">
                        <span>{c.name} ({c.percentage}%)</span><span>₹{c.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
