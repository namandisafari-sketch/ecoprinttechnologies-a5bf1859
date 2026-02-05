import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MessageSquare, Star, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SellerOverview = () => {
  const { user } = useAuth();

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

  const { data: services } = useQuery({
    queryKey: ["seller-services", sellerProfile?.id],
    queryFn: async () => {
      if (!sellerProfile?.id) return [];
      const { data, error } = await supabase
        .from("seller_services")
        .select("*")
        .eq("seller_id", sellerProfile.id);
      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile?.id,
  });

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

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const completedRequests = requests?.filter(r => r.status === 'completed') || [];

  const stats = [
    {
      label: "Total Services",
      value: services?.length || 0,
      icon: Briefcase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pending Requests",
      value: pendingRequests.length,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Completed",
      value: completedRequests.length,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Rating",
      value: `${sellerProfile?.rating || 0}/5`,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

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

  if (!sellerProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to Seller Portal</h1>
          <p className="text-muted-foreground">Complete your profile to start offering services</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Set Up Your Profile</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Create your seller profile to list your services and start receiving customer requests.
            </p>
            <Button asChild>
              <Link to="/seller/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {sellerProfile.business_name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Recent Requests</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/seller/requests">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.customer_name} • {request.device_type} {request.device_brand}
                    </p>
                  </div>
                  <Badge className={getStatusColor(request.status || "pending")}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No requests yet</p>
              <p className="text-sm">Requests from customers will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/seller/services">
            <Briefcase className="h-5 w-5" />
            <span>Manage Services</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to="/seller/profile">
            <TrendingUp className="h-5 w-5" />
            <span>Edit Profile</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SellerOverview;
