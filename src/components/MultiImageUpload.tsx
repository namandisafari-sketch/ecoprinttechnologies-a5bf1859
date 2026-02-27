import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addWatermark } from "@/lib/watermark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MultiImageUploadProps {
  mainImage: string;
  additionalImages: string[];
  onMainImageChange: (url: string) => void;
  onAdditionalImagesChange: (urls: string[]) => void;
}

const MultiImageUpload = ({
  mainImage,
  additionalImages,
  onMainImageChange,
  onAdditionalImagesChange,
}: MultiImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Use JPG, PNG, WebP, GIF, or AVIF", variant: "destructive" });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
      return null;
    }

    const watermarkedFile = await addWatermark(file);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage.from("product-images").upload(filePath, watermarkedFile);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) onMainImageChange(url);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        if (url) newUrls.push(url);
      }
      onAdditionalImagesChange([...additionalImages, ...newUrls]);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    onAdditionalImagesChange(additionalImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="space-y-2">
        <Label>Main Product Image *</Label>
        <div className="flex items-start gap-4">
          {mainImage ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border flex-shrink-0">
              <img src={mainImage} alt="Main product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { onMainImageChange(""); if (mainInputRef.current) mainInputRef.current.value = ""; }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
              onClick={() => mainInputRef.current?.click()}
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Main image</span>
            </div>
          )}
          <div className="flex-1 space-y-2">
            <Input ref={mainInputRef} type="file" accept="image/*" onChange={handleMainUpload} className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => mainInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {mainImage ? "Replace" : "Upload"}
            </Button>
            <Input placeholder="Or paste image URL" value={mainImage} onChange={(e) => onMainImageChange(e.target.value)} className="text-sm" />
          </div>
        </div>
      </div>

      {/* Additional Gallery Images */}
      <div className="space-y-2">
        <Label>Gallery Images <span className="text-muted-foreground font-normal">(up to 5 additional)</span></Label>
        <div className="flex flex-wrap gap-3">
          {additionalImages.map((url, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAdditionalImage(index)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {additionalImages.length < 5 && (
            <div
              className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => additionalInputRef.current?.click()}
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">Add</span>
            </div>
          )}
        </div>
        <Input
          ref={additionalInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdditionalUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default MultiImageUpload;
