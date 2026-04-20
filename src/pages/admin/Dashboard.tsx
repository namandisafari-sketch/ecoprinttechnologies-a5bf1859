import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Wallet, CreditCard, Receipt, PiggyBank, ArrowLeftRight, RefreshCw, HandCoins } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats", todayStart],
    queryFn: async () => {
      const [salesRes, creditRes, expensesRes, exchangesRes, refundsRes, paymentsRes] = await Promise.all([
        supabase.from("sales").select("total, payment_method, payment_status").gte("created_at", todayStart).lt("created_at", todayEnd),
        supabase.from("credit_sales").select("balance, total_amount, amount_paid"),
        supabase.from("expenses").select("amount").gte("expense_date", todayStart.split("T")[0]).lt("expense_date", todayEnd.split("T")[0]),
        supabase.from("exchanges").select("difference_amount, created_at").gte("created_at", todayStart).lt("created_at", todayEnd),
        supabase.from("refunds").select("amount, created_at").gte("created_at", todayStart).lt("created_at", todayEnd),
        supabase.from("credit_payments").select("amount, created_at").gte("created_at", todayStart).lt("created_at", todayEnd),
      ]);

      const sales = salesRes.data || [];
      const cashSales = sales.reduce((s, x) => s + Number(x.total || 0), 0);
      const cashCount = sales.length;

      const credits = creditRes.data || [];
      const creditOutstanding = credits.reduce((s, x) => s + Number(x.balance || 0), 0);
      const uncollectedBalance = credits.filter((c) => Number(c.balance) > 0).reduce((s, x) => s + Number(x.balance || 0), 0);
      const customersOwe = credits.filter((c) => Number(c.balance) > 0).length;

      const expenses = (expensesRes.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);

      const exchanges = exchangesRes.data || [];
      const exchangeTopups = exchanges.filter((e) => Number(e.difference_amount) > 0).reduce((s, x) => s + Number(x.difference_amount || 0), 0);
      const exchangeRefunds = exchanges.filter((e) => Number(e.difference_amount) < 0).reduce((s, x) => s + Math.abs(Number(x.difference_amount || 0)), 0);

      const refunds = (refundsRes.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
      const creditPayments = (paymentsRes.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
      const creditPaymentsCount = (paymentsRes.data || []).length;

      return {
        cashSales,
        cashCount,
        creditOutstanding,
        expenses,
        uncollectedBalance,
        customersOwe,
        exchangeTopups,
        exchangeCount: exchanges.length,
        exchangeRefunds: exchangeRefunds + refunds,
        creditPayments,
        creditPaymentsCount,
      };
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(price);

  const cards = [
    {
      title: "Today's Cash Sales",
      value: `USh ${formatPrice(stats?.cashSales || 0)}`,
      sub: `${stats?.cashCount || 0} cash transactions`,
      hint: "Sales paid by cash, card, mobile money, bank transfer",
      icon: Wallet,
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-900",
      text: "text-emerald-700 dark:text-emerald-400",
      iconColor: "text-emerald-600",
    },
    {
      title: "Today's Credit Outstanding",
      value: `USh ${formatPrice(stats?.creditOutstanding || 0)}`,
      sub: "All collected",
      hint: "Credit sales still awaiting payment",
      icon: CreditCard,
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-900",
      text: "text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-600",
    },
    {
      title: "Today's Expenses",
      value: `USh ${formatPrice(stats?.expenses || 0)}`,
      sub: "Deducted from operations",
      hint: "Total business expenses for the day",
      icon: Receipt,
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-900",
      text: "text-rose-700 dark:text-rose-400",
      iconColor: "text-rose-600",
    },
    {
      title: "Uncollected Balances",
      value: `USh ${formatPrice(stats?.uncollectedBalance || 0)}`,
      sub: `${stats?.customersOwe || 0} customers owe`,
      hint: "Total outstanding credit from all customers",
      icon: PiggyBank,
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-900",
      text: "text-orange-700 dark:text-orange-400",
      iconColor: "text-orange-600",
    },
    {
      title: "Today's Exchange Top-ups",
      value: `USh ${formatPrice(stats?.exchangeTopups || 0)}`,
      sub: `${stats?.exchangeCount || 0} exchanges processed`,
      hint: "Extra payments collected from product exchanges",
      icon: ArrowLeftRight,
      bg: "bg-sky-50 dark:bg-sky-950/30",
      border: "border-sky-200 dark:border-sky-900",
      text: "text-sky-700 dark:text-sky-400",
      iconColor: "text-sky-600",
    },
    {
      title: "Today's Exchange Refunds",
      value: `USh ${formatPrice(stats?.exchangeRefunds || 0)}`,
      sub: "Given back to customers",
      hint: "Refunds given for exchanges/returns",
      icon: RefreshCw,
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-200 dark:border-pink-900",
      text: "text-pink-700 dark:text-pink-400",
      iconColor: "text-pink-600",
    },
    {
      title: "Today's Credit Payments",
      value: `USh ${formatPrice(stats?.creditPayments || 0)}`,
      sub: `${stats?.creditPaymentsCount || 0} payments received`,
      hint: "Payments collected from credit customers",
      icon: HandCoins,
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-900",
      text: "text-green-700 dark:text-green-400",
      iconColor: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Eco Print Technologies Admin</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card shadow-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{format(today, "MMMM do, yyyy")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className={`${c.bg} ${c.border} border-2 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-foreground/70">{c.title}</p>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
              <p className={`text-3xl font-bold ${c.text}`}>{c.value}</p>
              <p className="text-sm text-foreground/60">{c.sub}</p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-foreground/10">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
