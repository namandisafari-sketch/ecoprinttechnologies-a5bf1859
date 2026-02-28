import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductWizard from "@/components/admin/ProductWizard";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .order("created_at", { ascending: false });
      if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setEditingProduct(null);
  };

  if (showWizard) {
    return <ProductWizard editingProduct={editingProduct} onClose={closeWizard} />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product: any) => {
            const discount = product.original_price && product.original_price > product.price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : 0;
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {(product.image_url || (product.images && product.images.length > 0)) ? (
                      <img src={product.image_url || product.images[0]} alt={product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku || "No SKU"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.categories?.name && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.categories.name}</Badge>
                        )}
                        {product.brands?.name && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.brands.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-primary">{formatPrice(Number(product.price))}</p>
                      {product.original_price && (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(Number(product.original_price))}</p>
                          {discount > 0 && <Badge variant="destructive" className="text-[10px] px-1 py-0">-{discount}%</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Stock: {product.stock_quantity ?? 0}</p>
                      <Badge variant={product.is_active ? "default" : "secondary"} className="text-[10px]">
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteProduct.mutate(product.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground">Create your first product to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProducts;
