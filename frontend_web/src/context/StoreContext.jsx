import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { storeApi } from "../api/store";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // 'idle' | 'detecting' | 'detected' | 'denied' | 'error'

  const fetchStores = useCallback(async (coords = null) => {
    try {
      setLoading(true);
      const lat = coords?.latitude ?? null;
      const lng = coords?.longitude ?? null;
      const res = await storeApi.getPublicStores(lat, lng);
      const storeList = Array.isArray(res.data) ? res.data : [];
      setStores(storeList);

      if (storeList.length > 0) {
        try {
          sessionStorage.removeItem("groomish_wakeup_start_time");
        } catch (_) {}
        const savedStoreId = localStorage.getItem("groomish_selected_store_id");
        if (savedStoreId) {
          const matched = storeList.find((s) => s.id === savedStoreId);
          if (matched) {
            setSelectedStore(matched);
            return;
          }
        }
        // Auto-select nearest store (the first one returned by proximity sorting)
        setSelectedStore(storeList[0]);
        localStorage.setItem("groomish_selected_store_id", storeList[0].id);
      } else {
        setSelectedStore(null);
        localStorage.removeItem("groomish_selected_store_id");
      }
    } catch (err) {
      console.error("Failed to load salon stores:", err);
      setStores([]);
      setSelectedStore(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      fetchStores();
      return;
    }

    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocationStatus("detected");
        fetchStores(coords);
      },
      (err) => {
        console.warn("Geolocation permission skipped or denied:", err.message);
        setLocationStatus("denied");
        fetchStores();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [fetchStores]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const selectStore = (store) => {
    if (!store) return;
    setSelectedStore(store);
    localStorage.setItem("groomish_selected_store_id", store.id);
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        selectedStore,
        selectStore,
        setSelectedStore: selectStore,
        loading,
        userLocation,
        locationStatus,
        detectLocation,
        refreshStores: () => fetchStores(userLocation),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

export default StoreContext;
