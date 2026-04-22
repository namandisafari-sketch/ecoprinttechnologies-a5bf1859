import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, Plus, Tag, Copy, Save, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StickerForm from "@/components/admin/stickers/StickerForm";
import StickerPreview from "@/components/admin/stickers/StickerPreview";
import { printStickers } from "@/components/admin/stickers/printStickers";
import { StickerData, StickerLayout, FooterImage, DEFAULT_SPECS, DEFAULT_DISCLAIMERS, DEFAULT_LAYOUT, emptyStickerData } from "@/components/admin/stickers/types";
import { BUILT_IN_TEMPLATES } from "@/components/admin/stickers/builtInTemplates";

interface StickerTemplate {
  id: string;
  name: string;
  createdAt: string;
  layout: StickerLayout;
  footerImages: FooterImage[];
  footerText: string;
  complianceId: string;
  poCode: string;
  disclaimers: string;
  showQrCode: boolean;
  showBrandLogo: boolean;
  specs: { key: string; value: string }[];
}

const TEMPLATES_KEY = "sticker_templates";

const AdminStickers = () => {
  const [stickers, setStickers] = useState<StickerData[]>(() => [BUILT_IN_TEMPLATES[0].build()]);
  const printRef = useRef<HTMLDivElement>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saveFromIndex, setSaveFromIndex] = useState(0);
  const queryClient = useQueryClient();

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

  const { data: templates = [] } = useQuery({
    queryKey: ["sticker-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", TEMPLATES_KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as StickerTemplate[]) || [];
    },
  });

  const saveTemplates = useMutation({
    mutationFn: async (newTemplates: StickerTemplate[]) => {
      const { data: existing } = await supabase
        .from("store_settings")
        .select("id")
        .eq("key", TEMPLATES_KEY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("store_settings")
          .update({ value: newTemplates as any })
          .eq("key", TEMPLATES_KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("store_settings")
          .insert({ key: TEMPLATES_KEY, value: newTemplates as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sticker-templates"] });
    },
  });

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const sticker = stickers[saveFromIndex];
    const template: StickerTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      layout: { ...sticker.layout },
      footerImages: sticker.footerImages.map(fi => ({ ...fi })),
      footerText: sticker.footerText,
      complianceId: sticker.complianceId,
      poCode: sticker.poCode,
      disclaimers: sticker.disclaimers,
      showQrCode: sticker.showQrCode,
      showBrandLogo: sticker.showBrandLogo,
      specs: sticker.specs.map(s => ({ ...s })),
    };

    const updated = [...templates, template];
    await saveTemplates.mutateAsync(updated);
    toast.success(`Template "${templateName}" saved`);
    setTemplateName("");
    setShowSaveDialog(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    await saveTemplates.mutateAsync(updated);
    toast.success("Template deleted");
  };

  const handleLoadTemplate = (template: StickerTemplate, targetIndex: number) => {
    setStickers(prev => {
      const updated = [...prev];
      const current = updated[targetIndex];
      updated[targetIndex] = {
        ...current,
        layout: { ...template.layout },
        footerImages: template.footerImages.map(fi => ({ ...fi })),
        footerText: template.footerText,
        complianceId: template.complianceId,
        poCode: template.poCode,
        disclaimers: template.disclaimers,
        showQrCode: template.showQrCode,
        showBrandLogo: template.showBrandLogo,
        specs: template.specs.map(s => ({ ...s })),
      };
      return updated;
    });
    toast.success(`Template "${template.name}" applied to Sticker ${targetIndex + 1}`);
    setShowLoadDialog(false);
  };

  // --- existing handlers ---

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
        complianceId: "",
        poCode: "",
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

  const applyBuiltIn = (templateId: string, targetIndex: number) => {
    const tpl = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setStickers(prev => {
      const updated = [...prev];
      updated[targetIndex] = tpl.build();
      return updated;
    });
    toast.success(`${tpl.name} applied to Sticker ${targetIndex + 1}`);
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
          <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
            <FolderOpen className="h-4 w-4 mr-1" /> Load Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSaveFromIndex(0); setShowSaveDialog(true); }}>
            <Save className="h-4 w-4 mr-1" /> Save Template
          </Button>
          {stickers.length === 1 && (
            <Button variant="outline" size="sm" onClick={() => fillAllWithSticker(0)}>
              <Copy className="h-4 w-4 mr-1" /> Fill 3x Identical
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addSticker} disabled={stickers.length >= 3}>
            <Plus className="h-4 w-4 mr-1" /> Add Sticker
          </Button>
          <Button size="sm" onClick={handlePrint}>
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

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Sticker Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Save the current layout, footer, disclaimers, and spec keys as a reusable template.
            </p>
            {stickers.length > 1 && (
              <div className="flex gap-2">
                {stickers.map((_, i) => (
                  <Button
                    key={i}
                    variant={saveFromIndex === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSaveFromIndex(i)}
                  >
                    Sticker {i + 1}
                  </Button>
                ))}
              </div>
            )}
            <Input
              placeholder="Template name (e.g. HP Standard, Lenovo Grid)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={saveTemplates.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Load Sticker Template</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No saved templates yet. Create a sticker layout and save it as a template.
            </p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tpl.layout.footerLayout === "grid" ? "Grid footer" : "Row footer"} · {tpl.layout.stickerWidthMm}mm wide · {tpl.specs.filter(s => s.key).length} spec fields · {new Date(tpl.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {stickers.map((_, i) => (
                      <Button key={i} size="sm" variant="outline" className="text-xs h-7" onClick={() => handleLoadTemplate(tpl, i)}>
                        → {i + 1}
                      </Button>
                    ))}
                    <Button size="sm" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(tpl.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStickers;
