import React, { useEffect, useState } from "react";
import { getCustomerDashboard } from "../../api/customer";
import {
  Crown,
  Star,
  CalendarCheck2,
  TicketPercent,
  Gift,
} from "lucide-react";

const CustomerDashboard = () => {
  const [data, setData] = useState({
    name: "Guest",
    tier: "SILVER",
    points: 0,
    upcomingBookings: [],
    rewards: [],
    coupons: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        // Demo fallback data
        setData({
          name: "Sagar",
          tier: "GOLD",
          points: 2450,
          upcomingBookings: [
            {
              id: "BK-2001",
              serviceName: "Luxury Facial",
              time: "Tomorrow, 5:00 PM",
              status: "CONFIRMED",
            },
          ],
          rewards: [
            { id: 1, title: "Free Hair Spa", pointsRequired: 2000 },
            { id: 2, title: "₹250 Off Next Visit", pointsRequired: 1500 },
          ],
          coupons: [
            { code: "NEW10", desc: "10% off on your next booking" },
            { code: "BIRTHDAY200", desc: "₹200 off birthday treat" },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const tierColor =
    data.tier === "PLATINUM"
      ? "text-indigo-300"
      : data.tier === "GOLD"
      ? "text-luxe-gold"
      : "text-slate-200";

  return (
    <div className="min-h-screen bg-luxe-black text-white">
      <header className="h-16 border-b border-luxe-gold/20 px-4 md:px-8 flex items-center justify-between bg-black/80 backdrop-blur">
        <div>
          <div className="text-xs text-luxe-gray-medium">Welcome back,</div>
          <div className="text-lg font-semibold">{data.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-luxe-gray-medium">Tier</div>
            <div className={`font-semibold flex items-center gap-1 ${tierColor}`}>
              <Crown className="w-4 h-4" />
              {data.tier}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-6">
        {/* Points Card */}
        <section className="bg-gradient-to-br from-luxe-gray-dark to-black border border-luxe-gold/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-gold">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-luxe-gray-medium">
              Loyalty Points
            </div>
            <div className="mt-2 text-3xl font-mono font-semibold">
              {data.points.toLocaleString()} PTS
            </div>
            <div className="text-xs text-luxe-gray-medium mt-2">
              Earn points on every service and unlock exclusive rewards.
            </div>
          </div>
          <button className="bg-luxe-gold text-luxe-black px-5 py-2 rounded-full text-xs font-semibold hover:bg-luxe-gold-soft transition">
            Redeem Rewards
          </button>
        </section>

        {/* Upcoming booking + coupons */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-luxe-gray-light/90">
                Upcoming Booking
              </h2>
              <CalendarCheck2 className="w-4 h-4 text-luxe-gold" />
            </div>
            {loading ? (
              <p className="text-xs text-luxe-gray-medium">Loading...</p>
            ) : data.upcomingBookings.length === 0 ? (
              <p className="text-xs text-luxe-gray-medium">
                No upcoming bookings. Book your next appointment now.
              </p>
            ) : (
              <div className="bg-black/50 rounded-xl p-3 text-sm">
                <div className="font-semibold">
                  {data.upcomingBookings[0].serviceName}
                </div>
                <div className="text-luxe-gray-medium text-xs mt-1">
                  {data.upcomingBookings[0].time} •{" "}
                  {data.upcomingBookings[0].status}
                </div>
              </div>
            )}
          </div>

          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-luxe-gray-light/90">
                Coupons
              </h2>
              <TicketPercent className="w-4 h-4 text-luxe-gold" />
            </div>
            {data.coupons.length === 0 ? (
              <p className="text-xs text-luxe-gray-medium">
                No active coupons right now.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {data.coupons.map((c) => (
                  <div
                    key={c.code}
                    className="border border-luxe-gold/30 rounded-lg px-3 py-2 bg-black/40 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-mono text-luxe-gold text-sm">
                        {c.code}
                      </div>
                      <div className="text-luxe-gray-medium">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Rewards */}
        <section className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-[0.2em] text-luxe-gray-light/90">
              Rewards You Can Unlock
            </h2>
            <Gift className="w-4 h-4 text-luxe-gold" />
          </div>
          {data.rewards.length === 0 ? (
            <p className="text-xs text-luxe-gray-medium">
              Rewards will appear here as you earn more points.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.rewards.map((r) => (
                <div
                  key={r.id}
                  className="bg-black/50 border border-luxe-gold/20 rounded-xl p-3 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-luxe-gold" />
                      {r.title}
                    </div>
                    <div className="text-luxe-gray-medium mt-1">
                      Requires{" "}
                      <span className="text-luxe-gold font-semibold">
                        {r.pointsRequired} pts
                      </span>
                    </div>
                  </div>
                  <button className="text-[11px] px-3 py-1 rounded-full bg-luxe-gold/15 text-luxe-gold border border-luxe-gold/40">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerDashboard;
