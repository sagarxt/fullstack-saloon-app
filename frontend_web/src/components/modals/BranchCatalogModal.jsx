import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import StaffBranchServicesTab from "../staff/StaffBranchServicesTab";
import StaffBranchInventoryTab from "../staff/StaffBranchInventoryTab";
import { Scissors, Package, Store, MapPin, X } from "lucide-react";

export default function BranchCatalogModal({ open, onClose, store }) {
  const [activeTab, setActiveTab] = useState("SERVICES"); // SERVICES | INVENTORY

  if (!store) return null;

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-6xl">
      <div className="space-y-6">
        {/* Modal Header */}
        <div className="border-b border-groomish-slate/10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Branch Exclusive Catalog
                </span>
                {store.code && (
                  <span className="font-mono text-[10px] font-bold bg-groomish-slate text-white px-2 py-0.5 rounded-md">
                    {store.code}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
                {store.name}
              </h2>
              {store.address && (
                <p className="text-xs text-groomish-slate/60 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                  <span>{store.address}, {store.city}</span>
                </p>
              )}
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-2 bg-groomish-cream p-1.5 rounded-2xl border border-groomish-slate/10 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("SERVICES")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "SERVICES"
                    ? "bg-groomish-slate text-white shadow-soft"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Branch Services</span>
              </button>

              <button
                onClick={() => setActiveTab("INVENTORY")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "INVENTORY"
                    ? "bg-groomish-slate text-white shadow-soft"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Product Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {activeTab === "SERVICES" ? (
            <StaffBranchServicesTab
              storeId={store.id}
              storeName={store.name}
              isAdmin={true}
            />
          ) : (
            <StaffBranchInventoryTab
              storeId={store.id}
              storeName={store.name}
              isAdmin={true}
            />
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
