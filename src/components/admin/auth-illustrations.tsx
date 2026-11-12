/**
 * Drawings for the sign-in pages, as inline SVG so they stay sharp and cost no downloads.
 * All decorative: hidden from screen readers. Colours follow the admin palette.
 */

const BLUE = "#0669d6";
const INK = "#0b1b33";
const TINT = "#e8f1fc";
const LINE = "#d3dbe6";
const CORAL = "#f0643c";
const GREEN = "#12b76a";
const GOLD = "#fdb022";

/** A four-pointed twinkle. */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

/** A five-pointed star centred on (x, y). */
const star = (x: number, y: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 ? r * 0.45 : r;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");

const BARS = [28, 44, 36, 60, 48, 72, 56, 84];

/** The blue panel's scene: a laptop with the dashboard, a phone with a paid M-Pesa order, headphones and notifications. */
export function ShopIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 370" fill="none" aria-hidden className={className}>
      <ellipse cx="250" cy="348" rx="235" ry="12" fill="#000" opacity="0.18" />

      {/* Laptop showing the dashboard */}
      <rect x="70" y="80" width="300" height="200" rx="16" fill={INK} />
      <rect x="80" y="90" width="280" height="180" rx="8" fill="#fff" />
      <rect x="80" y="90" width="58" height="180" rx="8" fill={TINT} />
      <rect x="130" y="90" width="8" height="180" fill={TINT} />
      <rect x="92" y="104" width="22" height="22" rx="6" fill={BLUE} />
      {[140, 156, 172, 188, 204].map((y, i) => (
        <rect key={y} x="92" y={y} width={i === 0 ? 34 : 28} height="6" rx="3" fill={i === 0 ? BLUE : "#b9d3f3"} />
      ))}
      {[
        [150, INK],
        [217, BLUE],
        [284, GREEN],
      ].map(([x, color]) => (
        <g key={x as number}>
          <rect x={x as number} y="104" width="62" height="38" rx="8" fill="#f4f7fb" />
          <rect x={(x as number) + 8} y="113" width="30" height="5" rx="2.5" fill={LINE} />
          <rect x={(x as number) + 8} y="124" width="40" height="8" rx="4" fill={color as string} />
        </g>
      ))}
      <rect x="150" y="152" width="196" height="104" rx="8" fill="#f4f7fb" />
      {BARS.map((h, i) => (
        <rect key={i} x={164 + i * 22} y={244 - h} width="13" height={h} rx="4" fill={i % 2 ? BLUE : "#9cc8ff"} />
      ))}
      <polyline
        points={BARS.map((h, i) => `${170.5 + i * 22},${236 - h}`).join(" ")}
        stroke={CORAL}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={170.5 + 7 * 22} cy={236 - 84} r="5" fill="#fff" stroke={CORAL} strokeWidth="3" />
      <path d="M30 282h380l-16 18H46z" fill="#dce7f5" />
      <rect x="190" y="282" width="60" height="5" rx="2.5" fill="#b9cbe3" />

      {/* Headphones lying in front */}
      <path d="M24 330v-14a32 32 0 0 1 64 0v14" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <rect x="13" y="312" width="22" height="36" rx="9" fill={CORAL} />
      <rect x="77" y="312" width="22" height="36" rx="9" fill={CORAL} />
      <rect x="18" y="319" width="5" height="20" rx="2.5" fill="#fff" opacity="0.35" />

      {/* Phone with a paid order */}
      <rect x="372" y="140" width="104" height="200" rx="20" fill={INK} />
      <rect x="379" y="147" width="90" height="186" rx="14" fill="#fff" />
      <rect x="408" y="153" width="32" height="5" rx="2.5" fill={INK} />
      <circle cx="424" cy="205" r="22" fill="#d1fadf" />
      <circle cx="424" cy="205" r="15" fill={GREEN} />
      <path d="m416.5 205 5 5 9.5-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="397" y="240" width="54" height="6" rx="3" fill={LINE} />
      <rect x="391" y="254" width="66" height="10" rx="5" fill={INK} />
      <rect x="403" y="270" width="42" height="5" rx="2.5" fill={LINE} />
      <rect x="391" y="296" width="66" height="22" rx="11" fill={BLUE} />

      {/* "New order" notification */}
      <g className="float">
        <rect x="324" y="44" width="176" height="60" rx="14" fill="#021f45" opacity="0.25" transform="translate(0 6)" />
        <rect x="324" y="44" width="176" height="60" rx="14" fill="#fff" />
        <circle cx="352" cy="74" r="16" fill={CORAL} />
        <path d="M345.5 70h13l-1.4 11h-10.2z" fill="#fff" />
        <path d="M348.5 70v-1.5a3.5 3.5 0 0 1 7 0V70" stroke="#fff" strokeWidth="2" />
        <rect x="378" y="62" width="74" height="7" rx="3.5" fill={INK} />
        <rect x="378" y="78" width="104" height="6" rx="3" fill={LINE} />
        <circle cx="488" cy="56" r="5" fill={CORAL} />
      </g>

      {/* Five-star review */}
      <g className="float" style={{ animationDelay: "-2s" }}>
        <rect x="8" y="132" width="134" height="52" rx="14" fill="#021f45" opacity="0.25" transform="translate(0 6)" />
        <rect x="8" y="132" width="134" height="52" rx="14" fill="#fff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon key={i} points={star(30 + i * 22, 150, 8)} fill={GOLD} />
        ))}
        <rect x="22" y="166" width="84" height="5" rx="2.5" fill={LINE} />
      </g>

      <path d={sparkle(300, 36, 9)} fill="#fff" />
      <path d={sparkle(40, 96, 6)} fill="#fff" opacity="0.8" />
      <path d={sparkle(500, 132, 6)} fill="#fff" opacity="0.8" />
      <path d={sparkle(170, 46, 5)} fill="#9cc8ff" />
    </svg>
  );
}

