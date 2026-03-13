import { useState, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageCarouselProps {
  images: { id?: string; image_url: string }[];
  productName?: string;
  className?: string;
}

const ProductImageCarousel = ({ images, productName = "Product", className }: ProductImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const pinchStart = useRef(0);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

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
    if (now - lastTap.current < 300) {
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  // Pinch-to-zoom
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
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy,
      });
    }
  };

  if (images.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted flex items-center justify-center rounded-2xl", className)}>
        <span className="text-muted-foreground text-sm">No images</span>
      </div>
    );
  }

  return (
    <>
      {/* Main Carousel */}
      <div className={cn("relative", className)}>
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex">
            {images.map((img, i) => (
              <div
                key={img.id || i}
                className="min-w-0 shrink-0 grow-0 basis-full"
              >
                <div
                  className="relative aspect-square bg-muted cursor-pointer"
                  onClick={() => openFullscreen(i)}
                >
                  <img
                    src={img.image_url}
                    alt={`${productName} ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute bottom-3 right-3 rounded-full bg-card/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id || i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                  i === activeIndex
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-transparent opacity-60 hover:opacity-80"
                )}
              >
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm text-white font-medium">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Swipeable fullscreen images */}
          <div
            className="w-full h-full flex items-center justify-center touch-none"
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <img
              src={images[activeIndex].image_url}
              alt={`${productName} ${activeIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              }}
              draggable={false}
            />
          </div>

          {/* Fullscreen dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                    setScale(1);
                    setTranslate({ x: 0, y: 0 });
                  }}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all",
                    i === activeIndex ? "bg-white scale-125" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}

          {/* Prev/Next in fullscreen */}
          {images.length > 1 && scale <= 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
              >
                <span className="text-white text-lg">‹</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-colors"
              >
                <span className="text-white text-lg">›</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageCarousel;
