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
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ProductInfo {
  id: string;
  name: string;
  image_url: string | null;
  images: string[] | null;
}

interface ProductMatch {
  file: File;
  preview: string;
  productName: string;
  imageIndex: number;
  productId: string | null;
  matchedProduct: ProductInfo | null;
  status: "pending" | "uploading" | "done" | "skipped" | "error";
  message?: string;
}

/**
 * Parse filenames like:
 * - "Dell_Latitude_7390_i7_8th_Gen_8GB_1.png"
 * - "dell xps (1).png"
 * - "dell xps 4.png"
 * - "dell xps.png" (no index → defaults to 1)
 * - "lenovo-thinkpad-x1-yoga-3rd-gen-hero 1.jpg"
 * - "Thinkpad-X1-YOGA Gen5 2.jpg"
 */
function parseFilename(filename: string): { productName: string; imageIndex: number } {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  // Try matching trailing index patterns: (N), _N, -N, space+N
  const indexMatch = nameWithoutExt.match(/[\s_-]*\((\d+)\)\s*$/)
    || nameWithoutExt.match(/[\s_-]+(\d+)\s*$/);

  let imageIndex = 1;
  let baseName = nameWithoutExt;

  if (indexMatch) {
    imageIndex = parseInt(indexMatch[1], 10);
    baseName = nameWithoutExt.slice(0, indexMatch.index);
  }

  // Remove common non-product suffixes
  let cleaned = baseName.replace(/[-_\s]*(hero|thumb|main|banner|cover)[-_\s]*/gi, " ");
  const productName = cleaned.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  return { productName, imageIndex };
}

/**
 * Fuzzy match: finds best product where all significant parsed words appear in product name.
 * Uses a lower threshold (0.5) and also tries substring matching for short names.
 */
function matchProduct(
  parsedName: string,
  products: ProductInfo[]
): ProductInfo | null {
  const parsedWords = parsedName.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (parsedWords.length === 0) return null;

  let bestMatch: ProductInfo | null = null;
  let bestScore = 0;

  for (const product of products) {
    const productLower = product.name.toLowerCase();
    const matchedWords = parsedWords.filter(w => productLower.includes(w));
    const score = matchedWords.length / parsedWords.length;

    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // Fallback: if parsed name is short (1-2 words), try if product name contains the full parsed string
  if (!bestMatch) {
    const parsedLower = parsedName.toLowerCase();
    for (const product of products) {
      if (product.name.toLowerCase().includes(parsedLower)) {
        return product;
      }
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
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
      const preview = URL.createObjectURL(file);

      // Skip already uploaded images entirely
      if (matched) {
        if (imageIndex === 1 && matched.image_url) return null;
        if (imageIndex > 1 && (matched.images || []).length >= imageIndex - 1) return null;
      }

      return {
        file,
        preview,
        productName,
        imageIndex,
        productId: matched?.id || null,
        matchedProduct: matched || null,
        status: matched ? "pending" : "error",
        message: matched ? `→ ${matched.name}` : `No matching product found`,
      } as ProductMatch;
    }).filter(Boolean) as ProductMatch[];

    parsed.sort((a, b) => {
      const order = { pending: 0, uploading: 1, done: 2, skipped: 3, error: 4 };
      return order[a.status] - order[b.status];
    });

    setMatches(parsed);
  };

  const reassignProduct = (index: number, product: ProductInfo) => {
    setMatches((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        // Check if already uploaded for this product
        let alreadyUploaded = false;
        if (m.imageIndex === 1 && product.image_url) {
          alreadyUploaded = true;
        } else if (m.imageIndex > 1 && (product.images || []).length >= m.imageIndex - 1) {
          alreadyUploaded = true;
        }
        return {
          ...m,
          productId: product.id,
          matchedProduct: product,
          status: alreadyUploaded ? "skipped" : "pending",
          message: alreadyUploaded ? `Already has image #${m.imageIndex}` : `→ ${product.name}`,
        };
      })
    );
  };

  const startUpload = async () => {
    const toUpload = matches.filter((m) => m.status === "pending");
    if (toUpload.length === 0) {
      toast({ title: "No images to upload" });
      return;
    }

    setIsProcessing(true);
    let completed = 0;
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
    toast({ title: `Bulk upload complete`, description: `${completed} images processed` });
  };

  const pendingCount = matches.filter((m) => m.status === "pending").length;
  const doneCount = matches.filter((m) => m.status === "done").length;
  const errorCount = matches.filter((m) => m.status === "error").length;

  const statusIcon = (status: ProductMatch["status"]) => {
    switch (status) {
      case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
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
            Select images named like <code className="bg-muted px-1 rounded text-xs">Dell XPS (1).png</code> or <code className="bg-muted px-1 rounded text-xs">Product_Name_1.png</code>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => folderInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Click to select a folder of product images</p>
            <p className="text-xs text-muted-foreground">
              Supports: Product_Name_1.png, dell xps (2).jpg, Name-Here 3.png
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Or select individual files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {matches.length} images detected
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {pendingCount > 0 && <Badge>{pendingCount} ready</Badge>}
                {doneCount > 0 && <Badge variant="outline" className="text-green-600">{doneCount} done</Badge>}
                {errorCount > 0 && <Badge variant="destructive">{errorCount} no match</Badge>}
                {errorCount > 0 && <Badge variant="destructive">{errorCount} no match</Badge>}
              </div>
            </div>
            {isProcessing && <Progress value={progress} className="mt-2" />}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {matches.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm p-2 rounded-lg border border-border hover:bg-muted/50"
                  >
                    {/* Image preview */}
                    <img
                      src={match.preview}
                      alt={match.file.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0 border border-border"
                    />

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs truncate">{match.file.name}</p>

                      {/* Product assignment row */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {statusIcon(match.status)}

                        {match.matchedProduct ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {match.matchedProduct.image_url && (
                              <img
                                src={match.matchedProduct.image_url}
                                alt=""
                                className="w-6 h-6 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-xs truncate text-muted-foreground">
                              {match.matchedProduct.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-destructive">No match</span>
                        )}
                      </div>
                    </div>

                    {/* Image index badge */}
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      #{match.imageIndex}
                    </Badge>

                    {/* Reassign button */}
                    {!isProcessing && match.status !== "done" && (
                      <ProductSelector
                        products={products}
                        onSelect={(p) => reassignProduct(i, p)}
                      />
                    )}
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
      />
      <input
        ref={folderInputRef}
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
          <Button variant="outline" onClick={() => { setMatches([]); folderInputRef.current?.click(); }}>
            Select different folder
          </Button>
        )}
        {matches.length > 0 && !isProcessing && (
          <Button variant="outline" onClick={() => { setMatches([]); fileInputRef.current?.click(); }}>
            Select files
          </Button>
        )}
      </div>
    </div>
  );
};

/** Inline product selector popover with search */
function ProductSelector({
  products,
  onSelect,
}: {
  products: ProductInfo[];
  onSelect: (product: ProductInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products.slice(0, 20);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-7 px-2 shrink-0">
          Assign <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs mb-2"
          autoFocus
        />
        <ScrollArea className="h-48">
          <div className="space-y-0.5">
            {filtered.map((p) => (
              <button
                key={p.id}
                className="flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-muted text-xs"
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted shrink-0" />
                )}
                <span className="truncate">{p.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No products found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default BulkImageUpload;
