import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StoreLocation {
  lat: number;
  lng: number;
  label: string;
}

export const useStoreLocation = () => {
  return useQuery({
    queryKey: ["store-location"],
    queryFn: async (): Promise<StoreLocation> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "store_location")
        .single();

      if (error) throw error;
      return data.value as unknown as StoreLocation;
    },
  });
};

export const useUpdateStoreLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: StoreLocation) => {
      const { error } = await supabase
        .from("store_settings")
        .update({ value: location as any })
        .eq("key", "store_location");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-location"] });
    },
  });
};
