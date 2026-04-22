import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Printer, IdCard, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WorkerIDCard from "@/components/admin/WorkerIDCard";
import ImageUpload from "@/components/ImageUpload";
import { logAudit } from "@/lib/audit";
import { format } from "date-fns";
import { toPng } from "html-to-image";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_vacation", label: "On Vacation" },
  { value: "on_holiday", label: "On Holiday" },
  { value: "left", label: "Left" },
  { value: "denied", label: "Denied" },
  { value: "n/a", label: "N/A" },
];

const statusVariant = (s: string): any => {
  if (s === "active") return "default";
  if (s === "left" || s === "denied") return "destructive";
  return "secondary";
};

const empty = {
  full_name: "",
  department: "",
  position: "",
  residence: "",
  phone: "",
  email: "",
  national_id: "",
  photo_url: "",
  notes: "",
  status: "active",
  validity_date: "",
};

const Workers = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [previewWorker, setPreviewWorker] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const { data: workers = [] } = useQuery({
    queryKey: ["workers", search, statusFilter],
    queryFn: async () => {
      let q = supabase.from("workers").select("*").order("created_at", { ascending: false });
      if (search) q = q.or(`full_name.ilike.%${search}%,worker_code.ilike.%${search}%,department.ilike.%${search}%,phone.ilike.%${search}%`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (w: any) => {
    setEditing(w);
    setForm({
      full_name: w.full_name || "",
      department: w.department || "",
      position: w.position || "",
      residence: w.residence || "",
      phone: w.phone || "",
      email: w.email || "",
      national_id: w.national_id || "",
      photo_url: w.photo_url || "",
      notes: w.notes || "",
      status: w.status || "active",
      validity_date: w.validity_date || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.department || !form.phone) {
      toast({ title: "Missing fields", description: "Name, department and phone are required.", variant: "destructive" });
      return;
    }
    const payload = { ...form, validity_date: form.validity_date || null };
    if (editing) {
      const { error } = await supabase.from("workers").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      await logAudit({ action: "update", entityType: "worker", entityId: editing.id, description: `Updated worker ${form.full_name}` });
      toast({ title: "Worker updated" });
    } else {
      const { data, error } = await supabase.from("workers").insert(payload).select().single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      await logAudit({ action: "create", entityType: "worker", entityId: data?.id, description: `Created worker ${form.full_name}` });
      toast({ title: "Worker added", description: `Code: ${data?.worker_code}` });
    }
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["workers"] });
  };

  const handleDelete = async (w: any) => {
    if (!confirm(`Delete ${w.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("workers").delete().eq("id", w.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    await logAudit({ action: "delete", entityType: "worker", entityId: w.id, description: `Deleted worker ${w.full_name}` });
    toast({ title: "Worker deleted" });
    qc.invalidateQueries({ queryKey: ["workers"] });
  };

  const updateStatus = async (w: any, status: string) => {
    const { error } = await supabase.from("workers").update({ status }).eq("id", w.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    await logAudit({ action: "update", entityType: "worker", entityId: w.id, description: `Status of ${w.full_name} → ${status}` });
    qc.invalidateQueries({ queryKey: ["workers"] });
  };

  const printCard = () => {
    const el = cardRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>ID Card</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10mm;min-height:100vh;background:#f3f4f6;padding:10mm;}@page{size:auto;margin:10mm;}@media print{body{background:#fff;}}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IdCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workers & ID Cards</h1>
            <p className="text-sm text-muted-foreground">Issue and manage staff identification</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Add Worker
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, code, dept..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <IdCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No workers yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((w: any) => (
            <Card key={w.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border">
                    {w.photo_url ? (
                      <img src={w.photo_url} alt={w.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">{w.full_name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{w.full_name}</p>
                    <p className="text-xs text-muted-foreground">{w.position || w.department}</p>
                    <p className="text-xs font-mono text-primary mt-1">{w.worker_code}</p>
                  </div>
                  <Badge variant={statusVariant(w.status)} className="capitalize">{w.status?.replace(/_/g, " ")}</Badge>
                </div>

                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <p>📞 {w.phone}</p>
                  {w.residence && <p>🏠 {w.residence}</p>}
                  {w.validity_date && <p>Valid until: {format(new Date(w.validity_date), "dd MMM yyyy")}</p>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Select value={w.status} onValueChange={(v) => updateStatus(w, v)}>
                    <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setPreviewWorker(w)} title="Preview ID">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(w)} title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(w)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Worker" : "Add Worker"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Photo</Label>
              <ImageUpload value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Department *</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sales, Technical" />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Senior Technician" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>National ID</Label>
              <Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Residence</Label>
              <Input value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })} placeholder="Address / area of residence" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Validity Date</Label>
              <Input type="date" value={form.validity_date} onChange={(e) => setForm({ ...form, validity_date: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Additional information shown when QR is scanned" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Worker"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ID Card Preview (front + back) */}
      <Dialog open={!!previewWorker} onOpenChange={(o) => !o && setPreviewWorker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Worker ID Card — Front & Back</span>
              <Button size="sm" onClick={printCard}>
                <Printer className="h-4 w-4 mr-1" /> Print Both
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewWorker && (
            <div className="flex flex-wrap justify-center gap-6 p-4 bg-muted/30 rounded-lg">
              <div ref={cardRef} className="flex flex-wrap gap-6 justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">FRONT</span>
                  <WorkerIDCard worker={previewWorker} side="front" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">BACK</span>
                  <WorkerIDCard worker={previewWorker} side="back" />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workers;
