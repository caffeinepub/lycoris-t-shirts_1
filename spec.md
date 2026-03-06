# Lycoris T-Shirts

## Current State
Full e-commerce store for Lycoris T-Shirts brand with:
- Product catalog with per-size pricing, multiple images, stock limits
- Shopping cart with size selection
- Flipkart/Amazon-style checkout (delivery address, COD/online payment)
- Order management for customers (My Orders, cancel, return requests)
- Admin panel with Products, Orders, and Storefront tabs
- Products: add/edit/delete with drag-drop image upload, size+price table
- Orders: view full details, update status, cancel, delete, clear all
- Storefront: customize hero banner text/image, logo
- Reviews per product (1-5 stars + comment)
- Free delivery over Rs 499 (Rs 49 below), 7-day returns
- All data synced across devices via backend canister

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend main.mo: Rewrite to match the full frontend API signatures (fix the mismatch that causes "failed to add product")
  - Product type needs: id, name, description, category, sizes[], sizePricesKeys[], sizePricesVals[], images[], inStock, stockLimit (optional Nat)
  - addProduct/updateProduct must accept these new fields, no auth checks blocking calls
  - Order type needs: orderId (Text), customerName, customerMobile, deliveryAddress, city, state, pincode, items (with productName+priceEach), totalPrice, paymentMethod, status, timestamp, cancellationReason, returnReason, returnDescription
  - placeOrder, getAllOrders, updateOrderStatus, cancelOrder, requestReturn, deleteOrder, clearAllOrders
  - Storefront config: getStorefrontConfig / updateStorefrontConfig

### Remove
- Authorization checks on product mutations (addProduct, updateProduct, deleteProduct are blocked by isAdmin check causing the failure)

## Implementation Plan
1. Rewrite backend main.mo with correct Product/Order/Storefront types and all required functions without auth guards on mutations
2. Update backend.d.ts to expose all these methods to the frontend TypeScript layer
