// src/components/customer/PointsCard.jsx
export default function PointsCard({ points = 0 }){
  return (
    <div className="card p-6 flex items-center justify-between">
      <div>
        <h4 className="text-sm text-muted">Loyalty Points</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{points}</span>
          <span className="text-sm text-muted">pts</span>
        </div>
        <p className="text-sm mt-2 text-muted">Use points to redeem rewards or discounts</p>
      </div>
      <div>
        <div className="rounded-full bg-indigo-600 text-white w-14 h-14 flex items-center justify-center">
          ★
        </div>
      </div>
    </div>
  );
}
