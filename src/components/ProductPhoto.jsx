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
  const label = alt || product?.name || "Product";

  const handleError = () => {
    const fallback =
      (product?.category && CATEGORY_FALLBACK_IMAGES[product.category]) ||
      CATEGORY_FALLBACK_IMAGES.Women;
    if (src !== fallback) setSrc(fallback);
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
        ...imgStyle,
        ...style,
      }}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}
