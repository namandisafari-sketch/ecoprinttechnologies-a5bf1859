import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string;
  cta_link: string;
  image_url: string | null;
  bg_class: string;
  display_order: number;
  is_active: boolean;
}

const bgOptions = [
  { label: "Dark", value: "from-secondary/95 via-secondary/80 to-secondary/95" },
  { label: "Primary", value: "from-primary/90 via-primary/70 to-primary/90" },
  { label: "Accent", value: "from-accent/90 via-accent/70 to-accent/90" },
];

const AdminHeroSlides = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editSlide, setEditSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_text: "Shop Now",
    cta_link: "/search",
    image_url: "",
    bg_class: bgOptions[0].value,
    display_order: 0,
    is_active: true,
  });

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (slide: typeof form & { id?: string }) => {
      if (slide.id) {
        const { error } = await supabase.from("hero_slides").update(slide).eq("id", slide.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_slides").insert(slide);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: editSlide ? "Slide updated" : "Slide created" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Slide deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("hero_slides").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `hero/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const openCreate = () => {
    setEditSlide(null);
    setForm({
      title: "",
      subtitle: "",
      cta_text: "Shop Now",
      cta_link: "/search",
      image_url: "",
      bg_class: bgOptions[0].value,
      display_order: slides.length + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditSlide(slide);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      cta_text: slide.cta_text,
      cta_link: slide.cta_link,
      image_url: slide.image_url || "",
      bg_class: slide.bg_class,
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditSlide(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editSlide ? { ...form, id: editSlide.id } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hero Slides</h1>
          <p className="text-muted-foreground">Manage homepage carousel banners</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Slide
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hero slides yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <Card key={slide.id} className={!slide.is_active ? "opacity-50" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                {slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-20 h-12 object-cover rounded-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{slide.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{slide.subtitle}</p>
                </div>

                <Switch
                  checked={slide.is_active}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: slide.id, is_active: checked })
                  }
                />

                <Button variant="ghost" size="icon" onClick={() => openEdit(slide)}>
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(slide.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editSlide ? "Edit Slide" : "New Slide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input value={form.cta_link} onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Image</Label>
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
              )}
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>

            <div className="space-y-2">
              <Label>Overlay Style</Label>
              <div className="flex gap-2">
                {bgOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={form.bg_class === opt.value ? "default" : "outline"}
                    onClick={() => setForm((p) => ({ ...p, bg_class: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editSlide ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeroSlides;
