import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getMyBookings } from "../../api/customer";
import BookingCard from "../../components/customer/BookingCard";
import Pagination from "../../components/common/Pagination";
import { extractList } from "../../utils/dataHelper";
import { Calendar, Scissors, Sparkles, Filter, RefreshCw, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 20;

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("ALL"); // ALL | UPCOMING | COMPLETED | CANCELLED
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
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
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const bookingList = extractList(bookings);

  const filteredBookings = bookingList.filter((b) => {
    if (filter === "UPCOMING" && b.status !== "PENDING" && b.status !== "CONFIRMED") return false;
    if (filter === "COMPLETED" && b.status !== "COMPLETED") return false;
    if (filter === "CANCELLED" && b.status !== "CANCELLED") return false;

    if (search.trim()) {
      const rawQ = search.toLowerCase();
      const cleanQ = rawQ.replace(/[^a-z0-9]/g, "");

      const bookingCode = (b.bookingCode || "").toLowerCase();
      const cleanCode = bookingCode.replace(/[^a-z0-9]/g, "");
      const idStr = (b.id || "").toLowerCase();
      const serviceName = (b.items?.[0]?.serviceNameSnapshot || b.serviceName || "").toLowerCase();
      const bookedBy = (b.bookedBy || "").toLowerCase();

      const matchesId = bookingCode.includes(rawQ) || (cleanQ && cleanCode.includes(cleanQ)) || idStr.includes(rawQ);
      const matchesService = serviceName.includes(rawQ);
      const matchesBookedBy = bookedBy.includes(rawQ);

      if (!matchesId && !matchesService && !matchesBookedBy) {
        return false;
      }
    }

    return true;
  });

  const upcomingCount = bookingList.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length;
  const completedCount = bookingList.filter((b) => b.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
              <Calendar className="w-4 h-4" />
              <span>Salon Appointments</span>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-groomish-slate">
              My Bookings
            </h1>
            <p className="text-sm text-groomish-slate/60 mt-1">
              Track upcoming visits, reschedule appointments, and view your loyalty points receipt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadBookings}
              className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
              title="Refresh bookings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            </button>
            <button
              onClick={() => navigate("/#services")}
              className="btn-primary text-xs px-5 py-2.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Book New Service</span>
            </button>
          </div>
        </div>

        {/* Controls: Filter Tabs + Search Input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-groomish-slate/10 shadow-soft overflow-x-auto">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                filter === "ALL"
                  ? "bg-groomish-slate text-white shadow-soft"
                  : "text-groomish-slate/60 hover:text-groomish-slate"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter("UPCOMING")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                filter === "UPCOMING"
                  ? "bg-groomish-orange text-white shadow-soft"
                  : "text-groomish-slate/60 hover:text-groomish-slate"
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                filter === "COMPLETED"
                  ? "bg-groomish-blue text-white shadow-soft"
                  : "text-groomish-slate/60 hover:text-groomish-slate"
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilter("CANCELLED")}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                filter === "CANCELLED"
                  ? "bg-groomish-crimson text-white shadow-soft"
                  : "text-groomish-slate/60 hover:text-groomish-slate"
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. GN-AB-123456), service..."
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

        {/* Booking Cards List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-groomish-slate/60 font-medium">Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-lg mx-auto shadow-soft my-8">
            <div className="w-16 h-16 bg-groomish-cream rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-groomish-slate/40" />
            </div>
            <h3 className="font-heading font-bold text-lg text-groomish-slate">
              No Bookings Found
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-1 mb-6">
              {search
                ? `No appointments match "${search}". Try searching by your 10-digit booking ID (e.g. GN-XX-123456) or service name.`
                : filter === "ALL"
                ? "You haven't scheduled any salon appointments yet."
                : `You don't have any ${filter.toLowerCase()} appointments.`}
            </p>
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="btn-secondary text-xs px-6 py-2.5 mx-auto"
              >
                Clear Search Query
              </button>
            ) : (
              <button
                onClick={() => navigate("/#services")}
                className="btn-primary text-xs px-6 py-2.5 mx-auto"
              >
                Explore Groomish Services
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              {filteredBookings
                .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    refresh={loadBookings}
                  />
                ))}
            </div>

            {filteredBookings.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-groomish-slate/10 shadow-soft">
                <Pagination
                  currentPage={page}
                  totalItems={filteredBookings.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemName="bookings"
                />
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
