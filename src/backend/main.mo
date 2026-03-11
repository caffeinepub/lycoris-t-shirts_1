import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {

  // ─── LEGACY STABLE VARS (kept for upgrade compatibility) ──────────────────
  // These must stay with their original names and types to avoid M0169/M0170

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  stable var nextOrderId : Nat = 1; // legacy, unused in v2

  // Old Product type (v1 - no images/sizePricesJson/stockLimit fields)
  type OldProduct = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    sizes : [Text];
    imageUrl : Text;
    category : Text;
    inStock : Bool;
  };

  // Old Order types (v1 - Nat key, minimal fields)
  type OldOrderItem = { productId : Nat; size : Text; quantity : Nat };
  type OldOrder = { id : Nat; items : [OldOrderItem]; totalPrice : Nat; note : Text };

  // Old maps kept with ORIGINAL types so stable memory is compatible
  let productsMap = Map.empty<Nat, OldProduct>();
  let ordersMap = Map.empty<Nat, OldOrder>();

  var seeded : Bool = false;

  // ─── NEW TYPES ─────────────────────────────────────────────────────────────────

  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    sizes : [Text];
    sizePricesJson : Text;
    imageUrl : Text;
    images : [Text];
    category : Text;
    inStock : Bool;
    stockLimit : ?Nat;
  };

  public type OrderItem = {
    productId : Nat;
    productName : Text;
    size : Text;
    quantity : Nat;
    priceEach : Nat;
  };

  public type Order = {
    id : Text;
    customerName : Text;
    customerMobile : Text;
    deliveryAddress : Text;
    city : Text;
    state : Text;
    pincode : Text;
    items : [OrderItem];
    totalPrice : Nat;
    paymentMethod : Text;
    status : Text;
    timestamp : Int;
    cancellationReason : Text;
    returnReason : Text;
    returnDescription : Text;
  };

  public type HeroConfig = {
    heroBadgeText : Text;
    heroTitle : Text;
    heroSubtitle : Text;
    heroCtaLabel : Text;
    heroBgImage : Text;
    logoImage : Text;
  };

  // ─── NEW STATE ────────────────────────────────────────────────────────────────

  var nextProductId : Nat = 1;
  let productsStore = Map.empty<Nat, Product>();
  let ordersStore = Map.empty<Text, Order>();
  stable var _migrationDone : Bool = false;

  var heroConfig : HeroConfig = {
    heroBadgeText = "New Collection 2026";
    heroTitle = "Wear the\nBloom";
    heroSubtitle = "Premium tees inspired by the ephemeral beauty of the lycoris flower.";
    heroCtaLabel = "Shop Now";
    heroBgImage = "";
    logoImage = "";
  };

  // ─── Migration (runs once on upgrade) ──────────────────────────────────

  system func postupgrade() {
    if (not _migrationDone) {
      // Migrate old products (v1 format → v2 format)
      for ((_, op) in productsMap.entries()) {
        let p : Product = {
          id = op.id;
          name = op.name;
          description = op.description;
          price = op.price;
          sizes = op.sizes;
          sizePricesJson = "{}";
          imageUrl = op.imageUrl;
          images = [];
          category = op.category;
          inStock = op.inStock;
          stockLimit = null;
        };
        productsStore.add(op.id, p);
        if (op.id >= nextProductId) {
          nextProductId := op.id + 1;
        };
      };
      // Old orders (Nat-keyed, minimal fields) are discarded —
      // they were stored locally in browser anyway and never synced.
      if (productsStore.size() == 0) {
        seeded := false;
        seedProducts();
      };
      _migrationDone := true;
    };
  };

  // ─── Seed ─────────────────────────────────────────────────────────────────

  func seedProducts() {
    if (seeded) return;
    let p1 : Product = {
      id = 1; name = "Classic Black Tee";
      description = "A timeless black t-shirt crafted from premium 100% cotton.";
      price = 2999; sizes = ["XS","S","M","L","XL","XXL"];
      sizePricesJson = "{\"XS\":2999,\"S\":2999,\"M\":2999,\"L\":2999,\"XL\":2999,\"XXL\":2999}";
      imageUrl = ""; images = []; category = "Basics"; inStock = true; stockLimit = null;
    };
    let p2 : Product = {
      id = 2; name = "Lycoris Bloom Graphic Tee";
      description = "Featuring a hand-drawn lycoris flower print on a soft white background.";
      price = 3499; sizes = ["S","M","L","XL"];
      sizePricesJson = "{\"S\":3499,\"M\":3499,\"L\":3499,\"XL\":3499}";
      imageUrl = ""; images = []; category = "Graphic"; inStock = true; stockLimit = null;
    };
    let p3 : Product = {
      id = 3; name = "Vintage Washed Crew";
      description = "Stone-washed for a lived-in feel. Relaxed fit with a slightly oversized silhouette.";
      price = 3999; sizes = ["XS","S","M","L","XL"];
      sizePricesJson = "{\"XS\":3999,\"S\":3999,\"M\":3999,\"L\":3999,\"XL\":3999}";
      imageUrl = ""; images = []; category = "Vintage"; inStock = true; stockLimit = null;
    };
    let p4 : Product = {
      id = 4; name = "Midnight Navy Essential";
      description = "A deep navy essential tee with a clean minimal look.";
      price = 2799; sizes = ["S","M","L","XL","XXL"];
      sizePricesJson = "{\"S\":2799,\"M\":2799,\"L\":2799,\"XL\":2799,\"XXL\":2799}";
      imageUrl = ""; images = []; category = "Basics"; inStock = true; stockLimit = null;
    };
    productsStore.add(1, p1);
    productsStore.add(2, p2);
    productsStore.add(3, p3);
    productsStore.add(4, p4);
    nextProductId := 5;
    seeded := true;
  };

  // On fresh deploy (not upgrade), seed if empty
  if (productsStore.size() == 0 and not _migrationDone) {
    seedProducts();
  };

  // ─── Products ─────────────────────────────────────────────────────────────

  public query func getAllProducts() : async [Product] {
    Array.fromIter(productsStore.values())
  };

  public query func getProduct(id : Nat) : async ?Product {
    productsStore.get(id)
  };

  public func addProduct(
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    sizePricesJson : Text,
    imageUrl : Text,
    images : [Text],
    category : Text,
    inStock : Bool,
    stockLimit : ?Nat,
  ) : async Nat {
    let id = nextProductId;
    nextProductId += 1;
    let p : Product = { id; name; description; price; sizes; sizePricesJson; imageUrl; images; category; inStock; stockLimit };
    productsStore.add(id, p);
    id
  };

  public func updateProduct(
    id : Nat,
    name : Text,
    description : Text,
    price : Nat,
    sizes : [Text],
    sizePricesJson : Text,
    imageUrl : Text,
    images : [Text],
    category : Text,
    inStock : Bool,
    stockLimit : ?Nat,
  ) : async Bool {
    switch (productsStore.get(id)) {
      case (null) { false };
      case (?_) {
        let p : Product = { id; name; description; price; sizes; sizePricesJson; imageUrl; images; category; inStock; stockLimit };
        productsStore.add(id, p);
        true
      };
    }
  };

  public func deleteProduct(id : Nat) : async Bool {
    switch (productsStore.get(id)) {
      case (null) { false };
      case (?_) { productsStore.remove(id); true };
    }
  };

  // ─── Orders ───────────────────────────────────────────────────────────────

  public func placeOrder(
    id : Text,
    customerName : Text,
    customerMobile : Text,
    deliveryAddress : Text,
    city : Text,
    state : Text,
    pincode : Text,
    items : [OrderItem],
    totalPrice : Nat,
    paymentMethod : Text,
    timestamp : Int,
  ) : async Text {
    let o : Order = {
      id; customerName; customerMobile; deliveryAddress; city; state; pincode;
      items; totalPrice; paymentMethod; status = "Pending"; timestamp;
      cancellationReason = ""; returnReason = ""; returnDescription = "";
    };
    ordersStore.add(id, o);
    id
  };

  public query func getAllOrders() : async [Order] {
    Array.fromIter(ordersStore.values())
  };

  public func updateOrderStatus(id : Text, newStatus : Text) : async Bool {
    switch (ordersStore.get(id)) {
      case (null) { false };
      case (?o) {
        let updated : Order = {
          id = o.id; customerName = o.customerName; customerMobile = o.customerMobile;
          deliveryAddress = o.deliveryAddress; city = o.city; state = o.state; pincode = o.pincode;
          items = o.items; totalPrice = o.totalPrice; paymentMethod = o.paymentMethod;
          status = newStatus; timestamp = o.timestamp;
          cancellationReason = o.cancellationReason; returnReason = o.returnReason;
          returnDescription = o.returnDescription;
        };
        ordersStore.add(id, updated);
        true
      };
    }
  };

  public func cancelOrder(id : Text, reason : Text) : async Bool {
    switch (ordersStore.get(id)) {
      case (null) { false };
      case (?o) {
        let updated : Order = {
          id = o.id; customerName = o.customerName; customerMobile = o.customerMobile;
          deliveryAddress = o.deliveryAddress; city = o.city; state = o.state; pincode = o.pincode;
          items = o.items; totalPrice = o.totalPrice; paymentMethod = o.paymentMethod;
          status = "Cancelled"; timestamp = o.timestamp;
          cancellationReason = reason; returnReason = o.returnReason;
          returnDescription = o.returnDescription;
        };
        ordersStore.add(id, updated);
        true
      };
    }
  };

  public func requestReturn(id : Text, reason : Text, description : Text) : async Bool {
    switch (ordersStore.get(id)) {
      case (null) { false };
      case (?o) {
        let updated : Order = {
          id = o.id; customerName = o.customerName; customerMobile = o.customerMobile;
          deliveryAddress = o.deliveryAddress; city = o.city; state = o.state; pincode = o.pincode;
          items = o.items; totalPrice = o.totalPrice; paymentMethod = o.paymentMethod;
          status = "Return Requested"; timestamp = o.timestamp;
          cancellationReason = o.cancellationReason; returnReason = reason;
          returnDescription = description;
        };
        ordersStore.add(id, updated);
        true
      };
    }
  };

  public func deleteOrder(id : Text) : async Bool {
    switch (ordersStore.get(id)) {
      case (null) { false };
      case (?_) { ordersStore.remove(id); true };
    }
  };

  public func clearAllOrders() : async () {
    let keys = Array.fromIter(ordersStore.keys());
    for (k in keys.vals()) {
      ordersStore.remove(k);
    };
  };

  // ─── Hero / Storefront Config ─────────────────────────────────────────────

  public query func getHeroConfig() : async HeroConfig {
    heroConfig
  };

  public func setHeroConfig(
    heroBadgeText : Text,
    heroTitle : Text,
    heroSubtitle : Text,
    heroCtaLabel : Text,
    heroBgImage : Text,
    logoImage : Text,
  ) : async () {
    heroConfig := { heroBadgeText; heroTitle; heroSubtitle; heroCtaLabel; heroBgImage; logoImage };
  };
};
