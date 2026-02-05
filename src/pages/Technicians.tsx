 import { useState } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import Header from "@/components/layout/Header";
 import Footer from "@/components/layout/Footer";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { useToast } from "@/hooks/use-toast";
 import { useAuth } from "@/contexts/AuthContext";
 import { Search, MapPin, Phone, Star, Wrench, MessageSquare, Loader2 } from "lucide-react";
 import { Link } from "react-router-dom";
 
 interface SellerProfile {
   id: string;
   business_name: string;
   description: string | null;
   phone: string;
   whatsapp: string | null;
   location: string | null;
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
   const [cart, setCart] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
   const [isCartOpen, setIsCartOpen] = useState(false);
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
     <div className="min-h-screen flex flex-col">
       <Header cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onCartClick={() => setIsCartOpen(true)} />
 
       <main className="flex-1">
         {/* Hero Section */}
         <section className="bg-secondary text-secondary-foreground py-12">
           <div className="container mx-auto px-4 text-center">
             <h1 className="text-3xl md:text-4xl font-bold mb-4">
               Find Expert <span className="text-primary">Laptop Technicians</span>
             </h1>
             <p className="text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
               Connect with skilled technicians at Suncity Mall for repairs, upgrades, and maintenance.
             </p>
             <div className="max-w-md mx-auto relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                 placeholder="Search by name or location..."
                 className="pl-10 h-12 bg-background text-foreground"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
           </div>
         </section>
 
         {/* Technicians List */}
         <section className="py-12">
           <div className="container mx-auto px-4">
             {isLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin" />
               </div>
             ) : sellers && sellers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {sellers.map((seller) => (
                   <Card key={seller.id} className="hover:shadow-lg transition-shadow">
                     <CardHeader>
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                             <Wrench className="h-6 w-6 text-primary" />
                           </div>
                           <div>
                             <CardTitle className="text-lg flex items-center gap-2">
                               {seller.business_name}
                               {seller.is_verified && (
                                 <Badge variant="secondary" className="text-xs">Verified</Badge>
                               )}
                             </CardTitle>
                             {seller.location && (
                               <CardDescription className="flex items-center gap-1">
                                 <MapPin className="h-3 w-3" />
                                 {seller.location}
                               </CardDescription>
                             )}
                           </div>
                         </div>
                         {seller.rating && seller.rating > 0 && (
                           <div className="flex items-center gap-1 text-yellow-500">
                             <Star className="h-4 w-4 fill-current" />
                             <span className="text-sm font-medium">{seller.rating}</span>
                           </div>
                         )}
                       </div>
                     </CardHeader>
                     <CardContent>
                       {seller.description && (
                         <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                           {seller.description}
                         </p>
                       )}
                       {seller.specializations && seller.specializations.length > 0 && (
                         <div className="flex flex-wrap gap-1 mb-4">
                           {seller.specializations.slice(0, 3).map((spec, i) => (
                             <Badge key={i} variant="outline" className="text-xs">
                               {spec}
                             </Badge>
                           ))}
                           {seller.specializations.length > 3 && (
                             <Badge variant="outline" className="text-xs">
                               +{seller.specializations.length - 3}
                             </Badge>
                           )}
                         </div>
                       )}
                       <div className="flex gap-2">
                         <Dialog>
                           <DialogTrigger asChild>
                             <Button 
                               className="flex-1" 
                               onClick={() => setSelectedSeller(seller)}
                             >
                               View Services
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                             <DialogHeader>
                               <DialogTitle className="flex items-center gap-2">
                                 {seller.business_name}
                                 {seller.is_verified && <Badge variant="secondary">Verified</Badge>}
                               </DialogTitle>
                             </DialogHeader>
                             <div className="space-y-4">
                               {seller.description && (
                                 <p className="text-muted-foreground">{seller.description}</p>
                               )}
                               <div className="flex gap-4 text-sm">
                                 <a href={`tel:${seller.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                                   <Phone className="h-4 w-4" />
                                   {seller.phone}
                                 </a>
                                 {seller.whatsapp && (
                                   <a 
                                     href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`} 
                                     target="_blank"
                                     className="flex items-center gap-1 text-primary hover:underline"
                                   >
                                     <MessageSquare className="h-4 w-4" />
                                     WhatsApp
                                   </a>
                                 )}
                               </div>
 
                               <h4 className="font-semibold mt-4">Services Offered</h4>
                               {sellerServices && sellerServices.length > 0 ? (
                                 <div className="space-y-3">
                                   {sellerServices.map((service) => (
                                     <div key={service.id} className="p-3 border rounded-lg">
                                       <div className="flex justify-between items-start">
                                         <div>
                                           <h5 className="font-medium">{service.title}</h5>
                                           <p className="text-sm text-muted-foreground">{service.description}</p>
                                         </div>
                                         <span className="text-primary font-semibold">
                                           {service.price_type === 'starting_from' && 'From '}
                                           {formatPrice(service.price)}
                                           {service.price_type === 'hourly' && '/hr'}
                                         </span>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-muted-foreground">No services listed yet.</p>
                               )}
 
                               <Button 
                                 className="w-full mt-4" 
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
                         <Button variant="outline" size="icon" asChild>
                           <a href={`tel:${seller.phone}`}>
                             <Phone className="h-4 w-4" />
                           </a>
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
                 <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                 <h3 className="text-xl font-semibold mb-2">No Technicians Found</h3>
                 <p className="text-muted-foreground mb-4">
                   {searchQuery ? "Try a different search term" : "Be the first to join as a technician!"}
                 </p>
                 <Link to="/signup">
                   <Button>Become a Technician</Button>
                 </Link>
               </div>
             )}
           </div>
         </section>
 
         {/* CTA Section */}
         <section className="bg-primary/10 py-12">
           <div className="container mx-auto px-4 text-center">
             <h2 className="text-2xl font-bold mb-4">Are You a Laptop Technician?</h2>
             <p className="text-muted-foreground mb-6">
               Join Eco Hub and connect with customers looking for your expertise.
             </p>
             <Link to="/signup">
               <Button size="lg">
                 <Wrench className="h-5 w-5 mr-2" />
                 Register as Technician
               </Button>
             </Link>
           </div>
         </section>
       </main>
 
       {/* Service Request Dialog */}
       <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Request Service from {selectedSeller?.business_name}</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmitRequest} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Your Name</Label>
                 <Input id="name" name="name" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="phone">Phone Number</Label>
                 <Input id="phone" name="phone" placeholder="+256..." required />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="title">What do you need help with?</Label>
               <Input id="title" name="title" placeholder="e.g. Screen replacement" required />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="device_brand">Laptop Brand</Label>
                 <Input id="device_brand" name="device_brand" placeholder="HP, Dell, Lenovo..." />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="device_model">Model</Label>
                 <Input id="device_model" name="device_model" placeholder="Model name" />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="description">Describe the issue</Label>
               <Textarea id="description" name="description" placeholder="Explain what's wrong with your laptop..." required />
             </div>
             <div className="space-y-2">
               <Label htmlFor="budget">Budget (optional)</Label>
               <Input id="budget" name="budget" type="number" placeholder="Your budget in UGX" />
             </div>
             {!user && (
               <p className="text-sm text-destructive">
                 Please <Link to="/login" className="underline">log in</Link> to submit a request.
               </p>
             )}
             <Button type="submit" className="w-full" disabled={!user || isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Submit Request
             </Button>
           </form>
         </DialogContent>
       </Dialog>
 
       <Footer />
     </div>
   );
 };
 
 export default Technicians;