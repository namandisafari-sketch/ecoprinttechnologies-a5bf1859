import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, DollarSign, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";

const AdminExpenses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    description: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "cash",
    reference_number: "",
  });

  const [newCatName, setNewCatName] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("expense_categories").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", filterCategory, filterMonth],
    queryFn: async () => {
      let q = supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .gte("expense_date", `${filterMonth}-01`)
        .lte("expense_date", `${filterMonth}-31`)
        .order("expense_date", { ascending: false });
      if (filterCategory !== "all") q = q.eq("category_id", filterCategory);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload = { ...values, amount: Number(values.amount) };
      if (editingId) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: editingId ? "Expense updated" : "Expense added" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted" });
    },
  });

  const addCatMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("expense_categories").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast({ title: "Category added" });
      setNewCatName("");
      setCatOpen(false);
    },
  });

  const resetForm = () => {
    setForm({ category_id: "", amount: "", description: "", expense_date: format(new Date(), "yyyy-MM-dd"), payment_method: "cash", reference_number: "" });
    setEditingId(null);
    setOpen(false);
  };

  const editExpense = (e: any) => {
    setForm({
      category_id: e.category_id || "",
      amount: String(e.amount),
      description: e.description || "",
      expense_date: e.expense_date,
      payment_method: e.payment_method || "cash",
      reference_number: e.reference_number || "",
    });
    setEditingId(e.id);
    setOpen(true);
  };

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const fmt = (n: number) => new Intl.NumberFormat("en-UG").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage business expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense Category</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                <Button onClick={() => newCatName && addCatMutation.mutate(newCatName)} className="w-full">Add Category</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Expense</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount (UGX)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Reference #</Label>
                    <Input value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
                <Button onClick={() => saveMutation.mutate(form)} className="w-full" disabled={!form.amount || !form.category_id}>
                  {editingId ? "Update" : "Save"} Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><TrendingDown className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses ({filterMonth})</p>
                <p className="text-xl font-bold text-foreground">UGX {fmt(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="text-xl font-bold text-foreground">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg"><Calendar className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-xl font-bold text-foreground">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-48" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{format(new Date(e.expense_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell><Badge variant="secondary">{e.expense_categories?.name || "—"}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-sm capitalize">{e.payment_method?.replace("_", " ")}</TableCell>
                  <TableCell className="text-right font-medium">UGX {fmt(e.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editExpense(e)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses recorded for this period</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExpenses;
