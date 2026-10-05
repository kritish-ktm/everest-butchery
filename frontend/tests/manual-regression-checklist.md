# Everest Butchery manual regression checklist

Use a local build or staging deployment with test data. Do not submit a real customer order, change live product data, or test recovery using another person's account. Each HTML comment below describes the reason for a check or what to observe.

## Before testing

1. Start the frontend with `npm run dev` from `frontend/`, or preview a successful build with `npm run preview`.
2. Confirm the required Vite Supabase URL and publishable/anon key are configured for the test environment. Never put a Supabase service-role key in a `VITE_` variable.
3. Use a test customer account and a staging/test backend if available. The order form writes to the configured API/database.

## Public pages and navigation

- [ ] Open `/`, `/menu`, `/about`, `/contact`, `/cart`, and `/dashain-offers`; confirm each route renders and the header/footer links work.
  <!-- Direct-route loads also exercise Vercel's SPA rewrite. -->
- [ ] Open Privacy Notice, Terms and Conditions, and GDPR Rights from the footer; follow the links between these pages and Contact.
  <!-- Legal routes should remain readable when loaded directly or refreshed. -->
- [ ] Check legal copy for broken links, missing text, placeholder business/CVR details, and consistency with the live checkout and data providers.
- [ ] Resize to 320px wide and test browser zoom at 200% and 400%; verify content reflows without horizontal page scrolling, clipped text, or overlapping controls.
- [ ] Keyboard-tab through the header, main content, and footer. Confirm focus is visible and links/buttons have understandable accessible names.
- [ ] Confirm page title, description, canonical URL, and robots metadata update on public routes. Confirm account, checkout, cart, and admin routes use `noindex`.

## Menu and cart

- [ ] Search for a known product, clear the search, and try available category/filter controls.
- [ ] Add an item; verify the cart count and subtotal. Increase/decrease quantity, remove an item, and empty the cart.
- [ ] Refresh while an item is in the cart; verify expected session persistence, then close/reopen the browser session and confirm the cart clears if session storage is used.
- [ ] Check long product names, unavailable products, empty search results, and narrow-screen layouts.

## Account and authentication

- [ ] Create a test account with valid details; inspect the confirmation message and complete email confirmation if enabled.
- [ ] Sign in with email/password, refresh, and verify the session remains active. Check account name/email display and profile-name update.
- [ ] Sign out; verify protected account state is gone and sign-in is required again.
- [ ] Test Google sign-in with the configured OAuth test account, including cancellation and provider error states.
- [ ] Request a password recovery email using a test account; confirm its link returns to the deployed test domain, not `localhost`, and follow the complete reset flow.
- [ ] Try an unconfirmed/invalid account where available; checkout must not proceed without an authenticated session.

## Checkout and orders

- [ ] With items in cart and signed out, open checkout. Confirm sign-in is required and the cart survives authentication.
- [ ] Sign in; verify customer name/email are prefilled where available. Try pickup and delivery and confirm the delivery fee appears only for delivery.
- [ ] Check required name/phone, required delivery address, optional fields, payment choices, requested time and notes.
- [ ] Leave the Terms checkbox unchecked; confirm Place Order is unavailable. Open the Terms and Privacy links in turn.
- [ ] In staging only, check Terms, submit one clearly identified test order, and verify the confirmation page, order reference, totals, and backend record. Repeat API failure/timeout if the test environment supports it; the cart should not be cleared on failure.
- [ ] Verify the confirmation and shop's follow-up wording do not imply online payment or guaranteed acceptance before the shop confirms.

## Admin (staging only)

- [ ] Open `/admin` while signed out and confirm it redirects to admin login.
- [ ] Sign in with the designated test admin only. Verify product/order views, status updates, and image upload if configured; confirm unauthorized users cannot perform admin API actions.
- [ ] Sign out and verify `/admin` is guarded again. UI hiding alone is not a security test; check backend authorization too.

## Dashain campaign and production check

- [ ] Test booking, validation, score/leaderboard, and reset behavior only against test data; confirm what player name and optional phone are publicly displayed.
- [ ] On the deployed site, inspect the game API request. Current source contains a `http://localhost/everest-butchery/backend/api/langur_burja.php` URL; replace/configure this backend before claiming the game works in production.
- [ ] Check the campaign reset date and leaderboard-retention behavior against the published campaign terms and Privacy Notice.
