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

// The moving pictures. They live in the folder public/hero.
// Any number works (6 or more looks best). Leave the list empty
// to show color blocks instead.
const PICTURES: string[] = [
  "/hero/look-1.jpg",
  "/hero/look-2.jpg",
  "/hero/look-3.jpg",
  "/hero/look-4.jpg",
  "/hero/look-5.jpg",
  "/hero/look-6.jpg",
  "/hero/look-7.jpg",
  "/hero/look-8.jpg",
  "/hero/look-9.jpg",
  "/hero/look-10.jpg",
  "/hero/look-11.jpg",
  "/hero/look-12.jpg",
  "/hero/look-13.jpg",
  "/hero/look-14.jpg",
  "/hero/look-15.jpg",
];

// =====================================================
//  YOU DO NOT NEED TO EDIT ANYTHING BELOW THIS LINE
// =====================================================

type Tile = {
  src: string | null;
  ratio: string;
  tone: string;
  label: string;
};

type StripTile = {
  src: string | null;
  tone: string;
};

const ratios = ["3 / 4", "1 / 1", "4 / 5", "3 / 4", "1 / 1"];
const tones = ["#d2561f", "#ececec", "#f3f3f3", "#e8b8a2", "#dcdcdc"];

// Picks every "step"-th picture starting at "offset", so all pictures are
// shared out evenly between the columns or strips.
function pick(offset: number, step: number, minimum: number): (string | null)[] {
  if (PICTURES.length === 0) {
    return Array.from({ length: minimum }).map(() => null);
  }

  let list: string[] = PICTURES.filter((_, index) => index % step === offset);

  if (list.length === 0) list = [...PICTURES];

  while (list.length < minimum) list = [...list, ...list];

  return list;
}

function buildColumn(offset: number): Tile[] {
  return pick(offset, 3, 5).map((src, i) => ({
    src,
    ratio: ratios[(i + offset) % ratios.length],
    tone: tones[(i + offset) % tones.length],
    label: `Look ${offset + 1}-${i + 1}`,
  }));
}

function buildStrip(offset: number): StripTile[] {
  return pick(offset, 2, 6).map((src, i) => ({
    src,
    tone: tones[(i + offset) % tones.length],
  }));
}

const columnA = buildColumn(0);
const columnB = buildColumn(1);
const columnC = buildColumn(2);

const stripA = buildStrip(0);
const stripB = buildStrip(1);

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
            loading="lazy"
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

function StripRow({
  tiles,
  direction,
  speed,
}: {
  tiles: StripTile[];
  direction: "left" | "right";
  speed: number;
}) {
  const loop = [...tiles, ...tiles];

  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max ${
          direction === "left" ? "drift-left" : "drift-right"
        }`}
        style={{ "--drift-speed": `${speed}s` } as React.CSSProperties}
      >
        {loop.map((tile, index) => (
          <div
            key={index}
            className="mr-3 h-44 w-36 shrink-0 overflow-hidden rounded-sm"
            style={{ backgroundColor: tile.tone }}
          >
            {tile.src && (
              <img
                src={tile.src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
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
        <div className="grid h-full grid-cols-3 gap-4">
          <Column tiles={columnA} direction="up" speed={55} />
          <Column tiles={columnB} direction="down" speed={70} />
          <Column tiles={columnC} direction="up" speed={45} />
        </div>
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

      {/* MOVING STRIPS (phones and tablets) */}
      <div className="relative z-10 space-y-3 pb-10 lg:hidden">
        <StripRow tiles={stripA} direction="left" speed={50} />
        <StripRow tiles={stripB} direction="right" speed={60} />
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