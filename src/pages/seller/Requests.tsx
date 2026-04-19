import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Phone, Laptop, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const SellerRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: requests, isLoading } = useQuery({
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

  const updateMutation = useMutation({
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
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!sellerProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complete Your Profile First</h3>
            <p className="text-muted-foreground mb-4">
              You need to set up your seller profile to receive requests.
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
      <div>
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <p className="text-muted-foreground">
          {requests?.filter(r => r.status === 'pending').length || 0} pending requests
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{request.title || "Service Request"}</h3>
                      <Badge className={getStatusColor(request.status || "pending")}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.description}
                    </p>
                  </div>
                  <Select
                    value={request.status || "pending"}
                    onValueChange={(status) => updateMutation.mutate({ id: request.id, status })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                {/* Customer & Budget */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium text-xs">
                        {request.customer_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{request.customer_name}</p>
                      <a 
                        href={`tel:${request.customer_phone}`}
                        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {request.customer_phone}
                      </a>
                    </div>
                  </div>
                  
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.created_at), "PPp")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
            <p className="text-muted-foreground">
              Customer requests will appear here once you receive them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerRequests;
