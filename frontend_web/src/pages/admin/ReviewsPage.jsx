import { useEffect, useState } from "react";
import { getAllReviewsApi } from "../../api/admin";
import { forceDeleteReviewApi } from "../../api/maintenance";
import { extractList } from "../../utils/dataHelper";
import { showConfirm } from "../../context/ConfirmContext";
import { Star, Trash2, RefreshCw, MessageSquare } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getAllReviewsApi(0, 100);
      setReviews(extractList(res.data));
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const reviewList = extractList(reviews);

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: "Force Delete Customer Review?",
      message: "Are you sure you want to permanently delete this customer review? This cannot be undone.",
      confirmText: "Force Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await forceDeleteReviewApi(id);
      loadReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Customer Feedback & Reviews
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Audit verified client ratings, stylist reviews, and service feedback.
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-groomish-slate/60">Loading reviews...</p>
        </div>
      ) : reviewList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
          <MessageSquare className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Reviews Submitted
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1">
            Customer ratings will appear here as treatments are completed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewList.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-groomish-slate/10 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (r.rating || 5)
                            ? "fill-groomish-gold text-groomish-gold"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-groomish-slate ml-1">
                      {r.rating}.0
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-groomish-slate/40 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                    title="Force Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-groomish-slate/80 mt-2 font-medium italic">
                  "{r.review}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-groomish-slate/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-groomish-slate block">
                    {r.userName || "Verified Customer"}
                  </span>
                  <span className="text-[11px] text-groomish-orange font-semibold">
                    Service: {r.serviceName || "Salon Service"}
                  </span>
                </div>

                <span className="text-[11px] text-groomish-slate/40">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })
                    : "Recently"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
