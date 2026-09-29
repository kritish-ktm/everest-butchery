# Everest Butchery - Website

## Structure
- `frontend/` - Vite + React customer site
- `backend/` - PHP REST API (products, categories, orders) + MySQL schema

## Setup (XAMPP)
1. Start Apache + MySQL in XAMPP.
2. Copy the `backend/` folder into `htdocs/everest-butchery/backend`.
3. Open phpMyAdmin → Import → select `backend/db/schema.sql`. This creates the `everest_butchery` database with sample products.
4. Check `backend/api/config.php` - defaults match a fresh XAMPP (`root` / no password). Edit if yours differs.
5. Test the API: `http://localhost/everest-butchery/backend/api/products.php` should return JSON.

## Setup (Frontend)
```
cd frontend
npm install
npm run dev
```
Opens at `http://localhost:5173`. It calls the API at `http://localhost/everest-butchery/backend/api` by default - change this in a `.env` file (`VITE_API_URL=...`) if needed.

If the API isn't reachable yet, the site still works using built-in sample data, so you can preview the design before XAMPP is set up.

## Deploy on Vercel with Supabase

The React storefront can run on Vercel. Its Supabase data adapter replaces the PHP API when both Supabase variables are configured; without them, local development continues to use the XAMPP PHP API.

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. This creates the tables, sample menu, access policies, product image bucket, and secure order creation function.
2. In Supabase Authentication, create an admin user, then set that user's **app metadata** to `{ "role": "admin" }`. Never set this in user-editable metadata. Enable Google as a provider only if checkout Google sign-in is needed.
3. In Vercel, import this repository and set the Root Directory to `frontend`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase project settings. These are public client values; do not add a service-role key.
4. Add the production Vercel URL to Supabase Auth's allowed redirect URLs and to the Google OAuth authorized origins if using Google sign-in. Deploy.

For local Supabase development, copy `frontend/.env.example` to `frontend/.env.local` and fill in the Supabase values. Remove/omit `VITE_API_URL` when using Supabase. To continue using XAMPP, leave the Supabase values unset.

The old PHP/MySQL backend remains for XAMPP. Vercel hosts the frontend; Supabase provides its database, authentication, and image storage.
