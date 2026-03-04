# Lycoris T-Shirts

## Current State
- ProductDetailPage has an "Add to Cart" button but no "Place Order" (Buy Now) button
- CartSheet shows "Proceed to Checkout" and cart totals, with no free delivery threshold message
- CheckoutPage shows "Free delivery on all orders" without any condition (no Rs 499 threshold)
- MyOrdersPage shows orders with Cancel option; no return/refund request option after delivery
- OrdersContext has order statuses: Pending, Confirmed, Shipped, Delivered, Cancelled -- no "Return Requested" or "Returned" status
- Trust badges in CheckoutPage sidebar say "Easy 30-Day Returns" (incorrect -- should be 7 days)

## Requested Changes (Diff)

### Add
- **Free delivery threshold**: Show "Free delivery on orders above Rs 499" messaging on the cart sheet. If cart total is below Rs 499, show a delivery charge (e.g. Rs 49) and show how much more to spend for free delivery. At Rs 499+, free delivery applies.
- **"Place Order" (Buy Now) button** on ProductDetailPage, placed directly below the "Add to Cart" button. Clicking it adds the item to cart and immediately navigates to checkout.
- **7-day return policy** messaging: Update all return-related text from "30 days" to "7 days" across the app (CheckoutPage trust badges, any other mentions).
- **Return/Refund request option** on MyOrdersPage: For orders with status "Delivered", show a "Request Return" button. Clicking it opens a dialog where the customer can select a return reason and submit. The order status changes to "Return Requested".
- Add "Return Requested" and "Returned" to the OrderStatus type in OrdersContext.
- Admin panel Orders tab should show "Return Requested" status and allow admin to approve (change status to "Returned") or reject (change back to "Delivered" with a note).

### Modify
- **CartSheet**: Update delivery charge logic -- if cartTotal < 499, show Rs 49 delivery fee and add it to the total. If cartTotal >= 499, show FREE. Show a small info bar: "Add Rs X more for free delivery" when below threshold.
- **CheckoutPage**: Update delivery charge logic to match cart (Rs 49 if below Rs 499, FREE if >= Rs 499). Update trust badge from "30-Day Returns" to "7-Day Returns". Update the delivery info banner text to mention Rs 499 threshold.
- **MyOrdersPage**: Add "Request Return" button for Delivered orders. Add return request dialog with reason options (Wrong size, Damaged product, Not as described, Changed mind, Other) and optional description. Add `requestReturn` function to OrdersContext.
- **OrdersContext**: Add "Return Requested" and "Returned" to OrderStatus type. Add `requestReturn(id, reason, description)` method.
- **ProductDetailPage**: Add "Place Order" button below "Add to Cart". It should validate size selection, add to cart, then trigger navigation to checkout (via a new `onBuyNow` prop).

### Remove
- Nothing removed.

## Implementation Plan
1. Update `OrdersContext.tsx`: Add "Return Requested" | "Returned" to OrderStatus, add `requestReturn` method.
2. Update `ProductDetailPage.tsx`: Add `onBuyNow` prop, add "Place Order" button below "Add to Cart" that validates size, adds to cart, and calls `onBuyNow`.
3. Update `CartSheet.tsx`: Add free delivery threshold logic (Rs 49 fee if < Rs 499, FREE if >= Rs 499), show "Add Rs X more for free delivery" progress hint.
4. Update `CheckoutPage.tsx`: Match delivery charge logic (Rs 49 or FREE), update "30-Day" -> "7-Day" returns text, update delivery info banner.
5. Update `MyOrdersPage.tsx`: Add `statusColor`/`statusIcon` for new statuses, add "Request Return" button for Delivered orders, add return request dialog with reason dropdown.
6. Update `App.tsx` or wherever ProductDetailPage is rendered to pass the `onBuyNow` prop wired to navigate to checkout.
7. Update `AdminPage.tsx` Orders tab to handle "Return Requested" status -- allow admin to approve (-> "Returned") or reject (-> "Delivered").
