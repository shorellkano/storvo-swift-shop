import { useState } from "react";
import { Copy, Check, MessageCircle, Twitter, Download, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SharePanelProps {
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  productUrl: string;
  storeSlug: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const SharePanel = ({ productName, productPrice, productImageUrl, productUrl }: SharePanelProps) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = `${productName} - ${formatCurrency(productPrice)}\n${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTwitter = () => {
    const text = `Check out ${productName} - ${formatCurrency(productPrice)}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
      "_blank"
    );
  };

  const shareInstagram = () => {
    navigator.clipboard.writeText(productUrl);
    toast.success("Link copied! Paste it in your Instagram bio or story.");
  };

  const downloadWhatsAppStatus = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, 1080, 1920);

      if (productImageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = productImageUrl;
          });
          if (img.naturalWidth > 0) {
            const scale = Math.max(1080 / img.naturalWidth, 1350 / img.naturalHeight);
            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;
            ctx.drawImage(img, (1080 - w) / 2, 0, w, h);
          }
        } catch (_) {
          // skip image if CORS fails
        }
      }

      // gradient overlay bottom half
      const gradient = ctx.createLinearGradient(0, 1050, 0, 1920);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.25, "rgba(0,0,0,0.75)");
      gradient.addColorStop(1, "rgba(0,0,0,0.97)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 1050, 1080, 870);

      // product name - word wrap
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      const maxWidth = 920;
      const lineHeight = 88;
      let fontSize = 76;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      while (ctx.measureText(productName).width > maxWidth * 1.8 && fontSize > 40) {
        fontSize -= 4;
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      }
      const words = productName.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      let textY = 1430 - (lines.length - 1) * (lineHeight / 2);
      for (const line of lines) {
        ctx.fillText(line, 540, textY);
        textY += lineHeight;
      }

      // price
      ctx.font = "bold 96px system-ui, sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.fillText(formatCurrency(productPrice), 540, textY + 60);

      // branding
      ctx.font = "38px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("storvo.co", 540, 1868);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-status.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("WhatsApp status image downloaded!");
      }, "image/png");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-accent/40 p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Product Link</p>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
          <p className="flex-1 text-xs text-muted-foreground truncate font-mono">{productUrl}</p>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-lg p-1.5 hover:bg-accent transition-colors"
            data-testid="button-copy-link"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2 font-medium"
          style={{ borderColor: "#25D366", color: "#25D366" }}
          onClick={shareWhatsApp}
          data-testid="button-share-whatsapp"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2 font-medium"
          onClick={shareTwitter}
          data-testid="button-share-twitter"
        >
          <Twitter className="h-4 w-4" /> Twitter / X
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2 font-medium col-span-2"
          style={{ borderColor: "#E1306C", color: "#E1306C" }}
          onClick={shareInstagram}
          data-testid="button-share-instagram"
        >
          <Instagram className="h-4 w-4" /> Copy for Instagram
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 font-medium border-dashed"
        onClick={downloadWhatsAppStatus}
        disabled={downloading}
        data-testid="button-download-status"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Generating..." : "Download WhatsApp Status Image"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center -mt-1">
        1080x1920 image ready to post as WhatsApp status
      </p>
    </div>
  );
};

export default SharePanel;
