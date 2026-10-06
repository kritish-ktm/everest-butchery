import { useState } from "react";
import { quantityStep, validQuantity } from "../lib/shopPresentation";

export default function QuantityControl({ value, unit, name, onChange, disabled = false, max = Infinity }) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const step = quantityStep(unit);

  function commit() {
    const next = Number(draft);
    if (validQuantity(next, unit) && next <= max) onChange(next);
    else setDraft(String(value));
    setEditing(false);
  }

  return (
    <div className="quantity-control">
      <button type="button" disabled={disabled || value <= step} title="Decrease quantity" aria-label={`Decrease ${name} quantity`} onClick={() => onChange(Math.max(step, value - step))}>
        <i className="bi bi-dash" aria-hidden="true" />
      </button>
      <input type="number" min={step} max={Number.isFinite(max) ? max : undefined} step={step} value={editing ? draft : String(value)} disabled={disabled} aria-label={`${name} quantity in ${unit}`} onFocus={() => { setDraft(String(value)); setEditing(true); }} onChange={(event) => {
        setDraft(event.target.value);
        const next = Number(event.target.value);
        if (validQuantity(next, unit) && next <= max) onChange(next);
      }} onBlur={commit} onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); commit(); }
      }} />
      <button type="button" disabled={disabled || value + step > max} title="Increase quantity" aria-label={`Increase ${name} quantity`} onClick={() => onChange(value + step)}>
        <i className="bi bi-plus" aria-hidden="true" />
      </button>
      <span>{unit}</span>
    </div>
  );
}
