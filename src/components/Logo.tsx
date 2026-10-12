import Link from "next/link";
import Wordmark from "./Wordmark";

export function LogoIcon({
  size = 40,
  dark = false,
}: {
  size?: number;
  dark?: boolean;
}) {
  const box = dark ? "#ffffff" : "#111111";
  const stroke = dark ? "#111111" : "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="9" fill={box} />
      <line
        x1="18"
        y1="18"
        x2="46"
        y2="46"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <line
        x1="46"
        y1="18"
        x2="18"
        y2="46"
        stroke="#D2561F"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  dark = false,
  tagline = false,
}: {
  dark?: boolean;
  tagline?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Imarax Drip home"
      className="inline-flex items-center gap-3"
    >
      <LogoIcon dark={dark} />

      <span className="flex flex-col gap-1.5">
        <Wordmark dark={dark} className="text-xl" />

        {tagline && (
          <span
            className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
              dark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Imagine it, wear it
          </span>
        )}
      </span>
    </Link>
  );
}