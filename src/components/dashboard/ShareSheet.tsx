import { X, MessageCircle, Facebook, Link2, Check, Twitter, Instagram, Camera } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  text?: string;
}

const ShareSheet = ({ open, onClose, url, title, text }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareText = text || title;

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`,
      "_blank"
    );
  };

  const shareInstagram = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied! Paste it in your Instagram story or bio.");
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareSnapchat = () => {
    window.open(
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const channels = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      onClick: shareWhatsApp,
      bg: "#25D366",
      color: "#fff",
    },
    {
      name: "Instagram",
      icon: Instagram,
      onClick: shareInstagram,
      bg: "#E1306C",
      color: "#fff",
    },
    {
      name: "Facebook",
      icon: Facebook,
      onClick: shareFacebook,
      bg: "#1877F2",
      color: "#fff",
    },
    {
      name: "Snapchat",
      icon: Camera,
      onClick: shareSnapchat,
      bg: "#FFFC00",
      color: "#000",
    },
    {
      name: "Twitter/X",
      icon: Twitter,
      onClick: shareTwitter,
      bg: "#000000",
      color: "#fff",
    },
    {
      name: copied ? "Copied!" : "Copy Link",
      icon: copied ? Check : Link2,
      onClick: copyLink,
      bg: undefined,
      color: undefined,
      className: "bg-accent text-accent-foreground",
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Share</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-5">
          {channels.map((ch) => (
            <button
              key={ch.name}
              onClick={ch.onClick}
              className={`flex flex-col items-center gap-1.5 ${ch.className || ""}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 ${ch.className || ""}`}
                style={ch.bg ? { backgroundColor: ch.bg, color: ch.color } : undefined}
              >
                <ch.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
