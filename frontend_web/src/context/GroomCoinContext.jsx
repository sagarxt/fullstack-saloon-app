import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getGroomCoinConfigApi, updateGroomCoinConfigApi } from "../api/loyalty";

const GroomCoinContext = createContext();

export const GroomCoinProvider = ({ children }) => {
  const [config, setConfig] = useState({
    coinName: "Groom Coin",
    coinIconUrl: null,
    spendAmountPerCoin: 100,
    coinValueInInr: 1.0,
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await getGroomCoinConfigApi();
      if (res.data) {
        setConfig((prev) => ({
          ...prev,
          ...res.data,
          spendAmountPerCoin: res.data.spendAmountPerCoin || 100,
          coinValueInInr: res.data.coinValueInInr || 1.0,
        }));
      }
    } catch (err) {
      console.warn("Failed to load Groom Coin config, using defaults:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig) => {
    const res = await updateGroomCoinConfigApi(newConfig);
    if (res.data) {
      setConfig((prev) => ({
        ...prev,
        ...res.data,
      }));
    }
    return res.data;
  };

  /**
   * Helper to calculate Groom Coins earned from spend + optional bonus coins
   */
  const calculateCoins = useCallback(
    (amount, extraBonus = 0) => {
      const spendRate = config.spendAmountPerCoin > 0 ? config.spendAmountPerCoin : 100;
      const num = Number(amount) || 0;
      if (num <= 0) return Number(extraBonus) || 0;
      const base = Math.round(num / spendRate);
      const bonus = Number(extraBonus) || 0;
      return Math.max(1, base + bonus);
    },
    [config.spendAmountPerCoin]
  );

  return (
    <GroomCoinContext.Provider
      value={{
        config,
        loading,
        refreshConfig: fetchConfig,
        updateConfig,
        calculateCoins,
      }}
    >
      {children}
    </GroomCoinContext.Provider>
  );
};

export const useGroomCoin = () => {
  const context = useContext(GroomCoinContext);
  if (!context) {
    // Return safe fallback if outside provider
    return {
      config: {
        coinName: "Groom Coin",
        coinIconUrl: null,
        spendAmountPerCoin: 100,
        coinValueInInr: 1.0,
      },
      loading: false,
      refreshConfig: () => {},
      updateConfig: async () => {},
      calculateCoins: (amount, extraBonus = 0) => {
        const num = Number(amount) || 0;
        if (num <= 0) return Number(extraBonus) || 0;
        return Math.max(1, Math.round(num / 100) + (Number(extraBonus) || 0));
      },
    };
  }
  return context;
};
