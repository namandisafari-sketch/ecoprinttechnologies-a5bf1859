import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

const AdminCustomers = () => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      // Get unique customers from orders
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, customer_email, customer_phone, city")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // Deduplicate by email
      const uniqueCustomers = data?.reduce((acc: any[], order) => {
        if (!acc.find((c) => c.customer_email === order.customer_email)) {
          acc.push(order);
        }
        return acc;
      }, []);

      return uniqueCustomers || [];
    },
  });

  const { data: orderCounts } = useQuery({
    queryKey: ["customer-order-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_email, total");
      
      if (error) throw error;

      // Count orders and total spent per customer
      const counts: Record<string, { orders: number; total: number }> = {};
      data?.forEach((order) => {
        if (!counts[order.customer_email]) {
          counts[order.customer_email] = { orders: 0, total: 0 };
        }
        counts[order.customer_email].orders++;
        counts[order.customer_email].total += Number(order.total);
      });

      return counts;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">View customer information</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{customer.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.customer_phone}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell className="text-center">
                      {orderCounts?.[customer.customer_email]?.orders || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(orderCounts?.[customer.customer_email]?.total || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground">
                Customers will appear here once they place orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
