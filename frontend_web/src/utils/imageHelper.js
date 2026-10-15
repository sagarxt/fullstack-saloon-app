/**
 * Image Optimization Utilities for Groomish
 * Automatically transforms Cloudinary URLs on-the-fly to deliver:
 * - f_auto: Modern formats (AVIF / WebP) based on browser support
 * - q_auto: Psycho-visual AI compression (80-92% size reduction with zero visible loss)
 * - w_<width>,c_limit: Responsive container width constraints
 */

export function getOptimizedImageUrl(
  url,
  { width = 800, quality = "auto", crop = "limit" } = {}
) {
  if (!url || typeof url !== "string") return "";

  // Only transform Cloudinary URLs
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // Prevent duplicate transformations
  if (
    url.includes("/upload/f_auto") ||
    url.includes("/upload/q_auto") ||
    url.includes("f_auto,q_auto")
  ) {
    return url;
  }

  const transformParams = ["f_auto", `q_${quality}`];
  if (width && width > 0) {
    transformParams.push(`w_${width}`);
    if (crop) {
      transformParams.push(`c_${crop}`);
    }
  }

  const transformSegment = `/upload/${transformParams.join(",")}/`;
  return url.replace("/upload/", transformSegment);
}

/**
 * Standard performance props for HTML <img> tags
 */
export const lazyImgProps = {
  loading: "lazy",
  decoding: "async",
};
