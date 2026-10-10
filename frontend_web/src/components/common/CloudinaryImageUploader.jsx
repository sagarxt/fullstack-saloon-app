import { useState, useRef } from "react";
import { uploadImageApi } from "../../api/upload";
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon, Link2 } from "lucide-react";

export default function CloudinaryImageUploader({
  value = "",
  onChange,
  folder = "groomishnow",
  label = "Upload Image",
  compact = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("file"); // 'file' | 'url'
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const res = await uploadImageApi(file, folder);
      if (res && res.url) {
        onChange(res.url);
      } else {
        setError("Failed to get image URL from Cloudinary.");
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setError(
        err.response?.data?.message ||
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

      {/* Preview if image exists */}
      {value ? (
        <div className={`relative rounded-2xl overflow-hidden border border-groomish-slate/15 bg-groomish-cream/40 flex items-center gap-2.5 ${compact ? "p-1.5" : "p-2"}`}>
          <img
            src={value}
            alt="Uploaded preview"
            className={`${compact ? "w-11 h-11" : "w-16 h-16"} rounded-xl object-cover bg-white border border-groomish-slate/10 shrink-0`}
            onError={(e) => {
              e.currentTarget.src = "/groomisg_now_icon.png";
            }}
          />
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 text-groomish-green text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Ready in Cloudinary</span>
            </div>
            <p className="text-[10px] text-groomish-slate/60 font-mono truncate mt-0.5" title={value}>
              {value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white text-groomish-slate/50 hover:text-groomish-crimson hover:bg-groomish-crimsonLight transition shadow-sm"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : mode === "file" ? (
        /* File Upload Box */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
            compact ? "p-2.5" : "p-4"
          } ${
            uploading
              ? "border-groomish-orange bg-groomish-orangeLight/30 cursor-wait"
              : "border-groomish-slate/20 hover:border-groomish-orange hover:bg-groomish-cream/40 bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading ? (
            <div className="py-1 space-y-1">
              <div className="w-5 h-5 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[11px] font-bold text-groomish-orange">
                Uploading to Cloudinary...
              </p>
            </div>
          ) : (
            <div className="py-0.5 space-y-0.5">
              <UploadCloud className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-groomish-orange mx-auto`} />
              <p className="text-xs font-bold text-groomish-slate">
                Click to browse or drop image
              </p>
              <p className="text-[9px] text-groomish-slate/50">
                Direct Cloudinary upload • Folder: <span className="font-mono text-groomish-orange">{folder}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Box */
        <div className="relative">
          <Link2 className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
          />
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
