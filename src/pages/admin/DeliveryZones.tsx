import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Truck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDistricts, fetchSubcountiesForDistrict, District, Subcounty,
} from "@/lib/ugandaLocations";

interface DeliveryZone {
  id: string;
  zone_name: string;
  district: string;
  subcounty: string | null;
  delivery_fee: number;
  estimated_days: string | null;
  is_active: boolean;
}

const AdminDeliveryZones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);

  const [zoneName, setZoneName] = useState("");
  const [district, setDistrict] = useState("");
  const [subcounty, setSubcounty] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [districts, setDistricts] = useState<District[]>([]);
  const [subcounties, setSubcounties] = useState<Subcounty[]>([]);

  useEffect(() => {
    fetchDistricts().then(setDistricts);
  }, []);

  const handleDistrictChange = async (val: string) => {
    setDistrict(val);
    setSubcounty("");
    const d = districts.find((dd) => dd.district_name === val);
    if (d) {
      const subs = await fetchSubcountiesForDistrict(d.district_code);
      setSubcounties(subs);
    }
  };

  const { data: zones, isLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("district", { ascending: true });
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (zone: Partial<DeliveryZone>) => {
      if (editing) {
        const { error } = await supabase.from("delivery_zones").update(zone).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("delivery_zones").insert([zone as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast({ title: editing ? "Zone updated" : "Zone created" });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast({ title: "Zone deleted" });
    },
  });

  const closeDialog = () => {
    setShowDialog(false);
    setEditing(null);
    setZoneName("");
    setDistrict("");
    setSubcounty("");
    setDeliveryFee("");
    setEstimatedDays("");
    setIsActive(true);
    setSubcounties([]);
  };

  const openEdit = async (zone: DeliveryZone) => {
    setEditing(zone);
    setZoneName(zone.zone_name);
    setDistrict(zone.district);
    setSubcounty(zone.subcounty || "");
    setDeliveryFee(String(zone.delivery_fee));
    setEstimatedDays(zone.estimated_days || "");
    setIsActive(zone.is_active);
    const d = districts.find((dd) => dd.district_name === zone.district);
    if (d) {
      const subs = await fetchSubcountiesForDistrict(d.district_code);
      setSubcounties(subs);
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!zoneName || !district || !deliveryFee) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      zone_name: zoneName,
      district,
      subcounty: subcounty || null,
      delivery_fee: Number(deliveryFee),
      estimated_days: estimatedDays || null,
      is_active: isActive,
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 md:h-6 md:w-6" /> Delivery Zones
          </h1>
          <p className="text-sm text-muted-foreground">Set delivery prices for different areas</p>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !zones?.length ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No delivery zones configured yet</p>
          <Button className="mt-4" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add First Zone
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{zone.zone_name}</p>
                    <p className="text-xs text-muted-foreground">{zone.district}{zone.subcounty ? ` • ${zone.subcounty}` : " • All areas"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${zone.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {zone.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-primary">{formatPrice(zone.delivery_fee)}</p>
                    <p className="text-[10px] text-muted-foreground">Delivery fee</p>
                  </div>
                  {zone.estimated_days && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{zone.estimated_days}</p>
                      <p className="text-[10px] text-muted-foreground">Est. delivery</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(zone)}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-destructive" onClick={() => deleteMutation.mutate(zone.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Delivery Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Zone Name *</Label>
              <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. Kampala Central" />
            </div>
            <div className="space-y-1">
              <Label>District *</Label>
              <Select value={district} onValueChange={handleDistrictChange}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {districts.map((d) => (
                    <SelectItem key={d.district_code} value={d.district_name}>{d.district_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sub-county (optional)</Label>
              <Select value={subcounty} onValueChange={setSubcounty}>
                <SelectTrigger><SelectValue placeholder="All sub-counties" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {subcounties.map((s) => (
                    <SelectItem key={s.subcounty_code} value={s.subcounty_name}>{s.subcounty_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Delivery Fee (UGX) *</Label>
              <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="e.g. 10000" />
            </div>
            <div className="space-y-1">
              <Label>Estimated Delivery Days</Label>
              <Input value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} placeholder="e.g. 1-2 days" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editing ? "Update Zone" : "Create Zone"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeliveryZones;
