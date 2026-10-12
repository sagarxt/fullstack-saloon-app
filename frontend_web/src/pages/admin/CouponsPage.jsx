import { useEffect, useState } from "react";
import { getCouponsApi, createCouponApi, deleteCouponApi } from "../../api/admin";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { extractList } from "../../utils/dataHelper";
import { showConfirm } from "../../context/ConfirmContext";
import { Tag, Plus, Trash2, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount: "",
    minAmount: 0,
    maxDiscount: 500,
    active: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await getCouponsApi();
      setCoupons(extractList(res.data));
    } catch (err) {
      console.error(err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      setError("Coupon code and discount are required.");
      return;
    }

    setCreateLoading(true);
    setError("");
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 90);

      await createCouponApi({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount: Number(form.discount),
        minAmount: Number(form.minAmount),
        maxDiscount: Number(form.maxDiscount),
        expiryDate: tomorrow.toISOString(),
        active: true,
      });

      setOpen(false);
      setForm({ code: "", description: "", discount: "", minAmount: 0, maxDiscount: 500, active: true });
      loadCoupons();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create coupon.";
      setError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: "Remove Promo Coupon",
      message: "Are you sure you want to remove this promo coupon from active promotions?",
      confirmText: "Remove Coupon",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteCouponApi(id);
      loadCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const couponList = extractList(coupons);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Promotional Coupons
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Configure discount codes, minimum booking thresholds, and seasonal offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCoupons}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setError("");
            }}
            className="btn-primary text-xs px-4 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading coupons...</p>
          </div>
        ) : couponList.length === 0 ? (
          <div className="col-span-3 bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
            <Tag className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-base text-groomish-slate">
              No Coupons Active
            </h3>
            <p className="text-xs text-groomish-slate/50 mt-1">
              Create coupons to offer discounts on customer appointments.
            </p>
          </div>
        ) : (
          couponList.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-groomish-slate/10 p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-base font-extrabold tracking-wider text-groomish-orange bg-groomish-orangeLight px-3 py-1 rounded-xl">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-groomish-slate/30 hover:text-groomish-crimson transition"
                    title="Delete coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-groomish-slate/70 mt-2 font-medium">
                  {c.description || "Applicable across salon services"}
                </p>

                <div className="mt-4 pt-3 border-t border-groomish-slate/10 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-groomish-slate/50">Discount Value:</span>
                    <span className="font-extrabold text-groomish-slate">
                      ₹{c.discount} Flat
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-groomish-slate/50">Min Cart Value:</span>
                    <span className="font-medium text-groomish-slate">
                      ₹{c.minAmount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-[11px]">
                <span className="text-groomish-green font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Active Offer
                </span>
                <span className="text-groomish-slate/40">
                  Max: ₹{c.maxDiscount || 500}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      <ModalWrapper open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-coral bg-groomish-coralLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              New Promotion
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              Create Promo Coupon
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Coupon Code
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
                className="input-groomish uppercase font-mono"
                placeholder="e.g. FESTIVE20 or GROOM100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Discount Amount (₹ Flat)
              </label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                required
                min={1}
                className="input-groomish"
                placeholder="e.g. 100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Min Spend (₹)
                </label>
                <input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  className="input-groomish"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Max Cap (₹)
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  className="input-groomish"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-groomish"
                placeholder="e.g. Flat ₹100 discount on bookings above ₹499"
              />
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="btn-auth mt-2"
            >
              {createLoading ? "Creating Coupon..." : "Publish Coupon"}
            </button>
          </form>
        </div>
      </ModalWrapper>
    </div>
  );
}
