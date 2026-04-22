import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, ShieldCheck, UserCog, Trash2 } from "lucide-react";

const PAGES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "categories", label: "Categories" },
  { key: "customers", label: "Customers" },
  { key: "chat", label: "Chat" },
  { key: "brokers", label: "Brokers" },
  { key: "broker_pickups", label: "Broker Pickups" },
  { key: "quotations", label: "Quotations" },
  { key: "sale_history", label: "Sale History" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
  { key: "stickers", label: "Stickers" },
  { key: "delivery_zones", label: "Delivery Zones" },
  { key: "delivery_accounts", label: "Delivery Accounts" },
  { key: "newsletter", label: "Newsletter" },
  { key: "notifications", label: "Notifications" },
  { key: "hero_slides", label: "Hero Slides" },
  { key: "store_location", label: "Store Location" },
  { key: "settings", label: "Settings" },
  { key: "staff", label: "Staff & Roles" },
  { key: "attendance", label: "Attendance" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;
type Action = (typeof ACTIONS)[number];
type PermMap = Record<string, Record<Action, boolean>>;

const ROLE_TEMPLATES: Record<string, PermMap> = {
  admin: PAGES.reduce((a, p) => ({ ...a, [p.key]: { view: true, create: true, edit: true, delete: true } }), {} as PermMap),
  manager: PAGES.reduce((a, p) => ({ ...a, [p.key]: { view: true, create: true, edit: true, delete: false } }), {} as PermMap),
  cashier: PAGES.reduce((a, p) => {
    const allowed = ["dashboard", "pos", "products", "inventory", "customers", "sale_history", "quotations", "attendance"];
    return { ...a, [p.key]: { view: allowed.includes(p.key), create: ["pos", "quotations"].includes(p.key), edit: false, delete: false } };
  }, {} as PermMap),
  storekeeper: PAGES.reduce((a, p) => {
    const allowed = ["dashboard", "inventory", "products", "broker_pickups", "attendance"];
    return { ...a, [p.key]: { view: allowed.includes(p.key), create: p.key === "broker_pickups", edit: ["inventory", "broker_pickups"].includes(p.key), delete: false } };
  }, {} as PermMap),
  accountant: PAGES.reduce((a, p) => {
    const allowed = ["dashboard", "expenses", "reports", "sale_history", "attendance"];
    return { ...a, [p.key]: { view: allowed.includes(p.key), create: p.key === "expenses", edit: p.key === "expenses", delete: false } };
  }, {} as PermMap),
  staff: PAGES.reduce((a, p) => ({ ...a, [p.key]: { view: p.key === "dashboard" || p.key === "attendance", create: p.key === "attendance", edit: false, delete: false } }), {} as PermMap),
};

const emptyForm = { user_id: "", full_name: "", email: "", phone: "", password: "", role_label: "staff", is_active: true, permissions: ROLE_TEMPLATES.staff };

const Staff = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: staff = [] } = useQuery({
    queryKey: ["staff_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_permissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          role_label: form.role_label,
          is_active: form.is_active,
          permissions: form.permissions,
        };
        const { error } = await supabase.from("staff_permissions").update(payload).eq("id", editing);
        if (error) throw error;
        return;
      }

      // Create flow: provision auth user + permission row in one call
      if (!form.email.trim() || !form.password.trim()) {
        throw new Error("Email and password are required to create a staff account");
      }
      if (form.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const { data, error } = await supabase.functions.invoke("admin-create-staff", {
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          role_label: form.role_label,
          is_active: form.is_active,
          permissions: form.permissions,
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_permissions"] });
      toast.success(editing ? "Staff updated" : "Staff account created — they can log in now");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_permissions"] });
      toast.success("Staff removed");
    },
  });

  const editStaff = (s: any) => {
    setEditing(s.id);
    setForm({
      user_id: s.user_id,
      full_name: s.full_name || "",
      email: s.email || "",
      phone: s.phone || "",
      password: "",
      role_label: s.role_label,
      is_active: s.is_active,
      permissions: { ...ROLE_TEMPLATES.staff, ...(s.permissions || {}) },
    });
    setOpen(true);
  };

  const applyTemplate = (role: string) => {
    setForm((f: any) => ({ ...f, role_label: role, permissions: ROLE_TEMPLATES[role] || ROLE_TEMPLATES.staff }));
  };

  const togglePerm = (page: string, action: Action) => {
    setForm((f: any) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [page]: { ...(f.permissions[page] || {}), [action]: !f.permissions[page]?.[action] },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="h-6 w-6" /> Staff & Roles</h1>
          <p className="text-sm text-muted-foreground">Create user accounts and control exactly what each person can do</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 text-sm bg-muted/50 border-l-4 border-primary">
          <p className="font-medium">How staff accounts work</p>
          <ol className="list-decimal pl-5 mt-1 text-muted-foreground space-y-0.5">
            <li>Click <strong>Add Staff</strong> and enter their email + a starter password.</li>
            <li>Pick a role template, then fine-tune per-page access if needed.</li>
            <li>Hand the credentials to the staff member — they can log in immediately at <code>/login</code>.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{s.email || s.phone || "—"}</p>
                </div>
                <Badge variant={s.is_active ? "default" : "secondary"} className="capitalize">{s.role_label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">UID: {s.user_id}</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(s.permissions || {}).filter(([_, v]: any) => v?.view).slice(0, 6).map(([k]) => (
                  <Badge key={k} variant="outline" className="text-xs">{PAGES.find((p) => p.key === k)?.label || k}</Badge>
                ))}
                {Object.entries(s.permissions || {}).filter(([_, v]: any) => v?.view).length > 6 && (
                  <Badge variant="outline" className="text-xs">+{Object.entries(s.permissions || {}).filter(([_, v]: any) => v?.view).length - 6} more</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editStaff(s)}><Pencil className="h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {staff.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No staff added yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> {editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editing}
                  placeholder="staff@example.com"
                />
              </div>
              {!editing && (
                <div>
                  <Label>Starter Password *</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Share this with the staff member — they can change it after first login.</p>
                </div>
              )}
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Role Template</Label>
                <Select value={form.role_label} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROLE_TEMPLATES).map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>

            <div>
              <Label className="text-base">Per-page Permissions</Label>
              <p className="text-xs text-muted-foreground mb-2">Tick exactly what this person can do on each page.</p>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Page</th>
                      {ACTIONS.map((a) => <th key={a} className="p-2 capitalize">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PAGES.map((p) => (
                      <tr key={p.key} className="border-t">
                        <td className="p-2 font-medium">{p.label}</td>
                        {ACTIONS.map((a) => (
                          <td key={a} className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!form.permissions[p.key]?.[a]}
                              onChange={() => togglePerm(p.key, a)}
                              className="h-4 w-4"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => save.mutate()}
              disabled={
                !form.full_name ||
                !form.email ||
                (!editing && !form.password) ||
                save.isPending
              }
            >
              {save.isPending ? "Saving…" : editing ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
