import { ArrowDownLeft, ArrowUpRight, Gift, Sparkles } from "lucide-react";

export default function RewardLedgerItem({ item }) {
  const amount = Number(item.changeAmount) || 0;
  const isCredit = amount > 0;

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Recent";

  return (
    <div className="flex items-center justify-between p-4 hover:bg-groomish-cream/40 transition">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isCredit
              ? "bg-groomish-greenLight text-groomish-green"
              : "bg-groomish-crimsonLight text-groomish-crimson"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </div>

        <div>
          <p className="font-bold text-xs text-groomish-slate">
            {item.reason ? item.reason.replaceAll("_", " ") : "Points Activity"}
          </p>
          <p className="text-[11px] text-groomish-slate/50 mt-0.5">
            {formattedDate}
            {item.relatedId && ` • Ref: ${item.relatedId.slice(0, 8)}`}
          </p>
        </div>
      </div>

      <div
        className={`font-extrabold text-sm flex items-center gap-1 ${
          isCredit ? "text-groomish-green" : "text-groomish-crimson"
        }`}
      >
        <span>
          {isCredit ? "+" : ""}
          {amount}
        </span>
        <span className="text-[11px] font-semibold text-groomish-slate/60">
          pts
        </span>
      </div>
    </div>
  );
}
