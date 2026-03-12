import { useCallback, useRef, useState } from "react";
import { Upload, X, GripVertical, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  src: string;
  file?: File;
  isExisting?: boolean;
}

interface ProductImageUploaderProps {
  existingImages?: { id: string; image_url: string }[];
  maxImages: number;
  isPro: boolean;
  onImagesChange: (images: ImageItem[]) => void;
  images: ImageItem[];
}

const ProductImageUploader = ({
  maxImages,
  isPro,
  onImagesChange,
  images,
}: ProductImageUploaderProps) => {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const allowed = fileArray.slice(0, maxImages - images.length);
      if (allowed.length < fileArray.length) {
        toast.error(`Maximum ${maxImages} images per product`);
      }
      if (allowed.length === 0) return;

      const newItems: ImageItem[] = [];
      let loaded = 0;

      allowed.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newItems.push({
            id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            src: e.target?.result as string,
            file,
            isExisting: false,
          });
          loaded++;
          if (loaded === allowed.length) {
            onImagesChange([...images, ...newItems]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, onImagesChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  // Drag-to-reorder
  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) {
      setDragIndex(null);
      return;
    }
    const reordered = [...images];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, removed);
    onImagesChange(reordered);
    dragItem.current = null;
    dragOver.current = null;
    setDragIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Product Images</span>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} · 1080×1080 recommended
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing",
              dragIndex === i ? "opacity-40 scale-95" : "opacity-100",
              i === 0 ? "border-primary ring-2 ring-primary/20" : "border-border",
              !img.isExisting && "border-dashed"
            )}
          >
            <img src={img.src} alt="" className="h-full w-full object-cover" />

            {/* Cover badge */}
            {i === 0 && (
              <span className="absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Cover
              </span>
            )}

            {/* Drag handle */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 rounded-full bg-card/80 p-1 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Add</span>
          </label>
        )}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
        <ImageIcon className="h-3 w-3" />
        Drag to reorder · First image becomes product cover
        {!isPro && " · Upgrade for more"}
      </p>
    </div>
  );
};

export default ProductImageUploader;
export type { ImageItem };
