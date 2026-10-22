import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../context/StoreContext";
import {
  MapPin,
  ChevronDown,
  Search,
  Check,
  Clock,
  Compass,
  Sparkles,
  X,
} from "lucide-react";

function BranchListContent({
  searchQuery,
  setSearchQuery,
  detectLocation,
  locationStatus,
  filteredStores,
  selectedStore,
  selectStore,
  setIsOpen,
  stores,
  isMobileModal = false,
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl border border-groomish-slate/10 overflow-hidden flex flex-col ${
        isMobileModal
          ? "w-full max-w-sm mx-auto max-h-[82vh]"
          : "w-96 max-h-[480px]"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-groomish-slate/10 bg-gradient-to-r from-groomish-cream/60 to-white shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-groomish-orange" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-groomish-slate">
              Select Salon Branch
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {/* Geolocation Trigger */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={locationStatus === "detecting"}
              className="flex items-center gap-1 text-[11px] font-semibold text-groomish-orange hover:text-groomish-orange/80 transition px-2 py-0.5 rounded-full bg-groomish-orange/10 hover:bg-groomish-orange/15 disabled:opacity-50 cursor-pointer"
            >
              <Compass
                className={`w-3 h-3 ${
                  locationStatus === "detecting" ? "animate-spin" : ""
                }`}
              />
              <span>
                {locationStatus === "detecting" ? "Detecting..." : "Nearest"}
              </span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-groomish-slate/50 hover:text-groomish-slate hover:bg-black/5 cursor-pointer"
              aria-label="Close branch selector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by area, branch name, or city..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-groomish-slate/15 focus:outline-none focus:border-groomish-orange focus:ring-1 focus:ring-groomish-orange/30 text-groomish-slate"
            autoFocus
          />
        </div>
      </div>

      {/* Store List */}
      <div className="overflow-y-auto divide-y divide-groomish-slate/5 p-1 flex-1">
        {stores.length === 0 ? (
          <div className="p-6 text-center text-xs text-groomish-slate/50">
            No salon branches configured yet.
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-6 text-center text-xs text-groomish-slate/50">
            No salon branches match your search.
          </div>
        ) : (
          filteredStores.map((store) => {
            const isSelected = selectedStore?.id === store.id;
            return (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  selectStore(store);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-groomish-orange/10 text-groomish-slate"
                    : "hover:bg-groomish-slate/5 text-groomish-slate"
                }`}
              >
                {/* Store Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-groomish-slate/10 shrink-0 relative">
                  {store.image || (store.images && store.images[0]) ? (
                    <>
                      <img
                        src={store.image || store.images[0]}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                      {store.images && store.images.length > 1 && (
                        <span className="absolute bottom-0 right-0 bg-groomish-slate/85 text-white text-[8px] font-extrabold px-1 rounded-tl">
                          {store.images.length}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-groomish-orange">
                      <MapPin className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Store Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold truncate">
                        {store.name}
                      </span>
                      {store.code && (
                        <span className="font-mono text-[9px] font-extrabold bg-groomish-slate text-white px-1.5 py-0.2 rounded shrink-0">
                          {store.code}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-groomish-orange text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-groomish-slate/70 line-clamp-1 mt-0.5">
                    {store.address ? `${store.address}, ` : ""}{store.city || ""}
                  </p>

                  <div className="flex items-center gap-3 mt-1 text-[10px] text-groomish-slate/50">
                    {store.openingTime && store.closingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {store.openingTime} - {store.closingTime}
                      </span>
                    )}
                    {store.distanceKm !== null &&
                      store.distanceKm !== undefined && (
                        <span className="font-semibold text-groomish-orange">
                          📍 {store.distanceKm} km away
                        </span>
                      )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-groomish-slate/5 bg-groomish-cream/30 text-center shrink-0">
        <span className="text-[10px] text-groomish-slate/50">
          Your service bookings will be scheduled at the chosen branch.
        </span>
      </div>
    </div>
  );
}

export default function StoreSelectorDropdown({ compact = false }) {
  const {
    stores,
    selectedStore,
    selectStore,
    loading,
    detectLocation,
    locationStatus,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredStores = stores.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button - Optimized for Mobile & Tablet */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 xs:gap-2 sm:gap-2.5 px-1.5 xs:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-all duration-200 text-left shrink-0 cursor-pointer ${
          isOpen
            ? "border-groomish-orange/50 bg-groomish-orange/5 shadow-sm"
            : "border-groomish-slate/15 hover:border-groomish-orange/40 hover:bg-black/[0.02] bg-white/70"
        }`}
        title="Change Salon Branch"
        aria-label="Change Salon Branch"
      >
        <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-groomish-orange/10 flex items-center justify-center text-groomish-orange shrink-0">
          <MapPin className="w-2.5 xs:w-3 sm:w-3.5 h-2.5 xs:h-3 sm:h-3.5" />
        </div>

        <div className="flex flex-col min-w-0 pr-0.5 max-w-[65px] xs:max-w-[105px] sm:max-w-[190px] md:max-w-[210px]">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-groomish-orange">
              Salon Branch
            </span>
            {selectedStore?.distanceKm !== null &&
              selectedStore?.distanceKm !== undefined && (
                <span className="text-[9px] font-semibold text-groomish-slate/60 bg-groomish-slate/5 px-1 py-0.2 rounded">
                  {selectedStore.distanceKm} km
                </span>
              )}
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-groomish-slate truncate leading-tight">
            {selectedStore
              ? selectedStore.name
              : loading
              ? "Locating..."
              : stores.length === 0
              ? "No Branches"
              : "Select Branch"}
          </span>
        </div>

        <ChevronDown
          className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-groomish-slate/50 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-groomish-orange" : ""
          }`}
        />
      </button>

      {/* Desktop Popover (Anchored below trigger button) */}
      {isOpen && (
        <div className="hidden sm:block absolute left-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <BranchListContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            detectLocation={detectLocation}
            locationStatus={locationStatus}
            filteredStores={filteredStores}
            selectedStore={selectedStore}
            selectStore={selectStore}
            setIsOpen={setIsOpen}
            stores={stores}
            isMobileModal={false}
          />
        </div>
      )}

      {/* Mobile Modal Dialog (Rendered in createPortal to body to prevent clipping) */}
      {isOpen &&
        createPortal(
          <div className="sm:hidden fixed inset-0 z-[9999] flex flex-col justify-start pt-16 px-3 pb-6 animate-fade-in">
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Box */}
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-150">
              <BranchListContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                detectLocation={detectLocation}
                locationStatus={locationStatus}
                filteredStores={filteredStores}
                selectedStore={selectedStore}
                selectStore={selectStore}
                setIsOpen={setIsOpen}
                stores={stores}
                isMobileModal={true}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

