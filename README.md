# Everest Butchery — Website

## Structure
- `frontend/` — Vite + React customer site
- `backend/` — PHP REST API (products, categories, orders) + MySQL schema

## Setup (XAMPP)
1. Start Apache + MySQL in XAMPP.
2. Copy the `backend/` folder into `htdocs/everest-butchery/backend`.
3. Open phpMyAdmin → Import → select `backend/db/schema.sql`. This creates the `everest_butchery` database with sample products.
4. Check `backend/api/config.php` — defaults match a fresh XAMPP (`root` / no password). Edit if yours differs.
5. Test the API: `http://localhost/everest-butchery/backend/api/products.php` should return JSON.

## Setup (Frontend)
```
cd frontend
npm install
npm run dev
```
Opens at `http://localhost:5173`. It calls the API at `http://localhost/everest-butchery/backend/api` by default — change this in a `.env` file (`VITE_API_URL=...`) if needed.

If the API isn't reachable yet, the site still works using built-in sample data, so you can preview the design before XAMPP is set up.

## Next steps (not built yet)
- Admin dashboard (manage products, view/update orders)
- POS till interface (in-store sales — the `orders` table already supports `source: "pos"`)
- Payment integration (currently cash/card/MobilePay are recorded but not processed online)
