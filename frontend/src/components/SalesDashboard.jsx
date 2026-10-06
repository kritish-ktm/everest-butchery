import { useEffect, useState } from "react";
import { formatDisplayDate, formatNepaliDate, isoDate } from "../lib/dateUtils";

function formatMoney(value) {
  return `${Number(value || 0).toFixed(0)} kr`;
}

function daysAgo(amount) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - amount);
  return isoDate(date);
}

const PRESETS = [
  { key: "today", label: "Today", from: () => daysAgo(0) },
  { key: "week", label: "This week", from: () => daysAgo(6) },
  { key: "month", label: "This month", from: () => daysAgo(29) },
];

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=55.7059&longitude=12.5008&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FCopenhagen&forecast_days=3";

function weatherSummary(code) {
  if ([0, 1].includes(code)) return "Clear";
  if ([2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Weather";
}

function percent(value, total) {
  if (!total) return "0%";
  return `${Math.round((Number(value || 0) / total) * 100)}%`;
}

function ReportList({ title, icon, items, renderItem, empty = "No report data yet." }) {
  return (
    <div className="report-card">
      <div className="report-card-head">
        <h4>{title}</h4>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      {items.length === 0 ? (
        <p className="report-empty">{empty}</p>
      ) : (
        <ul className="report-list">
          {items.map((item, index) => (
            <li key={item.id || item.product_name || item.key || index}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SalesDashboard({ data, loading, range, onRangeChange }) {
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const [weather, setWeather] = useState({ loading: true, error: "", data: null });
  const series = data?.series || [];
  const summary = data?.summary || {};
  const reports = data?.reports || {};
  const maxSales = Math.max(...series.map((item) => Number(item.sales) || 0), 1);
  const totalOrders = Number(summary.orders || 0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadWeather() {
      try {
        const response = await fetch(WEATHER_URL, { signal: controller.signal });
        if (!response.ok) throw new Error("Weather unavailable");
        const result = await response.json();
        setWeather({ loading: false, error: "", data: result });
      } catch (error) {
        if (error.name !== "AbortError") setWeather({ loading: false, error: "Weather unavailable", data: null });
      }
    }
    loadWeather();
    return () => controller.abort();
  }, []);

  function choosePreset(preset) {
    const to = isoDate(new Date());
    const from = preset.from();
    setCustomFrom(from);
    setCustomTo(to);
    onRangeChange({ from, to });
  }

  function applyCustomRange(event) {
    event.preventDefault();
    if (customFrom && customTo && customFrom <= customTo) {
      onRangeChange({ from: customFrom, to: customTo });
    }
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-toolbar">
        <div>
          <span className="page-kicker">STORE PERFORMANCE</span>
          <h3>Sales overview</h3>
          <p>Track sales, customer patterns, weather, and Nepali dates without counting cancelled orders.</p>
        </div>
        <div className="dashboard-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className="dashboard-range-btn"
              onClick={() => choosePreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form className="dashboard-custom-range" onSubmit={applyCustomRange}>
        <label>
          From
          <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">Apply range</button>
      </form>

      {loading ? (
        <div className="dashboard-loading">
          <i className="bi bi-arrow-repeat" aria-hidden="true" />
          Loading sales data…
        </div>
      ) : (
        <>
          <div className="dashboard-metrics">
            <div className="metric-card">
              <span>Total sales</span>
              <strong>{formatMoney(summary.sales)}</strong>
              <small>{formatDisplayDate(range.from)} to {formatDisplayDate(range.to)}</small>
            </div>
            <div className="metric-card">
              <span>Orders</span>
              <strong>{summary.orders || 0}</strong>
              <small>Non-cancelled orders</small>
            </div>
            <div className="metric-card">
              <span>Average order</span>
              <strong>{formatMoney(summary.average_order)}</strong>
              <small>Average basket value</small>
            </div>
            <div className="metric-card">
              <span>Items sold</span>
              <strong>{summary.items_sold || 0}</strong>
              <small>Across all order lines</small>
            </div>
          </div>

          <div className="dashboard-ops-grid">
            <div className="ops-card nepali-date-card">
              <span className="page-kicker">NEPALI DATE</span>
              <strong>{formatNepaliDate(isoDate(new Date()))}</strong>
              <small>Today in Copenhagen: {formatDisplayDate(new Date(), { year: "numeric" })}</small>
              <div className="nepali-range">
                <span>{formatNepaliDate(range.from)}</span>
                <i className="bi bi-arrow-right" aria-hidden="true" />
                <span>{formatNepaliDate(range.to)}</span>
              </div>
            </div>

            <div className="ops-card weather-card">
              <div>
                <span className="page-kicker">STORE WEATHER</span>
                <strong>
                  {weather.loading
                    ? "Loading..."
                    : weather.error
                      ? weather.error
                      : `${Math.round(weather.data.current.temperature_2m)}°C · ${weatherSummary(weather.data.current.weather_code)}`}
                </strong>
                <small>Islevhusvej 9, København</small>
              </div>
              {!weather.loading && !weather.error && (
                <div className="weather-details">
                  <span><i className="bi bi-thermometer-half" aria-hidden="true" /> Feels {Math.round(weather.data.current.apparent_temperature)}°C</span>
                  <span><i className="bi bi-cloud-rain" aria-hidden="true" /> Rain {weather.data.current.precipitation} mm</span>
                  <span><i className="bi bi-wind" aria-hidden="true" /> Wind {Math.round(weather.data.current.wind_speed_10m)} km/h</span>
                </div>
              )}
            </div>
          </div>

          <div className="sales-chart-card">
            <div className="sales-chart-heading">
              <div>
                <h4>Sales by day</h4>
                <p>Revenue in kr for the selected period</p>
              </div>
              <i className="bi bi-bar-chart-line" aria-hidden="true" />
            </div>
            {series.length === 0 ? (
              <div className="dashboard-empty">No sales recorded for this period.</div>
            ) : (
              <div className="sales-chart" role="img" aria-label="Sales by day bar chart">
                {series.map((item) => (
                  <div className="sales-bar-group" key={item.date} title={`${item.label}: ${formatMoney(item.sales)}`}>
                    <div className="sales-bar-value">{Number(item.sales) > 0 ? formatMoney(item.sales) : ""}</div>
                    <div
                      className="sales-bar"
                      style={{ height: `${Math.max((Number(item.sales) / maxSales) * 100, item.sales > 0 ? 8 : 2)}%` }}
                    />
                    <span>{item.label}</span>
                    <em>{formatNepaliDate(item.date).replace(" BS", "")}</em>
                    <small>{item.orders} {item.orders === 1 ? "order" : "orders"}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="reports-grid">
            <ReportList
              title="Top customers"
              icon="bi-people"
              items={reports.top_customers || []}
              renderItem={(item) => (
                <>
                  <span><strong>{item.full_name || "Customer"}</strong><small>{item.phone || "No phone"}</small></span>
                  <span><strong>{formatMoney(item.sales)}</strong><small>{item.orders} orders</small></span>
                </>
              )}
            />
            <ReportList
              title="Top products"
              icon="bi-basket"
              items={reports.top_products || []}
              renderItem={(item) => (
                <>
                  <span><strong>{item.product_name}</strong><small>{Number(item.quantity || 0).toFixed(1)} sold</small></span>
                  <span><strong>{formatMoney(item.sales)}</strong><small>Revenue</small></span>
                </>
              )}
            />
            <ReportList
              title="Fulfillment mix"
              icon="bi-truck"
              items={reports.fulfillment || []}
              renderItem={(item) => (
                <>
                  <span><strong>{item.key}</strong><small>{percent(item.count, totalOrders)} of orders</small></span>
                  <span><strong>{item.count}</strong><small>orders</small></span>
                </>
              )}
            />
            <ReportList
              title="Payment methods"
              icon="bi-credit-card"
              items={reports.payment_methods || []}
              renderItem={(item) => (
                <>
                  <span><strong>{item.key}</strong><small>{percent(item.count, totalOrders)} of orders</small></span>
                  <span><strong>{item.count}</strong><small>orders</small></span>
                </>
              )}
            />
          </div>
        </>
      )}
    </section>
  );
}
