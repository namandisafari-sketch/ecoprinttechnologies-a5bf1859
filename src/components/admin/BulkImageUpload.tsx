import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addWatermark } from "@/lib/watermark";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductMatch {
  file: File;
  productName: string;
  imageIndex: number;
  productId: string | null;
  status: "pending" | "uploading" | "done" | "skipped" | "error";
  message?: string;
}

/**
 * Parse a filename like "Dell_Latitude_7390_i7_8th_Gen_8GB_1.png"
 * into { productName: "Dell Latitude 7390 i7 8th Gen 8GB", imageIndex: 1 }
 */
function parseFilename(filename: string): { productName: string; imageIndex: number } {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
  // Match trailing _N, (N), -N, or space+N pattern for image index
  const indexMatch = nameWithoutExt.match(/[\s_-]*[\(_-]?(\d+)[\)]?$/);
  let imageIndex = 1;
  let baseName = nameWithoutExt;

  if (indexMatch) {
    imageIndex = parseInt(indexMatch[1], 10);
    baseName = nameWithoutExt.slice(0, indexMatch.index);
  }

  // Remove common non-product suffixes like "hero"
  let cleaned = baseName.replace(/[-_\s]*(hero|thumb|main|banner|cover)[-_\s]*/gi, " ");
  // Replace underscores and hyphens with spaces for matching
  const productName = cleaned.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  return { productName, imageIndex };
}

/**
 * Fuzzy match: check if product name contains all significant words from parsed name
 */
