import { CheckCircleIcon } from "@heroicons/react/24/solid";

export const MIN_PASSWORD_LENGTH = 10;

/** What a good password has. Only the length is required by the server; the rest is advice. */
export function passwordChecks(password: string) {
  return [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { label: "Upper and lower case letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", ok: /\d/.test(password) },
    { label: "A symbol, like ! or #", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

const LEVELS = [
  { label: "Too short", bar: "bg-[#d92d20]", text: "text-[#b42318]" },
  { label: "Weak", bar: "bg-[#f79009]", text: "text-[#b54708]" },
  { label: "Good", bar: "bg-[#2e90fa]", text: "text-adm-primary-dark" },
  { label: "Strong", bar: "bg-[#12b76a]", text: "text-[#116632]" },
] as const;

/** A strength bar and a live checklist under the new password field. */
export function PasswordStrength({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const longEnough = checks[0].ok;
  const extras = checks.slice(1).filter((c) => c.ok).length;
  // 0 = too short, 1 = long enough but plain, 2 = one more kind of character, 3 = two or more.
  const level = !password || !longEnough ? 0 : extras === 0 ? 1 : extras === 1 ? 2 : 3;
  const { label, bar, text } = LEVELS[level];

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${password && i <= level ? bar : "bg-adm-line"}`} />
          ))}
        </div>
        <span className={`w-16 text-right text-[13px] font-semibold ${password ? text : "text-adm-faint"}`}>{password ? label : ""}</span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {checks.map(({ label: text, ok }) => (
          <li key={text} className={`flex items-center gap-2 text-[13px] transition-colors ${ok ? "text-[#116632]" : "text-adm-muted"}`}>
            {ok ? (
              <CheckCircleIcon aria-hidden className="size-4 shrink-0 text-[#12b76a]" />
            ) : (
              <span aria-hidden className="mx-[3px] size-2.5 shrink-0 rounded-full border-[1.5px] border-adm-line-strong" />
            )}
            <span>
              {text}
              <span className="sr-only">{ok ? " (done)" : " (not yet)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
