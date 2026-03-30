import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StickerLayout } from "./types";

interface LayoutControlsProps {
  layout: StickerLayout;
  onChange: (layout: StickerLayout) => void;
}

const SliderRow = ({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <Label className="text-xs w-28 shrink-0">{label}</Label>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      className="flex-1"
    />
    <span className="text-xs text-muted-foreground w-14 text-right">{value}{unit}</span>
  </div>
);

const LayoutControls = ({ layout, onChange }: LayoutControlsProps) => {
  const update = (field: keyof StickerLayout, value: any) => {
    onChange({ ...layout, [field]: value });
  };

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
      <Label className="text-xs font-semibold">Layout Controls</Label>
      
      <SliderRow label="Sticker Width" value={layout.stickerWidthMm} min={50} max={210} step={1} unit="mm" onChange={(v) => update("stickerWidthMm", v)} />
      <SliderRow label="Logo Height" value={layout.logoMaxHeightMm} min={8} max={40} step={1} unit="mm" onChange={(v) => update("logoMaxHeightMm", v)} />
      <SliderRow label="Title Font" value={layout.titleFontPt} min={8} max={28} step={0.5} unit="pt" onChange={(v) => update("titleFontPt", v)} />
      <SliderRow label="Model Font" value={layout.modelFontPt} min={6} max={20} step={0.5} unit="pt" onChange={(v) => update("modelFontPt", v)} />
      <SliderRow label="Spec Font" value={layout.specFontPt} min={5} max={14} step={0.5} unit="pt" onChange={(v) => update("specFontPt", v)} />
      <SliderRow label="Disclaimer Font" value={layout.disclaimerFontPt} min={4} max={10} step={0.5} unit="pt" onChange={(v) => update("disclaimerFontPt", v)} />
      <SliderRow label="Top Padding" value={layout.paddingTopMm} min={2} max={20} step={1} unit="mm" onChange={(v) => update("paddingTopMm", v)} />
      <SliderRow label="Side Padding" value={layout.paddingHorizontalMm} min={2} max={15} step={1} unit="mm" onChange={(v) => update("paddingHorizontalMm", v)} />

      <div className="flex items-center gap-2">
        <Label className="text-xs w-28 shrink-0">Title Align</Label>
        <Select value={layout.textAlign} onValueChange={(v) => update("textAlign", v)}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs w-28 shrink-0">Specs Align</Label>
        <Select value={layout.specsAlign} onValueChange={(v) => update("specsAlign", v)}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs w-28 shrink-0">Footer Align</Label>
        <Select value={layout.footerAlign} onValueChange={(v) => update("footerAlign", v)}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LayoutControls;
