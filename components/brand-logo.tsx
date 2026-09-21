import { KokologMark } from "./kokolog-mark";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand-logo${compact ? " compact" : ""}`}
      aria-label="こころん"
    >
      <span aria-hidden="true">ここ</span>
      <span className="brand-heart" aria-hidden="true">
        <KokologMark />
      </span>
      <span aria-hidden="true">ん</span>
    </span>
  );
}
