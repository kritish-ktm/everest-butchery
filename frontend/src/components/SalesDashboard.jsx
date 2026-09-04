import { useState } from "react";

function formatMoney(value) {
  return `${Number(value || 0).toFixed(0)} kr`;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
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

export default function SalesDashboard({ data, loading, range, onRangeChange }) {
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const series = data?.series || [];
  const summary = data?.summary || {};
  const maxSales = Math.max(...series.map((item) => Number(item.sales) || 0), 1);

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
          <p>Track completed and active sales without counting cancelled orders.</p>
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
              <small>{range.from} to {range.to}</small>
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
                    <small>{item.orders} {item.orders === 1 ? "order" : "orders"}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}