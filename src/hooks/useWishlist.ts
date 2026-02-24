import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceContext } from "@/contexts/DeviceContext";

export const useWishlist = () => {
  const { deviceId } = useDeviceContext();
  const queryClient = useQueryClient();

  const { data: wishlistIds = [], isLoading } = useQuery({
    queryKey: ["wishlist", deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("device_id", deviceId);
      if (error) throw error;
      return data.map((w) => w.product_id);
    },
    enabled: !!deviceId,
  });

  const toggleWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!deviceId) throw new Error("No device");
      const isInWishlist = wishlistIds.includes(productId);
      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("device_id", deviceId)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({ device_id: deviceId, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", deviceId] });
    },
  });

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  return { wishlistIds, isLoading, toggleWishlist, isWishlisted };
};

export const useWishlistProducts = () => {
  const { deviceId } = useDeviceContext();

  return useQuery({
    queryKey: ["wishlist-products", deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const { data, error } = await supabase
        .from("wishlist")
        .select("product_id, products(*, categories(name), brands(name))")
        .eq("device_id", deviceId);
      if (error) throw error;
      return data?.map((w: any) => w.products).filter(Boolean) || [];
    },
    enabled: !!deviceId,
  });
};
