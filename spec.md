# Lycoris T-Shirts

## Current State

The app has a Motoko backend with basic Product and Order types, but the frontend ignores the backend for mutations. All product edits, order placements, order status updates, order deletions, and storefront (hero) config changes are saved to **localStorage only** — which means changes are invisible to other devices/browsers.

The current backend only has:
- `getAllProducts` / `getProduct` (query, read-only — these DO work)
- `addProduct` / `updateProduct` / `deleteProduct` — blocked by admin auth check (require AccessControl.isAdmin)
- `placeOrder` / `getAllOrders` — orders lack rich fields (no customer name, address, status, payment method, etc.)

The frontend Product type includes: id, name, description, price, sizes, sizePrices (per-size), imageUrl, images (multiple base64), category, inStock, stockLimit.

The frontend Order type includes: id (string), customerName, customerMobile, deliveryAddress, city, state, pincode, items (productId, productName, size, quantity, priceEach), totalPrice, paymentMethod (cod|online), status (Pending/Confirmed/Shipped/Delivered/Cancelled/Return Requested/Returned), timestamp, cancellationReason, returnReason, returnDescription.

The HeroConfig type includes: heroBadgeText, heroTitle, heroSubtitle, heroCtaLabel, heroBgImage (base64), logoImage (base64).

Reviews are stored in localStorage and in sessionStorage (reviewed tracking). Reviews do NOT need to be synced to backend in this iteration.

## Requested Changes (Diff)

### Add
- Full Product type in backend with all required fields: id, name, description, category, price (base Nat), sizePrices (as Text — JSON-encoded map), images (as Text — JSON-encoded array of base64/URLs), inStock, stockLimit (as ?Nat)
- Full Order type in backend with all fields: id (Text), customerName, customerMobile, deliveryAddress, city, state, pincode, items (JSON-encoded Text), totalPrice (Nat), paymentMethod (Text), status (Text), timestamp (Int), cancellationReason (opt Text), returnReason (opt Text), returnDescription (opt Text)
- HeroConfig type in backend: heroBadgeText, heroTitle, heroSubtitle, heroCtaLabel, heroBgImage (Text), logoImage (Text)
- Backend functions: addProduct, updateProduct, deleteProduct — open (no auth check), caller can be anyone
- Backend functions: placeOrder (no auth), getAllOrders (no auth), updateOrderStatus, cancelOrder, deleteOrder, clearAllOrders, requestReturn
- Backend functions: getStorefront, updateStorefront
- Backend counter for generating unique order IDs (e.g. "LYC-00001")

### Modify
- ProductsContext: addProduct, updateProduct, deleteProduct now call backend APIs; product list is fetched fresh from backend after every mutation
- OrdersContext: addOrder, updateOrderStatus, cancelOrder, requestReturn, deleteOrder, clearAllOrders all call backend APIs; orders fetched fresh from backend on mount and after mutations
- HeroConfigContext: updateHeroConfig and resetToDefault call backend APIs; config loaded from backend on mount
- Remove all localStorage read/write for products, orders, and storefront config

### Remove
- All localStorage usage for products (LS_PRODUCTS, LS_DELETED keys)
- All localStorage usage for orders (LS_ORDERS key)
- All localStorage usage for storefront config (LS_STOREFRONT key)
- OldBackendInterface workaround and related mapping code
- Merge/deleted-ids logic for products

## Implementation Plan

1. **Rewrite `src/backend/main.mo`** with complete types and all CRUD functions for products, orders, and storefront config. Remove admin-only auth on mutations — all mutations are open (admin panel uses local password only). Keep Authorization mixin for future use but do not gate any functions.

2. **Regenerate backend bindings** via `generate_motoko_code` so `backend.d.ts` reflects the new API surface.

3. **Rewrite `ProductsContext.tsx`**:
   - On mount: call `actor.getAllProducts()` and map to frontend Product type (parse sizePrices/images from JSON strings)
   - `addProduct`: call `actor.addProduct(...)`, re-fetch all products
   - `updateProduct`: call `actor.updateProduct(...)`, re-fetch
   - `deleteProduct`: call `actor.deleteProduct(id)`, re-fetch
   - Remove all localStorage usage, remove merge/deleted logic

4. **Rewrite `OrdersContext.tsx`**:
   - On mount: call `actor.getAllOrders()` and map to frontend Order type
   - `addOrder`: call `actor.placeOrder(...)`, re-fetch
   - `updateOrderStatus`: call `actor.updateOrderStatus(id, status)`, re-fetch
   - `cancelOrder`: call `actor.cancelOrder(id, reason)`, re-fetch
   - `requestReturn`: call `actor.requestReturn(id, reason, description)`, re-fetch
   - `deleteOrder`: call `actor.deleteOrder(id)`, re-fetch
   - `clearAllOrders`: call `actor.clearAllOrders()`, re-fetch
   - Remove all localStorage usage

5. **Rewrite `HeroConfigContext.tsx`**:
   - On mount: call `actor.getStorefront()`, use returned values (or defaults if not set)
   - `updateHeroConfig`: call `actor.updateStorefront(...)`, re-fetch
   - `resetToDefault`: call `actor.updateStorefront(defaults)`, update state
   - Remove all localStorage usage
