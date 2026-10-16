import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { createReview } from "../../api/customer";
import { Star, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function LeaveReviewModal({
  open,
  onClose,
  bookingId,
  serviceId,
  serviceName,
  productId,
  productName,
  storeId,
  storeName,
  initialRating,
  initialReview,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(initialRating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(initialReview || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initialRating || 5);
      setReview(initialReview || "");
      setError("");
      setSubmitted(false);
    }
  }, [open, initialRating, initialReview]);

  if (!serviceId && !productId && !storeId) return null;

  const isStore = !!storeId && !serviceId && !productId;
  const itemName = isStore ? (storeName || "Salon Branch") : (serviceName || productName || "Item");
  const itemType = isStore ? "Salon Branch" : (productId ? "Product" : "Service");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createReview({
        bookingId: bookingId || undefined,
        serviceId: serviceId || undefined,
        productId: productId || undefined,
        storeId: storeId || undefined,
        rating: rating,
        review: review ? review.trim() : "",
      });
      setSubmitted(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="text-center space-y-4">
        {submitted ? (
          <div className="py-8 space-y-3 animate-fade-in">
            <div className="w-14 h-14 bg-groomish-green/15 text-groomish-green rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-heading font-bold text-groomish-slate">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-groomish-slate/60">
              Your verified review helps the Groomish community maintain excellence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                Verified {itemType} Review
              </span>
              <h2 className="text-xl font-heading font-bold text-groomish-slate">
                Rate & Review
              </h2>
              <p className="text-xs text-groomish-slate/60">
                How was your experience with <b>{itemName}</b>?
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="flex flex-col items-center justify-center py-3 bg-groomish-cream rounded-2xl">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        (hoverRating || rating) >= star
                          ? "fill-groomish-gold text-groomish-gold drop-shadow-sm"
                          : "text-groomish-slate/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-groomish-slate/70 mt-2">
                {rating === 5 && "⭐ Outstanding Experience"}
                {rating === 4 && "⭐ Very Good"}
                {rating === 3 && "⭐ Satisfactory"}
                {rating === 2 && "⭐ Could be Better"}
                {rating === 1 && "⭐ Needs Improvement"}
              </span>
            </div>

            {/* Comment Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-groomish-slate/80">
                  {isStore
                    ? "Salon & Branch Hospitality Feedback"
                    : productId
                    ? "Product Feedback & Review"
                    : "Service & Stylist Feedback"}
                </label>
                <span className="text-[11px] font-medium text-groomish-slate/40">
                  (Optional)
                </span>
              </div>
              <textarea
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={
                  isStore
                    ? "Optional: Share your feedback about this salon branch (ambience, cleanliness, front desk, hygiene, and hospitality)..."
                    : productId
                    ? "Optional: Share your thoughts on the product effectiveness, scent, texture, and results..."
                    : "Optional: Share your thoughts on the service quality, hygiene, ambiance, and stylist professionalism..."
                }
                className="input-groomish resize-none font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-auth flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Submitting Review..." : "Submit Review"}</span>
            </button>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
}
