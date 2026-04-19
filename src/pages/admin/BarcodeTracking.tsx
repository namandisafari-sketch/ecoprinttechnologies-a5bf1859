import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminBarcodeTracking = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Barcode Tracking</h1>
      <p className="text-sm text-muted-foreground">Scan and manage inventory barcodes and item lookup in one place.</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Barcode tracking workflow</CardTitle>
        <CardDescription>Use the POS scanner or upload barcodes to keep stock aligned with product records.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">This page is ready for barcode tracking enhancements and can be extended with scan history, SKU updates, or batch processing.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminBarcodeTracking;
