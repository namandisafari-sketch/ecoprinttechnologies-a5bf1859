import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  FileText,
} from "lucide-react";
import QuotationPreview from "@/components/pos/QuotationPreview";
import type { QuotationData, QuotationItem } from "@/components/pos/QuotationPreview";

const AdminQuotations = () => {
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [subject, setSubject] = useState("QUOTATION FOR SALE OF LAPTOPS.");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [includeVAT, setIncludeVAT] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState("3 (three)");
  const [testingDuration, setTestingDuration] = useState("24 hours");
  const [customNotes, setCustomNotes] = useState("");

  const [items, setItems] = useState<QuotationItem[]>([
    { description: "", unitPrice: 0, quantity: 1 },
  ]);

  const { data: products } = useQuery({
    queryKey: ["quotation-products", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .ilike("name", `%${searchQuery}%`)
        .limit(10);
      return data || [];
    },
  });

  const addItem = () => {
    setItems([...items, { description: "", unitPrice: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addProductToQuotation = (product: any) => {
    const desc = [product.name, product.model ? `${product.model}` : "", product.color ? `${product.color}` : ""]
      .filter(Boolean)
      .join(", ");
    setItems([...items, { description: desc, unitPrice: product.price, quantity: 1 }]);
    setSearchQuery("");
    toast({ title: "Product added to quotation" });
  };

  const quotationData: QuotationData = {
    customerName,
    date,
    subject,
    items: items.filter((i) => i.description),
    includeVAT,
    paymentTerms,
    testingDuration,
    notes: customNotes
      ? customNotes.split("\n").filter((n) => n.trim())
      : [],
  };

  const handlePrint = () => {
    const el = previewRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Quotation</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;width:210mm;margin:0 auto;}img{display:inline-block;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const handleDownload = () => {
    const el = previewRef.current;
    if (!el) return;
    const blob = new Blob([`<!DOCTYPE html><html><head><title>Quotation</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;}</style>
    </head><body>${el.innerHTML}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotation-${customerName || "draft"}-${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">Create and print professional quotations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          {/* Customer & Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Customer Name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Client name" />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={includeVAT} onCheckedChange={setIncludeVAT} id="vat" />
                <Label htmlFor="vat" className="text-xs">Include VAT (18%)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add from Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {products && products.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {products.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => addProductToQuotation(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-muted-foreground ml-2 whitespace-nowrap">
                        UGX {new Intl.NumberFormat("en-UG").format(p.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Items
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Row
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    className="w-28 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    className="w-16 text-xs"
                    min={1}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(i)}
                    disabled={items.length <= 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Terms &amp; Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Payment Terms (days)</Label>
                  <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="3 (three)" />
                </div>
                <div>
                  <Label className="text-xs">Testing Duration</Label>
                  <Input value={testingDuration} onChange={(e) => setTestingDuration(e.target.value)} placeholder="24 hours" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Custom Notes (one per line, leave empty for defaults)</Label>
                <Textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Leave empty to use default terms..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-[85vh]">
          <div ref={previewRef} className="bg-white shadow-lg mx-auto" style={{ width: "210mm" }}>
            <QuotationPreview data={quotationData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuotations;
