import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminPurchaseOrders = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
      <p className="text-sm text-muted-foreground">Create and track purchase orders for suppliers and incoming stock.</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Purchase orders</CardTitle>
        <CardDescription>Keep supplier orders organized and record expected delivery dates.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This page is ready to support purchase order creation, supplier confirmations, and order status tracking.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminPurchaseOrders;
