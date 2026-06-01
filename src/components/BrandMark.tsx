import Image from "next/image";
import weaveLogo from "../../public/weave-logo.png";

const LOGO_W = 382;
const LOGO_H = 240;

/** Weave brand mark — the woven teal "W" lattice logo. Source is the trimmed,
   optimized PNG (transparent padding removed, ~36KB). Rendered at its natural
   aspect ratio with a fixed height (`size`) and proportional width. */
export function BrandMark({ size = 28 }: { size?: number }) {
  const width = Math.round((size * LOGO_W) / LOGO_H);
  return (
    <Image
      src={weaveLogo}
      alt="Weave"
      width={width}
      height={size}
      priority
      style={{ height: size, width: "auto", flex: "none" }}
    />
  );
}
