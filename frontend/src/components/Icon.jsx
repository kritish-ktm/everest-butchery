// Simple line-icon set used instead of emojis, styled via currentColor so
// it inherits whatever color context it's placed in (CSS-driven, no assets).
const paths = {
  goat: "M4 14c0-3 2-5 4-6 1-2 3-3 4-3s3 1 4 3c2 1 4 3 4 6-1 3-3 5-4 6l-1 2h-6l-1-2c-1-1-3-3-4-6z M9 6l-2-3 M15 6l2-3",
  buffalo: "M4 10c1-2 3-3 4-3 1-1 3-2 4-2s3 1 4 2c1 0 3 1 4 3 1 2 0 4-1 5-1 2-2 3-4 3h-6c-2 0-3-1-4-3-1-1-2-3-1-5z M6 7l-3-1 M18 7l3-1",
  chicken: "M8 4c2 0 4 1 5 3 2 0 4 1 4 3 0 1-1 2-2 2 1 1 1 3 0 4-1 2-3 3-5 3-3 0-5-2-6-4-1-2-1-5 1-7 1-1 2-2 3-4z M9 3l1 2 M12 3l0 2",
  fish: "M3 12c3-4 8-6 12-4 2 1 4 3 5 4-1 1-3 3-5 4-4 2-9 0-12-4z M15 9l3-2 M15 15l3 2 M6 10.5a1 1 0 100 2 1 1 0 000-2z",
  spice: "M12 3c2 2 4 5 4 8a4 4 0 01-8 0c0-3 2-6 4-8z M8 20h8 M9 17h6",
  skewer: "M2 12h20 M6 8v8 M11 8v8 M16 8v8 M20 6l2 2-2 2",
  meat: "M6 6c4-2 9-1 11 2s1 8-3 10-9 1-11-2c-1-2-1-6 0-9z M7 16l-3 3",
  halal: "M12 3v18 M7 8a5 5 0 0010 0",
  fresh: "M12 3c1 3 4 5 4 9a4 4 0 01-8 0c0-4 3-6 4-9z",
  truck: "M2 8h11v8H2z M13 11h4l3 3v2h-7z M6 19a2 2 0 100-4 2 2 0 000 4z M17 19a2 2 0 100-4 2 2 0 000 4z",
  pin: "M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z M12 11.5a2 2 0 100-4 2 2 0 000 4z",
  phone: "M4 4c0 9 7 16 16 16l2-4-5-2-2 2c-2-1-4-3-5-5l2-2-2-5z",
  mail: "M3 6h18v12H3z M3 6l9 7 9-7",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l4 2",
  check: "M4 12l5 5L20 6",
};

export default function Icon({ name, size = 28, className = "" }) {
  const d = paths[name] || paths.meat;
  return (
    <svg
      className={`icon icon-${name} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}