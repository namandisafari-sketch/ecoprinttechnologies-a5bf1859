import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[] | null;
  category_id: string | null;
  brand_id: string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  is_on_sale: boolean | null;
  sku: string | null;
  color: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string } | null;
  brands: { name: string } | null;
}

export const useProducts = (options?: {
  featured?: boolean;
  categoryId?: string;
  brandId?: string;
  search?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (options?.featured) {
        query = query.eq("is_featured", true);
      }

      if (options?.categoryId) {
        query = query.eq("category_id", options.categoryId);
      }

      if (options?.brandId) {
        query = query.eq("brand_id", options.brandId);
      }

      if (options?.search) {
        query = query.or(
          `name.ilike.%${options.search}%,description.ilike.%${options.search}%,model.ilike.%${options.search}%,color.ilike.%${options.search}%`
        );
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductWithRelations[];
    },
  });
};

export const useProductSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["product-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .eq("is_active", true)
        .or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`
        )
        .order("name")
        .limit(20);

      if (error) throw error;
      return data as ProductWithRelations[];
    },
    enabled: searchTerm.trim().length > 0,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
};

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};
