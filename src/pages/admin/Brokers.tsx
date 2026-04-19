import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Search, Phone, MapPin, Pencil, UserCheck, UserX } from "lucide-react";

interface Broker {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  id_number: string | null;
  location: string | null;
  commission_rate: number | null;
  is_active: boolean | null;
  notes: string | null;
}

const empty = {
  full_name: "",
  phone: "",
  email: "",
  id_number: "",
  location: "",
  commission_rate: "0",
  notes: "",
  is_active: true,
};

const Brokers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Broker | null>(null);
  const [form, setForm] = useState(empty);

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers", search],
    queryFn: async () => {
      let q = supabase.from("brokers").select("*").order("created_at", { ascending: false });
      if (search) q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Broker[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        id_number: form.id_number.trim() || null,
        location: form.location.trim() || null,
        commission_rate: Number(form.commission_rate) || 0,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("brokers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brokers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brokers"] });
      toast.success(editing ? "Broker updated" : "Broker added");
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (b: Broker) => {
      const { error } = await supabase.from("brokers").update({ is_active: !b.is_active }).eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brokers"] }),
  });

  const startEdit = (b: Broker) => {
    setEditing(b);
    setForm({
      full_name: b.full_name,
      phone: b.phone,
      email: b.email || "",
      id_number: b.id_number || "",
      location: b.location || "",
      commission_rate: String(b.commission_rate || 0),
      notes: b.notes || "",
      is_active: b.is_active ?? true,
    });
    setOpen(true);
  };

  const startAdd = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Brokers</h1>
          <p className="text-sm text-muted-foreground">Registered resellers who pick up stock from the shop</p>
        </div>
        <Button onClick={startAdd}>
          <Plus className="h-4 w-4" /> Add Broker
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brokers.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{b.full_name}</h3>
                  {b.id_number && <p className="text-xs text-muted-foreground">ID: {b.id_number}</p>}
                </div>
                <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {b.phone}</p>
                {b.location && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {b.location}</p>}
                {!!b.commission_rate && <p className="text-muted-foreground">Commission: {b.commission_rate}%</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(b)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate(b)}>
                  {b.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {brokers.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No brokers yet. Add the first one to get started.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Broker" : "Add Broker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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
                <Label>ID Number</Label>
                <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.full_name || !form.phone || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Brokers;
