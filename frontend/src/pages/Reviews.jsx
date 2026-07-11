import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, GoogleLogo, ArrowRight } from "@phosphor-icons/react";

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [config, setConfig] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [r, c] = await Promise.all([api.get("/reviews"), api.get("/config")]);
    setReviews(r.data);
    setConfig(c.data);
    if (user) {
      try {
        const mine = await api.get("/reviews/me");
        if (mine.data?.id) {
          setMyReview(mine.data);
          setRating(mine.data.rating);
          setComment(mine.data.comment);
        }
      } catch {}
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  const submit = async () => {
    if (!user) { toast.error("Please log in to leave a review"); return; }
    if (!rating) { toast.error("Please pick a rating"); return; }
    if (!comment.trim()) { toast.error("Please write a comment"); return; }
    setSubmitting(true);
    try {
      await api.post("/reviews", { rating, comment: comment.trim() });
      toast.success(myReview ? "Review updated" : "Thanks for your review!");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="reviews-page">
        <div className="overline klein mb-3">COMMUNITY</div>
        <h1 className="page-title mb-3">What people say.</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Real reviews from real users. Loving XLSBuddy? Leave us a Google review too.
        </p>

        {/* Avg + Google CTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-foreground/15 mb-12">
          <div className="md:col-span-2 border-r border-b border-foreground/15 p-8 bg-secondary">
            <div className="overline mb-2">AVERAGE RATING</div>
            <div className="flex items-baseline gap-4">
              <span className="metric-title klein">{avg || "—"}</span>
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={24} weight={avg && i <= Math.round(avg) ? "fill" : "regular"} className={avg && i <= Math.round(avg) ? "klein" : "text-foreground/20"} />
                ))}
              </div>
            </div>
            <div className="text-muted-foreground text-sm mt-2">Based on {reviews.length} review{reviews.length !== 1 && "s"}</div>
          </div>
          {config?.google_review_url ? (
            <a
              href={config.google_review_url}
              target="_blank"
              rel="noreferrer"
              data-testid="google-review-link"
              className="border-r border-b border-foreground/15 p-8 bg-black text-white flex flex-col justify-between lift"
            >
              <div>
                <GoogleLogo size={36} weight="bold" className="mb-4" />
                <div className="overline mb-2 text-white/60">GOOGLE REVIEWS</div>
                <h3 className="text-2xl font-bold tracking-tight">Leave a Google review</h3>
              </div>
              <div className="overline text-[#7AA0FF] mt-4 flex items-center gap-2">
                OPEN <ArrowRight size={14} weight="bold" />
              </div>
            </a>
          ) : (
            <div className="border-r border-b border-foreground/15 p-8 bg-secondary text-muted-foreground text-sm">
              <GoogleLogo size={28} className="mb-3" />
              Google reviews link not yet set by admin.
            </div>
          )}
        </div>

        {/* Submit form */}
        {user ? (
          <div className="border border-foreground/15 p-8 bg-white mb-12 max-w-2xl" data-testid="review-form">
            <div className="overline klein mb-4">{myReview ? "UPDATE YOUR REVIEW" : "LEAVE A REVIEW"}</div>
            <div className="mb-4">
              <div className="overline mb-2">YOUR RATING</div>
              <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    data-testid={`rating-star-${i}`}
                    className="p-1"
                  >
                    <Star size={32} weight={(hover || rating) >= i ? "fill" : "regular"} className={(hover || rating) >= i ? "klein" : "text-foreground/20"} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you love (or what we could improve)…"
              className="rounded-none border-foreground/30 min-h-[120px]"
              maxLength={1000}
              data-testid="review-comment-input"
            />
            <Button
              onClick={submit}
              disabled={submitting}
              className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-12 mt-4"
              data-testid="review-submit-button"
            >
              {submitting ? "Submitting…" : (myReview ? "Update review" : "Submit review")}
            </Button>
          </div>
        ) : (
          <div className="border border-foreground/15 p-6 bg-secondary mb-12 max-w-2xl text-sm">
            <a href="/login" className="klein font-bold underline">Sign in</a> to leave a review.
          </div>
        )}

        {/* List */}
        {reviews.length === 0 ? (
          <div className="border border-foreground/15 p-12 text-center text-muted-foreground">
            <div className="overline mb-2">NO REVIEWS YET</div>
            Be the first to share your thoughts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-foreground/15">
            {reviews.map((r) => (
              <div key={r.id} className="border-r border-b border-foreground/15 p-6 bg-white" data-testid={`review-${r.id}`}>
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={14} weight={i <= r.rating ? "fill" : "regular"} className={i <= r.rating ? "klein" : "text-foreground/20"} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed my-3">{r.comment}</p>
                <div className="font-bold text-sm">{r.user_name}</div>
                <div className="overline text-muted-foreground">{r.updated_at?.slice(0, 10)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
