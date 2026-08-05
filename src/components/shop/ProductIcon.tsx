import { productIcons } from "@/lib/product-icons";

export function ProductIcon({ icon, color }: { icon: string; color?: string }) {
  const svg = productIcons[icon] ?? productIcons.box;
  return (
    <span
      style={{ color: color ?? "var(--ink)", display: "contents" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
