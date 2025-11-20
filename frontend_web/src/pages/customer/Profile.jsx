// src/pages/customer/Profile.jsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getProfile, updateProfile } from "../../api/customer";
import { useToast } from "../../components/Toast";

export default function Profile(){
  const [profile, setProfile] = useState(null);
  const { showToast } = useToast();
  useEffect(()=>{ load(); }, []);
  async function load(){
    try{
      const res = await getProfile();
      setProfile(res.data);
    }catch(e){ console.error(e); }
  }

  async function handleSave(e){
    e.preventDefault();
    try{
      await updateProfile(profile);
      showToast("Profile updated", "success");
    }catch(err){
      showToast("Update failed", "error");
    }
  }

  if(!profile) return <div className="min-h-screen"><Navbar/></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">My Profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <input value={profile.name||""} onChange={e=>setProfile({...profile, name:e.target.value})} className="w-full p-3 rounded-xl border"/>
            <input value={profile.email||""} disabled className="w-full p-3 rounded-xl border bg-gray-100"/>
            <input value={profile.phone||""} onChange={e=>setProfile({...profile, phone:e.target.value})} className="w-full p-3 rounded-xl border"/>
            <div className="flex gap-3">
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
