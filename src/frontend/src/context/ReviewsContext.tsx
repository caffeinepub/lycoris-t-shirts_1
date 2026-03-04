import { createContext, useCallback, useContext, useState } from "react";

export interface Review {
  id: string;
  productId: number;
  name: string;
  rating: number; // 1–5
  comment: string;
  date: string; // ISO string
}

interface ReviewsContextValue {
  getReviews: (productId: number) => Review[];
  addReview: (review: Review) => void;
  hasReviewed: (productId: number) => boolean;
}

const STORAGE_KEY = "lycoris_reviews";
const SESSION_KEY = "lycoris_reviewed_products";

function loadReviews(): Record<number, Review[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReviews(data: Record<number, Review[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadReviewedProducts(): Set<number> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReviewedProducts(set: Set<number>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviewsMap, setReviewsMap] = useState<Record<number, Review[]>>(() =>
    loadReviews(),
  );
  const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(() =>
    loadReviewedProducts(),
  );

  const getReviews = useCallback(
    (productId: number): Review[] => {
      return reviewsMap[productId] ?? [];
    },
    [reviewsMap],
  );

  const addReview = useCallback((review: Review) => {
    setReviewsMap((prev) => {
      const existing = prev[review.productId] ?? [];
      const updated = { ...prev, [review.productId]: [review, ...existing] };
      saveReviews(updated);
      return updated;
    });
    setReviewedProducts((prev) => {
      const updated = new Set(prev);
      updated.add(review.productId);
      saveReviewedProducts(updated);
      return updated;
    });
  }, []);

  const hasReviewed = useCallback(
    (productId: number): boolean => {
      return reviewedProducts.has(productId);
    },
    [reviewedProducts],
  );

  return (
    <ReviewsContext.Provider value={{ getReviews, addReview, hasReviewed }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error("useReviews must be used within ReviewsProvider");
  return ctx;
}
