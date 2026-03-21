import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { barcodeApi, productsApi } from "@/lib/api";
import { ScanBarcode, Search, Package, Plus, ArrowRight, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  category: string;
  sellingPrice: number;
  stockQuantity: number;
  supplierName?: string;
  barcode?: string;
}

export default function BarcodeScanner() {
  const [searchInput, setSearchInput] = useState("");
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [addStockQty, setAddStockQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", sellingPrice: "", stockQuantity: "", category: "" });
  const { toast } = useToast();

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

  const handleLookup = async (product?: Product) => {
    if (product) {
      setFoundProduct(product);
      setNotFound(false);
      setSearchInput("");
      setShowDropdown(false);
      return;
    }
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const res = await barcodeApi.lookup(searchInput.trim());
      setFoundProduct(res.data);
      setNotFound(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setFoundProduct(null);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const handleAddStock = async () => {
    if (!foundProduct || !addStockQty || parseInt(addStockQty) <= 0) return;
    try {
      const res = await barcodeApi.scan({ barcode: foundProduct.barcode || "", addStock: parseInt(addStockQty) });
      setFoundProduct(res.data);
      setAddStockQty("");
      toast({ title: `Stock updated! New quantity: ${res.data.stockQuantity}` });
    } catch (err: any) {
      toast({ title: "Failed to update stock", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleAddProduct = async () => {
    if (!addForm.name || !addForm.sellingPrice) return;
    try {
      await productsApi.create({
        name: addForm.name,
        category: addForm.category || "General",
        sellingPrice: parseFloat(addForm.sellingPrice),
        stockQuantity: parseInt(addForm.stockQuantity) || 0,
        barcode: searchInput.trim() || undefined,
      });
      setShowAddDialog(false);
      setNotFound(false);
      setSearchInput("");
      setAddForm({ name: "", sellingPrice: "", stockQuantity: "", category: "" });
      toast({ title: "Product added successfully!" });
    } catch (err: any) {
      toast({ title: "Failed to add product", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Barcode Scanner</h1>
        <p className="text-muted-foreground">Search by product name or barcode to look up products.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ScanBarcode className="h-10 w-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Enter a barcode number or product name below.
            </p>
            <div className="w-full max-w-md relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or barcode..."
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => handleLookup()} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {loading ? "" : "Lookup"}
                </Button>
              </div>
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product._id} type="button"
                      className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center justify-between gap-2 border-b last:border-b-0 transition-colors"
                      onMouseDown={(e) => { e.preventDefault(); handleLookup(product); }}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.barcode || "No barcode"}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">₹{product.sellingPrice.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Found Product */}
      {foundProduct && (
        <Card className="animate-fade-in border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Product Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{foundProduct.name}</p></div>
              <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{foundProduct.category}</p></div>
              <div><p className="text-sm text-muted-foreground">Selling Price</p><p className="font-medium">₹{foundProduct.sellingPrice.toFixed(2)}</p></div>
              <div>
                <p className="text-sm text-muted-foreground">Stock</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{foundProduct.stockQuantity}</p>
                  {foundProduct.stockQuantity <= 5 && <Badge variant="destructive">Low</Badge>}
                </div>
              </div>
              <div><p className="text-sm text-muted-foreground">Supplier</p><p className="font-medium">{foundProduct.supplierName || "—"}</p></div>
              <div><p className="text-sm text-muted-foreground">Barcode</p><p className="font-mono text-sm">{foundProduct.barcode || "—"}</p></div>
            </div>
            {foundProduct.barcode && (
              <div className="mt-4 flex items-end gap-3">
                <div>
                  <Label className="text-sm">Add Stock</Label>
                  <Input
                    type="number" min="1" placeholder="Qty to add" className="w-32 mt-1"
                    value={addStockQty} onChange={(e) => setAddStockQty(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleAddStock}>
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Update Stock
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Not Found */}
      {notFound && (
        <Card className="animate-fade-in border-warning/30">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-3">No product found for <span className="font-mono font-medium text-foreground">"{searchInput}"</span></p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Product
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Barcode</Label><Input value={searchInput} readOnly className="font-mono" /></div>
            <div><Label>Product Name *</Label><Input placeholder="Enter product name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} /></div>
            <div><Label>Category</Label><Input placeholder="e.g. Dairy, Bakery" value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Selling Price (₹) *</Label><Input type="number" step="0.01" placeholder="0.00" value={addForm.sellingPrice} onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })} /></div>
              <div><Label>Stock Quantity</Label><Input type="number" placeholder="0" value={addForm.stockQuantity} onChange={(e) => setAddForm({ ...addForm, stockQuantity: e.target.value })} /></div>
            </div>
            <Button className="w-full" onClick={handleAddProduct}>Add Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
