import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, PackagePlus, Eye } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-UG").format(n || 0);

const AdminStockReceiving = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Array<{ product_id: string; product_name: string; quantity: number; unit_cost: number }>>([]);

  const { data: receipts = [] } = useQuery({
    queryKey: ["stock-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_receipts")
        .select("*, stock_receipt_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku, unit_cost, stock_quantity").order("name").limit(500);
      return data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const reset = () => {
    setSupplierId("");
    setSupplierName("");
    setNotes("");
    setLines([]);
  };

  const addLine = () => setLines([...lines, { product_id: "", product_name: "", quantity: 1, unit_cost: 0 }]);
  const updateLine = (i: number, patch: Partial<typeof lines[0]>) => {
    const next = [...lines];
    next[i] = { ...next[i], ...patch };
    setLines(next);
  };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x: any) => x.id === productId);
    updateLine(i, {
      product_id: productId,
      product_name: p?.name || "",
      unit_cost: lines[i].unit_cost || Number(p?.unit_cost) || 0,
    });
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  const save = async () => {
    const valid = lines.filter((l) => l.product_id && l.quantity > 0);
    if (valid.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    const supName = supplierId ? suppliers.find((s: any) => s.id === supplierId)?.name : supplierName.trim();

    const { data: receipt, error } = await supabase
      .from("stock_receipts")
      .insert({
        supplier_id: supplierId || null,
        supplier_name: supName || null,
        notes: notes.trim() || null,
        total_amount: total,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }

    const itemPayload = valid.map((l) => ({
      stock_receipt_id: receipt.id,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_cost: l.unit_cost,
      subtotal: l.quantity * l.unit_cost,
    }));
    const { error: itErr } = await supabase.from("stock_receipt_items").insert(itemPayload);
    if (itErr) {
      toast.error(itErr.message);
      return;
    }

    // Increment product stock & log inventory transactions
    for (const l of valid) {
      const p = products.find((x: any) => x.id === l.product_id);
      const newQty = (Number(p?.stock_quantity) || 0) + l.quantity;
      await supabase.from("products").update({ stock_quantity: newQty, unit_cost: l.unit_cost || p?.unit_cost }).eq("id", l.product_id);
      await supabase.from("inventory_transactions").insert({
        product_id: l.product_id,
        type: "stock_in",
        quantity: l.quantity,
        unit_cost: l.unit_cost,
        total_cost: l.quantity * l.unit_cost,
        reference: "stock_receipt",
        reference_id: receipt.id,
        notes: `Received from ${supName || "supplier"}`,
      });
    }

    toast.success("Stock received & inventory updated");
    setOpen(false);
    reset();
    qc.invalidateQueries({ queryKey: ["stock-receipts"] });
    qc.invalidateQueries({ queryKey: ["products-stock"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Receiving</h1>
          <p className="text-sm text-muted-foreground">Record incoming stock from suppliers. Inventory updates automatically.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Receive Stock</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent receipts ({receipts.length})</CardTitle></CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No stock receipts yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Receipt #</th>
                    <th className="py-2 pr-3">Supplier</th>
                    <th className="py-2 pr-3">Items</th>
                    <th className="py-2 pr-3">Total (UGX)</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 font-mono text-xs">{r.receipt_number}</td>
                      <td className="py-2 pr-3">{r.supplier_name || "—"}</td>
                      <td className="py-2 pr-3">{r.stock_receipt_items?.length || 0}</td>
                      <td className="py-2 pr-3 font-medium">{fmt(Number(r.total_amount) || 0)}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{format(new Date(r.received_at || r.created_at), "MMM dd, yyyy HH:mm")}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setViewing(r); setViewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Receive Stock</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Supplier</Label>
                <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Pick supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None / Manual —</SelectItem>
                    {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or supplier name</Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} disabled={!!supplierId} placeholder="Free-text" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">No items added yet</p>
              ) : (
                <div className="space-y-2">
                  {lines.map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end border rounded-md p-2">
                      <div className="col-span-5">
                        <Label className="text-xs">Product</Label>
                        <Select value={l.product_id} onValueChange={(v) => onProductPick(i, v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Pick" /></SelectTrigger>
                          <SelectContent>
                            {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Unit cost (UGX)</Label>
                        <Input type="number" min="0" value={l.unit_cost} onChange={(e) => updateLine(i, { unit_cost: Number(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-1 text-xs text-muted-foreground text-right">{fmt(l.quantity * l.unit_cost)}</div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold">UGX {fmt(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save & Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Receipt {viewing?.receipt_number}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Supplier:</span> {viewing.supplier_name || "—"}</div>
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(viewing.received_at || viewing.created_at), "MMM dd, yyyy HH:mm")}</div>
              </div>
              <table className="w-full text-sm border-t">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Unit Cost</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.stock_receipt_items?.map((it: any) => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2">{it.product_name}</td>
                      <td className="py-2">{it.quantity}</td>
                      <td className="py-2">{fmt(Number(it.unit_cost))}</td>
                      <td className="py-2 text-right">{fmt(Number(it.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="py-2 text-right font-medium">Total UGX</td><td className="py-2 text-right font-bold">{fmt(Number(viewing.total_amount) || 0)}</td></tr>
                </tfoot>
              </table>
              {viewing.notes && <p className="text-sm text-muted-foreground">{viewing.notes}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStockReceiving;
