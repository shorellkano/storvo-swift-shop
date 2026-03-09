import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Plus, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

interface SetupSuccessProps {
  storeName: string;
  storeSlug: string;
  logoPreview: string | null;
  brandColor: string;
  onViewStore: () => void;
  onAddProduct: () => void;
}

const SetupSuccess = ({
  storeName,
  storeSlug,
  logoPreview,
  brandColor,
  onViewStore,
  onAddProduct,
}: SetupSuccessProps) => {
  const [copied, setCopied] = useState(false);
  const storeUrl = `${storeSlug}.storvo.co`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopied(true);
    toast.success("Store link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Check out my store: ${storeName}`,
          url: `https://${storeUrl}`,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: brandColor + "18" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: brandColor }}
        >
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {logoPreview && (
        <motion.img
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          src={logoPreview}
          alt={storeName}
          className="mb-3 h-12 w-12 rounded-xl object-cover shadow-sm border border-border"
        />
      )}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-display text-2xl font-bold text-foreground"
      >
        Your store is live! 🎉
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-sm text-muted-foreground"
      >
        Your products can now be shared with customers.
      </motion.p>

      {/* Store URL card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-5 w-full rounded-xl border border-border/60 bg-muted/30 p-4"
      >
        <p className="text-xs text-muted-foreground mb-1">Your store link</p>
        <div className="flex items-center justify-center gap-2">
          <span className="font-display text-base font-bold text-foreground">{storeUrl}</span>
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* Next steps */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Let's add your first product
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex w-full flex-col gap-2.5"
      >
        <Button
          variant="hero"
          size="lg"
          className="w-full text-base font-semibold"
          onClick={onAddProduct}
        >
          <Plus className="mr-2 h-4 w-4" /> Add your first product
        </Button>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="hero-outline"
            size="lg"
            className="flex-1 text-sm"
            onClick={onViewStore}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> View my store
          </Button>
          <Button
            variant="hero-outline"
            size="lg"
            className="flex-1 text-sm"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share link
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupSuccess;
