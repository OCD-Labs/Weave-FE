/** Weave brand mark — accent rounded square with white woven-lattice strokes. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <g stroke="var(--on-accent)" strokeWidth="2.1" strokeLinecap="round" opacity="0.96">
        <path d="M8 11c2.7 0 2.7 4 5.4 4s2.7-4 5.4-4 2.7 4 5.2 4" />
        <path d="M8 17c2.7 0 2.7 4 5.4 4s2.7-4 5.4-4 2.7 4 5.2 4" />
        <path d="M11 8c0 2.7 4 2.7 4 5.4s-4 2.7-4 5.4" opacity="0.5" />
        <path d="M21 8c0 2.7-4 2.7-4 5.4s4 2.7 4 5.4" opacity="0.5" />
      </g>
    </svg>
  );
}
