import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDistricts,
  fetchSubcountiesForDistrict,
  District,
  Subcounty,
} from "@/lib/ugandaLocations";
import { useEffect } from "react";

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

  // Form state
  const [zoneName, setZoneName] = useState("");
  const [district, setDistrict] = useState("");
  const [subcounty, setSubcounty] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Location data
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
        const { error } = await supabase
          .from("delivery_zones")
          .update(zone)
          .eq("id", editing.id);
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
    // Load subcounties for district
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
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Delivery Zones
          </h1>
          <p className="text-muted-foreground text-sm">
            Set delivery prices for different areas
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Sub-county</TableHead>
              <TableHead>Delivery Fee</TableHead>
              <TableHead>Est. Days</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !zones?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No delivery zones configured yet
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.zone_name}</TableCell>
                  <TableCell>{zone.district}</TableCell>
                  <TableCell>{zone.subcounty || "All"}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatPrice(zone.delivery_fee)}
                  </TableCell>
                  <TableCell>{zone.estimated_days || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${zone.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {zone.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(zone)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(zone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Delivery Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Zone Name *</Label>
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Kampala Central"
              />
            </div>
            <div className="space-y-1">
              <Label>District *</Label>
              <Select value={district} onValueChange={handleDistrictChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {districts.map((d) => (
                    <SelectItem key={d.district_code} value={d.district_name}>
                      {d.district_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sub-county (optional — leave empty for whole district)</Label>
              <Select value={subcounty} onValueChange={setSubcounty}>
                <SelectTrigger>
                  <SelectValue placeholder="All sub-counties" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {subcounties.map((s) => (
                    <SelectItem key={s.subcounty_code} value={s.subcounty_name}>
                      {s.subcounty_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Delivery Fee (UGX) *</Label>
              <Input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-1">
              <Label>Estimated Delivery Days</Label>
              <Input
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="e.g. 1-2 days"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Update Zone" : "Create Zone"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeliveryZones;
