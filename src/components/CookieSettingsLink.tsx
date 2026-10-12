"use client";

export default function CookieSettingsLink({
  className = "",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("imx-open-cookie-settings"))}
      className={className}
    >
      Cookie Settings
    </button>
  );
}