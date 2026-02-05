import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, MapPin, Phone } from "lucide-react";

const SellerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sellerProfile, isLoading } = useQuery({
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

  const profileMutation = useMutation({
    mutationFn: async (profileData: { 
      business_name: string; 
      description: string; 
      phone: string; 
      whatsapp: string; 
      location: string; 
      specializations: string[] 
    }) => {
      if (sellerProfile) {
        const { error } = await supabase
          .from("seller_profiles")
          .update(profileData)
          .eq("id", sellerProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("seller_profiles")
          .insert({ ...profileData, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      toast({ title: "Profile saved successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    profileMutation.mutate({
      business_name: formData.get("business_name") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      whatsapp: formData.get("whatsapp") as string,
      location: formData.get("location") as string,
      specializations: (formData.get("specializations") as string)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seller Profile</h1>
        <p className="text-muted-foreground">
          {sellerProfile ? "Manage your business profile" : "Set up your seller profile"}
        </p>
      </div>

      {/* Profile Status Card */}
      {sellerProfile && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xl">
                  {sellerProfile.business_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{sellerProfile.business_name}</h2>
                  {sellerProfile.is_verified && (
                    <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                  {sellerProfile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {sellerProfile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {sellerProfile.phone}
                  </span>
                </div>
              </div>
              <Badge variant={sellerProfile.is_active ? "default" : "secondary"}>
                {sellerProfile.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>{sellerProfile ? "Edit Profile" : "Create Your Profile"}</CardTitle>
          <CardDescription>
            {sellerProfile 
              ? "Update your business information to attract more customers" 
              : "Complete your profile to start receiving service requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input 
                  id="business_name" 
                  name="business_name" 
                  defaultValue={sellerProfile?.business_name || ""} 
                  placeholder="Your Tech Repair Shop"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  defaultValue={sellerProfile?.location || ""} 
                  placeholder="Suncity Mall, Kampala"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={sellerProfile?.phone || ""} 
                  placeholder="+256 700 000 000"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
                <Input 
                  id="whatsapp" 
                  name="whatsapp" 
                  defaultValue={sellerProfile?.whatsapp || ""} 
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About Your Services</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={sellerProfile?.description || ""} 
                placeholder="Describe your expertise, experience, and the services you offer..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specializations">Specializations</Label>
              <Input 
                id="specializations" 
                name="specializations" 
                defaultValue={sellerProfile?.specializations?.join(", ") || ""} 
                placeholder="Laptop Repair, Screen Replacement, Data Recovery"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple specializations with commas
              </p>
            </div>

            {sellerProfile?.specializations && sellerProfile.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sellerProfile.specializations.map((spec: string, i: number) => (
                  <Badge key={i} variant="secondary">{spec}</Badge>
                ))}
              </div>
            )}

            <Button type="submit" disabled={profileMutation.isPending} className="w-full md:w-auto">
              {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sellerProfile ? "Update Profile" : "Create Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerProfile;
