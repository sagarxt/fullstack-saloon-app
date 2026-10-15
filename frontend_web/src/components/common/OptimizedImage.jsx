import { getOptimizedImageUrl } from "../../utils/imageHelper";

export default function OptimizedImage({
  src,
  alt = "",
  width = 800,
  quality = "auto",
  crop = "limit",
  className = "",
  loading = "lazy",
  fallback = null,
  ...props
}) {
  if (!src) {
    return fallback;
  }

  const optimizedSrc = getOptimizedImageUrl(src, { width, quality, crop });

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      {...props}
    />
  );
}
