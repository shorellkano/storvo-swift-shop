import { useState, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ZoomIn, Play, Download } from "lucide-react";
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const pinchStart = useRef(0);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

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
    setActiveIndex(index);
    setFullscreen(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStart.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translate };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStart.current;
      setScale(Math.max(1, Math.min(5, scale * ratio)));
      pinchStart.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy });
    }
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
      <div className={cn("relative", className)}>
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex">
            {media.map((item, i) => (
              <div key={item.id || i} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="relative aspect-square bg-muted cursor-pointer"
                  onClick={() => item.kind === "image" && openFullscreen(i)}
                >
                  {item.kind === "image" ? (
                    <>
                      <img
                        src={item.url}
                        alt={`${productName} ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute bottom-3 right-3 rounded-full bg-card/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4 text-foreground" />
                      </div>
                    </>
                  ) : (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {item.kind === "video" && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1">
                      <Play className="h-3 w-3 text-white fill-white" />
                      <span className="text-xs text-white font-medium">Video</span>
                    </div>
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

        {media.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {media.map((item, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  i === activeIndex ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to ${item.kind} ${i + 1}`}
              />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {media.map((item, i) => (
              <button
                key={item.id || i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all relative",
                  i === activeIndex ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-80"
                )}
              >
                {item.kind === "image" ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
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

      {fullscreen && media[activeIndex]?.kind === "image" && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm text-white font-medium">
            {activeIndex + 1} / {media.length}
          </div>

          {allowDownload && (
            <button
              onClick={() => handleDownload(media[activeIndex])}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 flex items-center gap-2 text-sm text-white font-medium hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4" /> Save
            </button>
          )}

          <div
            className="w-full h-full flex items-center justify-center touch-none"
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <img
              src={media[activeIndex].url}
              alt={`${productName} ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)` }}
              draggable={false}
            />
          </div>

          {media.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(i); setScale(1); setTranslate({ x: 0, y: 0 }); }}
                  className={cn("h-2.5 w-2.5 rounded-full transition-all", i === activeIndex ? "bg-white scale-125" : "bg-white/40")}
                />
              ))}
            </div>
          )}

          {media.length > 1 && scale <= 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => (prev - 1 + media.length) % media.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
              >
                <span className="text-white text-lg">&#8249;</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => (prev + 1) % media.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
              >
                <span className="text-white text-lg">&#8250;</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageCarousel;