function Blob() {
  return (
    <>
      <circle cx="60" cy="52" r="40" fill={TINT} />
      <circle cx="60" cy="52" r="40" fill="url(#auth-art-shine)" />
      <defs>
        <radialGradient id="auth-art-shine" cx="0.3" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </>
  );
}

/** Sign in: a Sky254 shopping bag with a star badge. */
export function SignInArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 96" fill="none" aria-hidden className={className}>
      <Blob />
      <path d="M48 40v-6a12 12 0 0 1 24 0v6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M33 40h54l-4 46H37z" fill={BLUE} />
      <path d="M33 40h54l-.9 10H33.9z" fill="#fff" opacity="0.15" />
      <text x="60" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff" fontFamily="inherit">
        S
      </text>
      <circle cx="88" cy="36" r="12" fill={GOLD} stroke="#fff" strokeWidth="3" />
      <polygon points={star(88, 36.5, 6.5)} fill="#fff" />
      <path d={sparkle(20, 28, 5)} fill={BLUE} />
      <path d={sparkle(104, 74, 4)} fill={CORAL} />
    </svg>
  );
}

/** Forgot password: a key arriving in an open envelope. */
export function ResetLinkArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 96" fill="none" aria-hidden className={className}>
      <Blob />
      <path d="M24 46 60 24l36 22v34a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6z" fill="#1f5fae" />
      <rect x="34" y="20" width="52" height="48" rx="5" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <circle cx="47" cy="38" r="6.5" stroke={CORAL} strokeWidth="4" />
      <path d="M53.5 38H75M69 38v6M74 38v4" stroke={CORAL} strokeWidth="4" strokeLinecap="round" />
      <rect x="42" y="52" width="36" height="4" rx="2" fill={LINE} />
      <path d="M24 50 60 72l36-22v30a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6z" fill={BLUE} />
      <path d={sparkle(102, 22, 6)} fill={GOLD} />
      <path d={sparkle(16, 34, 4)} fill={BLUE} />
    </svg>
  );
}

/** Choose a new password: a padlock with a green tick. */
export function NewPasswordArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 96" fill="none" aria-hidden className={className}>
      <Blob />
      <path d="M45 46V36a15 15 0 0 1 30 0v10" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <rect x="33" y="43" width="54" height="42" rx="10" fill={BLUE} />
      <rect x="33" y="43" width="54" height="10" rx="5" fill="#fff" opacity="0.15" />
      <circle cx="60" cy="61" r="5.5" fill="#fff" />
      <rect x="58" y="63" width="4" height="11" rx="2" fill="#fff" />
      <circle cx="88" cy="78" r="12" fill={GREEN} stroke="#fff" strokeWidth="3" />
      <path d="m82.5 78 3.8 3.8 7-7.6" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={sparkle(20, 26, 5)} fill={GOLD} />
      <path d={sparkle(102, 26, 4)} fill={BLUE} />
    </svg>
  );
}
