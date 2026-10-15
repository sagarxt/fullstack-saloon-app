import { useState } from "react";
import { useGroomCoin } from "../../context/GroomCoinContext";

export default function GroomCoinIcon({
  className = "w-4 h-4 inline-block",
  size,
  style,
  overrideUrl = null,
}) {
  const { config } = useGroomCoin();
  const [imgError, setImgError] = useState(false);

  const iconUrl = overrideUrl !== null ? overrideUrl : config?.coinIconUrl;

  const styleObj = {
    ...style,
    ...(size ? { width: size, height: size } : {}),
  };

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        alt="Groom Coin"
        onError={() => setImgError(true)}
        className={`object-contain inline-block align-middle shrink-0 ${className}`}
        style={styleObj}
      />
    );
  }

  // Premium Custom Gold Medallion SVG with "GC" insignia
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle shrink-0 select-none ${className}`}
      style={styleObj}
    >
      <defs>
        <linearGradient id="gc_gold_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.45" stopColor="#F59E0B" />
          <stop offset="0.8" stopColor="#D97706" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="gc_rim_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF3C7" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Outer Coin Base */}
      <circle cx="12" cy="12" r="10" fill="url(#gc_gold_grad)" stroke="url(#gc_rim_grad)" strokeWidth="1.5" />

      {/* Inner Rim */}
      <circle cx="12" cy="12" r="7.5" stroke="#FDE68A" strokeWidth="0.8" strokeDasharray="1.2 0.8" opacity="0.8" />

      {/* Embossed Lettering / Symbol "GC" */}
      <path
        d="M9.8 10.2C9.5 9.7 8.9 9.4 8.2 9.4C7.0 9.4 6.2 10.5 6.2 12C6.2 13.5 7.0 14.6 8.2 14.6C8.9 14.6 9.5 14.3 9.8 13.8M9.5 12H8.2"
        stroke="#FFFFFF"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 10.2C16.1 9.7 15.3 9.4 14.4 9.4C13.1 9.4 12.2 10.5 12.2 12C12.2 13.5 13.1 14.6 14.4 14.6C15.3 14.6 16.1 14.3 16.5 13.8"
        stroke="#FFFFFF"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Highlight sparkle */}
      <circle cx="8" cy="7" r="1" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}
