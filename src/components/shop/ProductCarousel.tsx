import { ProductCard } from "@/components/shop/ProductCard";
import type { ProductListItem } from "@/types/product";

export function ProductCarousel({
  eyebrow,
  title,
  products,
}: {
  eyebrow: string;
  title: string;
  products: ProductListItem[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-head">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="display">{title}</h2>
        </div>
        <div className="product-carousel-row">
          {products.map((p) => (
            <div className="product-carousel-item" key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
