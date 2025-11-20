// src/pages/customer/RewardsPage.jsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getRewards, redeemReward } from "../../api/customer";
import { useToast } from "../../components/Toast";
import { useNavigate } from "react-router-dom";

export default function RewardsPage(){
  const [rewards, setRewards] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(()=>{ load(); }, []);
  async function load(){
    try{
      const res = await getRewards();
      setRewards(res.data);
    }catch(e){ console.error(e); }
  }

  async function handleRedeem(id){
    try{
      await redeemReward(id);
      showToast("Reward redeemed", "success");
      load();
    }catch(err){
      if(err?.response?.data?.error === "Insufficient points"){
        showToast("You don't have enough points", "warning");
      }else{
        showToast(err?.response?.data?.error || "Redeem failed", "error");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Rewards</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {rewards.map(r => (
            <div key={r.id} className="card p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold">{r.title}</h4>
                <p className="text-sm text-muted my-2">{r.description}</p>
                <div className="text-sm text-muted">Cost: {r.pointsRequired} pts</div>
              </div>
              <div className="mt-4">
                <button onClick={()=>handleRedeem(r.id)} className="w-full bg-indigo-600 text-white py-2 rounded-xl">Redeem</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