function matchProduct(
  parsedName: string,
  products: { id: string; name: string; image_url: string | null; images: string[] | null }[]
): { id: string; name: string; image_url: string | null; images: string[] | null } | null {
  const parsedWords = parsedName.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  
  let bestMatch: typeof products[0] | null = null;
  let bestScore = 0;

  for (const product of products) {
    const productLower = product.name.toLowerCase();
    const matchedWords = parsedWords.filter(w => productLower.includes(w));
    const score = matchedWords.length / parsedWords.length;
    
    if (score > bestScore && score >= 0.7) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return bestMatch;
}

interface BulkImageUploadProps {
  onClose: () => void;
}

const BulkImageUpload = ({ onClose }: BulkImageUploadProps) => {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Fetch all products for matching
    const { data: allProducts } = await supabase
      .from("products")
      .select("id, name, image_url, images")
      .order("name");

    if (!allProducts) {
      toast({ title: "Failed to load products", variant: "destructive" });
      return;
    }

    setProducts(allProducts);

    const parsed: ProductMatch[] = Array.from(files).map((file) => {
      const { productName, imageIndex } = parseFilename(file.name);
      const matched = matchProduct(productName, allProducts);

      // Check if this image was already uploaded (by checking existing URLs contain a similar name pattern)
      let alreadyUploaded = false;
      if (matched) {
        const existingUrls = [matched.image_url, ...(matched.images || [])].filter(Boolean) as string[];
        // Simple check: if the product already has enough images covering this index
        if (imageIndex === 1 && matched.image_url) {
          alreadyUploaded = true;
        } else if (imageIndex > 1 && (matched.images || []).length >= imageIndex - 1) {
          alreadyUploaded = true;
        }
      }

      return {
        file,
        productName,
        imageIndex,
        productId: matched?.id || null,
        status: alreadyUploaded ? "skipped" : matched ? "pending" : "error",
        message: alreadyUploaded
          ? `Already has image #${imageIndex}`
          : matched
          ? `→ ${matched.name}`
          : `No matching product found`,
      };
    });

    // Sort: pending first, then skipped, then errors
    parsed.sort((a, b) => {
      const order = { pending: 0, uploading: 1, done: 2, skipped: 3, error: 4 };
      return order[a.status] - order[b.status];
    });

    setMatches(parsed);
  };

  const startUpload = async () => {
    const toUpload = matches.filter((m) => m.status === "pending");
    if (toUpload.length === 0) {
      toast({ title: "No images to upload" });
      return;
    }

    setIsProcessing(true);
    let completed = 0;

    // Group by product for batch updates
    const productUpdates: Record<string, { mainImage?: string; galleryImages: string[] }> = {};

    for (const match of toUpload) {
      setMatches((prev) =>
        prev.map((m) => (m === match ? { ...m, status: "uploading" } : m))
      );

      try {
        const watermarkedFile = await addWatermark(match.file);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(filePath, watermarkedFile);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        // Queue the update
        if (!productUpdates[match.productId!]) {
          productUpdates[match.productId!] = { galleryImages: [] };
        }

        if (match.imageIndex === 1) {
          productUpdates[match.productId!].mainImage = publicUrl;
        } else {
          productUpdates[match.productId!].galleryImages.push(publicUrl);
        }

        setMatches((prev) =>
          prev.map((m) =>
            m === match ? { ...m, status: "done", message: "Uploaded ✓" } : m
          )
        );
      } catch (err: any) {
        setMatches((prev) =>
          prev.map((m) =>
            m === match ? { ...m, status: "error", message: err.message } : m
          )
        );
      }

      completed++;
      setProgress(Math.round((completed / toUpload.length) * 100));
    }

    // Now batch-update products in the database
    for (const [productId, updates] of Object.entries(productUpdates)) {
      const existing = products.find((p) => p.id === productId);
      const existingImages = (existing?.images || []) as string[];

      const updateData: any = {};
      if (updates.mainImage) {
        updateData.image_url = updates.mainImage;
      }
      if (updates.galleryImages.length > 0) {
        updateData.images = [...existingImages, ...updates.galleryImages];
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from("products").update(updateData).eq("id", productId);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    setIsProcessing(false);

    const doneCount = matches.filter((m) => m.status === "done").length + toUpload.filter(m => m.status !== "error").length;
    toast({ title: `Bulk upload complete`, description: `${completed} images processed` });
  };

  const pendingCount = matches.filter((m) => m.status === "pending").length;
  const skippedCount = matches.filter((m) => m.status === "skipped").length;
  const doneCount = matches.filter((m) => m.status === "done").length;
  const errorCount = matches.filter((m) => m.status === "error").length;

  const statusIcon = (status: ProductMatch["status"]) => {
    switch (status) {
      case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "skipped": return <SkipForward className="h-4 w-4 text-muted-foreground" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "uploading": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default: return <ImagePlus className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Bulk Image Upload</h2>
          <p className="text-sm text-muted-foreground">
            Select images named like <code className="bg-muted px-1 rounded text-xs">Dell_Latitude_7390_i7_8th_Gen_8GB_1.png</code>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Click to select product images</p>
            <p className="text-xs text-muted-foreground">
              Name format: ProductName_ImageNumber.png (e.g. Dell_Latitude_5440_i5_13th_Gen_16GB_1.png)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {matches.length} images detected
              </CardTitle>
              <div className="flex gap-2">
                {pendingCount > 0 && <Badge>{pendingCount} ready</Badge>}
                {skippedCount > 0 && <Badge variant="secondary">{skippedCount} skipped</Badge>}
                {doneCount > 0 && <Badge variant="outline" className="text-green-600">{doneCount} done</Badge>}
                {errorCount > 0 && <Badge variant="destructive">{errorCount} no match</Badge>}
              </div>
            </div>
            {isProcessing && <Progress value={progress} className="mt-2" />}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1.5">
                {matches.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                  >
                    {statusIcon(match.status)}
                    <span className="font-mono text-xs truncate max-w-[180px]">{match.file.name}</span>
                    <span className="text-muted-foreground text-xs truncate flex-1">{match.message}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">#{match.imageIndex}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        {matches.length > 0 && !isProcessing && pendingCount > 0 && (
          <Button onClick={startUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload {pendingCount} images
          </Button>
        )}
        {matches.length > 0 && !isProcessing && (
          <Button variant="outline" onClick={() => { setMatches([]); fileInputRef.current?.click(); }}>
            Select different files
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkImageUpload;
