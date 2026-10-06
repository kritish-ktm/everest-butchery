export const STORE_TIME_ZONE = "Europe/Copenhagen";
export function storeDate(date) {
  return new Intl.DateTimeFormat("en-DK", { timeZone: STORE_TIME_ZONE, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date);
}
export function storeTime(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: STORE_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}
export function weatherIcon(weather) {
  const id = weather.conditionId;
  if (id < 300) return "bi-cloud-lightning-rain";
  if (id < 600) return "bi-cloud-rain";
  if (id < 700) return "bi-cloud-snow";
  if (id < 800) return "bi-cloud-fog2";
  if (id === 800) return weather.isDay ? "bi-sun" : "bi-moon";
  return "bi-cloud";
}
