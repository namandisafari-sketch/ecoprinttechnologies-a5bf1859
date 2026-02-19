import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Search, MapPin, Phone, Star, Wrench, MessageSquare, Loader2, ChevronLeft, Plus, Store } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNavigation from "@/components/layout/BottomNavigation";

interface SellerProfile {
  id: string;
  business_name: string;
  description: string | null;
  phone: string;
  whatsapp: string | null;
  location: string | null;
  shop_number: string | null;
  specializations: string[] | null;
  is_verified: boolean | null;
  rating: number | null;
  total_reviews: number | null;
  avatar_url: string | null;
}

interface SellerService {
  id: string;
  title: string;
  description: string | null;
  price: number;
  price_type: string | null;
  category: string;
}

const Technicians = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all active sellers
  const { data: sellers, isLoading } = useQuery({
    queryKey: ["sellers", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("seller_profiles")
        .select("*")
        .eq("is_active", true);

      if (searchQuery) {
        query = query.or(`business_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order("rating", { ascending: false });
      if (error) throw error;
      return data as SellerProfile[];
    },
  });

  // Fetch services for selected seller
  const { data: sellerServices } = useQuery({
    queryKey: ["seller-services-public", selectedSeller?.id],
    queryFn: async () => {
      if (!selectedSeller?.id) return [];
      const { data, error } = await supabase
        .from("seller_services")
        .select("*")
        .eq("seller_id", selectedSeller.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as SellerService[];
    },
    enabled: !!selectedSeller?.id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSeller || !user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to request a service",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from("service_requests").insert({
      customer_id: user.id,
      seller_id: selectedSeller.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      device_brand: formData.get("device_brand") as string,
      device_model: formData.get("device_model") as string,
      budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
      customer_phone: formData.get("phone") as string,
      customer_name: formData.get("name") as string,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Sent!",
        description: `${selectedSeller.business_name} will contact you soon.`,
      });
      setIsRequestDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Page Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search technicians..."
                className="pl-10 h-10 bg-muted border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {/* Hero Banner */}
        <div className="bg-secondary text-secondary-foreground px-4 py-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            Expert <span className="text-primary">Technicians</span>
          </h1>
          <p className="text-sm text-secondary-foreground/80">
            Skilled repair & maintenance specialists at Suncity Mall
          </p>
        </div>

        {/* Technicians List */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sellers && sellers.length > 0 ? (
            <div className="space-y-3">
              {sellers.map((seller) => (
                <Card key={seller.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm flex items-center gap-1">
                              {seller.business_name}
                              {seller.is_verified && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">✓</Badge>
                              )}
                            </h3>
                            {seller.shop_number && (
                              <p className="text-xs font-medium text-primary flex items-center gap-1 mt-0.5">
                                <Store className="h-3 w-3" />
                                Shop {seller.shop_number}
                              </p>
                            )}
                            {seller.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {seller.location}
                              </p>
                            )}
                          </div>
                          {seller.rating && seller.rating > 0 && (
                            <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                              <Star className="h-3 w-3 fill-current" />
                              <span className="text-xs font-medium">{seller.rating}</span>
                            </div>
                          )}
                        </div>

                        {seller.specializations && seller.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {seller.specializations.slice(0, 2).map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                                {spec}
                              </Badge>
                            ))}
                            {seller.specializations.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{seller.specializations.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => setSelectedSeller(seller)}
                              >
                                View Services
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-y-auto rounded-xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-base">
                                  {seller.business_name}
                                  {seller.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {seller.description && (
                                  <p className="text-sm text-muted-foreground">{seller.description}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <a href={`tel:${seller.phone}`} className="flex items-center gap-1 text-primary">
                                    <Phone className="h-4 w-4" />
                                    Call
                                  </a>
                                  {seller.whatsapp && (
                                    <a 
                                      href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`} 
                                      target="_blank"
                                      className="flex items-center gap-1 text-primary"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      WhatsApp
                                    </a>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Services Offered</h4>
                                  {sellerServices && sellerServices.length > 0 ? (
                                    <div className="space-y-2">
                                      {sellerServices.map((service) => (
                                        <div key={service.id} className="p-3 bg-muted rounded-lg">
                                          <div className="flex justify-between items-start gap-2">
                                            <div>
                                              <h5 className="font-medium text-sm">{service.title}</h5>
                                              {service.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                              )}
                                            </div>
                                            <span className="text-primary font-semibold text-sm shrink-0">
                                              {service.price_type === 'starting_from' && 'From '}
                                              {formatPrice(service.price)}
                                              {service.price_type === 'hourly' && '/hr'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No services listed yet.</p>
                                  )}
                                </div>

                                <Button 
                                  className="w-full" 
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setIsRequestDialogOpen(true);
                                  }}
                                >
                                  Request Service
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                            <a href={`tel:${seller.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Technicians Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search" : "Be the first to join!"}
              </p>
              <Link to="/signup">
                <Button size="sm">Become a Technician</Button>
              </Link>
            </div>
          )}
        </div>

        {/* CTA Banner */}
        <div className="mx-4 mb-4 bg-primary/10 rounded-xl p-4 text-center">
          <h3 className="font-semibold mb-1">Are You a Technician?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Join Eco Print and grow your business
          </p>
          <Link to="/signup">
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 mr-1" />
              Register
            </Button>
          </Link>
        </div>
      </main>

      {/* Service Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Request Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Your Name</Label>
                <Input id="name" name="name" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Phone</Label>
                <Input id="phone" name="phone" placeholder="+256..." required className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">What do you need?</Label>
              <Input id="title" name="title" placeholder="e.g. Screen replacement" required className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="device_brand" className="text-sm">Laptop Brand</Label>
                <Input id="device_brand" name="device_brand" placeholder="HP, Dell..." className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="device_model" className="text-sm">Model</Label>
                <Input id="device_model" name="device_model" placeholder="Model" className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Describe the issue</Label>
              <Textarea id="description" name="description" placeholder="What's wrong..." required className="min-h-[80px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget" className="text-sm">Budget (optional)</Label>
              <Input id="budget" name="budget" type="number" placeholder="UGX" className="h-10" />
            </div>
            {!user && (
              <p className="text-sm text-destructive">
                Please <Link to="/login" className="underline">log in</Link> to submit.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={!user || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNavigation cartCount={0} onCartClick={() => {}} />
    </div>
  );
};

export default Technicians;
