import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Plus, Tag, Copy } from "lucide-react";
import { toast } from "sonner";
import StickerForm from "@/components/admin/stickers/StickerForm";
import StickerPreview from "@/components/admin/stickers/StickerPreview";
import { printStickers } from "@/components/admin/stickers/printStickers";
import { StickerData, DEFAULT_SPECS, DEFAULT_DISCLAIMERS, DEFAULT_LAYOUT, emptyStickerData } from "@/components/admin/stickers/types";

const AdminStickers = () => {
  const [stickers, setStickers] = useState<StickerData[]>([emptyStickerData()]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ["sticker-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, model, color, brand_id, brands(name, logo_url), product_specifications(spec_key, spec_value)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const loadFromProduct = (productId: string, stickerIndex: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (!product) return;

    const brand = (product as any).brands;
    const specs = DEFAULT_SPECS.map(ds => {
      const found = ((product as any).product_specifications || []).find(
        (ps: any) => ps.spec_key.toLowerCase() === ds.key.toLowerCase()
      );
      return { key: ds.key, value: found ? found.spec_value : "" };
    });
    ((product as any).product_specifications || []).forEach((ps: any) => {
      if (!specs.find(s => s.key.toLowerCase() === ps.spec_key.toLowerCase())) {
        specs.push({ key: ps.spec_key, value: ps.spec_value });
      }
    });
    if (product.color) {
      const colorSpec = specs.find(s => s.key === "Color");
      if (colorSpec && !colorSpec.value) colorSpec.value = product.color;
    }

    const qrCodeUrl = `${window.location.origin}/product/${product.id}`;

    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIndex] = {
        brandName: brand?.name || "",
        brandLogoUrl: brand?.logo_url || "",
        showBrandLogo: !!brand?.logo_url,
        productType: "LAPTOP",
        productModel: product.model || product.name,
        serialNumber: "",
        typeCode: "",
        specs,
        disclaimers: DEFAULT_DISCLAIMERS,
        showQrCode: true,
        qrCodeUrl,
        footerImages: [],
        footerText: "Kabejja Technologies",
        layout: { ...DEFAULT_LAYOUT },
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
      updated[stickerIdx] = { ...updated[stickerIdx], specs: [...updated[stickerIdx].specs, { key: "", value: "" }] };
      return updated;
    });
  };

  const removeSpec = (stickerIdx: number, specIdx: number) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = { ...updated[stickerIdx], specs: updated[stickerIdx].specs.filter((_, i) => i !== specIdx) };
      return updated;
    });
  };

  const updateFooterImage = (stickerIdx: number, fiIdx: number, field: "url" | "label", value: string) => {
    setStickers(prev => {
      const updated = [...prev];
      const footerImages = [...updated[stickerIdx].footerImages];
      footerImages[fiIdx] = { ...footerImages[fiIdx], [field]: value };
      updated[stickerIdx] = { ...updated[stickerIdx], footerImages };
      return updated;
    });
  };

  const addFooterImage = (stickerIdx: number) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = { ...updated[stickerIdx], footerImages: [...updated[stickerIdx].footerImages, { url: "", label: "" }] };
      return updated;
    });
  };

  const removeFooterImage = (stickerIdx: number, fiIdx: number) => {
    setStickers(prev => {
      const updated = [...prev];
      updated[stickerIdx] = { ...updated[stickerIdx], footerImages: updated[stickerIdx].footerImages.filter((_, i) => i !== fiIdx) };
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

  const duplicateSticker = (index: number) => {
    if (stickers.length >= 3) {
      toast.error("Maximum 3 stickers per A4 page");
      return;
    }
    setStickers(prev => {
      const clone = JSON.parse(JSON.stringify(prev[index]));
      return [...prev, clone];
    });
  };

  const fillAllWithSticker = (index: number) => {
    const source = stickers[index];
    const filled: StickerData[] = [];
    for (let i = 0; i < 3; i++) {
      filled.push(JSON.parse(JSON.stringify(source)));
    }
    setStickers(filled);
    toast.success("Filled all 3 slots with identical stickers");
  };

  const removeSticker = (index: number) => {
    if (stickers.length <= 1) return;
    setStickers(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    if (!printStickers(stickers)) {
      toast.error("Please allow popups to print stickers");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Product Stickers
          </h1>
          <p className="text-muted-foreground text-sm">Generate packaging stickers with logos, QR codes & specs (up to 3 per A4)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stickers.length === 1 && (
            <Button variant="outline" onClick={() => fillAllWithSticker(0)}>
              <Copy className="h-4 w-4 mr-1" /> Fill 3x Identical
            </Button>
          )}
          <Button variant="outline" onClick={addSticker} disabled={stickers.length >= 3}>
            <Plus className="h-4 w-4 mr-1" /> Add Sticker
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Stickers
          </Button>
        </div>
      </div>

      {/* Sticker Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stickers.map((sticker, stickerIdx) => (
          <StickerForm
            key={stickerIdx}
            sticker={sticker}
            index={stickerIdx}
            canRemove={stickers.length > 1}
            products={products}
            onUpdate={(field, value) => updateSticker(stickerIdx, field, value)}
            onUpdateSpec={(specIdx, field, val) => updateSpec(stickerIdx, specIdx, field, val)}
            onAddSpec={() => addSpec(stickerIdx)}
            onRemoveSpec={(specIdx) => removeSpec(stickerIdx, specIdx)}
            onRemove={() => removeSticker(stickerIdx)}
            onDuplicate={() => duplicateSticker(stickerIdx)}
            onLoadProduct={(pid) => loadFromProduct(pid, stickerIdx)}
            onUpdateFooterImage={(fiIdx, field, val) => updateFooterImage(stickerIdx, fiIdx, field, val)}
            onAddFooterImage={() => addFooterImage(stickerIdx)}
            onRemoveFooterImage={(fiIdx) => removeFooterImage(stickerIdx, fiIdx)}
          />
        ))}
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview (A4 Layout)</CardTitle>
        </CardHeader>
        <CardContent>
          <StickerPreview ref={printRef} stickers={stickers} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStickers;
