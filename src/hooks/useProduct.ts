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
