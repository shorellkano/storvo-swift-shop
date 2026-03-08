import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";

interface LogoBrandStepProps {
  logoPreview: string | null;
  onLogoSelect: (file: File) => void;
  brandColor: string;
  onBrandColorChange: (color: string) => void;
  uploading: boolean;
  onContinue: () => void;
  onSkip: () => void;
}

const extractDominantColor = (imgSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve("#6366F1"); return; }

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2], pa = data[i + 3];
        // Skip near-white, near-black, and transparent pixels
        if (pa < 128) continue;
        if (pr > 240 && pg > 240 && pb > 240) continue;
        if (pr < 15 && pg < 15 && pb < 15) continue;
        r += pr; g += pg; b += pb; count++;
      }

      if (count === 0) { resolve("#6366F1"); return; }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      resolve(`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`);
    };
    img.onerror = () => resolve("#6366F1");
    img.src = imgSrc;
  });
};

const LogoBrandStep = ({
  logoPreview,
  onLogoSelect,
  brandColor,
  onBrandColorChange,
  uploading,
  onContinue,
  onSkip,
}: LogoBrandStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }

    onLogoSelect(file);

    // Extract dominant color
    setExtracting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const color = await extractDominantColor(src);
      onBrandColorChange(color);
      setExtracting(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-3">
        <Label className="text-sm font-medium text-foreground">Store Logo</Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-primary hover:bg-accent/50"
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Camera className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Upload
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP · Max 2MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Brand Color */}
      {logoPreview && (
        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {extracting ? "Extracting brand color..." : "Brand Color"}
            </span>
          </div>
          {extracting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analyzing your logo...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-border shadow-sm"
                style={{ backgroundColor: brandColor }}
              />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Auto-detected from your logo. Tap to change.</p>
                <Input
                  type="color"
                  value={brandColor}
                  onChange={(e) => onBrandColorChange(e.target.value)}
                  className="h-8 w-16 cursor-pointer border-none p-0"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mt-2 flex gap-2">
            <div
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              Add to Cart
            </div>
            <div
              className="rounded-lg border-2 px-4 py-2 text-xs font-semibold"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              Buy Now
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="hero-outline" size="lg" className="flex-1 text-base" onClick={onSkip}>
          Skip for now
        </Button>
        <Button variant="hero" size="lg" className="flex-1 text-base font-semibold" onClick={onContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
};

export default LogoBrandStep;
