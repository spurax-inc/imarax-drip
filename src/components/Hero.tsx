import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

// =====================================================
//  EDIT YOUR WORDS HERE (change only the text between
//  the quotes, keep the commas and quotes)
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

// PICTURES: nothing to edit. Every image file you put in the folder
// public/hero (jpg, png, webp) is used automatically. Push to publish.

// =====================================================
//  YOU DO NOT NEED TO EDIT ANYTHING BELOW THIS LINE
// =====================================================

function loadPictures(): string[] {
  try {
    const folder = path.join(process.cwd(), "public", "hero");

    return fs
      .readdirSync(folder)
      .filter((name) => /\.(jpe?g|png|webp|avif|gif)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((name) => `/hero/${encodeURIComponent(name)}`);
  } catch {
    return [];
  }
}

const PICTURES = loadPictures();

type Tile = {
  src: string | null;
  ratio: string;
  tone: string;
  label: string;
};

const ratios = ["3 / 4", "1 / 1", "4 / 5", "3 / 4", "1 / 1"];
const tones = ["#d2561f", "#ececec", "#f3f3f3", "#e8b8a2", "#dcdcdc"];

// Shares the pictures out evenly: column 0 gets pictures 0, 3, 6...
// column 1 gets 1, 4, 7... and column 2 gets 2, 5, 8...
function buildColumn(offset: number): Tile[] {
  let list: (string | null)[] = PICTURES.filter(
    (_, index) => index % 3 === offset
  );

  if (PICTURES.length === 0) {
    list = Array.from({ length: 5 }).map(() => null);
  } else if (list.length === 0) {
    list = [...PICTURES];
  }

  while (list.length < 5) list = [...list, ...list];

  return list.map((src, i) => ({
    src,
    ratio: ratios[(i + offset) % ratios.length],
    tone: tones[(i + offset) % tones.length],
    label: `Look ${offset + 1}-${i + 1}`,
  }));
}

const columnA = buildColumn(0);
const columnB = buildColumn(1);
const columnC = buildColumn(2);

const bandWords = Array.from({ length: 4 }).flatMap(() => SCROLLING_WORDS);

function TileView({ tile }: { tile: Tile }) {
  const onOrange = tile.tone === "#d2561f";

  return (
    <div className="pb-3 lg:pb-4">
      <div
        className="relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: tile.ratio, backgroundColor: tile.tone }}
      >
        {tile.src ? (
          <img
            src={tile.src}
            alt=""
            decoding="async"
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

function ImageWall() {
  return (
    <div className="grid h-full grid-cols-3 gap-3 lg:gap-4">
      <Column tiles={columnA} direction="up" speed={55} />
      <Column tiles={columnB} direction="down" speed={70} />
      <Column tiles={columnC} direction="up" speed={45} />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white lg:min-h-[calc(100vh-80px)]">
      {/* MOVING IMAGE WALL (computers) */}
      <div
        aria-hidden="true"
        className="drift-pause absolute -bottom-[15%] -right-[8%] -top-[15%] hidden w-[58%] rotate-[8deg] lg:block"
      >
        <ImageWall />
      </div>

      {/* TEXT, TOP LEFT */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start px-6 pb-8 pt-10 md:pt-16 lg:min-h-[calc(100vh-80px)] lg:pb-32 lg:pt-24">
        <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500 sm:text-xs sm:tracking-[0.35em]">
          <span className="h-0.5 w-8 bg-signal sm:w-10" />
          {EYEBROW}
        </p>

        <h1 className="max-w-xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          {HEADLINE_TOP}
          <br />
          <span className="text-signal">{HEADLINE_ORANGE}</span>
        </h1>

        <p className="mt-6 max-w-md text-sm leading-7 text-gray-600 sm:mt-8 sm:text-base sm:leading-8">
          {PARAGRAPH}
        </p>

        <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-signal px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-dark sm:px-8 sm:py-4"
          >
            {BUTTON_ONE}
          </Link>

          <a
            href="#collections"
            className="rounded-full border border-black bg-white px-7 py-3.5 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white sm:px-8 sm:py-4"
          >
            {BUTTON_TWO}
          </a>
        </div>
      </div>

      {/* MOVING IMAGE WALL (phones and tablets) */}
      <div className="relative z-10 h-[440px] overflow-hidden lg:hidden">
        <div
          aria-hidden="true"
          className="absolute -inset-x-10 -inset-y-12 rotate-[8deg]"
        >
          <ImageWall />
        </div>
      </div>

      {/* MOVING BAND, BOTTOM */}
      <div className="relative z-20 overflow-hidden border-t-4 border-signal bg-black py-4 text-white lg:absolute lg:inset-x-0 lg:bottom-0">
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