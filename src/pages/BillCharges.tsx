import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Receipt, FileText } from "lucide-react";
import { billChargesApi } from "@/lib/api";

interface BillCharge {
  _id: string;
  name: string;
  percentage: number;
}

export default function BillCharges() {
  const [charges, setCharges] = useState<BillCharge[]>([]);
  const [newName, setNewName] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    billChargesApi.list().then((res) => setCharges(res.data)).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPercentage.trim()) return;
    const pct = parseFloat(newPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Invalid percentage (0-100)", variant: "destructive" }); return;
    }
    try {
      const res = await billChargesApi.create({ name: newName.trim(), percentage: pct });
      setCharges([...charges, res.data]);
      setNewName(""); setNewPercentage("");
      toast({ title: `Added "${newName.trim()}" at ${pct}%` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await billChargesApi.remove(id);
      setCharges(charges.filter((c) => c._id !== id));
      toast({ title: `Removed "${name}"` });
    } catch {}
  };

  const handleUpdate = async (id: string, newPct: string) => {
    const pct = parseFloat(newPct);
    if (isNaN(pct) || pct < 0) return;
    try {
      const res = await billChargesApi.update(id, pct);
      setCharges(charges.map((c) => c._id === id ? res.data : c));
      toast({ title: "Charge updated" });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bill Charges</h1>
        <p className="text-muted-foreground">
          Add extra charges (e.g. Gas, Service, Packaging) applied as a percentage on the overall bill total.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add New Charge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Charge Name</Label>
              <Input placeholder="e.g. Gas, Service Charge..." value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="w-32">
              <Label>Percentage %</Label>
              <Input type="number" step="0.1" min="0" max="100" placeholder="5" value={newPercentage} onChange={(e) => setNewPercentage(e.target.value)} />
            </div>
            <Button type="submit"><Plus className="h-4 w-4 mr-1" />Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Configured Bill Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {charges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No bill charges configured yet. Add one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charge Name</TableHead>
                  <TableHead className="text-center">Percentage %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge._id}>
                    <TableCell><Badge variant="secondary">{charge.name}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number" step="0.1" min="0" max="100"
                        className="w-24 mx-auto text-center"
                        value={charge.percentage}
                        onChange={(e) => setCharges(charges.map((c) => c._id === charge._id ? { ...c, percentage: parseFloat(e.target.value) || 0 } : c))}
                        onBlur={(e) => handleUpdate(charge._id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(charge._id, charge.name)}>
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
