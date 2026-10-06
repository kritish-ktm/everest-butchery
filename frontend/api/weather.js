import { createWeatherService } from "../server/weather.js";

const weather = createWeatherService();
export function GET(request) { return weather(request); }
