import { useEffect, useRef, useState } from "react";

/** Instagram-style photo gallery: auto-slides every 3s, with tappable dot indicators. */
export default function ProductGallery({ images, alt = "Product" }) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (list.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % list.length);
    }, 3000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  if (list.length === 0) return null;

  const goTo = (i) => {
    setIndex(i);
    startTimer(); // reset the 3s countdown after a manual tap
  };

  return (
    <div className="product-gallery">
      <img
        key={list[index]}
        src={list[index]}
        alt={`${alt} — photo ${index + 1}`}
        className="product-gallery-img"
        loading="lazy"
        decoding="async"
      />
      {list.length > 1 && (
        <div className="gallery-dots">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View photo ${i + 1}`}
              className={`gallery-dot${i === index ? " active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}