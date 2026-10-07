import { createOrderService } from '../server/orders.js';

const orders = createOrderService();
export function POST(request) { return orders(request); }
export function GET(request) { return orders(request); }
