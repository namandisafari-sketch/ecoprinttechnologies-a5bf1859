 import { useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, Plus, Settings, Briefcase, MessageSquare, Star, LogOut, Home } from "lucide-react";
 import { Link, useNavigate } from "react-router-dom";
 
 const SellerDashboard = () => {
   const { user, signOut } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
 
   // Fetch seller profile
   const { data: sellerProfile, isLoading: profileLoading } = useQuery({
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
 
   // Fetch seller services
   const { data: services } = useQuery({
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
 
   // Fetch service requests
   const { data: requests } = useQuery({
     queryKey: ["service-requests", sellerProfile?.id],
     queryFn: async () => {
       if (!sellerProfile?.id) return [];
       const { data, error } = await supabase
         .from("service_requests")
         .select("*")
         .eq("seller_id", sellerProfile.id)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     },
     enabled: !!sellerProfile?.id,
   });
 
   // Create/Update profile mutation
   const profileMutation = useMutation({
     mutationFn: async (profileData: { business_name: string; description: string; phone: string; whatsapp: string; location: string; specializations: string[] }) => {
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
 
   // Add service mutation
   const serviceMutation = useMutation({
     mutationFn: async (serviceData: { title: string; description: string; price: number; price_type: string; category: string }) => {
       const { error } = await supabase
         .from("seller_services")
         .insert({ ...serviceData, seller_id: sellerProfile!.id });
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["seller-services"] });
       setIsServiceDialogOpen(false);
       toast({ title: "Service added successfully!" });
     },
     onError: (error: Error) => {
       toast({ title: "Error adding service", description: error.message, variant: "destructive" });
     },
   });
 
   // Update request status
   const updateRequestMutation = useMutation({
     mutationFn: async ({ id, status }: { id: string; status: string }) => {
       const { error } = await supabase
         .from("service_requests")
         .update({ status })
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["service-requests"] });
       toast({ title: "Request updated!" });
     },
   });
 
   const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     profileMutation.mutate({
       business_name: formData.get("business_name") as string,
       description: formData.get("description") as string,
       phone: formData.get("phone") as string,
       whatsapp: formData.get("whatsapp") as string,
       location: formData.get("location") as string,
       specializations: (formData.get("specializations") as string).split(",").map(s => s.trim()).filter(Boolean),
     });
   };
 
   const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     serviceMutation.mutate({
       title: formData.get("title") as string,
       description: formData.get("description") as string,
       price: parseFloat(formData.get("price") as string),
       price_type: formData.get("price_type") as string,
       category: formData.get("category") as string,
     });
   };
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/");
   };
 
   if (profileLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin" />
       </div>
     );
   }
 
   const formatPrice = (price: number) => {
     return new Intl.NumberFormat("en-UG", {
       style: "currency",
       currency: "UGX",
       minimumFractionDigits: 0,
     }).format(price);
   };
 
   return (
     <div className="min-h-screen bg-muted/30">
       {/* Header */}
       <header className="bg-secondary text-secondary-foreground">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <Link to="/" className="flex items-center gap-2">
             <img src="/logo.jpeg" alt="Eco Hub" className="w-10 h-10 rounded-lg object-cover" />
             <div>
               <h1 className="font-bold text-lg">Eco Hub</h1>
               <p className="text-xs text-secondary-foreground/70">Seller Dashboard</p>
             </div>
           </Link>
           <div className="flex items-center gap-2">
             <Link to="/">
               <Button variant="ghost" size="sm">
                 <Home className="h-4 w-4 mr-2" />
                 Home
               </Button>
             </Link>
             <Button variant="ghost" size="sm" onClick={handleSignOut}>
               <LogOut className="h-4 w-4 mr-2" />
               Sign Out
             </Button>
           </div>
         </div>
       </header>
 
       <main className="container mx-auto px-4 py-8">
         {/* Stats Overview */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Services</p>
                   <p className="text-2xl font-bold">{services?.length || 0}</p>
                 </div>
                 <Briefcase className="h-8 w-8 text-primary" />
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Requests</p>
                   <p className="text-2xl font-bold">{requests?.filter(r => r.status === 'pending').length || 0}</p>
                 </div>
                 <MessageSquare className="h-8 w-8 text-primary" />
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Completed</p>
                   <p className="text-2xl font-bold">{requests?.filter(r => r.status === 'completed').length || 0}</p>
                 </div>
                 <Star className="h-8 w-8 text-primary" />
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Rating</p>
                   <p className="text-2xl font-bold">{sellerProfile?.rating || 0}/5</p>
                 </div>
                 <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs defaultValue={sellerProfile ? "services" : "profile"} className="space-y-6">
           <TabsList>
             <TabsTrigger value="profile">
               <Settings className="h-4 w-4 mr-2" />
               Profile
             </TabsTrigger>
             <TabsTrigger value="services" disabled={!sellerProfile}>
               <Briefcase className="h-4 w-4 mr-2" />
               My Services
             </TabsTrigger>
             <TabsTrigger value="requests" disabled={!sellerProfile}>
               <MessageSquare className="h-4 w-4 mr-2" />
               Requests
             </TabsTrigger>
           </TabsList>
 
           {/* Profile Tab */}
           <TabsContent value="profile">
             <Card>
               <CardHeader>
                 <CardTitle>{sellerProfile ? "Edit Profile" : "Complete Your Profile"}</CardTitle>
                 <CardDescription>
                   {sellerProfile 
                     ? "Update your business information" 
                     : "Set up your seller profile to start offering services"}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handleProfileSubmit} className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="business_name">Business Name</Label>
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
                       <Label htmlFor="phone">Phone Number</Label>
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
                       placeholder="Describe your expertise and services..."
                       rows={4}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="specializations">Specializations (comma separated)</Label>
                     <Input 
                       id="specializations" 
                       name="specializations" 
                       defaultValue={sellerProfile?.specializations?.join(", ") || ""} 
                       placeholder="Laptop Repair, Screen Replacement, Data Recovery"
                     />
                   </div>
                   <Button type="submit" disabled={profileMutation.isPending}>
                     {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {sellerProfile ? "Update Profile" : "Create Profile"}
                   </Button>
                 </form>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Services Tab */}
           <TabsContent value="services">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">My Services</h2>
               <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                 <DialogTrigger asChild>
                   <Button>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Service
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>Add New Service</DialogTitle>
                   </DialogHeader>
                   <form onSubmit={handleServiceSubmit} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="title">Service Title</Label>
                       <Input id="title" name="title" placeholder="Laptop Screen Replacement" required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="category">Category</Label>
                       <Select name="category" required>
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
                       <Textarea id="description" name="description" placeholder="Describe your service..." />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="price">Price (UGX)</Label>
                         <Input id="price" name="price" type="number" placeholder="50000" required />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="price_type">Price Type</Label>
                         <Select name="price_type" defaultValue="fixed">
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
                       Add Service
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {services?.map((service) => (
                 <Card key={service.id}>
                   <CardHeader>
                     <div className="flex justify-between items-start">
                       <CardTitle className="text-lg">{service.title}</CardTitle>
                       <Badge variant={service.is_active ? "default" : "secondary"}>
                         {service.is_active ? "Active" : "Inactive"}
                       </Badge>
                     </div>
                     <CardDescription>{service.category}</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                     <p className="text-lg font-bold text-primary">
                       {service.price_type === 'starting_from' && 'From '}
                       {formatPrice(Number(service.price))}
                       {service.price_type === 'hourly' && '/hr'}
                     </p>
                   </CardContent>
                 </Card>
               ))}
               {services?.length === 0 && (
                 <Card className="col-span-full">
                   <CardContent className="py-8 text-center text-muted-foreground">
                     No services yet. Add your first service to start getting requests!
                   </CardContent>
                 </Card>
               )}
             </div>
           </TabsContent>
 
           {/* Requests Tab */}
           <TabsContent value="requests">
             <h2 className="text-xl font-semibold mb-4">Service Requests</h2>
             <div className="space-y-4">
               {requests?.map((request) => (
                 <Card key={request.id}>
                   <CardHeader>
                     <div className="flex justify-between items-start">
                       <div>
                         <CardTitle className="text-lg">{request.title}</CardTitle>
                         <CardDescription>
                           {request.customer_name} • {request.customer_phone}
                         </CardDescription>
                       </div>
                       <Badge variant={
                         request.status === 'completed' ? 'default' :
                         request.status === 'pending' ? 'secondary' :
                         request.status === 'in_progress' ? 'outline' : 'destructive'
                       }>
                         {request.status}
                       </Badge>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                     {request.device_brand && (
                       <p className="text-sm mb-2">
                         <strong>Device:</strong> {request.device_brand} {request.device_model}
                       </p>
                     )}
                     {request.budget && (
                       <p className="text-sm mb-4">
                         <strong>Budget:</strong> {formatPrice(Number(request.budget))}
                       </p>
                     )}
                     <div className="flex gap-2">
                       {request.status === 'pending' && (
                         <>
                           <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'accepted' })}>
                             Accept
                           </Button>
                           <Button size="sm" variant="outline" onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'cancelled' })}>
                             Decline
                           </Button>
                         </>
                       )}
                       {request.status === 'accepted' && (
                         <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'in_progress' })}>
                           Start Work
                         </Button>
                       )}
                       {request.status === 'in_progress' && (
                         <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'completed' })}>
                           Mark Complete
                         </Button>
                       )}
                       <Button size="sm" variant="ghost" asChild>
                         <a href={`https://wa.me/${request.customer_phone?.replace(/\D/g, '')}`} target="_blank">
                           WhatsApp
                         </a>
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
               {requests?.length === 0 && (
                 <Card>
                   <CardContent className="py-8 text-center text-muted-foreground">
                     No service requests yet. Share your profile to start getting customers!
                   </CardContent>
                 </Card>
               )}
             </div>
           </TabsContent>
         </Tabs>
       </main>
     </div>
   );
 };
 
 export default SellerDashboard;