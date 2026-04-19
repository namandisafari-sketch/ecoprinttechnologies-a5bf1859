import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Barcode, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["in_stock", "sold", "reserved", "damaged", "returned"];

const AdminBarcodeTracking = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ barcode: "", serial_number: "", product_id: "", status: "in_stock", notes: "" });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["barcode-items", search, statusFilter],
    queryFn: async () => {
      let q = supabase.from("barcode_items").select("*, products(name, sku)").order("created_at", { ascending: false });
      if (search) q = q.or(`barcode.ilike.%${search}%,serial_number.ilike.%${search}%`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku").eq("is_active", true).order("name").limit(500);
      return data || [];
    },
  });

  const reset = () => {
    setEditing(null);
    setForm({ barcode: "", serial_number: "", product_id: "", status: "in_stock", notes: "" });
  };

  const openEdit = (it: any) => {
    setEditing(it);
    setForm({
      barcode: it.barcode || "",
      serial_number: it.serial_number || "",
      product_id: it.product_id || "",
      status: it.status || "in_stock",
      notes: it.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.barcode.trim()) {
      toast.error("Barcode is required");
      return;
    }
    const payload: any = {
      barcode: form.barcode.trim(),
      serial_number: form.serial_number.trim() || null,
      product_id: form.product_id || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("barcode_items").update(payload).eq("id", editing.id)
      : supabase.from("barcode_items").insert(payload);
    const { error } = await op;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Updated" : "Barcode added");
    setOpen(false);
    reset();
    qc.invalidateQueries({ queryKey: ["barcode-items"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this barcode?")) return;
    const { error } = await supabase.from("barcode_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["barcode-items"] });
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("barcode_items").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["barcode-items"] });
  };

  const statusBadge = (s: string) => {
    const map: any = {
      in_stock: "default",
      sold: "secondary",
      reserved: "outline",
      damaged: "destructive",
      returned: "outline",
    };
    return map[s] || "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barcode Tracking</h1>
          <p className="text-sm text-muted-foreground">Register, scan and manage barcodes & serial numbers tied to products.</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Barcode</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Scan or search barcode / serial..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{items.length} barcode{items.length === 1 ? "" : "s"}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Barcode className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No barcodes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Barcode</th>
                    <th className="py-2 pr-3">Serial</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Added</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any) => (
                    <tr key={it.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 font-mono">{it.barcode}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{it.serial_number || "—"}</td>
                      <td className="py-2 pr-3">{it.products?.name || <span className="text-muted-foreground">Unlinked</span>}</td>
                      <td className="py-2 pr-3">
                        <Select value={it.status || "in_stock"} onValueChange={(v) => updateStatus(it.id, v)}>
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <Badge variant={statusBadge(it.status) as any} className="capitalize">{(it.status || "in_stock").replace("_", " ")}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">{format(new Date(it.created_at), "MMM dd, yyyy")}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(it)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Barcode" : "Add Barcode"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Barcode *</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or type" autoFocus />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
            </div>
            <div>
              <Label>Product</Label>
              <Select value={form.product_id || "none"} onValueChange={(v) => setForm({ ...form, product_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unlinked —</SelectItem>
                  {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBarcodeTracking;
