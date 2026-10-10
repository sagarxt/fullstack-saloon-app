import { useEffect, useState } from "react";
import { getBookings } from "../../api/admin";
import BookingCard from "../../components/admin/BookingCard";
import { extractList } from "../../utils/dataHelper";
import { Calendar, RefreshCw, Search, X } from "lucide-react";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function BookingsPage() {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookings(status === "ALL" ? "" : status);
      setBookings(extractList(res.data));
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [status]);

  const bookingList = extractList(bookings);

  const filteredBookings = bookingList.filter((b) => {
    if (search.trim()) {
      const rawQ = search.toLowerCase();
      const cleanQ = rawQ.replace(/[^a-z0-9]/g, "");

      const bookingCode = (b.bookingCode || "").toLowerCase();
      const cleanCode = bookingCode.replace(/[^a-z0-9]/g, "");
      const idStr = (b.id || "").toLowerCase();
      const customerName = (b.userName || "").toLowerCase();
      const bookedBy = (b.bookedBy || "").toLowerCase();
      const serviceName = (b.serviceName || "").toLowerCase();
      const note = (b.note || "").toLowerCase();

      const matchesId = bookingCode.includes(rawQ) || (cleanQ && cleanCode.includes(cleanQ)) || idStr.includes(rawQ);
      const matchesCustomer = customerName.includes(rawQ);
      const matchesBookedBy = bookedBy.includes(rawQ);
      const matchesService = serviceName.includes(rawQ);
      const matchesNote = note.includes(rawQ);

      if (!matchesId && !matchesCustomer && !matchesBookedBy && !matchesService && !matchesNote) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Appointments Management
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Approve requests, manage scheduled clients, and mark salon treatments completed.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition self-start sm:self-auto"
          title="Refresh bookings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
        </button>
      </div>

      {/* Controls: Status Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                status === s
                  ? "bg-groomish-slate text-white shadow-soft"
                  : "bg-white text-groomish-slate/70 border border-groomish-slate/10 hover:bg-groomish-cream"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID (GN-XX-123456), client, service..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 shadow-soft focus:outline-none focus:border-groomish-orange transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate transition p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-groomish-slate/60">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
          <Calendar className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Bookings Found
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
            {search
              ? `No appointments match "${search}". Try searching by 10-char booking code (e.g. GN-XX-123456) or customer name.`
              : `There are currently no bookings with status ${status}.`}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="btn-secondary text-xs px-4 py-2 mx-auto"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              refresh={loadBookings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
