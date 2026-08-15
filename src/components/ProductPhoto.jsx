import { useState } from "react";
import { CATEGORY_FALLBACK_IMAGES, getProductImage } from "../data/productImages.js";

export default function ProductPhoto({
  product,
  alt,
  className = "",
  style,
  imgStyle,
  objectFit = "cover",
}) {
  const [src, setSrc] = useState(() => getProductImage(product));
  const [loaded, setLoaded] = useState(false);
  const label = alt || product?.name || "Product";

  const handleError = () => {
    const fallback =
      (product?.category && CATEGORY_FALLBACK_IMAGES[product.category]) ||
      CATEGORY_FALLBACK_IMAGES.Women;
    if (src !== fallback) { setSrc(fallback); setLoaded(false); }
  };

  return (
    <img
      src={src}
      alt={label}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit,
        display: "block",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.4s ease",
        ...imgStyle,
        ...style,
      }}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  );
}
