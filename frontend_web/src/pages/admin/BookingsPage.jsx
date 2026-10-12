import { useEffect, useState } from "react";
import { getBookings } from "../../api/admin";
import { storeApi } from "../../api/store";
import BookingCard from "../../components/admin/BookingCard";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { extractList } from "../../utils/dataHelper";
import { Calendar, RefreshCw, Search, X, MapPin } from "lucide-react";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const PAGE_SIZE = 20;

export default function BookingsPage() {
  const [status, setStatus] = useState("ALL");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStores = async () => {
    try {
      const res = await storeApi.getAdminStores();
      setStores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load stores for filter:", err);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const activeStatus = status === "ALL" ? "" : status;
      const activeStore = storeFilter === "ALL" ? "" : storeFilter;
      const res = await getBookings(activeStatus, activeStore);
      setBookings(extractList(res.data));
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    setPage(1);
    loadBookings();
  }, [status, storeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search]);

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
      const storeName = (b.storeName || "").toLowerCase();
      const note = (b.note || "").toLowerCase();

      const matchesId = bookingCode.includes(rawQ) || (cleanQ && cleanCode.includes(cleanQ)) || idStr.includes(rawQ);
      const matchesCustomer = customerName.includes(rawQ);
      const matchesBookedBy = bookedBy.includes(rawQ);
      const matchesService = serviceName.includes(rawQ);
      const matchesStore = storeName.includes(rawQ);
      const matchesNote = note.includes(rawQ);

      if (!matchesId && !matchesCustomer && !matchesBookedBy && !matchesService && !matchesStore && !matchesNote) {
        return false;
      }
    }
    return true;
  });

  const storeOptions = [
    { value: "ALL", label: "All Salon Branches" },
    ...stores.map((st) => ({
      value: st.id,
      label: `${st.name} (${st.code || "Branch"})`,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Appointments Management
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Approve requests, manage scheduled clients, and mark salon treatments completed across branches.
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

      {/* Controls: Status Tabs, Store Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3 rounded-3xl border border-groomish-slate/10 shadow-soft">
        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                status === s
                  ? "bg-groomish-slate text-white shadow-soft"
                  : "bg-groomish-cream/60 text-groomish-slate/70 hover:bg-groomish-cream"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Store Filter Dropdown */}
          <div className="w-full sm:w-60">
            <CustomSelect
              options={storeOptions}
              value={storeFilter}
              onChange={(e) => {
                const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                setStoreFilter(val);
              }}
              placeholder="Filter by Branch"
            />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client, service..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:border-groomish-orange focus:bg-white transition"
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
              : `There are currently no bookings with status ${status}${storeFilter !== "ALL" ? " for this store" : ""}.`}
          </p>
          {(search || storeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStoreFilter("ALL");
              }}
              className="btn-secondary text-xs px-4 py-2 mx-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {filteredBookings
              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              .map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  refresh={loadBookings}
                />
              ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={filteredBookings.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemName="appointments"
          />
        </div>
      )}
    </div>
  );
}
