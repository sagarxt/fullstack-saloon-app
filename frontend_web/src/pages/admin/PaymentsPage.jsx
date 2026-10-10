import { useEffect, useState } from "react";
import { getPaymentsApi } from "../../api/admin";
import { extractList } from "../../utils/dataHelper";
import { CreditCard, RefreshCw, CheckCircle2, Clock, Smartphone, Store } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getPaymentsApi(0, 100);
      setPayments(extractList(res.data));
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const paymentList = extractList(payments);
  const totalCollected = paymentList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Payment Records & Invoices
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Audit trail of client payments, invoices, and checkout transactions.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
        </button>
      </div>

      {/* Overview Stat */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-groomish-slate/50 uppercase tracking-wider block">
            Total Payments Processed
          </span>
          <span className="text-3xl font-heading font-extrabold text-groomish-slate mt-1 block">
            ₹{totalCollected.toLocaleString()}
          </span>
        </div>
        <div className="text-right text-xs text-groomish-slate/50 font-semibold">
          {paymentList.length} Transactions Settled
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading payment ledger...</p>
          </div>
        ) : paymentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-groomish-slate/50">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Amount Paid</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {paymentList.map((p) => (
                  <tr key={p.id} className="hover:bg-groomish-cream/30 transition">
                    <td className="py-4 px-6 font-mono font-bold text-groomish-orange">
                      {p.invoiceNumber || `INV-${p.id?.slice(0, 8)}`}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-groomish-slate">{p.userName || "Client"}</div>
                      <div className="text-[11px] text-groomish-slate/40">{p.userEmail}</div>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-sm text-groomish-slate">
                      ₹{p.amount}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-groomish-cream text-groomish-slate font-bold text-[11px]">
                        {p.paymentMethod === "UPI" && <Smartphone className="w-3.5 h-3.5 text-groomish-orange" />}
                        {p.paymentMethod === "CARD" && <CreditCard className="w-3.5 h-3.5 text-groomish-blue" />}
                        {p.paymentMethod === "CASH" && <Store className="w-3.5 h-3.5 text-groomish-green" />}
                        {p.paymentMethod || "ONLINE"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-greenLight text-groomish-green uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.status || "PAID"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-groomish-slate/50">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })
                        : "Today"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
