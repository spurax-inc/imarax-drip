export default function Wordmark({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline font-bold leading-none ${
        dark ? "text-white" : "text-[#111111]"
      } ${className}`}
    >
      IMARAX
      <span className="ml-[0.2em] font-normal text-signal">dRip</span>
    </span>
  );
}