import { useState, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ZoomIn, Play, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaItem =
  | { kind: "image"; id?: string; url: string; display_order: number }
  | { kind: "video"; id?: string; url: string; display_order: number };

interface ProductImageCarouselProps {
  images: { id?: string; image_url: string; display_order?: number }[];
  videos?: { id?: string; video_url: string; display_order?: number }[];
  productName?: string;
  className?: string;
  allowDownload?: boolean;
}

const ProductImageCarousel = ({
  images,
  videos = [],
  productName = "Product",
  className,
  allowDownload = false,
}: ProductImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const lastTap = useRef(0);
  const pinchStart = useRef(0);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  // Fullscreen swipe tracking
  const fsSwipeStart = useRef<{ x: number; y: number } | null>(null);

  const media: MediaItem[] = [
    ...images.map((img) => ({
      kind: "image" as const,
      id: img.id,
      url: img.image_url,
      display_order: img.display_order ?? 0,
    })),
    ...videos.map((vid) => ({
      kind: "video" as const,
      id: vid.id,
      url: vid.video_url,
      display_order: vid.display_order ?? images.length,
    })),
  ].sort((a, b) => a.display_order - b.display_order);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
    setActiveIndex(index);
  }, [emblaApi]);

  const openFullscreen = (index: number) => {
    if (media[index]?.kind !== "image") return;
    setActiveIndex(index);
    setFullscreen(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    document.body.style.overflow = "";
  };

  const navigateFullscreen = (dir: 1 | -1) => {
    const next = (activeIndex + dir + media.length) % media.length;
    setActiveIndex(next);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Double-tap to zoom
  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) handleDoubleTap();
    lastTap.current = now;
  };

  // Fullscreen touch handlers (pinch zoom + pan + swipe)
  const handleFsTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      fsSwipeStart.current = null;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStart.current = dist;
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        fsSwipeStart.current = null;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateStart.current = { ...translate };
      } else {
        fsSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  };

  const handleFsTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStart.current;
      setScale((s) => Math.max(1, Math.min(5, s * ratio)));
      pinchStart.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy });
    }
  };

  const handleFsTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1 || !fsSwipeStart.current || media.length <= 1) return;
    const dx = e.changedTouches[0].clientX - fsSwipeStart.current.x;
    const dy = e.changedTouches[0].clientY - fsSwipeStart.current.y;
    // Only horizontal swipes (more horizontal than vertical)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      navigateFullscreen(dx < 0 ? 1 : -1);
    }
    fsSwipeStart.current = null;
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const ext = item.kind === "video" ? "mp4" : "jpg";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${productName}-${activeIndex + 1}.${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(item.url, "_blank");
    }
  };

  if (media.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted flex items-center justify-center rounded-2xl", className)}>
        <span className="text-muted-foreground text-sm">No media</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn("relative select-none", className)}>
        {/* Main swipeable carousel */}
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex touch-pan-y">
            {media.map((item, i) => (
              <div key={item.id || i} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="relative aspect-square bg-muted cursor-zoom-in"
                  onClick={() => item.kind === "image" && openFullscreen(i)}
                >
                  {item.kind === "image" ? (
                    <>
                      <img
                        src={item.url}
                        alt={`${productName} ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading={i === 0 ? "eager" : "lazy"}
                        draggable={false}
                      />
                      {/* Tap-to-zoom hint badge */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1.5 pointer-events-none">
                        <ZoomIn className="h-3.5 w-3.5 text-white" />
                        <span className="text-[11px] text-white font-medium">Tap to zoom</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 pointer-events-none">
                        <Play className="h-3 w-3 text-white fill-white" />
                        <span className="text-xs text-white font-medium">Video</span>
                      </div>
                    </>
                  )}

                  {allowDownload && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                      className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1.5 text-white text-xs font-medium hover:bg-black/80 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {media.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "bg-primary w-5 h-2"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2 h-2"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {media.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {media.map((item, i) => (
              <button
                key={item.id || i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                  i === activeIndex
                    ? "border-primary ring-2 ring-primary/20 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-75"
                )}
                data-testid={`button-thumb-${i}`}
              >
                {item.kind === "image" ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <Play className="h-5 w-5 text-muted-foreground fill-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      {fullscreen && media[activeIndex]?.kind === "image" && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col" onClick={handleTap}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70 font-medium">
                {activeIndex + 1} / {media.filter(m => m.kind === "image").length}
              </span>
              {scale > 1 && (
                <span className="text-xs text-white/50 bg-white/10 rounded-full px-2 py-0.5">
                  {Math.round(scale * 100)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {allowDownload && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(media[activeIndex]); }}
                  className="rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5 text-xs text-white font-medium hover:bg-white/20 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Save
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
                className="rounded-full bg-white/10 backdrop-blur-sm p-2.5 hover:bg-white/20 transition-colors"
                data-testid="button-close-fullscreen"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center touch-none overflow-hidden"
            onTouchStart={handleFsTouchStart}
            onTouchMove={handleFsTouchMove}
            onTouchEnd={handleFsTouchEnd}
          >
            <img
              src={media[activeIndex].url}
              alt={`${productName} ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                transition: scale === 1 && translate.x === 0 && translate.y === 0 ? "transform 0.2s ease" : "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              draggable={false}
            />
          </div>

          {/* Bottom area: dots + hint */}
          <div className="shrink-0 pb-6 pt-3 flex flex-col items-center gap-3">
            {media.length > 1 && (
              <div className="flex gap-2">
                {media.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); setScale(1); setTranslate({ x: 0, y: 0 }); }}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === activeIndex ? "bg-white w-5 h-2" : "bg-white/30 w-2 h-2"
                    )}
                  />
                ))}
              </div>
            )}
            {scale <= 1 && (
              <p className="text-xs text-white/40">Double-tap to zoom | Pinch to zoom</p>
            )}
          </div>

          {/* Left / Right arrows (desktop + when not zoomed) */}
          {media.length > 1 && scale <= 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateFullscreen(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/25 transition-colors"
                data-testid="button-prev-image"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateFullscreen(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/25 transition-colors"
                data-testid="button-next-image"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageCarousel;
