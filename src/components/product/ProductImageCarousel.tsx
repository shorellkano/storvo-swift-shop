import { useState, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageCarouselProps {
  images: { id?: string; image_url: string }[];
  productName?: string;
  brandColor?: string;
  className?: string;
}

const ProductImageCarousel = ({
  images,
  productName = "Product",
  brandColor,
  className,
}: ProductImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ dist: number; x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

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

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
      setActiveIndex(index);
    },
    [emblaApi]
  );

  // Pinch-to-zoom handlers for fullscreen
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchRef.current = {
        dist: Math.hypot(dx, dy),
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastTouchRef.current.dist;
      setScale((prev) => Math.min(4, Math.max(1, prev * ratio)));
      lastTouchRef.current.dist = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      setTranslate((prev) => ({
        x: prev.x + e.touches[0].clientX - (lastTouchRef.current?.x || e.touches[0].clientX),
        y: prev.y + e.touches[0].clientY - (lastTouchRef.current?.y || e.touches[0].clientY),
      }));
      lastTouchRef.current = { dist: 0, x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    if (scale <= 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

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

  if (images.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted flex items-center justify-center rounded-2xl", className)}>
        <span className="text-muted-foreground text-sm">No images</span>
      </div>
    );
  }

  return (
    <>
      {/* Main carousel */}
      <div className={cn("relative", className)}>
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex">
            {images.map((img, i) => (
              <div
                key={img.id || i}
                className="relative aspect-square min-w-0 flex-[0_0_100%] cursor-pointer"
                onClick={() => openFullscreen(i)}
              >
                <img
                  src={img.image_url}
                  alt={`${productName} ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute bottom-3 right-3 rounded-full bg-card/70 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-4 w-4 text-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  i === activeIndex
                    ? "scale-125"
                    : "opacity-50"
                )}
                style={{
                  backgroundColor: i === activeIndex
                    ? (brandColor || "hsl(var(--primary))")
                    : "white",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 px-1">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                i === activeIndex
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-50"
              )}
            >
              <img
                src={img.image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen zoom overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 backdrop-blur-sm"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Swipe between images in fullscreen */}
          <div
            ref={imgRef}
            className="h-full w-full touch-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={() => {
              if (scale > 1) {
                setScale(1);
                setTranslate({ x: 0, y: 0 });
              } else {
                setScale(2.5);
              }
            }}
          >
            <img
              src={images[activeIndex].image_url}
              alt={productName}
              className="h-full w-full object-contain transition-transform duration-100"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              }}
              draggable={false}
            />
          </div>

          {/* Fullscreen indicators */}
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
        </div>
      )}
    </>
  );
};

export default ProductImageCarousel;
