import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, AlertCircle, CheckCircle2, FileText, MessageCircle } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => `UGX ${Number(n || 0).toLocaleString()}`;

const BrokerStatement = () => {
  const [brokerId, setBrokerId] = useState("all");

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-all"],
    queryFn: async () => {
      const { data } = await supabase.from("brokers").select("id, full_name, phone, commission_rate").order("full_name");
      return data || [];
    },
  });

  const { data: pickups = [] } = useQuery({
    queryKey: ["broker-statement", brokerId],
    queryFn: async () => {
      let q = supabase.from("broker_pickups").select("*, brokers(full_name, phone, commission_rate)").order("created_at", { ascending: false });
      if (brokerId !== "all") q = q.eq("broker_id", brokerId);
      const { data } = await q;
      return data || [];
    },
  });

  // Aggregate per broker
  const byBroker: Record<string, any> = {};
  pickups.forEach((p: any) => {
    const id = p.broker_id;
    if (!byBroker[id]) {
      byBroker[id] = {
        broker: p.brokers,
        broker_id: id,
        items_out: 0, value_out: 0,
        sold_count: 0, sold_value: 0,
        returned_count: 0,
        paid: 0, unpaid: 0,
        commission_rate: p.brokers?.commission_rate || 0,
        commission_earned: 0,
        pickups: [] as any[],
      };
    }
    const b = byBroker[id];
    b.pickups.push(p);
    if (["released", "overdue"].includes(p.status)) {
      b.items_out += p.quantity;
      b.value_out += Number(p.total_value);
      b.unpaid += Number(p.total_value) - Number(p.amount_paid || 0);
    }
    if (p.status === "sold") {
      b.sold_count += p.quantity;
      b.sold_value += Number(p.total_value);
      b.commission_earned += Number(p.total_value) * (Number(b.commission_rate) / 100);
    }
    if (p.status === "returned") b.returned_count += p.quantity;
    b.paid += Number(p.amount_paid || 0);
  });

  const summaries = Object.values(byBroker);

  const totalOut = summaries.reduce((s: number, b: any) => s + b.value_out, 0);
  const totalSold = summaries.reduce((s: number, b: any) => s + b.sold_value, 0);
  const totalCommission = summaries.reduce((s: number, b: any) => s + b.commission_earned, 0);
  const totalUnpaid = summaries.reduce((s: number, b: any) => s + b.unpaid, 0);

  const printStatement = (b: any) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = b.pickups.map((p: any) => `
      <tr>
        <td>${format(new Date(p.created_at), "MMM dd, yyyy")}</td>
        <td>${p.pickup_number}</td>
        <td>${p.product_name}</td>
        <td style="text-align:right">${p.quantity}</td>
        <td style="text-align:right">${fmt(p.unit_price)}</td>
        <td style="text-align:right">${fmt(p.total_value)}</td>
        <td>${p.status}</td>
      </tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Broker Statement - ${b.broker?.full_name}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20mm;max-width:210mm;margin:auto;color:#222}
        h1{margin:0 0 4px;color:#1a1a1a}
        .meta{color:#666;font-size:13px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f5f5f5}
        .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}
        .box{border:1px solid #ddd;padding:10px;border-radius:6px}
        .box .lbl{font-size:11px;color:#666;text-transform:uppercase}
        .box .val{font-size:16px;font-weight:bold;margin-top:4px}
        @page{size:A4;margin:0}
      </style></head><body>
      <h1>Broker Statement</h1>
      <div class="meta">
        <strong>${b.broker?.full_name}</strong> • ${b.broker?.phone}<br/>
        Generated: ${format(new Date(), "PPpp")}
      </div>
      <div class="summary">
        <div class="box"><div class="lbl">Items Out</div><div class="val">${b.items_out}</div></div>
        <div class="box"><div class="lbl">Value Out</div><div class="val">${fmt(b.value_out)}</div></div>
        <div class="box"><div class="lbl">Sold</div><div class="val">${fmt(b.sold_value)}</div></div>
        <div class="box"><div class="lbl">Commission (${b.commission_rate}%)</div><div class="val">${fmt(b.commission_earned)}</div></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Pickup #</th><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:30px;font-size:11px;color:#666;text-align:center">Eco Print Technologies • Powered by Kabejja Systems</p>
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const waReminder = (b: any) => {
    const dueItems = b.pickups.filter((p: any) => p.status === "released" && p.expected_return_date);
    const lines = dueItems.map((p: any) => `• ${p.product_name} (return by ${format(new Date(p.expected_return_date), "MMM dd")})`).join("%0A");
    const msg = `Hi ${b.broker?.full_name}, friendly reminder from Eco Print Technologies regarding the items you have:%0A${lines}%0AKindly update us. Thank you.`;
    const phone = (b.broker?.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Broker Statements</h1>
          <p className="text-sm text-muted-foreground">Per-broker activity, commission, and outstanding balance</p>
        </div>
        <Select value={brokerId} onValueChange={setBrokerId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brokers</SelectItem>
            {brokers.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg"><Package className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-xs text-muted-foreground">Out with brokers</p><p className="font-bold">{fmt(totalOut)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">Sold via brokers</p><p className="font-bold">{fmt(totalSold)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Commission owed</p><p className="font-bold">{fmt(totalCommission)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">Unpaid balance</p><p className="font-bold">{fmt(totalUnpaid)}</p></div>
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {summaries.map((b: any) => (
          <Card key={b.broker_id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{b.broker?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{b.broker?.phone}</p>
                </div>
                <Badge variant="outline">{b.commission_rate}% commission</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-muted-foreground">Items currently out</p><p className="font-semibold">{b.items_out} ({fmt(b.value_out)})</p></div>
                <div><p className="text-xs text-muted-foreground">Sold</p><p className="font-semibold text-emerald-600">{fmt(b.sold_value)}</p></div>
                <div><p className="text-xs text-muted-foreground">Returned</p><p className="font-semibold">{b.returned_count} items</p></div>
                <div><p className="text-xs text-muted-foreground">Commission earned</p><p className="font-semibold text-primary">{fmt(b.commission_earned)}</p></div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Outstanding balance</span>
                    <span className={`font-bold ${b.unpaid > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(b.unpaid)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => printStatement(b)}><FileText className="h-3 w-3" /> Print Statement</Button>
                <Button size="sm" variant="outline" onClick={() => waReminder(b)}><MessageCircle className="h-3 w-3" /> WhatsApp Reminder</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {summaries.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No broker activity yet.</p>}
      </div>
    </div>
  );
};

export default BrokerStatement;
