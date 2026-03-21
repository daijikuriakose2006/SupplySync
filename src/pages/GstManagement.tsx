import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Percent } from "lucide-react";
import { gstApi, productsApi } from "@/lib/api";

interface GstEntry {
  _id?: string;
  category: string;
  percentage: number;
}

export default function GstManagement() {
  const [gstRates, setGstRates] = useState<GstEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([gstApi.list(), productsApi.categories()])
      .then(([gRes, cRes]) => {
        setGstRates(gRes.data);
        setCategories(cRes.data);
      }).catch(() => {});
  }, []);

  const existingCategories = gstRates.map((g) => g.category.toLowerCase());
  const filteredCategories = categories.filter(
    (c) => c.toLowerCase().includes(newCategory.toLowerCase()) && !existingCategories.includes(c.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newPercentage.trim()) return;
    const pct = parseFloat(newPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Invalid GST percentage", variant: "destructive" }); return;
    }
    try {
      const res = await gstApi.save({ category: newCategory.trim(), percentage: pct });
      setGstRates((prev) => {
        const exists = prev.find((g) => g.category === newCategory.trim());
        if (exists) return prev.map((g) => g.category === newCategory.trim() ? res.data : g);
        return [...prev, res.data];
      });
      setNewCategory(""); setNewPercentage("");
      toast({ title: `GST ${pct}% set for ${newCategory}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (category: string) => {
    try {
      await gstApi.remove(category);
      setGstRates(gstRates.filter((g) => g.category !== category));
      toast({ title: `Removed GST for ${category}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (category: string, newPct: string) => {
    const pct = parseFloat(newPct);
    if (isNaN(pct) || pct < 0) return;
    try {
      const res = await gstApi.save({ category, percentage: pct });
      setGstRates(gstRates.map((g) => g.category === category ? res.data : g));
      toast({ title: "GST rate updated" });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">GST Management</h1>
        <p className="text-muted-foreground">Set GST percentage for each product category. This will be applied in bills.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add GST Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Label>Category</Label>
              <Input
                placeholder="e.g. Dairy, Bakery..."
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setShowCatDropdown(true); }}
                onFocus={() => setShowCatDropdown(true)}
                onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
              />
              {showCatDropdown && newCategory && filteredCategories.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button key={cat} type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
                      onMouseDown={(e) => { e.preventDefault(); setNewCategory(cat); setShowCatDropdown(false); }}
                    >{cat}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-32">
              <Label>GST %</Label>
              <Input type="number" step="0.1" min="0" max="100" placeholder="18" value={newPercentage} onChange={(e) => setNewPercentage(e.target.value)} />
            </div>
            <Button type="submit"><Plus className="h-4 w-4 mr-1" />Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            GST Rates by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gstRates.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No GST rates configured yet. Add one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">GST %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gstRates.map((entry) => (
                  <TableRow key={entry.category}>
                    <TableCell><Badge variant="secondary">{entry.category}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number" step="0.1" min="0" max="100"
                        className="w-24 mx-auto text-center"
                        value={entry.percentage}
                        onChange={(e) => setGstRates(gstRates.map((g) => g.category === entry.category ? { ...g, percentage: parseFloat(e.target.value) || 0 } : g))}
                        onBlur={(e) => handleUpdate(entry.category, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.category)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
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
