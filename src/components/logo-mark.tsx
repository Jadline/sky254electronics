// The Sky254 symbol: a ribbon S breaking out of a screen, on a swoosh that rises into an
// orbit with a satellite. The same drawing as the logo files (sky254-mark.svg).
//
// By default it's drawn for small sizes (header, menus, dashboard): heavier lines and no
// star, so it holds its own next to the bold name instead of turning into hairlines.
// `detailed` is the full drawing, for large uses such as the share image.

const RIBBON = "M98 22 C70 10 30 18 30 42 C30 54 42 60 58 62 C46 56 42 50 44 44 C48 30 74 26 98 22 Z";

/**
 * `dark` is for navy backgrounds. `background` is the colour behind the mark: the ribbon
 * is outlined in it, which cuts the screen's edge where the ribbon breaks out.
 */
export function LogoMark({
  dark = false,
  background = "#ffffff",
  detailed = false,
  className,
  height,
}: {
  dark?: boolean;
  background?: string;
  detailed?: boolean;
  className?: string;
  /** A fixed size in px, for places without CSS such as the share image. */
  height?: number;
}) {
  const line = dark ? "#ffffff" : "#0b1b33";
  const weight = detailed ? { frame: 3.5, orbit: 2.5, cut: 6, sat: 5.5 } : { frame: 7, orbit: 5, cut: 9, sat: 8 };
  const cut = { stroke: background, strokeWidth: weight.cut, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };
  return (
    <svg
      viewBox="0 0 140 130"
      aria-hidden="true"
      className={className}
      {...(height && { width: Math.round((height * 140) / 130), height })}
    >
      <rect x="22" y="30" width="96" height="56" rx={detailed ? 9 : 11} fill="none" stroke={line} strokeWidth={weight.frame} />
      <g transform="translate(22 6.8) scale(0.8)">
        <path d={RIBBON} fill="#4d9cf0" {...cut} />
        <path d={RIBBON} fill={dark ? "#ffffff" : "#0669d6"} transform="rotate(180 60 64)" {...cut} />
      </g>
      <path d={detailed ? "M24 104 Q76 124 124 90 Q78 114 24 104 Z" : "M22 104 Q76 130 125 89 Q78 111 22 104 Z"} fill="#ffb020" />
      <path d="M124 90 Q137 68 129 42 Q125 28 116 20" fill="none" stroke={line} strokeWidth={weight.orbit} strokeLinecap="round" />
      <circle cx="112.5" cy="16.5" r={weight.sat} fill="#ffb020" />
      {detailed && (
        <path d="M24 8 L25.4 12.6 L30 14 L25.4 15.4 L24 20 L22.6 15.4 L18 14 L22.6 12.6 Z" fill={dark ? "#4d9cf0" : "#0669d6"} />
      )}
    </svg>
  );
}
