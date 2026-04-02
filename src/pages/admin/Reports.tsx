import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";

type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const AdminReports = () => {
  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const getDateRange = () => {
    const d = new Date(selectedDate);
    switch (period) {
      case "daily": return { start: selectedDate, end: selectedDate };
      case "weekly": return { start: format(startOfWeek(d), "yyyy-MM-dd"), end: format(endOfWeek(d), "yyyy-MM-dd") };
      case "monthly": return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
      case "quarterly": return { start: format(startOfQuarter(d), "yyyy-MM-dd"), end: format(endOfQuarter(d), "yyyy-MM-dd") };
      case "yearly": return { start: format(startOfYear(d), "yyyy-MM-dd"), end: format(endOfYear(d), "yyyy-MM-dd") };
    }
  };

  const range = getDateRange();

  const { data: salesData } = useQuery({
    queryKey: ["report-sales", range.start, range.end],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("total, subtotal, delivery_fee, created_at, status, payment_status")
        .gte("created_at", `${range.start}T00:00:00`)
        .lte("created_at", `${range.end}T23:59:59`)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: expensesData } = useQuery({
    queryKey: ["report-expenses", range.start, range.end],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .gte("expense_date", range.start)
        .lte("expense_date", range.end)
        .order("expense_date", { ascending: false });
      return data || [];
    },
  });

  const { data: expensesByCategory } = useQuery({
    queryKey: ["report-expenses-cat", range.start, range.end],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("amount, expense_categories(name)")
        .gte("expense_date", range.start)
        .lte("expense_date", range.end);
      const grouped: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        const cat = e.expense_categories?.name || "Uncategorized";
        grouped[cat] = (grouped[cat] || 0) + Number(e.amount);
      });
      return Object.entries(grouped).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    },
  });

  const totalRevenue = (salesData || [])
    .filter((o: any) => o.status !== "cancelled")
    .reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalExpenses = (expensesData || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalOrders = (salesData || []).filter((o: any) => o.status !== "cancelled").length;

  const fmt = (n: number) => new Intl.NumberFormat("en-UG").format(Math.round(n));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Financial reports and business analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Period: {format(new Date(range.start), "MMM dd, yyyy")} — {format(new Date(range.end), "MMM dd, yyyy")}
      </p>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-foreground">UGX {fmt(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><TrendingDown className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-bold text-foreground">UGX {fmt(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${netIncome >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <DollarSign className={`h-5 w-5 ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Income</p>
                <p className={`text-lg font-bold ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>UGX {fmt(netIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg"><BarChart3 className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-lg font-bold text-foreground">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader><CardTitle>Income Statement</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount (UGX)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-bold text-primary">Revenue</TableCell><TableCell /></TableRow>
                  <TableRow><TableCell className="pl-8">Sales Revenue</TableCell><TableCell className="text-right">{fmt(totalRevenue)}</TableCell></TableRow>
                  <TableRow className="border-t-2"><TableCell className="font-bold">Total Revenue</TableCell><TableCell className="text-right font-bold">{fmt(totalRevenue)}</TableCell></TableRow>

                  <TableRow><TableCell className="font-bold text-destructive pt-4">Expenses</TableCell><TableCell /></TableRow>
                  {(expensesByCategory || []).map((c: any) => (
                    <TableRow key={c.name}><TableCell className="pl-8">{c.name}</TableCell><TableCell className="text-right">{fmt(c.amount)}</TableCell></TableRow>
                  ))}
                  <TableRow className="border-t-2"><TableCell className="font-bold">Total Expenses</TableCell><TableCell className="text-right font-bold">{fmt(totalExpenses)}</TableCell></TableRow>

                  <TableRow className="border-t-4 bg-muted/50">
                    <TableCell className="font-bold text-lg">Net Income</TableCell>
                    <TableCell className={`text-right font-bold text-lg ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(netIncome)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader><CardTitle>Balance Sheet</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount (UGX)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-bold text-primary">Assets</TableCell><TableCell /></TableRow>
                  <TableRow><TableCell className="pl-8">Cash from Sales</TableCell><TableCell className="text-right">{fmt(totalRevenue)}</TableCell></TableRow>
                  <TableRow className="border-t-2"><TableCell className="font-bold">Total Assets</TableCell><TableCell className="text-right font-bold">{fmt(totalRevenue)}</TableCell></TableRow>

                  <TableRow><TableCell className="font-bold text-destructive pt-4">Liabilities & Expenses</TableCell><TableCell /></TableRow>
                  <TableRow><TableCell className="pl-8">Total Operating Expenses</TableCell><TableCell className="text-right">{fmt(totalExpenses)}</TableCell></TableRow>
                  <TableRow className="border-t-2"><TableCell className="font-bold">Total Liabilities</TableCell><TableCell className="text-right font-bold">{fmt(totalExpenses)}</TableCell></TableRow>

                  <TableRow className="border-t-4 bg-muted/50">
                    <TableCell className="font-bold text-lg">Equity (Retained Earnings)</TableCell>
                    <TableCell className={`text-right font-bold text-lg ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(netIncome)}</TableCell>
                  </TableRow>

                  <TableRow className="bg-muted/30">
                    <TableCell className="font-semibold">Opening Balance (Period Start)</TableCell>
                    <TableCell className="text-right font-semibold">UGX 0</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-semibold">Closing Balance (Period End)</TableCell>
                    <TableCell className={`text-right font-semibold ${netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>UGX {fmt(netIncome)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader><CardTitle>Expense Breakdown by Category</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (UGX)</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(expensesByCategory || []).map((c: any) => (
                    <TableRow key={c.name}>
                      <TableCell><Badge variant="outline">{c.name}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{fmt(c.amount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{totalExpenses > 0 ? ((c.amount / totalExpenses) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  ))}
                  {(!expensesByCategory || expensesByCategory.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No expenses for this period</TableCell></TableRow>
                  )}
                  {(expensesByCategory || []).length > 0 && (
                    <TableRow className="border-t-2 font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{fmt(totalExpenses)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
