import { useState, useRef } from "react";
import { uploadImageApi } from "../../api/upload";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Plus,
  Star,
  ArrowLeft,
  ArrowRight,
  Link2,
} from "lucide-react";

/**
 * CloudinaryMultiImageUploader
 * Allows uploading and managing multiple images for Stores and Products.
 *
 * Props:
 * - value: string[] (array of image URLs)
 * - onChange: (urls: string[]) => void
 * - maxImages: number (default 6)
 * - folder: string (default "groomishnow")
 * - label: string (default "Photos & Gallery")
 */
export default function CloudinaryMultiImageUploader({
  value = [],
  onChange,
  maxImages = 6,
  folder = "groomishnow",
  label = "Photos & Gallery",
  entityName = "",
}) {
  const images = Array.isArray(value) ? value : value ? [value] : [];

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. Please select fewer files.`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 25 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds 25MB limit.`);
          continue;
        }
        try {
          const fileIndex = images.length + newUrls.length + 1;
          const targetPublicId = entityName ? `${entityName}-${fileIndex}` : null;
          const res = await uploadImageApi(file, folder, targetPublicId);
          if (res?.url) {
            newUrls.push(res.url);
          }
        } catch (singleErr) {
          console.error(`Upload failed for ${file.name}:`, singleErr);
          const msg = singleErr.response?.data?.message || singleErr.response?.data?.error || singleErr.message;
          setError(`Upload failed for "${file.name}": ${msg}`);
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }
    } catch (err) {
      console.error("Multi-image upload failed:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to upload image(s). Please try again."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput("");
    setShowUrlInput(false);
    setError("");
  };

  const handleRemove = (index) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const cover = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([cover, ...rest]);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-groomish-slate flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-groomish-orange" />
          <span>{label}</span>
          <span className="text-groomish-slate/40 font-normal">
            ({images.length}/{maxImages})
          </span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-semibold text-groomish-slate/60 hover:text-groomish-orange flex items-center gap-1 transition"
          >
            <Link2 className="w-3 h-3" />
            <span>{showUrlInput ? "Hide URL" : "Add by URL"}</span>
          </button>
        </div>
      </div>

      {/* URL Input Row */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (https://...)"
            className="flex-1 px-3 py-1.5 rounded-xl border border-groomish-slate/20 text-xs text-groomish-slate focus:border-groomish-orange focus:ring-1 focus:ring-groomish-orange"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 rounded-xl bg-groomish-slate text-white text-xs font-bold hover:bg-groomish-slate/90 transition"
          >
            Add
          </button>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-groomish-crimsonLight text-groomish-crimson text-xs font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className={`group relative rounded-2xl overflow-hidden border bg-white aspect-square shadow-soft transition ${
              idx === 0
                ? "border-groomish-orange ring-2 ring-groomish-orange/20"
                : "border-groomish-slate/15 hover:border-groomish-slate/30"
            }`}
          >
            <img
              src={imgUrl}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/groomisg_now_icon.png";
              }}
            />

            {/* Cover Badge */}
            {idx === 0 ? (
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-groomish-orange text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-white" />
                <span>Cover</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSetCover(idx)}
                title="Set as Cover Photo"
                className="opacity-0 group-hover:opacity-100 absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-groomish-slate/80 text-white text-[9px] font-bold transition hover:bg-groomish-orange"
              >
                Set Cover
              </button>
            )}

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-groomish-crimson text-white flex items-center justify-center transition hover:scale-110 shadow-sm"
              title="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Reorder Arrows */}
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-1.5 inset-x-1.5 flex justify-between gap-1">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  className="w-5 h-5 rounded-full bg-white/90 text-groomish-slate flex items-center justify-center hover:bg-white shadow-sm"
                  title="Move left"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
              )}
              {idx < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  className="w-5 h-5 rounded-full bg-white/90 text-groomish-slate flex items-center justify-center hover:bg-white shadow-sm ml-auto"
                  title="Move right"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Upload Trigger Tile */}
        {images.length < maxImages && (
          <label
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition aspect-square ${
              uploading
                ? "border-groomish-orange/40 bg-groomish-orange/5 cursor-wait"
                : "border-groomish-slate/20 hover:border-groomish-orange bg-groomish-cream/30 hover:bg-groomish-orange/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-1 text-groomish-orange">
                <div className="w-5 h-5 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-groomish-slate/50 hover:text-groomish-orange transition p-2 text-center">
                <div className="w-7 h-7 rounded-full bg-white shadow-soft flex items-center justify-center text-groomish-orange">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold leading-tight">Add Photo</span>
              </div>
            )}
          </label>
        )}
      </div>
      <p className="text-[10px] text-groomish-slate/40">
        Tip: Drag or use arrows to reorder. The first photo with the orange badge is used as the primary card cover.
      </p>
    </div>
  );
}
