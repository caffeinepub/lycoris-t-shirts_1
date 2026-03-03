import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {

  // ─── Authorization ────────────────────────────────────────────────────────

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─── Types ────────────────────────────────────────────────────────────────

  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    sizes : [Text];
    imageUrl : Text;
    category : Text;
    inStock : Bool;
  };

  public type OrderItem = {
    productId : Nat;
    productName : Text;
    size : Text;
    quantity : Nat;
    price : Nat;
  };

  public type Order = {
    id : Nat;
    customerName : Text;
    customerMobile : Text;
    customerAddress : Text;
    items : [OrderItem];
    totalPrice : Nat;
    paymentMethod : Text;
    status : Text;
    note : Text;
    timestamp : Int;
  };

  // ─── Legacy order type (matches the previously-deployed stable schema) ─────

  type LegacyOrderItem = {
    productId : Nat;
    size : Text;
    quantity : Nat;
  };

  type LegacyOrder = {
    id : Nat;
    items : [LegacyOrderItem];
    totalPrice : Nat;
    note : Text;
  };

  // ─── State ────────────────────────────────────────────────────────────────

  var nextProductId : Nat = 1;
  var nextOrderId : Nat = 1;
  let productsMap = Map.empty<Nat, Product>();

  // Keep old orders map under the legacy schema so upgrade is compatible
  let ordersMap = Map.empty<Nat, LegacyOrder>();

  // New orders stored in a separate map with the full schema
  let newOrdersMap = Map.empty<Nat, Order>();

  var seeded : Bool = false;
  var ordersMigrated : Bool = false;

  // ─── Seed ─────────────────────────────────────────────────────────────────

  func seedProducts() {
    if (seeded) return;
    let p1 : Product = { id = 1; name = "Classic Black Tee"; description = "A timeless black t-shirt crafted from premium 100% cotton."; price = 2999; sizes = ["XS", "S", "M", "L", "XL", "XXL"]; imageUrl = ""; category = "Basics"; inStock = true };
    let p2 : Product = { id = 2; name = "Lycoris Bloom Graphic Tee"; description = "Featuring a hand-drawn lycoris flower print on a soft white background."; price = 3499; sizes = ["S", "M", "L", "XL"]; imageUrl = ""; category = "Graphic"; inStock = true };
    let p3 : Product = { id = 3; name = "Vintage Washed Crew"; description = "Stone-washed for a lived-in feel. Relaxed fit with a slightly oversized silhouette."; price = 3999; sizes = ["XS", "S", "M", "L", "XL"]; imageUrl = ""; category = "Vintage"; inStock = true };
    let p4 : Product = { id = 4; name = "Midnight Navy Essential"; description = "A deep navy essential tee with a clean minimal look."; price = 2799; sizes = ["S", "M", "L", "XL", "XXL"]; imageUrl = ""; category = "Basics"; inStock = true };
    productsMap.add(1, p1);
    productsMap.add(2, p2);
    productsMap.add(3, p3);
    productsMap.add(4, p4);
    nextProductId := 5;
    seeded := true;
  };

  // ─── Migrate legacy orders into newOrdersMap ──────────────────────────────

  func upgradeLegacyItem(li : LegacyOrderItem) : OrderItem {
    {
      productId = li.productId;
      productName = "";
      size = li.size;
      quantity = li.quantity;
      price = 0;
    }
  };

  func migrateOrders() {
    if (ordersMigrated) return;
    for ((id, lo) in ordersMap.entries()) {
      switch (newOrdersMap.get(id)) {
        case (?_) {};
        case (null) {
          let upgradedItems = lo.items.map(upgradeLegacyItem);
          let upgraded : Order = {
            id = lo.id;
            customerName = "Unknown";
            customerMobile = "";
            customerAddress = "";
            items = upgradedItems;
            totalPrice = lo.totalPrice;
            paymentMethod = "cod";
            status = "Pending";
            note = lo.note;
            timestamp = 0;
          };
          newOrdersMap.add(id, upgraded);
          if (id >= nextOrderId) {
            nextOrderId := id + 1;
          };
        };
      };
    };
    ordersMigrated := true;
  };

  seedProducts();
  migrateOrders();

  // ─── Product Queries ──────────────────────────────────────────────────────

  public query func getAllProducts() : async [Product] {
    Array.fromIter(productsMap.values())
  };

  public query func getProduct(id : Nat) : async ?Product {
    productsMap.get(id)
  };

  // ─── Product Mutations (open — protected by frontend password) ────────────

  public shared func addProduct(
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    imageUrl : Text,
    category : Text,
    inStock : Bool,
  ) : async Nat {
    let id = nextProductId;
    nextProductId += 1;
    let p : Product = { id; name; description; price; sizes; imageUrl; category; inStock };
    productsMap.add(id, p);
    id
  };

  public shared func updateProduct(
    id : Nat,
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    imageUrl : Text,
    category : Text,
    inStock : Bool,
  ) : async Bool {
    switch (productsMap.get(id)) {
      case (null) { false };
      case (?_) {
        let p : Product = { id; name; description; price; sizes; imageUrl; category; inStock };
        productsMap.add(id, p);
        true
      };
    }
  };

  public shared func deleteProduct(id : Nat) : async Bool {
    switch (productsMap.get(id)) {
      case (null) { false };
      case (?_) { productsMap.remove(id); true };
    }
  };

  // ─── Orders ───────────────────────────────────────────────────────────────

  public shared func placeOrder(
    customerName : Text,
    customerMobile : Text,
    customerAddress : Text,
    items : [OrderItem],
    totalPrice : Nat,
    paymentMethod : Text,
    note : Text,
    timestamp : Int,
  ) : async Nat {
    let id = nextOrderId;
    nextOrderId += 1;
    let o : Order = {
      id;
      customerName;
      customerMobile;
      customerAddress;
      items;
      totalPrice;
      paymentMethod;
      status = "Pending";
      note;
      timestamp;
    };
    newOrdersMap.add(id, o);
    id
  };

  public shared func getAllOrders() : async [Order] {
    Array.fromIter(newOrdersMap.values())
  };

  public shared func updateOrderStatus(id : Nat, status : Text) : async Bool {
    switch (newOrdersMap.get(id)) {
      case (null) { false };
      case (?o) {
        let updated : Order = {
          id = o.id;
          customerName = o.customerName;
          customerMobile = o.customerMobile;
          customerAddress = o.customerAddress;
          items = o.items;
          totalPrice = o.totalPrice;
          paymentMethod = o.paymentMethod;
          status;
          note = o.note;
          timestamp = o.timestamp;
        };
        newOrdersMap.add(id, updated);
        true
      };
    }
  };
};
