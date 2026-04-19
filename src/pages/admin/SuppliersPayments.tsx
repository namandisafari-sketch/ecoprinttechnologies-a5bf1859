import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminSuppliersPayments = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Suppliers & Payments</h1>
      <p className="text-sm text-muted-foreground">Track supplier accounts, payment status, and vendor invoices.</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Supplier payments</CardTitle>
        <CardDescription>Record payments to suppliers and reconcile supplier accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This page is ready to support supplier invoice management, payment recording, and account reconciliation.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminSuppliersPayments;
