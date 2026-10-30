import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Scissors,
  ShoppingBag,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";

export default function RevenueGrowthSection({ revenueGrowth }) {
  const [activeCatalogTab, setActiveCatalogTab] = useState("services"); // "services" | "products"
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!revenueGrowth) return null;

  const currentRev = revenueGrowth.currentPeriodRevenue || 0;
  const prevRev = revenueGrowth.previousPeriodRevenue || 0;
  const growth = revenueGrowth.growthPercent || 0;
  const isPositiveGrowth = growth >= 0;

  const trends = revenueGrowth.trends || [];
  const branches = revenueGrowth.branches || [];
  const categories = revenueGrowth.categories || [];
  const topServices = revenueGrowth.topServices || [];
  const topProducts = revenueGrowth.topProducts || [];
  const gst = revenueGrowth.gstSummary || {
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalGst: 0,
    effectiveTaxRate: "18.0%",
  };

  // SVG Chart Geometry
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.currentRevenue || 0, t.previousRevenue || 0)),
    1000
  );

  const getCoordinates = (index, value) => {
    if (trends.length <= 1) return { x: chartWidth / 2, y: chartHeight / 2 };
    const x = paddingX + (index / (trends.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (value / maxVal) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const currentPoints = trends.map((t, idx) => getCoordinates(idx, t.currentRevenue || 0));
  const prevPoints = trends.map((t, idx) => getCoordinates(idx, t.previousRevenue || 0));

  const currentPath = currentPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  const currentAreaPath = currentPoints.length > 0
    ? `${currentPath} L ${currentPoints[currentPoints.length - 1].x} ${chartHeight - paddingY} L ${currentPoints[0].x} ${chartHeight - paddingY} Z`
    : "";

  const prevPath = prevPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-heading font-extrabold text-groomish-slate uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-groomish-green" />
            Revenue & Growth Dynamics
          </h2>
          <p className="text-xs text-groomish-slate/60">
            Period-over-period performance, branch ranking, catalog breakdown, and GST tax ledger.
          </p>
        </div>

        {/* Growth Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-groomish-slate/10 shadow-sm text-xs font-bold">
            <span className="text-groomish-slate/60 font-medium">Period Growth:</span>
            <span
              className={`flex items-center font-extrabold font-mono ${
                isPositiveGrowth ? "text-groomish-green" : "text-groomish-crimson"
              }`}
            >
              {isPositiveGrowth ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {growth > 0 ? `+${growth}%` : `${growth}%`}
            </span>
          </div>
        </div>
      </div>

      {/* REVENUE TREND LINE CHART (CURRENT VS PREVIOUS PERIOD OVERLAID) */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-groomish-orange" />
              Revenue Trend (Previous Period Overlaid)
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Comparison of daily/periodic earnings against the preceding baseline.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-groomish-orange" />
              <span className="font-bold text-groomish-slate">
                Current: ₹{currentRev.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 border-t-2 border-dashed border-groomish-slate/40" />
              <span className="text-groomish-slate/60 font-medium">
                Previous: ₹{prevRev.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full overflow-x-auto pt-2">
          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-groomish-slate/40">
              No trend data available for this range.
            </div>
          ) : (
            <div className="min-w-[640px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 overflow-visible">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FA7B47" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#FA7B47" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                  return (
                    <g key={pct}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#373A43"
                        strokeOpacity="0.06"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#373A43"
                        fillOpacity="0.4"
                        fontFamily="monospace"
                      >
                        ₹{Math.round(maxVal * pct).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Base axis line */}
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="#373A43"
                  strokeOpacity="0.12"
                />

                {/* Area Fill for Current Period */}
                {currentAreaPath && (
                  <path d={currentAreaPath} fill="url(#revenueGradient)" />
                )}

                {/* Previous Period Line (Dashed) */}
                {prevPath && (
                  <path
                    d={prevPath}
                    fill="none"
                    stroke="#545864"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Current Period Line (Solid Vibrant) */}
                {currentPath && (
                  <path
                    d={currentPath}
                    fill="none"
                    stroke="#FA7B47"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {currentPoints.map((pt, idx) => {
                  const t = trends[idx];
                  const isHovered = hoveredPoint?.index === idx;
                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ ...t, index: idx, x: pt.x, y: pt.y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#FA7B47"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all"
                      />
                      {/* Label on X-axis (every few items if dense) */}
                      {(trends.length <= 14 || idx % Math.ceil(trends.length / 10) === 0) && (
                        <text
                          x={pt.x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#373A43"
                          fillOpacity="0.6"
                          fontWeight="600"
                        >
                          {t.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-10 bg-groomish-slateDark text-white p-2.5 rounded-2xl shadow-xl text-xs -translate-x-1/2 -translate-y-full border border-white/10"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 10}%`,
                  }}
                >
                  <div className="font-bold text-[11px] text-white/90 pb-1 border-b border-white/10 mb-1">
                    {hoveredPoint.date || hoveredPoint.label}
                  </div>
                  <div className="flex items-center gap-2 text-groomish-orange font-bold font-mono">
                    <span>Current:</span>
                    <span>₹{hoveredPoint.currentRevenue?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 font-medium font-mono text-[11px]">
                    <span>Previous:</span>
                    <span>₹{hoveredPoint.previousRevenue?.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">
                    {hoveredPoint.bookingCount || 0} bookings recorded
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2-COLUMN GRID: REVENUE BY BRANCH & GST COLLECTED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE BY BRANCH (RANKING TABLE & BARS) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
                <Building2 className="w-4 h-4 text-groomish-blue" />
                Revenue by Salon Branch
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Turnover distribution and services vs retail split across locations.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-groomish-cream text-groomish-slate/70">
              {branches.length} Branches
            </span>
          </div>

          {branches.length === 0 ? (
            <div className="py-8 text-center text-xs text-groomish-slate/40">
              No branch sales recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Branch Location</th>
                    <th className="py-2.5 px-4 text-center">Bookings</th>
                    <th className="py-2.5 px-4 text-right">Services</th>
                    <th className="py-2.5 px-4 text-right">Products</th>
                    <th className="py-2.5 px-4 text-right">Total Revenue</th>
                    <th className="py-2.5 px-4 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-groomish-slate/5">
                  {branches.map((b, idx) => (
                    <tr key={b.storeId || idx} className="hover:bg-groomish-cream/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-groomish-slate flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-groomish-cream flex items-center justify-center font-mono text-[10px] text-groomish-slate/70">
                            #{idx + 1}
                          </span>
                          <span>{b.storeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-groomish-slate/80">
                        {b.bookingsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-groomish-slate/80">
                        ₹{(b.servicesRevenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-groomish-slate/80">
                        ₹{(b.productsRevenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-groomish-slate">
                        ₹{(b.totalRevenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-groomish-cream rounded-full overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${b.revenueSharePercent || 0}%` }}
                              className="h-full bg-groomish-orange rounded-full"
                            />
                          </div>
                          <span className="font-mono font-bold text-groomish-orange text-xs">
                            {b.revenueSharePercent || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GST COLLECTED SUMMARY */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
                <Receipt className="w-4 h-4 text-groomish-goldDark" />
                GST Collected Ledger
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-groomish-goldLight text-groomish-slate">
                18% GST (9% CGST + 9% SGST)
              </span>
            </div>
            <p className="text-xs text-groomish-slate/50 mb-4">
              Statutory tax component collected on service and retail billing.
            </p>

            <div className="bg-groomish-cream/60 rounded-2xl p-4 border border-groomish-slate/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate/70">Taxable Turnover</span>
                <span className="font-mono font-bold text-groomish-slate">
                  ₹{gst.taxableAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate/70">CGST (9.0%)</span>
                <span className="font-mono font-bold text-groomish-slate">
                  ₹{gst.cgstAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate/70">SGST (9.0%)</span>
                <span className="font-mono font-bold text-groomish-slate">
                  ₹{gst.sgstAmount?.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-groomish-slate/10 flex items-center justify-between text-sm">
                <span className="font-bold text-groomish-slate">Total GST Collected</span>
                <span className="font-mono font-extrabold text-groomish-orange text-base">
                  ₹{gst.totalGst?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-groomish-blueLight/50 rounded-2xl border border-groomish-blue/10 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-groomish-blue shrink-0 mt-0.5" />
            <div className="text-[11px] text-groomish-slate/80 leading-relaxed">
              Amounts reflect GST included in customer checkout prices. Ready for monthly GSTR-3B and GSTR-1 reconciliations.
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY REVENUE & TOP 10 SERVICES / PRODUCTS */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-5">
        {/* Category breakdown pills */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <Layers className="w-4 h-4 text-groomish-coral" />
              Revenue by Service Category
            </h3>
            <span className="text-xs text-groomish-slate/50 font-medium">
              Share of services turnover
            </span>
          </div>

          {categories.length === 0 ? (
            <p className="text-xs text-groomish-slate/40">No category breakdown available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((c, idx) => (
                <div
                  key={c.categoryId || idx}
                  className="bg-groomish-cream/50 rounded-2xl p-3 border border-groomish-slate/5 hover:border-groomish-orange/30 transition"
                >
                  <div className="text-xs font-bold text-groomish-slate truncate" title={c.categoryName}>
                    {c.categoryName}
                  </div>
                  <div className="text-sm font-mono font-extrabold text-groomish-slate mt-1">
                    ₹{c.revenue?.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-groomish-slate/60 mt-1">
                    <span>{c.bookingsCount} orders</span>
                    <span className="font-bold text-groomish-orange">{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab switch for Top 10 Services vs Top 10 Products */}
        <div className="pt-4 border-t border-groomish-slate/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-groomish-cream/80 p-1 rounded-2xl border border-groomish-slate/10">
              <button
                onClick={() => setActiveCatalogTab("services")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCatalogTab === "services"
                    ? "bg-white text-groomish-orange shadow-sm"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Top 10 Services</span>
              </button>
              <button
                onClick={() => setActiveCatalogTab("products")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeCatalogTab === "products"
                    ? "bg-white text-groomish-blue shadow-sm"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Top 10 Products (Stock Adjusted)</span>
              </button>
            </div>
          </div>

          {/* Catalog Tab Content */}
          {activeCatalogTab === "services" ? (
            topServices.length === 0 ? (
              <div className="py-8 text-center text-xs text-groomish-slate/40">
                No service booking sales data found in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Service</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-center">Bookings Done</th>
                      <th className="py-2.5 px-4 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-groomish-slate/5">
                    {topServices.map((s, idx) => (
                      <tr key={s.serviceId || idx} className="hover:bg-groomish-cream/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-groomish-slate/60">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-groomish-slate">
                          {s.serviceName}
                        </td>
                        <td className="py-3 px-4 text-groomish-slate/70">
                          {s.categoryName || "General"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-groomish-slate">
                          {s.bookingCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-groomish-orange">
                          ₹{(s.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-groomish-slate/40">
                No product purchases recorded in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Product Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-center">Units Sold</th>
                      <th className="py-2.5 px-4 text-center">Stock Status</th>
                      <th className="py-2.5 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-groomish-slate/5">
                    {topProducts.map((p, idx) => (
                      <tr key={p.productId || idx} className="hover:bg-groomish-cream/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-groomish-slate/60">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-groomish-slate">
                          {p.productName}
                        </td>
                        <td className="py-3 px-4 text-groomish-slate/70">
                          {p.categoryName || "Retail"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-groomish-slate">
                          {p.unitsSold}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.inStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-greenLight text-groomish-green">
                              <CheckCircle2 className="w-3 h-3" />
                              In Stock ({p.stockQuantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-crimsonLight text-groomish-crimson">
                              <AlertCircle className="w-3 h-3" />
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-groomish-blue">
                          ₹{(p.revenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
