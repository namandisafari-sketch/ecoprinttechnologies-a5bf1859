import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, RefreshCcw, Undo2 } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-UG").format(n || 0);

const AdminReturnsExchanges = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState("refunds");
  const [refundOpen, setRefundOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  const [refundForm, setRefundForm] = useState({ order_id: "", amount: 0, reason: "", refund_method: "cash", notes: "" });
  const [exchangeForm, setExchangeForm] = useState({ sale_id: "", original_product_id: "", new_product_id: "", reason: "", difference_amount: 0, notes: "" });

  const { data: refunds = [] } = useQuery({
    queryKey: ["refunds-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("refunds").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: exchanges = [] } = useQuery({
    queryKey: ["exchanges-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exchanges").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderResults = [] } = useQuery({
    queryKey: ["order-search-rx", orderSearch],
    queryFn: async () => {
      if (!orderSearch) return [];
      const { data } = await supabase.from("orders").select("id, order_number, customer_name, total").ilike("order_number", `%${orderSearch}%`).limit(20);
      return data || [];
    },
    enabled: orderSearch.length > 1,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-list-rx"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("id, sale_number, customer_name, total").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-rx"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price").eq("is_active", true).order("name").limit(500);
      return data || [];
    },
  });

  const saveRefund = async () => {
    if (!refundForm.order_id || !refundForm.amount) {
      toast.error("Order and amount are required");
      return;
    }
    const { error } = await supabase.from("refunds").insert({
      order_id: refundForm.order_id,
      amount: refundForm.amount,
      reason: refundForm.reason || null,
      refund_method: refundForm.refund_method,
      notes: refundForm.notes || null,
      status: "completed",
    });
    if (error) return toast.error(error.message);
    toast.success("Refund recorded");
    setRefundOpen(false);
    setRefundForm({ order_id: "", amount: 0, reason: "", refund_method: "cash", notes: "" });
    qc.invalidateQueries({ queryKey: ["refunds-list"] });
  };

  const saveExchange = async () => {
    if (!exchangeForm.original_product_id || !exchangeForm.new_product_id) {
      toast.error("Pick both products");
      return;
    }
    const { error } = await supabase.from("exchanges").insert({
      sale_id: exchangeForm.sale_id || null,
      original_product_id: exchangeForm.original_product_id,
      new_product_id: exchangeForm.new_product_id,
      reason: exchangeForm.reason || null,
      difference_amount: exchangeForm.difference_amount || 0,
      notes: exchangeForm.notes || null,
      status: "completed",
    });
    if (error) return toast.error(error.message);
    toast.success("Exchange recorded");
    setExchangeOpen(false);
    setExchangeForm({ sale_id: "", original_product_id: "", new_product_id: "", reason: "", difference_amount: 0, notes: "" });
    qc.invalidateQueries({ queryKey: ["exchanges-list"] });
  };

  const productName = (id: string) => products.find((p: any) => p.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Returns & Exchanges</h1>
        <p className="text-sm text-muted-foreground">Process refunds for online orders and product exchanges for in-store sales.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="refunds"><Undo2 className="h-4 w-4 mr-1" /> Refunds</TabsTrigger>
          <TabsTrigger value="exchanges"><RefreshCcw className="h-4 w-4 mr-1" /> Exchanges</TabsTrigger>
        </TabsList>

        <TabsContent value="refunds" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRefundOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Refund</Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">{refunds.length} refund{refunds.length === 1 ? "" : "s"}</CardTitle></CardHeader>
            <CardContent>
              {refunds.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No refunds yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-3">Order</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Method</th>
                        <th className="py-2 pr-3">Reason</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-mono text-xs">{r.order_id?.slice(0, 8)}</td>
                          <td className="py-2 pr-3 font-medium">UGX {fmt(Number(r.amount))}</td>
                          <td className="py-2 pr-3 capitalize">{r.refund_method}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{r.reason || "—"}</td>
                          <td className="py-2 pr-3"><Badge variant="default" className="capitalize">{r.status}</Badge></td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM dd, yyyy")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setExchangeOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Exchange</Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">{exchanges.length} exchange{exchanges.length === 1 ? "" : "s"}</CardTitle></CardHeader>
            <CardContent>
              {exchanges.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No exchanges yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-3">From product</th>
                        <th className="py-2 pr-3">To product</th>
                        <th className="py-2 pr-3">Difference</th>
                        <th className="py-2 pr-3">Reason</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchanges.map((e: any) => (
                        <tr key={e.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{productName(e.original_product_id)}</td>
                          <td className="py-2 pr-3">{productName(e.new_product_id)}</td>
                          <td className="py-2 pr-3 font-medium">UGX {fmt(Number(e.difference_amount) || 0)}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{e.reason || "—"}</td>
                          <td className="py-2 pr-3"><Badge variant="default" className="capitalize">{e.status}</Badge></td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{format(new Date(e.created_at), "MMM dd, yyyy")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Refund</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search order #</Label>
              <Input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="SW-..." />
              {orderResults.length > 0 && (
                <div className="border rounded-md mt-1 max-h-40 overflow-auto">
                  {orderResults.map((o: any) => (
                    <button key={o.id} type="button" onClick={() => { setRefundForm({ ...refundForm, order_id: o.id, amount: Number(o.total) }); setOrderSearch(o.order_number); }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted">
                      <span className="font-mono">{o.order_number}</span> · {o.customer_name} · UGX {fmt(Number(o.total))}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Amount (UGX)</Label>
              <Input type="number" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={refundForm.refund_method} onValueChange={(v) => setRefundForm({ ...refundForm, refund_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="wallet">Store Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={refundForm.notes} onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button onClick={saveRefund}>Record Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange dialog */}
      <Dialog open={exchangeOpen} onOpenChange={setExchangeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Exchange</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sale (optional)</Label>
              <Select value={exchangeForm.sale_id || "none"} onValueChange={(v) => setExchangeForm({ ...exchangeForm, sale_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Pick sale" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {sales.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.sale_number} · {s.customer_name || "Walk-in"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Original product *</Label>
              <Select value={exchangeForm.original_product_id} onValueChange={(v) => setExchangeForm({ ...exchangeForm, original_product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New product *</Label>
              <Select value={exchangeForm.new_product_id} onValueChange={(v) => setExchangeForm({ ...exchangeForm, new_product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price difference (UGX)</Label>
              <Input type="number" value={exchangeForm.difference_amount} onChange={(e) => setExchangeForm({ ...exchangeForm, difference_amount: Number(e.target.value) || 0 })} />
              <p className="text-xs text-muted-foreground mt-1">Positive = customer pays more, negative = refund.</p>
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={exchangeForm.reason} onChange={(e) => setExchangeForm({ ...exchangeForm, reason: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={exchangeForm.notes} onChange={(e) => setExchangeForm({ ...exchangeForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExchangeOpen(false)}>Cancel</Button>
            <Button onClick={saveExchange}>Record Exchange</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReturnsExchanges;
