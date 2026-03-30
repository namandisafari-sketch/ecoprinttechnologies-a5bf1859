import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface StickerSpec {
  key: string;
  value: string;
}

interface StickerData {
  brandName: string;
  productType: string;
  productModel: string;
  specs: StickerSpec[];
  disclaimers: string;
}

const DEFAULT_DISCLAIMERS = `For storage drive, GB a billion bytes TB =1 trillion bytes. Actual formatted capacity is less. Up to 35GB of system disk is reserved for system recovery software.
[4] Maximum memory capacities assume Windows 64-bit operating systems or Linux with Windows 32-bit operating systems, memory above 3GB may not be available due to system resource requirements.
[8] Not all features are available in all editions or versions of Windows Systems may require upgraded and/or separately purchased hardware, drivers, software or BIOS update to take full advantage of Windows functionality.`;

const DEFAULT_SPECS: StickerSpec[] = [
  { key: "Processor", value: "" },
  { key: "Speed", value: "" },
  { key: "RAM", value: "" },
  { key: "Storage", value: "" },
  { key: "Graphics", value: "" },
  { key: "Display", value: "" },
  { key: "Color", value: "" },
];

const emptyStickerData = (): StickerData => ({
  brandName: "",
  productType: "LAPTOP",
  productModel: "",
  specs: DEFAULT_SPECS.map(s => ({ ...s })),
  disclaimers: DEFAULT_DISCLAIMERS,
});

