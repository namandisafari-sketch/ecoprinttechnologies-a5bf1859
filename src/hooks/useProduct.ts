import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductWithRelations } from "./useProducts";

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as ProductWithRelations;
    },
    enabled: !!slug,
  });
};

export const useProductSpecifications = (productId: string) => {
  return useQuery({
    queryKey: ["product-specifications", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_specifications")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

export const useRelatedProducts = (categoryId: string | null, currentProductId: string, limit = 4) => {
  return useQuery({
    queryKey: ["related-products", categoryId, currentProductId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(limit);

      if (error) throw error;
      return data as ProductWithRelations[];
    },
    enabled: !!categoryId,
  });
};
