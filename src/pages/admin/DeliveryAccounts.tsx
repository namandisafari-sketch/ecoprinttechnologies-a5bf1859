import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, User, Phone, Mail, Key, ToggleLeft, ToggleRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminDeliveryAccounts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", pin_code: "" });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["delivery-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!form.full_name || !form.phone || !form.pin_code) throw new Error("Missing fields");
      const { error } = await supabase.from("delivery_accounts").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-accounts"] });
      setForm({ full_name: "", phone: "", email: "", pin_code: "" });
      setOpen(false);
      toast({ title: "Delivery account created!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("delivery_accounts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-accounts"] }),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-accounts"] });
      toast({ title: "Account deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Accounts</h1>
          <p className="text-muted-foreground text-sm">Manage delivery personnel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Delivery Account</DialogTitle></DialogHeader>
            <div className="space-y-4">
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
                <Label>PIN Code *</Label>
                <Input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} placeholder="e.g. 1234" />
              </div>
              <Button className="w-full" onClick={() => createAccount.mutate()} disabled={createAccount.isPending}>
                {createAccount.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((acc: any) => (
            <Card key={acc.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{acc.full_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive.mutate({ id: acc.id, is_active: !acc.is_active })}
                    >
                      {acc.is_active ? (
                        <ToggleRight className="h-5 w-5 text-primary" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAccount.mutate(acc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {acc.phone}</p>
                  {acc.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {acc.email}</p>}
                  <p className="flex items-center gap-1"><Key className="h-3 w-3" /> PIN: {acc.pin_code}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${acc.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {acc.is_active ? "Active" : "Inactive"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No delivery accounts yet.</p>
      )}
    </div>
  );
};

export default AdminDeliveryAccounts;