const AdminStickers = () => {
  const [stickers, setStickers] = useState<StickerData[]>([emptyStickerData()]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ["sticker-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, model, color, brand_id, brands(name), product_specifications(spec_key, spec_value)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const loadFromProduct = (productId: string, stickerIndex: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (!product) return;

    const brandName = (product as any).brands?.name || "";
    const specs: StickerSpec[] = DEFAULT_SPECS.map(ds => {
      const found = ((product as any).product_specifications || []).find(
        (ps: any) => ps.spec_key.toLowerCase() === ds.key.toLowerCase()
      );
      return { key: ds.key, value: found ? found.spec_value : "" };
    });

    // Add any extra specs from product that aren't in defaults
    ((product as any).product_specifications || []).forEach((ps: any) => {
      if (!specs.find(s => s.key.toLowerCase() === ps.spec_key.toLowerCase())) {
        specs.push({ key: ps.spec_key, value: ps.spec_value });
      }
    });

    if (product.color && !specs.find(s => s.key === "Color" && s.value)) {
      const colorSpec = specs.find(s => s.key === "Color");
      if (colorSpec) colorSpec.value = product.color;
    }

    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIndex] = {
        brandName,
        productType: "LAPTOP",
        productModel: product.model || product.name,
        specs,
        disclaimers: DEFAULT_DISCLAIMERS,
      };
      return updated;
    });
  };

  const updateSticker = (index: number, field: keyof StickerData, value: any) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateSpec = (stickerIdx: number, specIdx: number, field: "key" | "value", val: string) => {
    setStickers(prev => {
      const updated = [...prev];
      const specs = [...updated[stickerIdx].specs];
      specs[specIdx] = { ...specs[specIdx], [field]: val };
      updated[stickerIdx] = { ...updated[stickerIdx], specs };
      return updated;
    });
  };

  const addSpec = (stickerIdx: number) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = {
        ...updated[stickerIdx],
        specs: [...updated[stickerIdx].specs, { key: "", value: "" }],
      };
      return updated;
    });
  };

  const removeSpec = (stickerIdx: number, specIdx: number) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = {
        ...updated[stickerIdx],
        specs: updated[stickerIdx].specs.filter((_, i) => i !== specIdx),
      };
      return updated;
    });
  };

  const addSticker = () => {
    if (stickers.length >= 3) {
      toast.error("Maximum 3 stickers per A4 page");
      return;
    }
    setStickers(prev => [...prev, emptyStickerData()]);
  };

  const removeSticker = (index: number) => {
    if (stickers.length <= 1) return;
    setStickers(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print stickers");
      return;
    }

    const stickerCount = stickers.length;
    const stickerWidth = stickerCount === 1 ? "210mm" : stickerCount === 2 ? "105mm" : "70mm";

    printWindow.document.write(`
      <html>
        <head>
          <title>Product Stickers</title>
          <style>
            @page { size: A4; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: 210mm; height: 297mm; display: flex; font-family: Arial, Helvetica, sans-serif; }
            .sticker {
              width: ${stickerWidth};
              height: 297mm;
              border-right: 1px dashed #ccc;
              padding: 8mm 5mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              overflow: hidden;
            }
            .sticker:last-child { border-right: none; }
            .brand-name {
              font-size: ${stickerCount === 3 ? "14pt" : "18pt"};
              font-weight: bold;
              margin-top: 4mm;
              text-align: center;
            }
            .product-type {
              font-size: ${stickerCount === 3 ? "10pt" : "13pt"};
              font-weight: bold;
              margin-top: 2mm;
              text-align: center;
            }
            .product-model {
              font-size: ${stickerCount === 3 ? "9pt" : "11pt"};
              margin-top: 1mm;
              text-align: center;
            }
            .specs-table {
              width: 90%;
              margin-top: 5mm;
              border-collapse: collapse;
            }
            .specs-table td {
              padding: 1.5mm 2mm;
              font-size: ${stickerCount === 3 ? "7pt" : "9pt"};
              vertical-align: top;
            }
            .spec-key {
              font-weight: bold;
              width: 40%;
            }
            .spec-value {
              font-weight: bold;
            }
            .disclaimers {
              margin-top: 4mm;
              font-size: ${stickerCount === 3 ? "5pt" : "6.5pt"};
              line-height: 1.4;
              width: 90%;
              text-align: left;
              color: #333;
            }
            .separator {
              width: 60%;
              border: none;
              border-top: 1px solid #000;
              margin-top: 4mm;
            }
            .footer {
              margin-top: auto;
              display: flex;
              align-items: center;
              gap: 3mm;
              padding-bottom: 5mm;
              font-size: 6pt;
              color: #666;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${stickers.map(sticker => `
            <div class="sticker">
              <div class="brand-name">${sticker.brandName.toUpperCase()}</div>
              <div class="product-type">${sticker.productType}</div>
              <div class="product-model">${sticker.productModel}</div>
              <table class="specs-table">
                ${sticker.specs.filter(s => s.key && s.value).map(spec => `
                  <tr>
                    <td class="spec-key">${spec.key}</td>
                    <td class="spec-value">${spec.value}</td>
                  </tr>
                `).join("")}
              </table>
              ${sticker.disclaimers ? `
                <hr class="separator" />
                <div class="disclaimers">${sticker.disclaimers.replace(/\n/g, "<br/>")}</div>
              ` : ""}
              <div class="footer">
                <span>Kabejja Technologies</span>
              </div>
            </div>
          `).join("")}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Product Stickers
          </h1>
          <p className="text-muted-foreground">Generate packaging stickers for products (3 per A4 page)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSticker} disabled={stickers.length >= 3}>
            <Plus className="h-4 w-4 mr-1" /> Add Sticker
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Stickers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stickers.map((sticker, stickerIdx) => (
          <Card key={stickerIdx}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Sticker {stickerIdx + 1}</CardTitle>
                {stickers.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSticker(stickerIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {products && products.length > 0 && (
                <Select onValueChange={(val) => loadFromProduct(val, stickerIdx)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Load from product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Brand Name</Label>
                  <Input
                    value={sticker.brandName}
                    onChange={(e) => updateSticker(stickerIdx, "brandName", e.target.value)}
                    placeholder="HP / Lenovo / Dell"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Product Type</Label>
                  <Input
                    value={sticker.productType}
                    onChange={(e) => updateSticker(stickerIdx, "productType", e.target.value)}
                    placeholder="LAPTOP"
                    className="text-xs h-8"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Product Model</Label>
                <Input
                  value={sticker.productModel}
                  onChange={(e) => updateSticker(stickerIdx, "productModel", e.target.value)}
                  placeholder="ProBook 450 G8"
                  className="text-xs h-8"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Specifications</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addSpec(stickerIdx)}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-1">
                  {sticker.specs.map((spec, specIdx) => (
                    <div key={specIdx} className="flex gap-1 items-center">
                      <Input
                        value={spec.key}
                        onChange={(e) => updateSpec(stickerIdx, specIdx, "key", e.target.value)}
                        placeholder="Key"
                        className="text-xs h-7 w-[40%]"
                      />
                      <Input
                        value={spec.value}
                        onChange={(e) => updateSpec(stickerIdx, specIdx, "value", e.target.value)}
                        placeholder="Value"
                        className="text-xs h-7 flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeSpec(stickerIdx, specIdx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Disclaimers</Label>
                <Textarea
                  value={sticker.disclaimers}
                  onChange={(e) => updateSticker(stickerIdx, "disclaimers", e.target.value)}
                  className="text-xs min-h-[60px]"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview (A4 Layout)</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={printRef}
            className="bg-white border border-border mx-auto"
            style={{
              width: "210mm",
              height: "297mm",
              display: "flex",
              overflow: "hidden",
              transform: "scale(0.4)",
              transformOrigin: "top center",
            }}
          >
            {stickers.map((sticker, idx) => (
              <div
                key={idx}
                className="h-full flex flex-col items-center"
                style={{
                  width: stickers.length === 1 ? "210mm" : stickers.length === 2 ? "105mm" : "70mm",
                  borderRight: idx < stickers.length - 1 ? "1px dashed #ccc" : "none",
                  padding: "8mm 5mm",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: stickers.length === 3 ? "14pt" : "18pt", marginTop: "4mm", textAlign: "center", color: "#000" }}>
                  {sticker.brandName.toUpperCase() || "BRAND"}
                </div>
                <div style={{ fontWeight: "bold", fontSize: stickers.length === 3 ? "10pt" : "13pt", marginTop: "2mm", textAlign: "center", color: "#000" }}>
                  {sticker.productType || "LAPTOP"}
                </div>
                <div style={{ fontSize: stickers.length === 3 ? "9pt" : "11pt", marginTop: "1mm", textAlign: "center", color: "#000" }}>
                  {sticker.productModel || "Model Name"}
                </div>
                <table style={{ width: "90%", marginTop: "5mm", borderCollapse: "collapse" }}>
                  <tbody>
                    {sticker.specs.filter(s => s.key && s.value).map((spec, si) => (
                      <tr key={si}>
                        <td style={{ padding: "1.5mm 2mm", fontSize: stickers.length === 3 ? "7pt" : "9pt", fontWeight: "bold", width: "40%", color: "#000" }}>
                          {spec.key}
                        </td>
                        <td style={{ padding: "1.5mm 2mm", fontSize: stickers.length === 3 ? "7pt" : "9pt", fontWeight: "bold", color: "#000" }}>
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sticker.disclaimers && (
                  <>
                    <hr style={{ width: "60%", border: "none", borderTop: "1px solid #000", marginTop: "4mm" }} />
                    <div style={{
                      marginTop: "4mm",
                      fontSize: stickers.length === 3 ? "5pt" : "6.5pt",
                      lineHeight: "1.4",
                      width: "90%",
                      textAlign: "left",
                      color: "#333",
                      whiteSpace: "pre-wrap",
                    }}>
                      {sticker.disclaimers}
                    </div>
                  </>
                )}
                <div style={{ marginTop: "auto", paddingBottom: "5mm", fontSize: "6pt", color: "#666" }}>
                  Kabejja Technologies
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStickers;
