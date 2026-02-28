import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMaintenanceMode = () => {
  const queryClient = useQueryClient();

  const { data: isMaintenanceMode, isLoading } = useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      if (error) throw error;
      return data?.value === true;
    },
    refetchInterval: 30000, // Check every 30s
  });

  const toggleMaintenance = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase
        .from("store_settings")
        .select("id")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("store_settings")
          .update({ value: enabled, updated_at: new Date().toISOString() })
          .eq("key", "maintenance_mode");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("store_settings")
          .insert({ key: "maintenance_mode", value: enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
    },
  });

  return { isMaintenanceMode: !!isMaintenanceMode, isLoading, toggleMaintenance };
};
