import React, { useEffect, useState } from "react";
import { getStaffDashboard } from "../../api/staff";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  UserCircle2,
  Scissors,
} from "lucide-react";

const StaffDashboard = () => {
  const [data, setData] = useState({
    staffName: "Staff User",
    todayBookings: 0,
    completedBookings: 0,
    upcomingBookings: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStaffDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        // demo data
        setData({
          staffName: "Priya Sharma",
          todayBookings: 6,
          completedBookings: 3,
          upcomingBookings: [
            {
              id: "BK-1010",
              customerName: "Aman Gupta",
              serviceName: "Haircut + Beard",
              time: "2:30 PM",
              status: "CONFIRMED",
            },
            {
              id: "BK-1011",
              customerName: "Neha Singh",
              serviceName: "Facial & Cleanup",
              time: "3:15 PM",
              status: "PENDING",
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-luxe-black text-white flex flex-col">
      {/* Top bar */}
      <header className="h-16 border-b border-luxe-gold/20 bg-black/80 backdrop-blur flex items-center justify-between px-4 md:px-8">
        <div>
          <h1 className="text-lg font-semibold font-serif">
            Staff Dashboard
          </h1>
          <p className="text-xs text-luxe-gray-medium">
            Manage today&apos;s appointments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-luxe-gray-medium">Logged in as</div>
            <div className="font-semibold">{data.staffName}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-luxe-gold/20 border border-luxe-gold/40 flex items-center justify-center">
            <UserCircle2 className="w-5 h-5 text-luxe-gold" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6">
        {/* Today stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-luxe-gray-medium uppercase tracking-[0.2em]">
                Today&apos;s Bookings
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {data.todayBookings}
              </div>
            </div>
            <CalendarClock className="w-8 h-8 text-luxe-gold" />
          </div>

          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-luxe-gray-medium uppercase tracking-[0.2em]">
                Completed
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-400">
                {data.completedBookings}
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-luxe-gray-medium uppercase tracking-[0.2em]">
                Next Appointment
              </div>
              <div className="mt-2 text-lg font-semibold">
                {data.upcomingBookings[0]?.time || "--"}
              </div>
            </div>
            <Clock3 className="w-8 h-8 text-luxe-gold" />
          </div>
        </section>

        {/* Upcoming bookings */}
        <section className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-luxe-gray-light/90">
              Today&apos;s Appointments
            </h2>
          </div>

          {loading ? (
            <p className="text-xs text-luxe-gray-medium">Loading...</p>
          ) : data.upcomingBookings.length === 0 ? (
            <p className="text-xs text-luxe-gray-medium">
              No appointments assigned yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.upcomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between bg-black/50 rounded-xl px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-luxe-gold/15 flex items-center justify-center">
                      <Scissors className="w-4 h-4 text-luxe-gold" />
                    </div>
                    <div>
                      <div className="font-semibold">{b.customerName}</div>
                      <div className="text-luxe-gray-medium">
                        {b.serviceName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{b.time}</div>
                    <div className="text-[11px] text-luxe-gray-medium">
                      {b.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StaffDashboard;
