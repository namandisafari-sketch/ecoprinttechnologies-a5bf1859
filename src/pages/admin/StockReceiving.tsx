import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminStockReceiving = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Stock Receiving</h1>
      <p className="text-sm text-muted-foreground">Receive new inventory, record deliveries, and adjust stock quantities.</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Incoming stock</CardTitle>
        <CardDescription>Track deliveries from suppliers and update your inventory with received items.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This page is ready for stock receiving workflows, including purchase receiving, supplier invoices, and inventory adjustments.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminStockReceiving;
