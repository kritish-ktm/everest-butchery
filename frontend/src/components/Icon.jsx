const iconNames = {
  goat: "bi-egg-fried",
  buffalo: "bi-box-seam",
  chicken: "bi-egg",
  fish: "bi-droplet",
  spice: "bi-flower1",
  skewer: "bi-grip-horizontal",
  meat: "bi-egg-fried",
  halal: "bi-shield-check",
  fresh: "bi-droplet-half",
  truck: "bi-truck",
  pin: "bi-geo-alt",
  phone: "bi-telephone",
  mail: "bi-envelope",
  clock: "bi-clock",
  check: "bi-check2",
  gift: "bi-gift",
  trophy: "bi-trophy",
  info: "bi-info-circle",
  sparkles: "bi-stars",
};

export default function Icon({ name, size = 28, className = "" }) {
  const icon = iconNames[name] || iconNames.meat;
  return <i className={`icon bi ${icon} ${className}`} style={{ fontSize: size }} aria-hidden="true" />;
}