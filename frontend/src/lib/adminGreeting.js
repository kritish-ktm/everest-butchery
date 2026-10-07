import { STORE_TIME_ZONE } from "./storeTime.js";

export function timeGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(date));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function weatherGreeting(weather) {
  if (!weather || !Number.isFinite(weather.temperature)) return "";
  const id = weather.conditionId;
  const cold = (weather.feelsLike ?? weather.temperature) <= 5;
  if (id >= 200 && id < 300) return "Stormy weather today. Take care on your way to the store.";
  if (id >= 300 && id < 600) return cold
    ? "It's raining and cold today. Keep warm and take care!"
    : "It's raining today. Bring an umbrella and take care!";
  if (id >= 600 && id < 700) return "It's snowy today. Keep warm and take care!";
  if (cold) return "It's cold today. Keep warm and take care!";
  if ((weather.feelsLike ?? weather.temperature) >= 28) return "It's warm today. Stay cool and take care!";
  if (id === 800) return weather.isDay
    ? "It's sunny today. Hope your day is off to a bright start!"
    : "Clear skies this evening. Have a lovely evening!";
  if (id > 800) return "It's cloudy today. Wishing you a good day at the store!";
  if (id >= 700 && id < 800) return "Visibility may be low today. Take care on your way to the store.";
  return "Hope you have a good day at the store!";
}
