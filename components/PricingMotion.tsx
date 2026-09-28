"use client";

import { useId, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

export type Billing = "monthly" | "yearly";

const THUMB = { type: "spring", duration: 0.3, bounce: 0 } as const;
// Longer than a usual UI move because a digit can travel up to nine places;
// any faster and the roll reads as a flicker rather than counting.
const ROLL = { type: "spring", duration: 0.5, bounce: 0 } as const;
const OPTIONS: { value: Billing; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Annual" },
];

export function BillingToggle({
  value,
  onChange,
  saving,
}: {
  value: Billing;
  onChange: (value: Billing) => void;
  saving: string;
}) {
  const reduceMotion = useReducedMotion();
  const group = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="pm-toggle-wrap">
      <LayoutGroup id={group}>
        <div role="radiogroup" aria-label="Billing period" className="billing-toggle pm-toggle">
          {OPTIONS.map((option, i) => {
            const checked = option.value === value;
            return (
              <button
                key={option.value}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => onChange(option.value)}
                onKeyDown={(e) => {
                  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                  e.preventDefault();
                  const next = (i + 1) % OPTIONS.length;
                  onChange(OPTIONS[next].value);
                  buttons.current[next]?.focus();
                }}
                className={cn("billing-toggle-btn", checked && "is-active")}
              >
                {checked && (
                  <motion.span
                    layoutId="billing-thumb"
                    transition={reduceMotion ? { duration: 0 } : THUMB}
                    className="pm-thumb"
                    aria-hidden
                  />
                )}
                <span className="pm-label">{option.label}</span>
                {option.value === "yearly" && (
                  <>
                    <span className="billing-toggle-save">{saving}</span>
                    <span className="sr-only">, {saving}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

// Rolls each digit to its new value in its own column, like an odometer.
// Columns are keyed by place value, so "9" to "86" keeps the ones column
// and grows a tens column beside it. `formatted` is a locale-grouped
// string (e.g. "20,707" or "1,03,577"); separators are read out of it so
// any grouping system works, digits roll, everything else stays pinned.
export function RollingNumber({ formatted, className }: { formatted: string; className?: string }) {
  const digits = formatted.replace(/\D/g, "");
  // every separator, tagged with how many digits sit to its right
  const seps: { at: number; ch: string }[] = [];
  let right = 0;
  for (let k = formatted.length - 1; k >= 0; k--) {
    const c = formatted[k];
    if (/\d/.test(c)) right += 1;
    else seps.push({ at: right, ch: c });
  }
  // Holds every column this number has ever needed, so a column that is no
  // longer used can still shrink away instead of vanishing.
  const [slots, setSlots] = useState(digits.length || 1);
  if (digits.length > slots) setSlots(digits.length);
  // Columns present on first render just appear; only later ones grow in.
  const [initialSlots] = useState(digits.length || 1);

  const cols = [];
  for (let i = 0; i < slots; i++) {
    const place = slots - 1 - i;
    const index = digits.length - 1 - place;
    const present = index >= 0;
    cols.push(
      <DigitColumn
        key={place}
        digit={present ? Number(digits[index]) : null}
        grow={place >= initialSlots}
      />
    );
    const sep = seps.find((s) => s.at === place);
    if (sep && present) {
      cols.push(
        <span key={`s${place}`} className="pm-sep">
          {sep.ch}
        </span>
      );
    }
  }

  return (
    <span aria-hidden className={cn("pm-roll", className)}>
      {cols}
    </span>
  );
}

function DigitColumn({ digit, grow }: { digit: number | null; grow: boolean }) {
  const reduceMotion = useReducedMotion();
  // A column on its way out keeps showing its last digit while it shrinks.
  const [shown, setShown] = useState(digit ?? 0);
  if (digit !== null && digit !== shown) setShown(digit);
  const present = digit !== null;

  return (
    <span className={cn("pm-digit", present ? "is-present" : "is-gone", grow && "pm-digit--grow")}>
      <motion.span
        className="pm-reel"
        initial={false}
        animate={{ y: `${-shown * 10}%` }}
        transition={reduceMotion ? { duration: 0 } : ROLL}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="pm-glyph">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Same odometer, alphabetical: each letter rolls through A–Z (case kept).
// Columns are keyed by index, so "Starter" to "Teams" morphs letter by
// letter while extra columns grow or shrink away.
export function RollingWord({ text, className }: { text: string; className?: string }) {
  const chars = text.split("");
  const [slots, setSlots] = useState(chars.length || 1);
  if (chars.length > slots) setSlots(chars.length);
  const [initialSlots] = useState(chars.length || 1);

  const cols = [];
  for (let i = 0; i < slots; i++) {
    const ch = i < chars.length ? chars[i] : null;
    cols.push(<LetterColumn key={i} ch={ch} grow={i >= initialSlots} />);
  }

  return (
    <span aria-hidden className={cn("pm-roll", className)}>
      {cols}
    </span>
  );
}

function LetterColumn({ ch, grow }: { ch: string | null; grow: boolean }) {
  const reduceMotion = useReducedMotion();
  const isAlpha = ch !== null && /[a-zA-Z]/.test(ch);
  const [shown, setShown] = useState(ch ?? "A");
  if (ch !== null && ch !== shown) setShown(ch);
  // case follows the visible letter so shrinking columns keep their reel
  const upper = /[A-Z]/.test(shown);
  const alpha = upper ? UPPER : UPPER.toLowerCase();
  const present = ch !== null && isAlpha;
  const idx = Math.max(0, alpha.indexOf((upper ? shown.toUpperCase() : shown.toLowerCase())));

  if (ch !== null && !isAlpha) {
    return <span className="pm-sep">{ch}</span>;
  }

  return (
    <span className={cn("pm-digit", present ? "is-present" : "is-gone", grow && "pm-digit--grow")}>
      <motion.span
        className="pm-reel"
        initial={false}
        animate={{ y: `${(-idx * 100) / 26}%` }}
        transition={reduceMotion ? { duration: 0 } : ROLL}
      >
        {alpha.split("").map((g) => (
          <span key={g} className="pm-glyph">
            {g}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
