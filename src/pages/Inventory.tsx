import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Package, RefreshCw } from "lucide-react";
import { productsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice: number;
  stockQuantity: number;
  barcode?: string;
  expiryDate?: string | null;
  supplierName?: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        productsApi.list({ search: search || undefined }),
        productsApi.categories(),
      ]);
      setProducts(pRes.data.products);
      setCategories(cRes.data);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // client-side filter for instant feel
  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.barcode || "").includes(q)
    );
  }, [products, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.remove(id);
      setProducts(products.filter((p) => p._id !== id));
      toast({ title: "Product deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const getStockBadge = (qty: number) => {
    if (qty <= 5) return <Badge variant="destructive">Critical</Badge>;
    if (qty <= 15) return <Badge className="bg-warning text-warning-foreground">Low</Badge>;
    return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditProduct(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <ProductForm
                product={editProduct}
                categories={categories}
                onSave={async (formData) => {
                  try {
                    if (editProduct) {
                      const res = await productsApi.update(editProduct._id, formData);
                      setProducts(products.map((p) => (p._id === editProduct._id ? res.data : p)));
                      toast({ title: "Product updated" });
                    } else {
                      const res = await productsApi.create(formData);
                      setProducts([res.data, ...products]);
                      toast({ title: "Product added" });
                    }
                    setDialogOpen(false);
                    // Refresh categories
                    const cRes = await productsApi.categories();
                    setCategories(cRes.data);
                  } catch (err: any) {
                    toast({ title: "Error", description: err.response?.data?.message || "Failed to save", variant: "destructive" });
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {filtered.length} products
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading products...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{product.barcode || "—"}</TableCell>
                      <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stockQuantity}</TableCell>
                      <TableCell>{getStockBadge(product.stockQuantity)}</TableCell>
                      <TableCell className="text-muted-foreground">{product.supplierName || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { setEditProduct(product); setDialogOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
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

function ProductForm({
  product,
  categories,
  onSave,
}: {
  product: Product | null;
  categories: string[];
  onSave: (data: object) => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || "",
    sellingPrice: product?.sellingPrice?.toString() || "",
    buyingPrice: product?.buyingPrice?.toString() || "",
    stockQuantity: product?.stockQuantity?.toString() || "",
    barcode: product?.barcode || "",
    expiryDate: product?.expiryDate ? product.expiryDate.split("T")[0] : "",
    supplierName: product?.supplierName || "",
  });
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.toLowerCase().includes(form.category.toLowerCase()) && c.toLowerCase() !== form.category.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      category: form.category,
      sellingPrice: parseFloat(form.sellingPrice),
      buyingPrice: parseFloat(form.buyingPrice) || 0,
      stockQuantity: parseInt(form.stockQuantity) || 0,
      barcode: form.barcode || undefined,
      expiryDate: form.expiryDate || null,
      supplierName: form.supplierName,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Product Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="relative">
          <Label>Category</Label>
          <Input
            value={form.category}
            onChange={(e) => { setForm({ ...form, category: e.target.value }); setShowCatDropdown(true); }}
            onFocus={() => setShowCatDropdown(true)}
            onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
            placeholder="Type or select..."
          />
          {showCatDropdown && form.category && filteredCategories.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-32 overflow-y-auto">
              {filteredCategories.map((cat) => (
                <button
                  key={cat} type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); setForm({ ...form, category: cat }); setShowCatDropdown(false); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Barcode</Label>
          <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        </div>
        <div>
          <Label>Selling Price (₹) *</Label>
          <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
        </div>
        <div>
          <Label>Buying Price (₹)</Label>
          <Input type="number" step="0.01" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} />
        </div>
        <div>
          <Label>Stock Quantity</Label>
          <Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
        </div>
        <div>
          <Label>Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Supplier</Label>
          <Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
        </div>
      </div>
      <Button type="submit" className="w-full">
        {product ? "Update Product" : "Add Product"}
      </Button>
    </form>
  );
}
