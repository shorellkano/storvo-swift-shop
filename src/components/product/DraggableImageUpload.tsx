import { useState, useRef, useCallback } from "react";
import { Upload, X, GripVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  preview: string;
  file?: File;
  isExisting?: boolean;
}

interface DraggableImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages: number;
  isPro?: boolean;
}

const DraggableImageUpload = ({ images, onChange, maxImages, isPro }: DraggableImageUploadProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files);
    const allowed = fileArr.slice(0, maxImages - images.length);
    if (allowed.length < fileArr.length) {
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
          preview: e.target?.result as string,
          file,
        });
        loaded++;
        if (loaded === allowed.length) {
          onChange([...images, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images, maxImages, onChange]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Drag handlers
  const onDragStart = (index: number) => {
    dragItem.current = index;
    setDragIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const onDrop = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);
    dragItem.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
  };

  // Touch drag reorder
  const touchStartY = useRef(0);
  const touchStartIndex = useRef<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Product Images</span>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} • Drag to reorder
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing group",
              dragIndex === i && "opacity-40 scale-95",
              overIndex === i && dragIndex !== i && "ring-2 ring-primary",
              i === 0 ? "border-primary" : "border-border"
            )}
          >
            <img src={img.preview} alt="" className="h-full w-full object-cover" />

            {/* Cover badge on first image */}
            {i === 0 && (
              <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5">
                <Star className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                <span className="text-[9px] font-bold text-primary-foreground">COVER</span>
              </div>
            )}

            {/* Drag handle */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              {i !== 0 && (
                <div className="rounded-full bg-card/80 backdrop-blur-sm p-0.5">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 rounded-full bg-card/80 backdrop-blur-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Add</span>
          </label>
        )}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        First image becomes product cover. Up to {maxImages} images, 5MB each. Recommended: 1080×1080px.
      </p>
    </div>
  );
};

export default DraggableImageUpload;
