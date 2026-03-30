import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { StickerData } from "./types";

interface StickerFormProps {
  sticker: StickerData;
  index: number;
  canRemove: boolean;
  products: any[] | undefined;
  onUpdate: (field: keyof StickerData, value: any) => void;
  onUpdateSpec: (specIdx: number, field: "key" | "value", val: string) => void;
  onAddSpec: () => void;
  onRemoveSpec: (specIdx: number) => void;
  onRemove: () => void;
  onLoadProduct: (productId: string) => void;
  onUpdateFooterImage: (index: number, field: "url" | "label", value: string) => void;
  onAddFooterImage: () => void;
  onRemoveFooterImage: (index: number) => void;
}

const StickerForm = ({
  sticker, index, canRemove, products,
  onUpdate, onUpdateSpec, onAddSpec, onRemoveSpec,
  onRemove, onLoadProduct,
  onUpdateFooterImage, onAddFooterImage, onRemoveFooterImage,
}: StickerFormProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Sticker {index + 1}</CardTitle>
          {canRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        {products && products.length > 0 && (
          <Select onValueChange={onLoadProduct}>
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
      <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Brand Logo */}
        <div>
          <Label className="text-xs font-semibold">Brand Logo URL</Label>
          <div className="flex gap-1">
            <Input
              value={sticker.brandLogoUrl}
              onChange={(e) => onUpdate("brandLogoUrl", e.target.value)}
              placeholder="https://... or auto-loaded from product"
              className="text-xs h-8"
            />
          </div>
          {sticker.brandLogoUrl && (
            <div className="mt-1 flex items-center gap-2">
              <img src={sticker.brandLogoUrl} alt="logo" className="h-8 object-contain bg-white rounded border p-0.5" />
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onUpdate("brandLogoUrl", "")}>
                Remove
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={sticker.showBrandLogo} onCheckedChange={(v) => onUpdate("showBrandLogo", v)} />
          <Label className="text-xs">Show brand logo</Label>
        </div>

        {/* Brand & Type */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Brand Name</Label>
            <Input value={sticker.brandName} onChange={(e) => onUpdate("brandName", e.target.value)} placeholder="HP / Lenovo" className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs">Product Type</Label>
            <Input value={sticker.productType} onChange={(e) => onUpdate("productType", e.target.value)} placeholder="LAPTOP" className="text-xs h-8" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Product Model</Label>
          <Input value={sticker.productModel} onChange={(e) => onUpdate("productModel", e.target.value)} placeholder="ProBook 450 G8" className="text-xs h-8" />
        </div>

        {/* Serial / Type codes */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">S/N (optional)</Label>
            <Input value={sticker.serialNumber} onChange={(e) => onUpdate("serialNumber", e.target.value)} placeholder="PC-GM01JLPF" className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs">Type Code (optional)</Label>
            <Input value={sticker.typeCode} onChange={(e) => onUpdate("typeCode", e.target.value)} placeholder="20WN-S16S0H" className="text-xs h-8" />
          </div>
        </div>

        {/* Specs */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-semibold">Specifications</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onAddSpec}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-1">
            {sticker.specs.map((spec, specIdx) => (
              <div key={specIdx} className="flex gap-1 items-center">
                <Input value={spec.key} onChange={(e) => onUpdateSpec(specIdx, "key", e.target.value)} placeholder="Key" className="text-xs h-7 w-[40%]" />
                <Input value={spec.value} onChange={(e) => onUpdateSpec(specIdx, "value", e.target.value)} placeholder="Value" className="text-xs h-7 flex-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveSpec(specIdx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimers */}
        <div>
          <Label className="text-xs font-semibold">Disclaimers</Label>
          <Textarea value={sticker.disclaimers} onChange={(e) => onUpdate("disclaimers", e.target.value)} className="text-xs min-h-[60px]" rows={3} />
        </div>

        {/* QR Code */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Switch checked={sticker.showQrCode} onCheckedChange={(v) => onUpdate("showQrCode", v)} />
            <Label className="text-xs font-semibold">Show QR Code</Label>
          </div>
          {sticker.showQrCode && (
            <Input value={sticker.qrCodeUrl} onChange={(e) => onUpdate("qrCodeUrl", e.target.value)} placeholder="URL for QR code" className="text-xs h-8" />
          )}
        </div>

        {/* Footer Images (Energy Star, TCO, etc.) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-semibold">Footer Images / Badges</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onAddFooterImage} disabled={sticker.footerImages.length >= 4}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-1">
            {sticker.footerImages.map((fi, fiIdx) => (
              <div key={fiIdx} className="flex gap-1 items-center">
                <Input value={fi.url} onChange={(e) => onUpdateFooterImage(fiIdx, "url", e.target.value)} placeholder="Image URL" className="text-xs h-7 flex-1" />
                <Input value={fi.label} onChange={(e) => onUpdateFooterImage(fiIdx, "label", e.target.value)} placeholder="Label" className="text-xs h-7 w-[30%]" />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveFooterImage(fiIdx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Made in / PRM / RATT */}
        <div>
          <Label className="text-xs font-semibold">Footer Text (Made in, PRM, RATT etc.)</Label>
          <Input value={sticker.footerText} onChange={(e) => onUpdate("footerText", e.target.value)} placeholder="Made in China | PRM: TPN-C 139" className="text-xs h-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StickerForm;
