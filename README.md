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

1. Create a Supabase project and run `supabase/schema.sql`, then `supabase/stock_tracking.sql` in its SQL Editor. This creates the tables, sample menu, access policies, product image bucket, secure order creation function, and inventory tracking.
2. In Supabase Authentication, create an admin user, then set that user's **app metadata** to `{ "role": "admin" }`. Never set this in user-editable metadata. Enable Google as a provider only if checkout Google sign-in is needed.
3. In Vercel, import this repository and set the Root Directory to `frontend`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase project settings. These are public client values; do not add a service-role key.
4. Add the production Vercel URL to Supabase Auth's allowed redirect URLs and to the Google OAuth authorized origins if using Google sign-in. Deploy.

### Dashain game on Vercel

The Langur Burja game uses a Vercel Function at `frontend/api/langur-burja.js`; it does not call the local XAMPP PHP API. Run `supabase/langur_burja.sql` once in the Supabase SQL Editor to create the RLS-protected game table and server-only game action function. Then add `SUPABASE_SERVER_KEY` to the Vercel project's **Production** and **Preview** environment variables using a Supabase secret/service-role key. Keep this value server-only: never prefix it with `VITE_`, put it in frontend `.env`, or commit it. `VITE_SUPABASE_URL` is already the public project URL used by the site. Redeploy after setting the variable. Use `vercel dev` from `frontend/` to test the Vercel Function locally; plain `npm run dev` only starts Vite and does not execute `/api` functions.

## Google Search

Set `VITE_SITE_URL` in Vercel to the canonical public domain (`https://everestbutchery.dk` once its DNS/domain is connected). The production build generates `robots.txt` and `sitemap.xml`, and adds page titles, descriptions, canonical URLs, social previews, and local business structured data. After the site is live, add the domain as a URL-prefix property in Google Search Console, verify it with the HTML tag method, then set the tag's token as `VITE_GOOGLE_SITE_VERIFICATION` in Vercel and redeploy. Submit `https://everestbutchery.dk/sitemap.xml` in Search Console. Add/claim the shop in Google Business Profile separately to appear as a local business listing; website metadata alone does not guarantee search placement.

For local Supabase development, copy `frontend/.env.example` to `frontend/.env.local` and fill in the Supabase values. Remove/omit `VITE_API_URL` when using Supabase. To continue using XAMPP, leave the Supabase values unset.

The old PHP/MySQL backend remains for XAMPP. Vercel hosts the frontend; Supabase provides its database, authentication, and image storage.

Customer accounts use Supabase Auth. Add both the local and production `/account` URLs to Supabase Authentication's allowed redirect URLs. To enable Google login, configure Google under Supabase Authentication providers, set `VITE_GOOGLE_CLIENT_ID` in local and Vercel environments, and register the local and deployed site origins in Google OAuth. The Google OAuth client secret belongs only in Supabase, never in Vite environment variables.

Checkout requires a Supabase-authenticated customer. If the schema was already installed before this requirement was added, run `supabase/require_authenticated_checkout.sql` once in the Supabase SQL Editor. Existing signed-in customers continue directly to checkout; other customers sign in first.

## Cookie And Storage Choices

The customer notice provides equal Accept optional and Reject optional controls, with Cookie settings in the footer to change the choice. The only new optional storage remembers the menu sort order; it is neither read nor written before acceptance. Rejection removes that preference without removing login or basket data. The consent record lasts up to 180 days and is versioned; new tracking purposes must require fresh consent rather than reusing this preference consent. Browser-storage blocking leaves the notice usable for the current visit.

This does not migrate Supabase browser authentication to server-issued session cookies and does not add analytics or advertising. HttpOnly session cookies would require a separate server-auth architecture change. Review external sign-in, font, and icon providers and the legal notice before claiming comprehensive cookie compliance.

## Customer Weather And Time

Customer pages show the Copenhagen date and clock, plus store-area readings from OpenWeather. Admin weather uses the same endpoint. Readings are cached for 15 minutes and include their observation timestamp; they are regional weather data, not a sensor reading inside the store.

Set `OPENWEATHER_API_KEY` as a server-only Secret in Vercel Project Settings > Environment Variables for Production (and Preview if needed), then redeploy. Do not use a `VITE_` prefix. For local development, put the key in the gitignored `frontend/.env.local`; the Vite server includes a local `/api/weather` handler. Missing or inactive keys display "Weather unavailable" rather than sample readings. Rotate any key shared in chat.

Run weather/time regression tests with `node --test tests/weather.test.js` from `frontend`.

## Storefront Verification

Run `npm test`, `npm run lint`, `npm run build`, and `npm run check:build` from `frontend`. GitHub Actions runs these checks on pushes and pull requests. The build budget checks initial JavaScript and the responsive storefront WebP sizes; it is not a substitute for measuring real Core Web Vitals.

Secondary pages, including admin code and styles, load on demand. The storefront photo uses responsive WebP with the original JPEG as a fallback. Checkout blocks repeat submissions while pending, retains the cart on errors, and keeps a minimal confirmation reference and total in session storage for up to 24 hours. It does not persist customer contact details in the receipt. Server-side idempotency is still needed to deduplicate retries after a lost successful response.

For browser checks without real orders, open `http://127.0.0.1:5173/tests/checkout-preview.html` during local development. This dev-only fixture uses mock authentication and a mock order API, supports simulated stock errors, and is not bundled into the production app. Never use it as proof that production authentication or database writes work.

## Inventory Management

Open `/admin` and choose Inventory to enter each product's available quantity and full-stock reference, using that product's unit (kg, pack, or piece). A 100 kg reference shows Stock good at 50 kg or more, Stock running low below 50 kg, and Limited stock available below 20 kg. Zero stock is sold out. Products without quantities remain untracked; existing stock is never guessed.

Stock is reserved atomically when an order is placed. Cancellation returns reserved quantities once; reopening reserves them again and can fail if stock is insufficient. Updating a product's name or price never overwrites remaining stock. Inventory edits reject stale quantities, and the admin view refreshes inventory every 30 seconds while visible and when the window regains focus.

The `product_stock_tracking` migration was applied to the connected Supabase project on 2026-10-06. For another existing Supabase project, apply `supabase/stock_tracking.sql` once. For an existing MySQL installation, import `backend/db/stock_tracking.sql` once before running the updated PHP API; fresh MySQL installations already include these columns in `backend/db/schema.sql`.

Run `node --test tests/inventory.test.js` from `frontend` for threshold and profile tests. `supabase/tests/stock_tracking.sql` tests database reservations, cancellation, overselling, stale edits, and admin authorization inside a rolled-back transaction. The dev-only `/tests/admin-preview.html` uses mock data for responsive layout checks; it is not part of the production build.
