import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Pencil, Plus, Layers, Sparkles, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/hero-slides")({
  component: HeroSlidesAdmin,
});

interface HeroSlide {
  id: string;
  image_url: string;
  subtitle: string;
  title: string;
  description: string;
  alt: string | null;
  display_order: number;
  created_at: string;
}

function HeroSlidesAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();

  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [form, setForm] = useState({
    image_url: "",
    subtitle: "",
    title: "",
    description: "",
    alt: "",
    display_order: 0,
  });

  const { data: slides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const createSlide = useMutation({
    mutationFn: async (newSlide: Omit<HeroSlide, "id" | "created_at">) => {
      const { error } = await supabase.from("hero_slides").insert(newSlide);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Hero slide created successfully!");
      setIsAdding(false);
      resetForm();
    },
    onError: (err) => {
      toast.error("Failed to create slide: " + err.message);
    },
  });

  const updateSlide = useMutation({
    mutationFn: async (updated: HeroSlide) => {
      const { error } = await supabase
        .from("hero_slides")
        .update({
          image_url: updated.image_url,
          subtitle: updated.subtitle,
          title: updated.title,
          description: updated.description,
          alt: updated.alt,
          display_order: updated.display_order,
        })
        .eq("id", updated.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Hero slide updated successfully!");
      setEditingSlide(null);
    },
    onError: (err) => {
      toast.error("Failed to update slide: " + err.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Hero slide deleted successfully.");
    },
    onError: (err) => {
      toast.error("Failed to delete slide: " + err.message);
    },
  });

  const moveOrder = async (index: number, direction: "up" | "down") => {
    if (!slides) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const otherSlide = slides[targetIndex];

    try {
      // Swap display orders
      const { error: err1 } = await supabase
        .from("hero_slides")
        .update({ display_order: otherSlide.display_order })
        .eq("id", currentSlide.id);
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("hero_slides")
        .update({ display_order: currentSlide.display_order })
        .eq("id", otherSlide.id);
      if (err2) throw err2;

      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Slide order updated!");
    } catch (err: any) {
      toast.error("Failed to swap slides: " + err.message);
    }
  };

  const resetForm = () => {
    setForm({
      image_url: "",
      subtitle: "",
      title: "",
      description: "",
      alt: "",
      display_order: slides ? slides.length : 0,
    });
  };

  const handleEditClick = (s: HeroSlide) => {
    setEditingSlide(s);
    setForm({
      image_url: s.image_url,
      subtitle: s.subtitle,
      title: s.title,
      description: s.description,
      alt: s.alt || "",
      display_order: s.display_order,
    });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    resetForm();
  };

  const renderPreviewTitle = (text: string) => {
    if (!text) return "";
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <span key={i} className="text-amber-400 font-bold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Hero Slider</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure slides displayed on the website landing page. Upload banner images and edit core promotional messages.
          </p>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary/95 shadow-soft">
          <Plus className="h-4 w-4 mr-2" /> Add New Slide
        </Button>
      </div>

      {/* HIGHLIGHT GUIDANCE BOX */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-sm text-amber-700 dark:text-amber-300">
        <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold">Styling Tip!</h4>
          <p className="text-xs mt-1 leading-relaxed opacity-90">
            You can highlight text in <strong>Gold</strong> inside slide titles by surrounding the keywords with double asterisks.
            For example: <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">Raising an army of **soul winners** for the nations.</code>
          </p>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading slides…</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        {slides?.map((s, idx) => (
          <Card key={s.id} className="overflow-hidden flex flex-col group hover:shadow-md transition duration-200">
            {/* Slide Image Preview Banner */}
            <div className="relative h-48 w-full bg-neutral-900 overflow-hidden shrink-0">
              <img
                src={s.image_url.startsWith("/src/assets/") ? s.image_url.replace("/src/", "/") : s.image_url}
                alt={s.alt || s.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1000";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 flex flex-col justify-between p-4 text-white">
                <div className="flex justify-between items-start">
                  <Badge className="bg-primary text-primary-foreground font-semibold">
                    Slide #{idx + 1}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                      disabled={idx === 0}
                      onClick={() => moveOrder(idx, "up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                      disabled={idx === slides.length - 1}
                      onClick={() => moveOrder(idx, "down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                    {s.subtitle || "Welcome"}
                  </span>
                  <h3 className="text-lg font-bold truncate mt-1">
                    {renderPreviewTitle(s.title)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Slide metadata details */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-3 italic">
                  "{s.description}"
                </p>
                <div className="text-[10px] text-muted-foreground flex gap-3 pt-2">
                  <span><strong>Alt Text:</strong> {s.alt || "None"}</span>
                  <span>•</span>
                  <span><strong>Order:</strong> {s.display_order}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditClick(s)}
                >
                  <Pencil className="h-4 w-4 mr-1.5" /> Edit slide
                </Button>
                {canDelete(role) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this hero slide?")) {
                        remove.mutate(s.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {slides && slides.length === 0 && (
          <div className="col-span-full text-center py-20 border border-dashed rounded-2xl">
            <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-bold text-lg text-foreground">No slides found</h4>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              Create a slide or run the database seeder to configure the initial landing page imagery.
            </p>
            <Button onClick={handleAddClick} className="mt-4 bg-primary text-primary-foreground">
              Add first slide
            </Button>
          </div>
        )}
      </div>

      {/* ADD/EDIT DIALOG MODAL */}
      {(isAdding || editingSlide) && (
        <Dialog
          open={isAdding || !!editingSlide}
          onOpenChange={(open) => {
            if (!open) {
              setIsAdding(false);
              setEditingSlide(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isAdding ? "Add Hero Slide" : "Edit Hero Slide"}</DialogTitle>
              <DialogDescription>
                Fill in the details below to update your home page banner imagery and message block.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.image_url.trim()) return toast.error("Please enter a valid image URL.");
                if (!form.title.trim()) return toast.error("Please enter a slide title.");
                if (!form.description.trim()) return toast.error("Please enter a slide description.");

                if (isAdding) {
                  createSlide.mutate({
                    image_url: form.image_url.trim(),
                    subtitle: form.subtitle.trim(),
                    title: form.title.trim(),
                    description: form.description.trim(),
                    alt: form.alt.trim() || null,
                    display_order: Number(form.display_order),
                  });
                } else if (editingSlide) {
                  updateSlide.mutate({
                    id: editingSlide.id,
                    image_url: form.image_url.trim(),
                    subtitle: form.subtitle.trim(),
                    title: form.title.trim(),
                    description: form.description.trim(),
                    alt: form.alt.trim() || null,
                    display_order: Number(form.display_order),
                    created_at: editingSlide.created_at,
                  });
                }
              }}
              className="space-y-4 py-3"
            >
              <div className="space-y-2">
                <Label htmlFor="image_url">Image Path / URL *</Label>
                <Input
                  id="image_url"
                  required
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="e.g. /assets/hero-slide-1.png or Unsplash URL"
                />
                <p className="text-[10px] text-muted-foreground opacity-80">
                  Input a local absolute path (e.g. `/assets/hero-slide-1.png`) or a remote HTTP URL.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle Eyebrow</Label>
                  <Input
                    id="subtitle"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. Welcome Home"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order Index</Label>
                  <Input
                    id="display_order"
                    type="number"
                    required
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    placeholder="0, 1, 2..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Slide Title *</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Raising an army of **soul winners**..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Slide description details..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt">Image Alt Text (for accessibility)</Label>
                <Input
                  id="alt"
                  value={form.alt}
                  onChange={(e) => setForm({ ...form, alt: e.target.value })}
                  placeholder="Describe what is happening in the picture..."
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingSlide(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSlide.isPending || updateSlide.isPending}
                >
                  {createSlide.isPending || updateSlide.isPending ? "Saving..." : "Save Banner Slide"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
