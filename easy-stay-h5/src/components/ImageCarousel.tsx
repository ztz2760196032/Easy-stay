import { useMemo, useState } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const normalized = useMemo(
    () =>
      images.length
        ? images
        : ["https://images.unsplash.com/photo-1445019980597-93fa8acb246c"],
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = normalized.length - 1;

  return (
    <div className="carousel">
      <img className="carousel-image" src={normalized[activeIndex]} alt={`${alt} - ${activeIndex + 1}`} />
      <button
        className="carousel-btn left"
        onClick={() => setActiveIndex((prev) => (prev === 0 ? maxIndex : prev - 1))}
        type="button"
      >
        ‹
      </button>
      <button
        className="carousel-btn right"
        onClick={() => setActiveIndex((prev) => (prev === maxIndex ? 0 : prev + 1))}
        type="button"
      >
        ›
      </button>
      <div className="carousel-dots">
        {normalized.map((_, index) => (
          <button
            aria-label={`切换到第 ${index + 1} 张图片`}
            className={`dot ${activeIndex === index ? "active" : ""}`}
            key={index}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
