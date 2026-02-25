import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Loader2, Package, AlertTriangle, TrendingDown, TrendingUp, Minus, Plus,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const AdminInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["inventory", searchQuery, filter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true });

      if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (filter === "low") {
        filtered = filtered.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10);
      } else if (filter === "out") {
        filtered = filtered.filter((p) => (p.stock_quantity || 0) === 0);
      }
      return filtered;
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, stock_quantity }: { id: string; stock_quantity: number }) => {
      const { error } = await supabase.from("products").update({ stock_quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Stock updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating stock", description: error.message, variant: "destructive" });
    },
  });

  const handleStockChange = (product: Product, change: number) => {
    const newQuantity = Math.max(0, (product.stock_quantity || 0) + change);
    updateStock.mutate({ id: product.id, stock_quantity: newQuantity });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

  const getStockBadge = (quantity: number | null) => {
    const qty = quantity || 0;
    if (qty === 0) return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Out of Stock</Badge>;
    if (qty <= 10) return <Badge className="bg-yellow-500/10 text-yellow-600 gap-1"><TrendingDown className="h-3 w-3" />Low ({qty})</Badge>;
    return <Badge className="bg-primary/10 text-primary gap-1"><TrendingUp className="h-3 w-3" />In Stock ({qty})</Badge>;
  };

  const stats = products
    ? {
        total: products.length,
        inStock: products.filter((p) => (p.stock_quantity || 0) > 10).length,
        lowStock: products.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length,
        outOfStock: products.filter((p) => (p.stock_quantity || 0) === 0).length,
        totalValue: products.reduce((sum, p) => sum + Number(p.price) * (p.stock_quantity || 0), 0),
      }
    : { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Track and manage stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "In Stock", value: stats.inStock, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Low Stock", value: stats.lowStock, icon: TrendingDown, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { label: "Out of Stock", value: stats.outOfStock, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Value */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl md:text-3xl font-bold text-primary">{formatPrice(stats.totalValue)}</p>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {(["all", "low", "out"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "low" ? "Low" : "Out"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brands?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{product.categories?.name || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-primary">{formatPrice(Number(product.price))}</p>
                  {getStockBadge(product.stock_quantity)}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    Value: {formatPrice(Number(product.price) * (product.stock_quantity || 0))}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(product, -1)} disabled={(product.stock_quantity || 0) === 0 || updateStock.isPending}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{product.stock_quantity || 0}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(product, 1)} disabled={updateStock.isPending}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminInventory;
