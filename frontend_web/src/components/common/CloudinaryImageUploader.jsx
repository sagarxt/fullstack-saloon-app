import { useState, useRef } from "react";
import { uploadImageApi } from "../../api/upload";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Link2,
  RefreshCw,
} from "lucide-react";

/**
 * Extracts publicId filename from a Cloudinary URL if available.
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return "";
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return "";
    const segments = afterUpload.split("/");
    const filenameWithExt = segments[segments.length - 1];
    return filenameWithExt.split(".")[0] || "";
  } catch (e) {
    return "";
  }
};

export default function CloudinaryImageUploader({
  value = "",
  onChange,
  folder = "groomishnow",
  label = "Upload Image",
  compact = false,
  entityName = "",
  publicId = "",
  shape = "rounded",
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("file"); // 'file' | 'url'
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setError("Image size exceeds 25MB limit.");
      return;
    }

    setUploading(true);
    setError("");

    // Resolve naming: prop publicId > prop entityName > extracted from existing Cloudinary URL
    const targetPublicId =
      (publicId && String(publicId).trim()) ||
      (entityName && String(entityName).trim()) ||
      extractCloudinaryPublicId(value) ||
      null;

    try {
      const res = await uploadImageApi(file, folder, targetPublicId);
      if (res && res.url) {
        onChange(res.url);
      } else {
        setError("Failed to get image URL from Cloudinary.");
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Upload to Cloudinary failed. Check file format or network."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {/* Hidden file input always available for initial upload or replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-groomish-slate flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-groomish-orange" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-1 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === "file"
                ? "bg-groomish-orange text-white font-bold"
                : "text-groomish-slate/60 hover:text-groomish-slate"
            }`}
          >
            Upload File
          </button>
          <span className="text-groomish-slate/30">|</span>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md transition ${
              mode === "url"
                ? "bg-groomish-orange text-white font-bold"
                : "text-groomish-slate/60 hover:text-groomish-slate"
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {/* Mode: Image URL Direct Editing */}
      {mode === "url" ? (
        <div className="space-y-1.5">
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={value || ""}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-8 pr-8 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-crimson transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center gap-2 p-1.5 bg-groomish-cream/40 rounded-xl border border-groomish-slate/10">
              <img
                src={value}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-groomish-slate/10"
                onError={(e) => {
                  e.currentTarget.src = "/groomisg_now_icon.png";
                }}
              />
              <span className="text-[10px] text-groomish-slate/60 font-mono truncate flex-1">
                {value}
              </span>
            </div>
          )}
        </div>
      ) : value ? (
        /* Preview with Replace / Remove Actions when Image Exists */
        <div
          className={`relative rounded-2xl overflow-hidden border border-groomish-slate/15 bg-groomish-cream/40 flex items-center gap-3 ${
            compact ? "p-2" : "p-3"
          }`}
        >
          {uploading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center gap-2 z-20">
              <div className="w-4 h-4 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-groomish-orange">
                Replacing file in Cloudinary...
              </span>
            </div>
          )}

          {(() => {
            const isCircle = shape === "circle" || folder?.includes("category");
            return (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="relative cursor-pointer group shrink-0"
                title="Click to replace photo"
              >
                <img
                  src={value}
                  alt="Uploaded preview"
                  className={`${
                    compact ? "w-12 h-12" : "w-16 h-16"
                  } ${isCircle ? "rounded-full p-0.5" : "rounded-xl"} object-cover bg-white border border-groomish-slate/10 transition group-hover:opacity-85 shadow-xs`}
                  onError={(e) => {
                    e.currentTarget.src = "/groomisg_now_icon.png";
                  }}
                />
                <div className={`absolute inset-0 ${isCircle ? "rounded-full" : "rounded-xl"} bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition`}>
                  <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>
            );
          })()}

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-groomish-green text-[10px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Ready in Cloudinary</span>
              {folder && (
                <span className="text-[9px] font-mono text-groomish-slate/50 bg-white/80 px-1.5 py-0.5 rounded-md border border-groomish-slate/10">
                  {folder}
                </span>
              )}
            </div>
            <p
              className="text-[10px] text-groomish-slate/60 font-mono truncate mt-0.5"
              title={value}
            >
              {value}
            </p>

            {/* Replace Button */}
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-groomish-slate/20 text-[11px] font-bold text-groomish-slate hover:bg-groomish-orange hover:text-white hover:border-groomish-orange transition shadow-2xs"
              >
                <UploadCloud className="w-3 h-3" />
                <span>Replace Photo</span>
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-groomish-crimson hover:bg-groomish-crimsonLight transition"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* File Upload Box (Empty state) */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
            compact ? "p-3" : "p-4"
          } ${
            uploading
              ? "border-groomish-orange bg-groomish-orangeLight/30 cursor-wait"
              : "border-groomish-slate/20 hover:border-groomish-orange hover:bg-groomish-cream/40 bg-white"
          }`}
        >
          {uploading ? (
            <div className="py-1 space-y-1">
              <div className="w-5 h-5 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[11px] font-bold text-groomish-orange">
                Uploading to Cloudinary...
              </p>
            </div>
          ) : (
            <div className="py-0.5 space-y-0.5">
              <UploadCloud
                className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-groomish-orange mx-auto`}
              />
              <p className="text-xs font-bold text-groomish-slate">
                Click to browse or drop image
              </p>
              <p className="text-[9px] text-groomish-slate/50">
                Direct Cloudinary upload • Folder:{" "}
                <span className="font-mono text-groomish-orange">{folder}</span>
                {entityName ? (
                  <>
                    {" "}• Filename:{" "}
                    <span className="font-mono text-groomish-slate/70">
                      {entityName}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-groomish-crimson text-[11px] font-semibold bg-groomish-crimsonLight p-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
