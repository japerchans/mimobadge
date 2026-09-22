export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand-logo${compact ? " compact" : ""}`}
      aria-label="こころん"
    >
      <img
        src="/logo.png"
        width="2163"
        height="727"
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </span>
  );
}
