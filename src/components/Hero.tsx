import Link from "next/link";

// =====================================================
//  EDIT YOUR WORDS AND PICTURES HERE (change only the
//  text between the quotes, keep the commas and quotes)
// =====================================================

const EYEBROW = "Imarax Drip / All-round wear";

const HEADLINE_TOP = "Imagine it.";
const HEADLINE_ORANGE = "Wear it.";

const PARAGRAPH =
  "Clothing, shoes and accessories for everyone. Professional, streetwear, Afro-modern, all in one wardrobe.";

const BUTTON_ONE = "Shop the drop";
const BUTTON_TWO = "Explore collections";

// Words that scroll along the black band at the bottom
const SCROLLING_WORDS = [
  "Streetwear",
  "Workwear",
  "Afro-modern",
  "Footwear",
  "Accessories",
  "For everyone",
];

// Moving pictures: put photos in the folder public/hero, then list them
// like this (6 or more looks best). Leave the list empty for color blocks:
// const PICTURES = ["/hero/look-1.jpg", "/hero/look-2.jpg", "/hero/look-3.jpg"];
const PICTURES: string[] = [];

// =====================================================
//  YOU DO NOT NEED TO EDIT ANYTHING BELOW THIS LINE
// =====================================================

type Tile = {
  src: string | null;
  ratio: string;
  tone: string;
  label: string;
};

const ratios = ["3 / 4", "1 / 1", "4 / 5", "3 / 4", "1 / 1"];
const tones = ["#d2561f", "#ececec", "#f3f3f3", "#e8b8a2", "#dcdcdc"];

function buildColumn(offset: number): Tile[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    src:
      PICTURES.length > 0 ? PICTURES[(offset + i * 3) % PICTURES.length] : null,
    ratio: ratios[(i + offset) % ratios.length],
    tone: tones[(i + offset) % tones.length],
    label: `Look ${String(offset * 5 + i + 1).padStart(2, "0")}`,
  }));
}

const columnA = buildColumn(0);
const columnB = buildColumn(1);
const columnC = buildColumn(2);

const bandWords = Array.from({ length: 4 }).flatMap(() => SCROLLING_WORDS);

function TileView({ tile }: { tile: Tile }) {
  const onOrange = tile.tone === "#d2561f";

  return (
    <div className="pb-4">
      <div
        className="relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: tile.ratio, backgroundColor: tile.tone }}
      >
        {tile.src ? (
          <img
            src={tile.src}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: onOrange ? "#ffffff" : "#111111" }}
          >
            {tile.label}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({
  tiles,
  direction,
  speed,
}: {
  tiles: Tile[];
  direction: "up" | "down";
  speed: number;
}) {
  const loop = [...tiles, ...tiles];

  return (
    <div className="h-full overflow-hidden">
      <div
        className={direction === "up" ? "drift-up" : "drift-down"}
        style={{ "--drift-speed": `${speed}s` } as React.CSSProperties}
      >
        {loop.map((tile, index) => (
          <TileView key={`${tile.label}-${index}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-white"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      {/* MOVING IMAGE WALL */}
      <div
        aria-hidden="true"
        className="drift-pause absolute -bottom-[15%] -right-[30%] -top-[15%] w-[110%] rotate-[8deg] opacity-30 lg:-right-[8%] lg:w-[58%] lg:opacity-100"
      >
        <div className="grid h-full grid-cols-3 gap-4">
          <Column tiles={columnA} direction="up" speed={55} />
          <Column tiles={columnB} direction="down" speed={70} />
          <Column tiles={columnC} direction="up" speed={45} />
        </div>
      </div>

      {/* TEXT, TOP LEFT */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-start px-6 pb-32 pt-16 md:pt-24">
        <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
          <span className="h-0.5 w-10 bg-signal" />
          {EYEBROW}
        </p>

        <h1 className="max-w-xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          {HEADLINE_TOP}
          <br />
          <span className="text-signal">{HEADLINE_ORANGE}</span>
        </h1>

        <p className="mt-8 max-w-md text-base leading-8 text-gray-600">
          {PARAGRAPH}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-signal px-8 py-4 text-sm font-semibold text-white transition hover:bg-signal-dark"
          >
            {BUTTON_ONE}
          </Link>

          <a
            href="#collections"
            className="rounded-full border border-black bg-white px-8 py-4 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
          >
            {BUTTON_TWO}
          </a>
        </div>
      </div>

      {/* MOVING BAND, BOTTOM */}
      <div className="absolute inset-x-0 bottom-0 z-20 overflow-hidden border-t-4 border-signal bg-black py-4 text-white">
        <div
          className="drift-left flex w-max whitespace-nowrap"
          style={{ "--drift-speed": "35s" } as React.CSSProperties}
        >
          {bandWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="mr-10 text-xs font-semibold uppercase tracking-[0.35em]"
            >
              {word} <span className="text-signal">×</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}