import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const SellerServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["seller-services", sellerProfile?.id],
    queryFn: async () => {
      if (!sellerProfile?.id) return [];
      const { data, error } = await supabase
        .from("seller_services")
        .select("*")
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile?.id,
  });

  const serviceMutation = useMutation({
    mutationFn: async (serviceData: { 
      title: string; 
      description: string; 
      price: number; 
      price_type: string; 
      category: string;
      id?: string;
    }) => {
      if (serviceData.id) {
        const { error } = await supabase
          .from("seller_services")
          .update({
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            price_type: serviceData.price_type,
            category: serviceData.category,
          })
          .eq("id", serviceData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("seller_services")
          .insert({ 
            ...serviceData, 
            seller_id: sellerProfile!.id 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      toast({ title: editingService ? "Service updated!" : "Service added!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("seller_services")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-services"] });
      toast({ title: "Service deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    serviceMutation.mutate({
      id: editingService?.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      price_type: formData.get("price_type") as string,
      category: formData.get("category") as string,
    });
  };

  const formatPrice = (price: number, priceType: string) => {
    const formatted = new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
    
    if (priceType === "starting_from") return `From ${formatted}`;
    if (priceType === "hourly") return `${formatted}/hr`;
    return formatted;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      repair: "bg-blue-100 text-blue-800",
      upgrade: "bg-purple-100 text-purple-800",
      maintenance: "bg-green-100 text-green-800",
      "data-recovery": "bg-orange-100 text-orange-800",
      software: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  if (!sellerProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Services</h1>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complete Your Profile First</h3>
            <p className="text-muted-foreground mb-4">
              You need to set up your seller profile before adding services.
            </p>
            <Button asChild>
              <Link to="/seller/profile">Set Up Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-muted-foreground">{services?.length || 0} services listed</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingService(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Service Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingService?.title || ""}
                  placeholder="Laptop Screen Replacement" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingService?.category || ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="data-recovery">Data Recovery</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingService?.description || ""}
                  placeholder="Describe your service..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (UGX)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    defaultValue={editingService?.price || ""}
                    placeholder="50000" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_type">Price Type</Label>
                  <Select name="price_type" defaultValue={editingService?.price_type || "fixed"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="starting_from">Starting From</SelectItem>
                      <SelectItem value="hourly">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={serviceMutation.isPending}>
                {serviceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? "Update Service" : "Add Service"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : services && services.length > 0 ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{service.title}</h3>
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {service.description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(service.price, service.price_type || "fixed")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingService(service);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first service to start receiving customer requests.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerServices;
