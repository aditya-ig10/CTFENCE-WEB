import { reviews } from "@/content/copy";

function Stars({ count }: { count: number }) {
  return (
    <div className="review-stars" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M6 1l1.5 3.2 3.5.4-2.6 2.4.7 3.5L6 8.8 2.9 10.5l.7-3.5L1 4.6l3.5-.4L6 1Z"
            fill={i < count ? "var(--accent)" : "var(--dim)"}
          />
        </svg>
      ))}
    </div>
  );
}

// PLACEHOLDER REVIEWS — replace with real quotes once design partners are
// live, per application: 0 users currently. Attributions are generic on purpose.
export default function Reviews() {
  return (
    <section className="section tight" id="reviews" aria-labelledby="reviews-title">
      <div className="section-eyebrow">{reviews.eyebrow}</div>
      <h2 className="section-title" id="reviews-title">{reviews.title}</h2>
      <div className="reviews-grid" style={{ marginTop: 48 }}>
        {reviews.items.map((r, i) => (
          <figure className="review-card" key={i}>
            <Stars count={r.stars} />
            <blockquote className="review-text">{r.text}</blockquote>
            <figcaption className="review-author">{r.author}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}