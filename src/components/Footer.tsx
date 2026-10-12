import Link from "next/link";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";
import NewsletterForm from "./NewsletterForm";
import CookieSettingsLink from "./CookieSettingsLink";

// =====================================================
//  EDIT YOUR FOOTER WORDS AND LINKS HERE
//  (change only the text between the quotes)
// =====================================================

const ABOUT_LINE =
  "Clothing, shoes and accessories for everyone. Imagine it, wear it.";

// Your contact details. Leave PHONE as "" to hide it.
const EMAIL = "support@imaraxdrip.com";
const PHONE = "";

// Links to Spurax Inc. and IsaacDev. Use "#" until you have the real address.
const SPURAX_NAME = "Spurax Inc.";
const SPURAX_URL = "#";
const ISAACDEV_NAME = "IsaacDev";
const ISAACDEV_URL = "#";

// Social media: paste each profile link between the quotes.
// Leave "" for accounts you do not have yet.
const SOCIALS = [
  { name: "Instagram", url: "" },
  { name: "Facebook", url: "" },
  { name: "X", url: "" },
  { name: "TikTok", url: "" },
  { name: "YouTube", url: "" },
  { name: "LinkedIn", url: "" },
  { name: "WhatsApp", url: "" },
];

const NEWSLETTER_TITLE = "Stay in the loop";
const NEWSLETTER_TEXT = "New drops and offers, straight to your inbox.";

// =====================================================
//  YOU DO NOT NEED TO EDIT ANYTHING BELOW THIS LINE
// =====================================================

const shopLinks = [
  { href: "/shop", label: "All products" },
  { href: "/shop?category=Clothing", label: "Clothing" },
  { href: "/shop?category=Footwear", label: "Footwear" },
  { href: "/shop?category=Accessories", label: "Accessories" },
];

const helpLinks = [
  { href: "/support", label: "Help & support" },
  { href: "/returns", label: "Shipping & returns" },
  { href: "/account", label: "My account & orders" },
  { href: "/cart", label: "Cart" },
  { href: "/track", label: "Track my order" },
];

function externalProps(url: string) {
  return url !== "#"
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}

const linkClass = "text-gray-300 transition hover:text-signal";
const headingClass =
  "text-xs font-semibold uppercase tracking-[0.3em] text-signal";

export default function Footer() {
  return (
    <footer className="border-t-4 border-signal bg-black px-6 pb-8 pt-20 text-white">
      <div className="mx-auto max-w-7xl">
        {/* SECTIONS */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          {/* BRAND */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo dark tagline />

            <p className="mt-6 max-w-sm text-sm leading-7 text-gray-400">
              {ABOUT_LINE}
            </p>

            <div className="mt-6">
              <SocialIcons socials={SOCIALS} />
            </div>
          </div>

          {/* SHOP */}
          <div>
            <p className={headingClass}>Shop</p>

            <ul className="mt-5 space-y-3 text-sm">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* HELP & SUPPORT */}
          <div>
            <p className={headingClass}>Help &amp; Support</p>

            <ul className="mt-5 space-y-3 text-sm">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <p className={headingClass}>Company</p>

            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/about" className={linkClass}>
                  About Imarax Drip
                </Link>
              </li>

              <li>
                <a
                  href={SPURAX_URL}
                  {...externalProps(SPURAX_URL)}
                  className={linkClass}
                >
                  {SPURAX_NAME}
                </a>
              </li>

              <li>
                <a
                  href={ISAACDEV_URL}
                  {...externalProps(ISAACDEV_URL)}
                  className={linkClass}
                >
                  {ISAACDEV_NAME}
                </a>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <p className={headingClass}>Contact</p>

            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={`mailto:${EMAIL}`} className={linkClass}>
                  {EMAIL}
                </a>
              </li>

              {PHONE.trim() !== "" && (
                <li>
                  <a href={`tel:${PHONE}`} className={linkClass}>
                    {PHONE}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={headingClass}>{NEWSLETTER_TITLE}</p>

            <p className="mt-3 text-sm text-gray-400">{NEWSLETTER_TEXT}</p>
          </div>

          <div className="w-full md:max-w-md">
            <NewsletterForm />
          </div>
        </div>

        {/* BOTTOM LINE */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs text-gray-500">
          <span>© 2026 Imarax Drip. All rights reserved.</span>

          <span>
            A brand of{" "}
            <a
              href={SPURAX_URL}
              {...externalProps(SPURAX_URL)}
              className="font-semibold text-white transition hover:text-signal"
            >
              {SPURAX_NAME}
            </a>
          </span>

          <Link href="/terms" className="transition hover:text-signal">
            Terms
          </Link>

          <Link href="/privacy" className="transition hover:text-signal">
            Privacy
          </Link>

          <Link href="/returns" className="transition hover:text-signal">
            Shipping &amp; returns
          </Link>

          <CookieSettingsLink className="transition hover:text-signal" />

          <a
            href={ISAACDEV_URL}
            {...externalProps(ISAACDEV_URL)}
            className="transition hover:text-signal"
          >
            Built by {ISAACDEV_NAME}
          </a>
        </div>
      </div>
    </footer>
  );
}