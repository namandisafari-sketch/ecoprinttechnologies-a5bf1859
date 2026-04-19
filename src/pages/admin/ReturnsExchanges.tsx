import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminReturnsExchanges = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Returns & Exchanges</h1>
      <p className="text-sm text-muted-foreground">Manage product returns, exchanges, and refunds from customers.</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Customer returns</CardTitle>
        <CardDescription>Review recent return requests and process exchanges with stock reconciliation.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This page is a placeholder for returns and exchanges flows, including refund approvals and inventory restocking.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminReturnsExchanges;
