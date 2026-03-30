import { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageDropZoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  height?: string;
}

const ImageDropZone = ({ value, onChange, label = "Drop image here", height = "h-20" }: ImageDropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `stickers/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <img src={value} alt="uploaded" className="h-10 object-contain bg-white rounded border p-0.5" />
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onChange("")}>
          <X className="h-3 w-3 mr-1" /> Remove
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`${height} border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors text-xs text-muted-foreground ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      {uploading ? (
        <span className="animate-pulse">Uploading…</span>
      ) : (
        <>
          <Upload className="h-4 w-4 mb-1" />
          <span>{label}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />
    </div>
  );
};

export default ImageDropZone;
