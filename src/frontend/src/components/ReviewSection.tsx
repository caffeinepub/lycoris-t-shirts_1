import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useReviews } from "@/context/ReviewsContext";
import { Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface ReviewSectionProps {
  productId: number;
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Select rating"
      data-ocid="review.star_picker"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} out of 5`}
          aria-pressed={value === star}
          data-ocid={`review.star.${star}`}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        >
          <Star
            className={`h-6 w-6 transition-colors duration-100 ${
              star <= display
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function AverageRating({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;

  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-3xl font-bold text-foreground">
        {rounded.toFixed(1)}
      </span>
      <div className="flex flex-col gap-0.5">
        <StarRating rating={Math.round(avg)} size="md" />
        <span className="font-body text-xs text-muted-foreground">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { getReviews, addReview, hasReviewed } = useReviews();
  const reviews = getReviews(productId);
  const alreadyReviewed = hasReviewed(productId);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    setRatingError(false);
    setSubmitting(true);

    const review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId,
      name: name.trim() || "Anonymous",
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    // Slight delay for feel
    setTimeout(() => {
      addReview(review);
      setName("");
      setRating(0);
      setComment("");
      setSubmitting(false);
      toast.success("Review submitted!", {
        description: "Thank you for your feedback.",
      });
    }, 400);
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12"
      aria-label="Customer Reviews"
      data-ocid="reviews.section"
    >
      <Separator className="mb-10 bg-border" />

      {/* Section header */}
      <div className="mb-8">
        <span className="text-primary font-body text-xs tracking-[0.2em] uppercase font-semibold block mb-1">
          Customer Feedback
        </span>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Reviews
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left: Reviews list */}
        <div className="lg:col-span-3 space-y-0">
          {/* Average rating summary */}
          {reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 pb-6 border-b border-border"
              data-ocid="reviews.summary"
            >
              <AverageRating reviews={reviews} />
            </motion.div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="py-10 text-center"
              data-ocid="reviews.empty_state"
            >
              <div className="flex justify-center mb-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-5 w-5 fill-transparent text-muted-foreground/20"
                    />
                  ))}
                </div>
              </div>
              <p className="font-display text-base font-semibold text-foreground mb-1">
                No reviews yet
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Be the first to share your experience with this product.
              </p>
            </motion.div>
          ) : (
            <div
              className="space-y-0 divide-y divide-border"
              data-ocid="reviews.list"
            >
              <AnimatePresence initial={false}>
                {reviews.map((review, index) => (
                  <motion.article
                    key={review.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="py-5"
                    data-ocid={`reviews.item.${index + 1}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-xs font-bold text-primary uppercase">
                            {review.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-foreground truncate">
                            {review.name}
                          </p>
                          <time
                            className="font-body text-[11px] text-muted-foreground/70"
                            dateTime={review.date}
                          >
                            {new Date(review.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="font-body text-sm text-muted-foreground leading-relaxed pl-[2.625rem]">
                        {review.comment}
                      </p>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Submit form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-sm p-6 sticky top-6">
            {alreadyReviewed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center gap-3 py-6 text-center"
                data-ocid="reviews.already_reviewed"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
                <p className="font-display text-sm font-semibold text-foreground">
                  Review Submitted
                </p>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  You've already reviewed this product in this session. Thank
                  you for your feedback!
                </p>
              </motion.div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="font-display text-base font-semibold text-foreground mb-0.5">
                    Write a Review
                  </h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Share your experience with this product
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  data-ocid="reviews.form"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="review-name"
                      className="font-body text-[10px] tracking-widests uppercase text-muted-foreground mb-1.5 block tracking-[0.15em]"
                    >
                      Your Name
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Anonymous"
                      maxLength={60}
                      data-ocid="review.name_input"
                      className="w-full h-9 px-3 text-sm font-body bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Star picker */}
                  <div>
                    <p className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">
                      Rating{" "}
                      <span className="text-destructive font-semibold">*</span>
                    </p>
                    <StarPicker value={rating} onChange={setRating} />
                    {ratingError && (
                      <p
                        className="font-body text-xs text-destructive mt-1"
                        data-ocid="review.rating_error"
                      >
                        Please select a star rating
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label
                      htmlFor="review-comment"
                      className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block"
                    >
                      Comment{" "}
                      <span className="normal-case font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </label>
                    <Textarea
                      id="review-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you think of this product?"
                      rows={4}
                      maxLength={500}
                      data-ocid="review.comment_textarea"
                      className="bg-background border-border font-body text-sm resize-none focus:ring-primary"
                    />
                    {comment.length > 400 && (
                      <p className="font-body text-[10px] text-muted-foreground text-right mt-1">
                        {comment.length}/500
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    data-ocid="review.submit_button"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold tracking-wider uppercase rounded-none h-11 text-sm"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Submitting…
                      </span>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
