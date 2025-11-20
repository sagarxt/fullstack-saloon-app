// src/pages/customer/Referral.jsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getReferrals } from "../../api/customer";

export default function Referral(){
  const [data, setData] = useState(null);
  useEffect(()=>{ load(); }, []);
  async function load(){
    try{
      const res = await getReferrals();
      setData(res.data);
    }catch(e){ console.error(e); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Your Referral</h2>
          <p className="text-muted mt-2">Share your code and earn points when friends register</p>

          <div className="mt-4 flex items-center gap-3">
            <div className="p-3 bg-white/5 rounded-xl">{data?.referralCode || "—"}</div>
            <button onClick={()=>navigator.clipboard.writeText(data?.referralCode || "")} className="btn btn-ghost">Copy</button>
          </div>

          <h3 className="mt-6 font-semibold">Referrals</h3>
          <div className="mt-3">
            {data?.referrals?.length ? data.referrals.map(r => (
              <div key={r.id} className="py-2 border-b">{r.refereeEmail} — {r.awarded ? "Awarded" : "Pending"}</div>
            )) : <div className="text-muted">No referrals yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
