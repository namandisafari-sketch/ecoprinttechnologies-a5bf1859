import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProfitMarginCardProps {
  cost: number;
  retail: number;
  wholesale: number;
  internal: number;
}

const formatUGX = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);

const Row = ({ label, price, cost }: { label: string; price: number; cost: number }) => {
  if (!price) {
    return (
      <div className="flex items-center justify-between py-2 text-sm border-b border-dashed border-border last:border-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground italic">not set</span>
      </div>
    );
  }
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const isProfit = profit > 0;
  const isBreakEven = profit === 0;
  const Icon = isBreakEven ? Minus : isProfit ? TrendingUp : TrendingDown;
  const color = isBreakEven
    ? "text-muted-foreground"
    : isProfit
    ? "text-emerald-600"
    : "text-destructive";
  const bg = isBreakEven
    ? "bg-muted"
    : isProfit
    ? "bg-emerald-50 dark:bg-emerald-950/40"
    : "bg-destructive/10";

  return (
    <div className="py-2 border-b border-dashed border-border last:border-0">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{formatUGX(price)}</span>
      </div>
      <div className={`mt-1 flex items-center justify-between rounded-md px-2 py-1 ${bg}`}>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
          <Icon className="h-3.5 w-3.5" />
          <span>{formatUGX(profit)}</span>
        </div>
        <Badge
          variant={isProfit ? "default" : isBreakEven ? "secondary" : "destructive"}
          className="text-[10px] px-1.5 py-0 font-mono"
        >
          {margin.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
};

const ProfitMarginCard = ({ cost, retail, wholesale, internal }: ProfitMarginCardProps) => {
  return (
    <Card className="border-emerald-500/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Profit Margin</h2>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Per unit</Badge>
        </div>

        {!cost ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Minus className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Enter <strong>Unit Cost</strong> to see margins</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
              Unit Cost: <span className="font-mono font-medium text-foreground">{formatUGX(cost)}</span>
            </div>
            <Row label="Retail" price={retail} cost={cost} />
            <Row label="Wholesale" price={wholesale} cost={cost} />
            <Row label="Internal" price={internal} cost={cost} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitMarginCard;
