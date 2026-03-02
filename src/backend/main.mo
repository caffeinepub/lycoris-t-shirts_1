import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
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
    size : Text;
    quantity : Nat;
  };

  public type Order = {
    id : Nat;
    items : [OrderItem];
    totalPrice : Nat;
    note : Text;
  };

  // ─── State ────────────────────────────────────────────────────────────────

  var nextProductId : Nat = 1;
  var nextOrderId : Nat = 1;
  let productsMap = Map.empty<Nat, Product>();
  let ordersMap = Map.empty<Nat, Order>();
  var seeded : Bool = false;

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

  seedProducts();

  // ─── Product Queries ──────────────────────────────────────────────────────

  public query func getAllProducts() : async [Product] {
    Array.fromIter(productsMap.values())
  };

  public query func getProduct(id : Nat) : async ?Product {
    productsMap.get(id)
  };

  // ─── Product Mutations (admin only) ──────────────────────────────────────

  public shared ({ caller }) func addProduct(
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    imageUrl : Text,
    category : Text,
    inStock : Bool,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    let id = nextProductId;
    nextProductId += 1;
    let p : Product = { id; name; description; price; sizes; imageUrl; category; inStock };
    productsMap.add(id, p);
    id
  };

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    imageUrl : Text,
    category : Text,
    inStock : Bool,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (productsMap.get(id)) {
      case (null) { false };
      case (?_) {
        let p : Product = { id; name; description; price; sizes; imageUrl; category; inStock };
        productsMap.add(id, p);
        true
      };
    }
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (productsMap.get(id)) {
      case (null) { false };
      case (?_) { productsMap.remove(id); true };
    }
  };

  // ─── Orders ───────────────────────────────────────────────────────────────

  public shared func placeOrder(items : [OrderItem], totalPrice : Nat, note : Text) : async Nat {
    let id = nextOrderId;
    nextOrderId += 1;
    let o : Order = { id; items; totalPrice; note };
    ordersMap.add(id, o);
    id
  };

  public shared ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    Array.fromIter(ordersMap.values())
  };
};
